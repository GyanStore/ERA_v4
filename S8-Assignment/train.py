"""
ResNet Training Script for CIFAR-100

This script provides a complete training pipeline for ResNet models on CIFAR-100
with the goal of achieving 73% top-1 accuracy.

Features:
- Multiple ResNet architectures (18, 34, 50)
- Advanced data augmentation
- Mixed precision training
- Learning rate scheduling
- Comprehensive logging and checkpointing
- Real-time monitoring
"""

import torch
import torch.nn as nn
import torch.optim as optim
import torch.cuda.amp as amp
import argparse
import os
import time
import json
from datetime import datetime
import numpy as np
import matplotlib.pyplot as plt

# Import our modules
from resnet_model import get_model, count_parameters
from data_utils import get_data_loaders, CIFAR100_CLASSES
from utils_minimal import (
    AverageMeter, ProgressMeter, accuracy, save_checkpoint, load_checkpoint,
    setup_logging, plot_training_curves, save_training_results, 
    get_gpu_memory_usage, format_time
)


class Trainer:
    """
    Complete training class for ResNet on CIFAR-100
    """
    
    def __init__(self, args):
        self.args = args
        self.device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        self.start_epoch = 0
        self.best_acc = 0.0
        self.target_reached_epoch = None
        
        # Training history
        self.train_losses = []
        self.train_accuracies = []
        self.test_losses = []
        self.test_accuracies = []
        self.learning_rates = []
        
        # Setup logging
        self.logger = setup_logging(args.log_dir)
        self.logger.info(f"Training started with args: {args}")
        
        # Initialize components
        self._setup_model()
        self._setup_data()
        self._setup_optimizer()
        self._setup_scheduler()
        self._setup_loss_function()
        
        # Mixed precision training
        if args.mixed_precision:
            self.scaler = amp.GradScaler()
            self.logger.info("Mixed precision training enabled")
        
        # Load checkpoint if resuming
        if args.resume:
            self._load_checkpoint()
    
    def _setup_model(self):
        """Initialize the model"""
        self.logger.info(f"Creating {self.args.model} model...")
        
        self.model = get_model(self.args.model, num_classes=100)
        self.model = self.model.to(self.device)
        
        # Model info
        params = count_parameters(self.model)
        self.logger.info(f"Model created with {params['total']:,} parameters ({params['total_mb']:.2f} MB)")
        
        # Data parallel if multiple GPUs
        if torch.cuda.device_count() > 1:
            self.model = nn.DataParallel(self.model)
            self.logger.info(f"Using {torch.cuda.device_count()} GPUs")
    
    def _setup_data(self):
        """Setup data loaders"""
        self.logger.info("Setting up data loaders...")
        
        self.train_loader, self.test_loader, self.dataset_info = get_data_loaders(
            batch_size=self.args.batch_size,
            num_workers=self.args.num_workers,
            data_dir=self.args.data_dir,
            strong_augment=self.args.strong_augment,
            download=True
        )
        
        self.logger.info(f"Data loaded - Train: {self.dataset_info['train_size']}, "
                        f"Test: {self.dataset_info['test_size']}")
    
    def _setup_optimizer(self):
        """Setup optimizer"""
        if self.args.optimizer == 'sgd':
            self.optimizer = optim.SGD(
                self.model.parameters(),
                lr=self.args.lr,
                momentum=self.args.momentum,
                weight_decay=self.args.weight_decay,
                nesterov=True
            )
        elif self.args.optimizer == 'adam':
            self.optimizer = optim.Adam(
                self.model.parameters(),
                lr=self.args.lr,
                weight_decay=self.args.weight_decay
            )
        elif self.args.optimizer == 'adamw':
            self.optimizer = optim.AdamW(
                self.model.parameters(),
                lr=self.args.lr,
                weight_decay=self.args.weight_decay
            )
        
        self.logger.info(f"Optimizer: {self.args.optimizer}, LR: {self.args.lr}")
    
    def _setup_scheduler(self):
        """Setup learning rate scheduler"""
        if self.args.scheduler == 'cosine':
            self.scheduler = optim.lr_scheduler.CosineAnnealingLR(
                self.optimizer, T_max=self.args.epochs
            )
        elif self.args.scheduler == 'cosine_warm':
            self.scheduler = optim.lr_scheduler.CosineAnnealingWarmRestarts(
                self.optimizer, T_0=10, T_mult=2, eta_min=1e-6
            )
        elif self.args.scheduler == 'multistep':
            milestones = [int(self.args.epochs * 0.5), int(self.args.epochs * 0.75)]
            self.scheduler = optim.lr_scheduler.MultiStepLR(
                self.optimizer, milestones=milestones, gamma=0.1
            )
        elif self.args.scheduler == 'onecycle':
            self.scheduler = optim.lr_scheduler.OneCycleLR(
                self.optimizer,
                max_lr=self.args.lr,
                epochs=self.args.epochs,
                steps_per_epoch=len(self.train_loader)
            )
        
        self.logger.info(f"Scheduler: {self.args.scheduler}")
    
    def _setup_loss_function(self):
        """Setup loss function"""
        if self.args.label_smoothing > 0:
            self.criterion = nn.CrossEntropyLoss(label_smoothing=self.args.label_smoothing)
            self.logger.info(f"Using label smoothing: {self.args.label_smoothing}")
        else:
            self.criterion = nn.CrossEntropyLoss()
    
    def _load_checkpoint(self):
        """Load checkpoint for resuming training"""
        checkpoint = load_checkpoint(
            self.args.resume, self.model, self.optimizer, self.scheduler
        )
        
        self.start_epoch = checkpoint.get('epoch', 0)
        self.best_acc = checkpoint.get('best_acc', 0.0)
        self.target_reached_epoch = checkpoint.get('target_reached_epoch', None)
        
        # Load training history
        self.train_losses = checkpoint.get('train_losses', [])
        self.train_accuracies = checkpoint.get('train_accuracies', [])
        self.test_losses = checkpoint.get('test_losses', [])
        self.test_accuracies = checkpoint.get('test_accuracies', [])
        self.learning_rates = checkpoint.get('learning_rates', [])
        
        self.logger.info(f"Resumed from epoch {self.start_epoch}, best acc: {self.best_acc:.2f}%")
    
    def train_epoch(self, epoch):
        """Train for one epoch"""
        batch_time = AverageMeter('Time', ':6.3f')
        data_time = AverageMeter('Data', ':6.3f')
        losses = AverageMeter('Loss', ':.4e')
        top1 = AverageMeter('Acc@1', ':6.2f')
        top5 = AverageMeter('Acc@5', ':6.2f')
        
        progress = ProgressMeter(
            len(self.train_loader),
            [batch_time, data_time, losses, top1, top5],
            prefix=f"Epoch: [{epoch}]"
        )
        
        # Switch to train mode
        self.model.train()
        
        end = time.time()
        for i, (inputs, targets) in enumerate(self.train_loader):
            # Measure data loading time
            data_time.update(time.time() - end)
            
            inputs = inputs.to(self.device, non_blocking=True)
            targets = targets.to(self.device, non_blocking=True)
            
            # Forward pass with mixed precision
            if self.args.mixed_precision:
                with amp.autocast():
                    outputs = self.model(inputs)
                    loss = self.criterion(outputs, targets)
                
                # Backward pass
                self.optimizer.zero_grad()
                self.scaler.scale(loss).backward()
                self.scaler.step(self.optimizer)
                self.scaler.update()
            else:
                # Standard training
                outputs = self.model(inputs)
                loss = self.criterion(outputs, targets)
                
                self.optimizer.zero_grad()
                loss.backward()
                self.optimizer.step()
            
            # Update scheduler if OneCycleLR
            if self.args.scheduler == 'onecycle':
                self.scheduler.step()
            
            # Measure accuracy and record loss
            acc1, acc5 = accuracy(outputs, targets, topk=(1, 5))
            losses.update(loss.item(), inputs.size(0))
            top1.update(acc1[0], inputs.size(0))
            top5.update(acc5[0], inputs.size(0))
            
            # Measure elapsed time
            batch_time.update(time.time() - end)
            end = time.time()
            
            # Print progress
            if i % self.args.print_freq == 0:
                progress.display(i)
        
        return losses.avg, top1.avg
    
    def validate(self, epoch):
        """Validate the model"""
        batch_time = AverageMeter('Time', ':6.3f')
        losses = AverageMeter('Loss', ':.4e')
        top1 = AverageMeter('Acc@1', ':6.2f')
        top5 = AverageMeter('Acc@5', ':6.2f')
        
        progress = ProgressMeter(
            len(self.test_loader),
            [batch_time, losses, top1, top5],
            prefix='Test: '
        )
        
        # Switch to evaluate mode
        self.model.eval()
        
        with torch.no_grad():
            end = time.time()
            for i, (inputs, targets) in enumerate(self.test_loader):
                inputs = inputs.to(self.device, non_blocking=True)
                targets = targets.to(self.device, non_blocking=True)
                
                # Forward pass
                if self.args.mixed_precision:
                    with amp.autocast():
                        outputs = self.model(inputs)
                        loss = self.criterion(outputs, targets)
                else:
                    outputs = self.model(inputs)
                    loss = self.criterion(outputs, targets)
                
                # Measure accuracy and record loss
                acc1, acc5 = accuracy(outputs, targets, topk=(1, 5))
                losses.update(loss.item(), inputs.size(0))
                top1.update(acc1[0], inputs.size(0))
                top5.update(acc5[0], inputs.size(0))
                
                # Measure elapsed time
                batch_time.update(time.time() - end)
                end = time.time()
                
                if i % self.args.print_freq == 0:
                    progress.display(i)
        
        return losses.avg, top1.avg
    
    def train(self):
        """Main training loop"""
        self.logger.info("Starting training...")
        self.logger.info(f"Target accuracy: {self.args.target_acc}%")
        
        training_start_time = time.time()
        
        for epoch in range(self.start_epoch, self.args.epochs):
            epoch_start_time = time.time()
            
            # Train for one epoch
            train_loss, train_acc = self.train_epoch(epoch)
            
            # Validate
            test_loss, test_acc = self.validate(epoch)
            
            # Update scheduler (except OneCycleLR which updates per batch)
            if self.args.scheduler != 'onecycle':
                self.scheduler.step()
            
            # Get current learning rate
            current_lr = self.optimizer.param_groups[0]['lr']
            
            # Record history
            self.train_losses.append(train_loss)
            self.train_accuracies.append(train_acc.item())
            self.test_losses.append(test_loss)
            self.test_accuracies.append(test_acc.item())
            self.learning_rates.append(current_lr)
            
            # Check if target reached
            if test_acc >= self.args.target_acc and self.target_reached_epoch is None:
                self.target_reached_epoch = epoch
                self.logger.info(f"🎯 Target accuracy {self.args.target_acc}% reached at epoch {epoch}!")
            
            # Check if best model
            is_best = test_acc > self.best_acc
            if is_best:
                self.best_acc = test_acc
            
            # Calculate epoch time
            epoch_time = time.time() - epoch_start_time
            gpu_memory = get_gpu_memory_usage()
            
            # Log epoch results
            self.logger.info(
                f"Epoch {epoch:3d}/{self.args.epochs}: "
                f"Train Loss: {train_loss:.4f} | Train Acc: {train_acc:.2f}% | "
                f"Test Loss: {test_loss:.4f} | Test Acc: {test_acc:.2f}% | "
                f"LR: {current_lr:.6f} | Time: {format_time(epoch_time)} | "
                f"GPU: {gpu_memory:.2f}GB"
            )
            
            # Special logging for milestones
            if is_best:
                self.logger.info(f"✨ New best accuracy: {test_acc:.2f}%")
            
            if test_acc >= self.args.target_acc:
                self.logger.info(f"🏆 Above target: {test_acc:.2f}% >= {self.args.target_acc}%")
            
            # Save checkpoint
            checkpoint_state = {
                'epoch': epoch + 1,
                'state_dict': self.model.state_dict(),
                'best_acc': self.best_acc,
                'optimizer': self.optimizer.state_dict(),
                'scheduler': self.scheduler.state_dict(),
                'args': self.args,
                'target_reached_epoch': self.target_reached_epoch,
                'train_losses': self.train_losses,
                'train_accuracies': self.train_accuracies,
                'test_losses': self.test_losses,
                'test_accuracies': self.test_accuracies,
                'learning_rates': self.learning_rates
            }
            
            # Save regular checkpoint
            if (epoch + 1) % self.args.save_freq == 0:
                save_checkpoint(
                    checkpoint_state,
                    is_best=False,
                    checkpoint_dir=self.args.checkpoint_dir,
                    filename=f'checkpoint_epoch_{epoch+1}.pth'
                )
            
            # Save best model
            if is_best:
                save_checkpoint(
                    checkpoint_state,
                    is_best=True,
                    checkpoint_dir=self.args.checkpoint_dir
                )
            
            # Save target model (first time reaching target)
            if test_acc >= self.args.target_acc:
                target_filename = f'target_model_epoch_{epoch+1}.pth'
                target_path = os.path.join(self.args.checkpoint_dir, target_filename)
                if not os.path.exists(target_path):
                    save_checkpoint(
                        checkpoint_state,
                        is_best=False,
                        checkpoint_dir=self.args.checkpoint_dir,
                        filename=target_filename
                    )
                    self.logger.info(f"💾 Target model saved: {target_filename}")
            
            # Early stopping check
            if self.args.early_stopping > 0:
                if len(self.test_accuracies) >= self.args.early_stopping:
                    recent_accs = self.test_accuracies[-self.args.early_stopping:]
                    if all(acc <= max(recent_accs) for acc in recent_accs[-self.args.early_stopping//2:]):
                        self.logger.info(f"Early stopping triggered after {epoch+1} epochs")
                        break
        
        # Training completed
        total_time = time.time() - training_start_time
        self.logger.info(f"Training completed in {format_time(total_time)}")
        self.logger.info(f"Best accuracy: {self.best_acc:.2f}%")
        
        if self.target_reached_epoch is not None:
            self.logger.info(f"Target {self.args.target_acc}% reached at epoch {self.target_reached_epoch}")
        else:
            self.logger.info(f"Target {self.args.target_acc}% not reached")
        
        # Save final results
        self._save_final_results(total_time)
        
        # Plot training curves
        self._plot_results()
    
    def _save_final_results(self, total_time):
        """Save final training results"""
        results = {
            'model': self.args.model,
            'epochs': len(self.train_losses),
            'best_accuracy': float(self.best_acc),
            'target_accuracy': self.args.target_acc,
            'target_reached_epoch': self.target_reached_epoch,
            'total_training_time': total_time,
            'train_losses': self.train_losses,
            'train_accuracies': self.train_accuracies,
            'test_losses': self.test_losses,
            'test_accuracies': self.test_accuracies,
            'learning_rates': self.learning_rates,
            'args': vars(self.args)
        }
        
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        results_path = os.path.join(self.args.checkpoint_dir, f'training_results_{timestamp}.json')
        save_training_results(results, results_path)
    
    def _plot_results(self):
        """Plot and save training curves"""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        plot_path = os.path.join(self.args.log_dir, f'training_curves_{timestamp}.png')
        
        try:
            plot_training_curves(
                self.train_losses,
                self.train_accuracies,
                self.test_losses,
                self.test_accuracies,
                self.learning_rates,
                save_path=plot_path,
                title=f"{self.args.model.upper()} Training on CIFAR-100"
            )
        except Exception as e:
            self.logger.warning(f"Could not create training curves plot: {e}")


def parse_args():
    """Parse command line arguments"""
    parser = argparse.ArgumentParser(description='ResNet Training on CIFAR-100')
    
    # Model arguments
    parser.add_argument('--model', default='resnet18', choices=['resnet18', 'resnet34', 'resnet50'],
                       help='Model architecture')
    
    # Data arguments
    parser.add_argument('--data-dir', default='./data', help='Path to dataset')
    parser.add_argument('--batch-size', default=128, type=int, help='Batch size')
    parser.add_argument('--num-workers', default=4, type=int, help='Number of data loading workers')
    parser.add_argument('--strong-augment', action='store_true', default=True,
                       help='Use strong data augmentation')
    
    # Training arguments
    parser.add_argument('--epochs', default=100, type=int, help='Number of epochs')
    parser.add_argument('--lr', default=0.1, type=float, help='Initial learning rate')
    parser.add_argument('--momentum', default=0.9, type=float, help='Momentum')
    parser.add_argument('--weight-decay', default=5e-4, type=float, help='Weight decay')
    parser.add_argument('--optimizer', default='sgd', choices=['sgd', 'adam', 'adamw'],
                       help='Optimizer type')
    parser.add_argument('--scheduler', default='cosine_warm', 
                       choices=['cosine', 'cosine_warm', 'multistep', 'onecycle'],
                       help='Learning rate scheduler')
    parser.add_argument('--label-smoothing', default=0.1, type=float,
                       help='Label smoothing factor')
    
    # Training options
    parser.add_argument('--mixed-precision', action='store_true', default=True,
                       help='Use mixed precision training')
    parser.add_argument('--target-acc', default=73.0, type=float,
                       help='Target accuracy to achieve')
    parser.add_argument('--early-stopping', default=0, type=int,
                       help='Early stopping patience (0 to disable)')
    
    # Checkpointing
    parser.add_argument('--checkpoint-dir', default='./checkpoints', help='Checkpoint directory')
    parser.add_argument('--log-dir', default='./logs', help='Log directory')
    parser.add_argument('--resume', default='', help='Path to checkpoint to resume from')
    parser.add_argument('--save-freq', default=10, type=int, help='Checkpoint save frequency')
    
    # Logging
    parser.add_argument('--print-freq', default=100, type=int, help='Print frequency')
    
    return parser.parse_args()


def main():
    """Main training function"""
    args = parse_args()
    
    # Create directories
    os.makedirs(args.checkpoint_dir, exist_ok=True)
    os.makedirs(args.log_dir, exist_ok=True)
    
    # Set random seeds for reproducibility
    torch.manual_seed(42)
    np.random.seed(42)
    if torch.cuda.is_available():
        torch.cuda.manual_seed(42)
        torch.backends.cudnn.deterministic = True
        torch.backends.cudnn.benchmark = False
    
    # Print system info
    print(f"🚀 Starting ResNet training on CIFAR-100")
    print(f"📱 Device: {'CUDA' if torch.cuda.is_available() else 'CPU'}")
    if torch.cuda.is_available():
        print(f"🔥 GPU: {torch.cuda.get_device_name()}")
        print(f"💾 GPU Memory: {torch.cuda.get_device_properties(0).total_memory / 1e9:.1f} GB")
    print(f"🎯 Target: {args.target_acc}% accuracy")
    print(f"🏗️  Model: {args.model.upper()}")
    print(f"📊 Batch Size: {args.batch_size}")
    print(f"🔄 Epochs: {args.epochs}")
    print("="*60)
    
    # Create trainer and start training
    trainer = Trainer(args)
    trainer.train()
    
    print("\n🎉 Training completed successfully!")
    print(f"🏆 Best accuracy achieved: {trainer.best_acc:.2f}%")
    
    if trainer.target_reached_epoch is not None:
        print(f"🎯 Target {args.target_acc}% reached at epoch {trainer.target_reached_epoch}")
    else:
        print(f"⚠️  Target {args.target_acc}% not reached")
    
    print(f"📁 Checkpoints saved in: {args.checkpoint_dir}")
    print(f"📋 Logs saved in: {args.log_dir}")


if __name__ == '__main__':
    main()
