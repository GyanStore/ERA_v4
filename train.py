"""
S7 Assignment - Training Script
===============================

Train CIFAR-10 CNN to achieve 85%+ accuracy with <200k parameters.

Features:
- OneCycleLR scheduler for super-convergence
- Mixed precision training (if available)
- Automatic checkpointing of best model
- Comprehensive logging and progress tracking
- Apple Silicon MPS optimization
"""

import torch
import torch.nn as nn
import torch.optim as optim
from torch.optim.lr_scheduler import OneCycleLR
import time
import os
from tqdm import tqdm
import json

from model import CIFAR10Net, get_model_summary
from utils import get_dataloaders, get_device, AverageMeter, accuracy, save_checkpoint, print_augmentation_info

def train_epoch(model, device, train_loader, optimizer, criterion, scheduler, epoch, scaler=None):
    """Train for one epoch"""
    
    model.train()
    losses = AverageMeter()
    top1 = AverageMeter()
    
    pbar = tqdm(train_loader, desc=f'Epoch {epoch:2d}')
    
    for batch_idx, (data, target) in enumerate(pbar):
        data, target = data.to(device), target.to(device)
        
        optimizer.zero_grad()
        
        # Mixed precision training if available
        if scaler is not None:
            with torch.cuda.amp.autocast():
                output = model(data)
                loss = criterion(output, target)
            
            scaler.scale(loss).backward()
            scaler.step(optimizer)
            scaler.update()
        else:
            output = model(data)
            loss = criterion(output, target)
            loss.backward()
            optimizer.step()
        
        # Update learning rate
        scheduler.step()
        
        # Measure accuracy and record loss
        acc1 = accuracy(output, target)[0]
        losses.update(loss.item(), data.size(0))
        top1.update(acc1.item(), data.size(0))
        
        # Update progress bar
        pbar.set_postfix({
            'Loss': f'{losses.avg:.4f}',
            'Acc': f'{top1.avg:.2f}%',
            'LR': f'{scheduler.get_last_lr()[0]:.6f}'
        })
    
    return losses.avg, top1.avg

def validate(model, device, test_loader, criterion):
    """Validate the model"""
    
    model.eval()
    losses = AverageMeter()
    top1 = AverageMeter()
    
    with torch.no_grad():
        pbar = tqdm(test_loader, desc='Validation')
        
        for data, target in pbar:
            data, target = data.to(device), target.to(device)
            
            output = model(data)
            loss = criterion(output, target)
            
            # Measure accuracy and record loss
            acc1 = accuracy(output, target)[0]
            losses.update(loss.item(), data.size(0))
            top1.update(acc1.item(), data.size(0))
            
            pbar.set_postfix({
                'Loss': f'{losses.avg:.4f}',
                'Acc': f'{top1.avg:.2f}%'
            })
    
    return losses.avg, top1.avg

