"""
Utility Functions for ResNet CIFAR-100 Training

This module provides various utility functions for training, evaluation,
visualization, and model management.
"""

import torch
import torch.nn as nn
import torch.nn.functional as F
import numpy as np
import matplotlib.pyplot as plt

# Optional imports
try:
    import seaborn as sns
    HAS_SEABORN = True
except ImportError:
    HAS_SEABORN = False
    print("⚠️  Seaborn not available, some visualization features will be limited")

try:
    from sklearn.metrics import confusion_matrix, classification_report
    HAS_SKLEARN = True
except ImportError:
    HAS_SKLEARN = False
    print("⚠️  Scikit-learn not available, some evaluation features will be limited")
import os
import json
import time
from datetime import datetime
from typing import Dict, List, Tuple, Optional
import logging
from pathlib import Path


class AverageMeter:
    """Computes and stores the average and current value"""
    
    def __init__(self, name: str, fmt: str = ':f'):
        self.name = name
        self.fmt = fmt
        self.reset()

    def reset(self):
        self.val = 0
        self.avg = 0
        self.sum = 0
        self.count = 0

    def update(self, val: float, n: int = 1):
        self.val = val
        self.sum += val * n
        self.count += n
        self.avg = self.sum / self.count

    def __str__(self):
        fmtstr = '{name} {val' + self.fmt + '} ({avg' + self.fmt + '})'
        return fmtstr.format(**self.__dict__)