def main():
    """Main training function"""
    
    # Training configuration
    config = {
        'epochs': 50,
        'batch_size': 128,
        'learning_rate': 0.1,
        'weight_decay': 5e-4,
        'momentum': 0.9,
        'num_workers': 4,
        'target_accuracy': 85.0,
        'save_dir': 'logs'
    }
    
    print("S7 Assignment - CIFAR-10 CNN Training")
    print("=" * 50)
    
    # Create save directory
    os.makedirs(config['save_dir'], exist_ok=True)
    
    # Get device
    device = get_device()
    
    # Print augmentation info
    print_augmentation_info()
    
    # Create model
    print("\nCreating model...")
    model = CIFAR10Net()
    model.to(device)
    
    # Get model summary
    total_params, rf = get_model_summary(model, device)
    
    # Data loaders
    print("\nLoading data...")
    train_loader, test_loader = get_dataloaders(
        batch_size=config['batch_size'],
        num_workers=config['num_workers']
    )
    
    # Loss function and optimizer
    criterion = nn.CrossEntropyLoss()
    optimizer = optim.SGD(
        model.parameters(),
        lr=config['learning_rate'],
        momentum=config['momentum'],
        weight_decay=config['weight_decay']
    )
    
    # OneCycleLR scheduler for super-convergence
    scheduler = OneCycleLR(
        optimizer,
        max_lr=config['learning_rate'],
        epochs=config['epochs'],
        steps_per_epoch=len(train_loader),
        pct_start=0.3,  # 30% of training for warmup
        div_factor=10,  # Initial LR = max_lr/10
        final_div_factor=100,  # Final LR = max_lr/100
        anneal_strategy='cos'
    )
    
    # Mixed precision scaler (for CUDA only)
    scaler = torch.cuda.amp.GradScaler() if device.type == 'cuda' else None
    
    # Training tracking
    best_acc = 0.0
    training_history = []
    
    print(f"\nStarting training for {config['epochs']} epochs...")
    print(f"Target accuracy: {config['target_accuracy']}%")
    print("=" * 70)
    
    start_time = time.time()
    
    for epoch in range(1, config['epochs'] + 1):
        epoch_start = time.time()
        
        # Train
        train_loss, train_acc = train_epoch(
            model, device, train_loader, optimizer, criterion, scheduler, epoch, scaler
        )
        
        # Validate
        val_loss, val_acc = validate(model, device, test_loader, criterion)
        
        epoch_time = time.time() - epoch_start
        
        # Log results
        print(f"Epoch [{epoch:2d}/{config['epochs']}] | "
              f"Time: {epoch_time:.1f}s | "
              f"LR: {scheduler.get_last_lr()[0]:.6f} | "
              f"Train Loss: {train_loss:.4f} | "
              f"Train Acc: {train_acc:.2f}% | "
              f"Test Loss: {val_loss:.4f} | "
              f"Test Acc: {val_acc:.2f}%", end="")
        
        # Save best model
        is_best = val_acc > best_acc
        if is_best:
            best_acc = val_acc
            print(" <- Best!", end="")
            
            # Save best model
            save_checkpoint({
                'epoch': epoch,
                'model_state_dict': model.state_dict(),
                'optimizer_state_dict': optimizer.state_dict(),
                'scheduler_state_dict': scheduler.state_dict(),
                'best_acc': best_acc,
                'train_acc': train_acc,
                'train_loss': train_loss,
                'val_loss': val_loss,
                'config': config,
                'total_params': total_params,
                'receptive_field': rf
            }, os.path.join(config['save_dir'], 'best_model.pth'))
        
        print()  # New line
        
        # Record training history
        training_history.append({
            'epoch': epoch,
            'train_loss': train_loss,
            'train_acc': train_acc,
            'val_loss': val_loss,
            'val_acc': val_acc,
            'lr': scheduler.get_last_lr()[0],
            'time': epoch_time,
            'is_best': is_best
        })
        
        # Check if target achieved
        if val_acc >= config['target_accuracy']:
            print(f"\n🎉 Target accuracy {config['target_accuracy']}% achieved!")
            print(f"   Current accuracy: {val_acc:.2f}%")
            print(f"   Epoch: {epoch}")
    
    total_time = time.time() - start_time
    
    # Final results
    print("\n" + "=" * 70)
    print("TRAINING COMPLETED")
    print("=" * 70)
    print(f"Total Training Time: {total_time/60:.2f} minutes")
    print(f"Best Test Accuracy: {best_acc:.2f}% (Epoch {[h['epoch'] for h in training_history if h['is_best']][-1]})")
    print(f"Target Achieved (85%): {'✓ Yes' if best_acc >= config['target_accuracy'] else '✗ No'}")
    print(f"Total Parameters: {total_params:,} (<200k)")
    print(f"Receptive Field: {rf} (>44)")
    print("=" * 70)
    
    # Save training history
    with open(os.path.join(config['save_dir'], 'training_history.json'), 'w') as f:
        json.dump(training_history, f, indent=2)
    
    # Save final model
    save_checkpoint({
        'epoch': config['epochs'],
        'model_state_dict': model.state_dict(),
        'optimizer_state_dict': optimizer.state_dict(),
        'scheduler_state_dict': scheduler.state_dict(),
        'best_acc': best_acc,
        'final_train_acc': training_history[-1]['train_acc'],
        'final_val_acc': training_history[-1]['val_acc'],
        'config': config,
        'total_params': total_params,
        'receptive_field': rf,
        'training_history': training_history
    }, os.path.join(config['save_dir'], 'final_model.pth'))
    
    print(f"\nModel and logs saved to: {config['save_dir']}/")
    
    return best_acc, total_params, rf

if __name__ == "__main__":
    try:
        best_acc, total_params, rf = main()
        
        print("\n🚀 Training completed successfully!")
        print(f"   Best Accuracy: {best_acc:.2f}%")
        print(f"   Parameters: {total_params:,}")
        print(f"   Receptive Field: {rf}")
        
    except KeyboardInterrupt:
        print("\n\nTraining interrupted by user.")
    except Exception as e:
        print(f"\n\nTraining failed with error: {e}")
        raise