class ProgressMeter:
    """Display progress during training"""
    
    def __init__(self, num_batches: int, meters: List[AverageMeter], prefix: str = ""):
        self.batch_fmtstr = self._get_batch_fmtstr(num_batches)
        self.meters = meters
        self.prefix = prefix

    def display(self, batch: int):
        entries = [self.prefix + self.batch_fmtstr.format(batch)]
        entries += [str(meter) for meter in self.meters]
        print('\t'.join(entries))

    def _get_batch_fmtstr(self, num_batches: int):
        num_digits = len(str(num_batches // 1))
        fmt = '{:' + str(num_digits) + 'd}'
        return '[' + fmt + '/' + fmt.format(num_batches) + ']'


def accuracy(output: torch.Tensor, target: torch.Tensor, topk: Tuple[int, ...] = (1,)):
    """
    Computes the accuracy over the k top predictions for the specified values of k
    
    Args:
        output: Model predictions (batch_size, num_classes)
        target: Ground truth labels (batch_size,)
        topk: Tuple of k values for top-k accuracy
    
    Returns:
        List of top-k accuracies
    """
    with torch.no_grad():
        maxk = max(topk)
        batch_size = target.size(0)

        _, pred = output.topk(maxk, 1, True, True)
        pred = pred.t()
        correct = pred.eq(target.view(1, -1).expand_as(pred))

        res = []
        for k in topk:
            correct_k = correct[:k].reshape(-1).float().sum(0, keepdim=True)
            res.append(correct_k.mul_(100.0 / batch_size))
        return res


def save_checkpoint(
    state: Dict,
    is_best: bool,
    checkpoint_dir: str,
    filename: str = 'checkpoint.pth'
):
    """
    Save model checkpoint
    
    Args:
        state: Dictionary containing model state, optimizer state, etc.
        is_best: Whether this is the best model so far
        checkpoint_dir: Directory to save checkpoints
        filename: Checkpoint filename
    """
    os.makedirs(checkpoint_dir, exist_ok=True)
    
    filepath = os.path.join(checkpoint_dir, filename)
    torch.save(state, filepath)
    
    if is_best:
        best_filepath = os.path.join(checkpoint_dir, 'best_model.pth')
        torch.save(state, best_filepath)
        print(f"💾 New best model saved: {best_filepath}")


def load_checkpoint(
    checkpoint_path: str,
    model: nn.Module,
    optimizer: torch.optim.Optimizer = None,
    scheduler: torch.optim.lr_scheduler._LRScheduler = None
) -> Dict:
    """
    Load model checkpoint
    
    Args:
        checkpoint_path: Path to checkpoint file
        model: Model to load state into
        optimizer: Optimizer to load state into (optional)
        scheduler: Scheduler to load state into (optional)
    
    Returns:
        Dictionary with loaded information
    """
    if not os.path.isfile(checkpoint_path):
        raise FileNotFoundError(f"No checkpoint found at '{checkpoint_path}'")
    
    print(f"Loading checkpoint '{checkpoint_path}'")
    checkpoint = torch.load(checkpoint_path, map_location='cpu')
    
    # Load model state
    model.load_state_dict(checkpoint['state_dict'])
    
    # Load optimizer state
    if optimizer is not None and 'optimizer' in checkpoint:
        optimizer.load_state_dict(checkpoint['optimizer'])
    
    # Load scheduler state
    if scheduler is not None and 'scheduler' in checkpoint:
        scheduler.load_state_dict(checkpoint['scheduler'])
    
    print(f"Loaded checkpoint (epoch {checkpoint.get('epoch', 'unknown')})")
    return checkpoint


def setup_logging(log_dir: str, log_name: str = None) -> logging.Logger:
    """
    Setup logging configuration
    
    Args:
        log_dir: Directory to save log files
        log_name: Name for the log file
    
    Returns:
        Configured logger
    """
    os.makedirs(log_dir, exist_ok=True)
    
    if log_name is None:
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        log_name = f"training_{timestamp}.log"
    
    log_path = os.path.join(log_dir, log_name)
    
    # Configure logging
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(levelname)s - %(message)s',
        handlers=[
            logging.FileHandler(log_path),
            logging.StreamHandler()
        ]
    )
    
    logger = logging.getLogger(__name__)
    logger.info(f"Logging initialized. Log file: {log_path}")
    
    return logger


def plot_training_curves(
    train_losses: List[float],
    train_accuracies: List[float],
    test_losses: List[float],
    test_accuracies: List[float],
    learning_rates: List[float] = None,
    save_path: str = None,
    title: str = "Training Curves"
):
    """
    Plot training and validation curves
    
    Args:
        train_losses: List of training losses per epoch
        train_accuracies: List of training accuracies per epoch
        test_losses: List of test losses per epoch
        test_accuracies: List of test accuracies per epoch
        learning_rates: List of learning rates per epoch (optional)
        save_path: Path to save the plot
        title: Title for the plot
    """
    epochs = range(1, len(train_losses) + 1)
    
    # Create subplots
    if learning_rates is not None:
        fig, axes = plt.subplots(2, 2, figsize=(15, 10))
        fig.suptitle(title, fontsize=16, fontweight='bold')
        
        # Loss plot
        axes[0, 0].plot(epochs, train_losses, 'b-', label='Train Loss', linewidth=2)
        axes[0, 0].plot(epochs, test_losses, 'r-', label='Test Loss', linewidth=2)
        axes[0, 0].set_title('Loss Curves')
        axes[0, 0].set_xlabel('Epoch')
        axes[0, 0].set_ylabel('Loss')
        axes[0, 0].legend()
        axes[0, 0].grid(True, alpha=0.3)
        
        # Accuracy plot
        axes[0, 1].plot(epochs, train_accuracies, 'b-', label='Train Acc', linewidth=2)
        axes[0, 1].plot(epochs, test_accuracies, 'r-', label='Test Acc', linewidth=2)
        axes[0, 1].axhline(y=73.0, color='g', linestyle='--', label='Target (73%)')
        axes[0, 1].set_title('Accuracy Curves')
        axes[0, 1].set_xlabel('Epoch')
        axes[0, 1].set_ylabel('Accuracy (%)')
        axes[0, 1].legend()
        axes[0, 1].grid(True, alpha=0.3)
        
        # Learning rate plot
        axes[1, 0].plot(epochs, learning_rates, 'g-', linewidth=2)
        axes[1, 0].set_title('Learning Rate Schedule')
        axes[1, 0].set_xlabel('Epoch')
        axes[1, 0].set_ylabel('Learning Rate')
        axes[1, 0].set_yscale('log')
        axes[1, 0].grid(True, alpha=0.3)
        
        # Summary statistics
        best_test_acc = max(test_accuracies)
        best_epoch = test_accuracies.index(best_test_acc) + 1
        final_test_acc = test_accuracies[-1]
        
        stats_text = f"""
        Training Summary:
        Best Test Accuracy: {best_test_acc:.2f}% (Epoch {best_epoch})
        Final Test Accuracy: {final_test_acc:.2f}%
        Total Epochs: {len(epochs)}
        Target Achieved: {'✅ Yes' if best_test_acc >= 73.0 else '❌ No'}
        
        Final Losses:
        Train: {train_losses[-1]:.4f}
        Test: {test_losses[-1]:.4f}
        """
        
        axes[1, 1].text(0.1, 0.5, stats_text, fontsize=11, verticalalignment='center',
                        bbox=dict(boxstyle="round,pad=0.3", facecolor="lightblue"))
        axes[1, 1].axis('off')
        
    else:
        fig, axes = plt.subplots(1, 2, figsize=(15, 5))
        fig.suptitle(title, fontsize=16, fontweight='bold')
        
        # Loss plot
        axes[0].plot(epochs, train_losses, 'b-', label='Train Loss', linewidth=2)
        axes[0].plot(epochs, test_losses, 'r-', label='Test Loss', linewidth=2)
        axes[0].set_title('Loss Curves')
        axes[0].set_xlabel('Epoch')
        axes[0].set_ylabel('Loss')
        axes[0].legend()
        axes[0].grid(True, alpha=0.3)
        
        # Accuracy plot
        axes[1].plot(epochs, train_accuracies, 'b-', label='Train Acc', linewidth=2)
        axes[1].plot(epochs, test_accuracies, 'r-', label='Test Acc', linewidth=2)
        axes[1].axhline(y=73.0, color='g', linestyle='--', label='Target (73%)')
        axes[1].set_title('Accuracy Curves')
        axes[1].set_xlabel('Epoch')
        axes[1].set_ylabel('Accuracy (%)')
        axes[1].legend()
        axes[1].grid(True, alpha=0.3)
    
    plt.tight_layout()
    
    if save_path:
        plt.savefig(save_path, dpi=300, bbox_inches='tight')
        print(f"Training curves saved to: {save_path}")
    
    plt.show()


def plot_confusion_matrix(
    y_true: np.ndarray,
    y_pred: np.ndarray,
    class_names: List[str],
    save_path: str = None,
    title: str = "Confusion Matrix",
    figsize: Tuple[int, int] = (20, 16)
):
    """
    Plot confusion matrix
    
    Args:
        y_true: True labels
        y_pred: Predicted labels
        class_names: List of class names
        save_path: Path to save the plot
        title: Title for the plot
        figsize: Figure size
    """
    if not HAS_SKLEARN:
        print("⚠️  Scikit-learn not available, cannot create confusion matrix")
        return
    
    # Compute confusion matrix
    cm = confusion_matrix(y_true, y_pred)
    cm_normalized = cm.astype('float') / cm.sum(axis=1)[:, np.newaxis]
    
    # Create plot
    fig, axes = plt.subplots(1, 2, figsize=figsize)
    fig.suptitle(title, fontsize=16, fontweight='bold')
    
    if HAS_SEABORN:
        # Use seaborn if available
        sns.heatmap(cm, annot=False, fmt='d', cmap='Blues', ax=axes[0])
        axes[0].set_title('Raw Counts')
        axes[0].set_xlabel('Predicted Label')
        axes[0].set_ylabel('True Label')
        
        sns.heatmap(cm_normalized, annot=False, fmt='.2f', cmap='Blues', ax=axes[1])
        axes[1].set_title('Normalized')
        axes[1].set_xlabel('Predicted Label')
        axes[1].set_ylabel('True Label')
    else:
        # Use matplotlib imshow as fallback
        im0 = axes[0].imshow(cm, cmap='Blues')
        axes[0].set_title('Raw Counts')
        axes[0].set_xlabel('Predicted Label')
        axes[0].set_ylabel('True Label')
        plt.colorbar(im0, ax=axes[0])
        
        im1 = axes[1].imshow(cm_normalized, cmap='Blues')
        axes[1].set_title('Normalized')
        axes[1].set_xlabel('Predicted Label')
        axes[1].set_ylabel('True Label')
        plt.colorbar(im1, ax=axes[1])
    
    plt.tight_layout()
    
    if save_path:
        plt.savefig(save_path, dpi=300, bbox_inches='tight')
        print(f"Confusion matrix saved to: {save_path}")
    
    plt.show()


def evaluate_model(
    model: nn.Module,
    test_loader: torch.utils.data.DataLoader,
    device: torch.device,
    class_names: List[str] = None
) -> Dict:
    """
    Comprehensive model evaluation
    
    Args:
        model: Trained model
        test_loader: Test data loader
        device: Device to run evaluation on
        class_names: List of class names
    
    Returns:
        Dictionary with evaluation results
    """
    model.eval()
    
    all_predictions = []
    all_targets = []
    test_loss = 0.0
    correct = 0
    total = 0
    
    criterion = nn.CrossEntropyLoss()
    
    with torch.no_grad():
        for inputs, targets in test_loader:
            inputs, targets = inputs.to(device), targets.to(device)
            
            outputs = model(inputs)
            loss = criterion(outputs, targets)
            
            test_loss += loss.item()
            _, predicted = outputs.max(1)
            
            total += targets.size(0)
            correct += predicted.eq(targets).sum().item()
            
            all_predictions.extend(predicted.cpu().numpy())
            all_targets.extend(targets.cpu().numpy())
    
    # Calculate metrics
    accuracy = 100.0 * correct / total
    avg_loss = test_loss / len(test_loader)
    
    # Classification report
    if HAS_SKLEARN:
        if class_names is not None:
            report = classification_report(
                all_targets, all_predictions,
                target_names=class_names,
                output_dict=True
            )
        else:
            report = classification_report(
                all_targets, all_predictions,
                output_dict=True
            )
    else:
        report = None
    
    results = {
        'accuracy': accuracy,
        'loss': avg_loss,
        'predictions': all_predictions,
        'targets': all_targets,
        'classification_report': report,
        'total_samples': total,
        'correct_predictions': correct
    }
    
    return results


def get_gpu_memory_usage():
    """Get current GPU memory usage"""
    if torch.cuda.is_available():
        return torch.cuda.memory_allocated() / 1024**3  # GB
    return 0.0


def format_time(seconds: float) -> str:
    """Format time in seconds to human readable format"""
    if seconds < 60:
        return f"{seconds:.1f}s"
    elif seconds < 3600:
        minutes = seconds // 60
        seconds = seconds % 60
        return f"{int(minutes)}m {seconds:.0f}s"
    else:
        hours = seconds // 3600
        minutes = (seconds % 3600) // 60
        return f"{int(hours)}h {int(minutes)}m"


def save_training_results(
    results: Dict,
    save_path: str
):
    """
    Save training results to JSON file
    
    Args:
        results: Dictionary with training results
        save_path: Path to save the results
    """
    # Convert numpy arrays to lists for JSON serialization
    serializable_results = {}
    for key, value in results.items():
        if isinstance(value, np.ndarray):
            serializable_results[key] = value.tolist()
        elif isinstance(value, torch.Tensor):
            serializable_results[key] = value.cpu().numpy().tolist()
        else:
            serializable_results[key] = value
    
    # Add timestamp
    serializable_results['timestamp'] = datetime.now().isoformat()
    
    # Save to file
    os.makedirs(os.path.dirname(save_path), exist_ok=True)
    with open(save_path, 'w') as f:
        json.dump(serializable_results, f, indent=2)
    
    print(f"Training results saved to: {save_path}")


def create_model_summary_plot(
    model: nn.Module,
    input_size: Tuple[int, ...] = (3, 32, 32),
    save_path: str = None
):
    """
    Create a visual summary of the model architecture
    
    Args:
        model: PyTorch model
        input_size: Input tensor size
        save_path: Path to save the plot
    """
    try:
        from torchsummary import summary
        
        # Capture summary output
        import io
        import sys
        
        old_stdout = sys.stdout
        sys.stdout = buffer = io.StringIO()
        
        summary(model, input_size)
        
        sys.stdout = old_stdout
        summary_text = buffer.getvalue()
        
        # Create plot
        fig, ax = plt.subplots(figsize=(12, 8))
        ax.text(0.1, 0.5, summary_text, fontsize=10, fontfamily='monospace',
                verticalalignment='center', transform=ax.transAxes)
        ax.set_title('Model Architecture Summary', fontsize=16, fontweight='bold')
        ax.axis('off')
        
        plt.tight_layout()
        
        if save_path:
            plt.savefig(save_path, dpi=300, bbox_inches='tight')
            print(f"Model summary saved to: {save_path}")
        
        plt.show()
        
    except ImportError:
        print("torchsummary not available. Install with: pip install torchsummary")


# Test the utilities
if __name__ == "__main__":
    print("Testing Utility Functions...")
    
    try:
        # Test AverageMeter
        print("\n🔍 Testing AverageMeter...")
        meter = AverageMeter('Loss', ':.4f')
        for i in range(10):
            meter.update(np.random.random())
        print(f"✅ AverageMeter: {meter}")
        
        # Test accuracy function
        print("\n🔍 Testing accuracy function...")
        output = torch.randn(32, 100)  # 32 samples, 100 classes
        target = torch.randint(0, 100, (32,))
        acc1, acc5 = accuracy(output, target, topk=(1, 5))
        print(f"✅ Accuracy - Top-1: {acc1.item():.2f}%, Top-5: {acc5.item():.2f}%")
        
        # Test GPU memory function
        print("\n🔍 Testing GPU memory function...")
        gpu_mem = get_gpu_memory_usage()
        print(f"✅ GPU Memory: {gpu_mem:.2f} GB")
        
        # Test time formatting
        print("\n🔍 Testing time formatting...")
        times = [30, 150, 3665]
        for t in times:
            formatted = format_time(t)
            print(f"✅ {t}s -> {formatted}")
        
        # Test logging setup
        print("\n🔍 Testing logging setup...")
        logger = setup_logging('./logs', 'test.log')
        logger.info("Test log message")
        print("✅ Logging setup successful!")
        
        # Create sample training curves
        print("\n🔍 Creating sample training curves...")
        epochs = 50
        train_losses = [2.0 * np.exp(-i/20) + 0.1 * np.random.random() for i in range(epochs)]
        test_losses = [2.2 * np.exp(-i/25) + 0.15 * np.random.random() for i in range(epochs)]
        train_accs = [95 * (1 - np.exp(-i/15)) + 2 * np.random.random() for i in range(epochs)]
        test_accs = [85 * (1 - np.exp(-i/20)) + 3 * np.random.random() for i in range(epochs)]
        lrs = [0.1 * (0.95 ** (i//10)) for i in range(epochs)]
        
        try:
            plot_training_curves(
                train_losses, train_accs, test_losses, test_accs, lrs,
                save_path="sample_training_curves.png",
                title="Sample Training Curves"
            )
            print("✅ Training curves created!")
        except Exception as e:
            print(f"⚠️  Plotting skipped (display not available): {e}")
        
        print("\n🎉 All utility tests passed!")
        
    except Exception as e:
        print(f"❌ Error in utilities: {e}")
        raise
