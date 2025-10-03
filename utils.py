"""
S7 Assignment - Utility Functions
=================================

Data loading, augmentations, and helper functions for CIFAR-10 training.

Required Augmentations (using Albumentations):
1. Horizontal Flip
2. ShiftScaleRotate  
3. CoarseDropout with specific parameters

CIFAR-10 Dataset Info:
- 32x32 RGB images
- 10 classes: airplane, automobile, bird, cat, deer, dog, frog, horse, ship, truck
- Mean: [0.4914, 0.4822, 0.4465]
- Std: [0.2470, 0.2435, 0.2616]
"""

import torch
import torch.nn as nn
from torch.utils.data import DataLoader
from torchvision import datasets, transforms
import albumentations as A
from albumentations.pytorch import ToTensorV2
import numpy as np
import cv2

# CIFAR-10 dataset statistics
CIFAR10_MEAN = [0.4914, 0.4822, 0.4465]
CIFAR10_STD = [0.2470, 0.2435, 0.2616]

class AlbumentationsTransform:
    """Wrapper for Albumentations transforms to work with PyTorch DataLoader"""
    
    def __init__(self, transform):
        self.transform = transform
    
    def __call__(self, image):
        # Convert PIL Image to numpy array
        if hasattr(image, 'numpy'):
            image = image.numpy()
        else:
            image = np.array(image)
        
        # Apply albumentations transform
        transformed = self.transform(image=image)
        return transformed['image']

def get_train_transforms():
    """
    Training transforms using Albumentations with required augmentations:
    1. Horizontal Flip
    2. ShiftScaleRotate
    3. CoarseDropout with specific parameters
    """
    
    # Calculate fill_value as mean of dataset
    fill_value = tuple([int(x * 255) for x in CIFAR10_MEAN])  # Convert to 0-255 range
    
    train_transform = A.Compose([
        # Required augmentations
        A.HorizontalFlip(p=0.5),
        
        A.ShiftScaleRotate(
            shift_limit=0.1,    # ±10% shift
            scale_limit=0.1,    # ±10% scale
            rotate_limit=15,    # ±15 degrees rotation
            border_mode=cv2.BORDER_CONSTANT,
            value=fill_value,
            p=0.5
        ),
        
        A.CoarseDropout(
            max_holes=1,
            max_height=16,
            max_width=16,
            min_holes=1,
            min_height=16,
            min_width=16,
            fill_value=fill_value,
            mask_fill_value=None,
            p=0.5
        ),
        
        # Additional augmentations for better performance
        A.RandomBrightnessContrast(
            brightness_limit=0.2,
            contrast_limit=0.2,
            p=0.3
        ),
        
        # Normalization and tensor conversion
        A.Normalize(mean=CIFAR10_MEAN, std=CIFAR10_STD),
        ToTensorV2()
    ])
    
    return AlbumentationsTransform(train_transform)

def get_test_transforms():
    """Test transforms - only normalization, no augmentation"""
    
    test_transform = A.Compose([
        A.Normalize(mean=CIFAR10_MEAN, std=CIFAR10_STD),
        ToTensorV2()
    ])
    
    return AlbumentationsTransform(test_transform)

def get_dataloaders(batch_size=128, num_workers=4, pin_memory=True):
    """
    Create CIFAR-10 data loaders with Albumentations transforms
    
    Args:
        batch_size: Batch size for training and testing
        num_workers: Number of worker processes for data loading
        pin_memory: Whether to pin memory for faster GPU transfer
    
    Returns:
        train_loader, test_loader
    """
    
    print("Setting up CIFAR-10 data loaders...")
    
    # Get transforms
    train_transform = get_train_transforms()
    test_transform = get_test_transforms()
    
    # Load datasets
    train_dataset = datasets.CIFAR10(
        root='./data', 
        train=True, 
        download=True, 
        transform=train_transform
    )
    
    test_dataset = datasets.CIFAR10(
        root='./data', 
        train=False, 
        download=True, 
        transform=test_transform
    )
    
    # Create data loaders
    train_loader = DataLoader(
        train_dataset,
        batch_size=batch_size,
        shuffle=True,
        num_workers=num_workers,
        pin_memory=pin_memory,
        persistent_workers=True if num_workers > 0 else False
    )
    
    test_loader = DataLoader(
        test_dataset,
        batch_size=batch_size,
        shuffle=False,
        num_workers=num_workers,
        pin_memory=pin_memory,
        persistent_workers=True if num_workers > 0 else False
    )
    
    print(f"Training samples: {len(train_dataset):,}")
    print(f"Test samples: {len(test_dataset):,}")
    print(f"Batch size: {batch_size}")
    print(f"Number of batches - Train: {len(train_loader)}, Test: {len(test_loader)}")
    
    return train_loader, test_loader

def print_augmentation_info():
    """Print information about the augmentations being used"""
    
    print("\nAugmentation Configuration:")
    print("=" * 40)
    print("✓ Horizontal Flip (p=0.5)")
    print("✓ ShiftScaleRotate:")
    print("  - Shift: ±10%")
    print("  - Scale: ±10%") 
    print("  - Rotate: ±15°")
    print("✓ CoarseDropout:")
    print("  - max_holes=1, min_holes=1")
    print("  - max_height=16px, min_height=16px")
    print("  - max_width=16px, min_width=16px")
    print(f"  - fill_value={tuple([int(x * 255) for x in CIFAR10_MEAN])}")
    print("  - mask_fill_value=None")
    print("✓ Additional augmentations:")
    print("  - RandomBrightnessContrast (p=0.3)")
    print(f"✓ Normalization: mean={CIFAR10_MEAN}, std={CIFAR10_STD}")

def get_device():
    """Get the best available device (MPS > CUDA > CPU)"""
    
    if torch.backends.mps.is_available():
        device = torch.device("mps")
        print("Using Apple Silicon MPS")
    elif torch.cuda.is_available():
        device = torch.device("cuda")
        print(f"Using CUDA: {torch.cuda.get_device_name()}")
    else:
        device = torch.device("cpu")
        print("Using CPU")
    
    return device

class AverageMeter:
    """Computes and stores the average and current value"""
    
    def __init__(self):
        self.reset()
    
    def reset(self):
        self.val = 0
        self.avg = 0
        self.sum = 0
        self.count = 0
    
    def update(self, val, n=1):
        self.val = val
        self.sum += val * n
        self.count += n
        self.avg = self.sum / self.count

def accuracy(output, target, topk=(1,)):
    """Computes the accuracy over the k top predictions"""
    
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

def save_checkpoint(state, filename='checkpoint.pth'):
    """Save model checkpoint"""
    torch.save(state, filename)
    print(f"Checkpoint saved: {filename}")

def load_checkpoint(filename, model, optimizer=None):
    """Load model checkpoint"""
    
    if torch.backends.mps.is_available():
        checkpoint = torch.load(filename, map_location='mps')
    elif torch.cuda.is_available():
        checkpoint = torch.load(filename, map_location='cuda')
    else:
        checkpoint = torch.load(filename, map_location='cpu')
    
    model.load_state_dict(checkpoint['model_state_dict'])
    
    if optimizer and 'optimizer_state_dict' in checkpoint:
        optimizer.load_state_dict(checkpoint['optimizer_state_dict'])
    
    print(f"Checkpoint loaded: {filename}")
    print(f"Epoch: {checkpoint.get('epoch', 'Unknown')}")
    print(f"Best Accuracy: {checkpoint.get('best_acc', 'Unknown'):.2f}%")
    
    return checkpoint

# CIFAR-10 class names
CIFAR10_CLASSES = [
    'airplane', 'automobile', 'bird', 'cat', 'deer',
    'dog', 'frog', 'horse', 'ship', 'truck'
]

def get_class_name(class_idx):
    """Get class name from index"""
    return CIFAR10_CLASSES[class_idx]

if __name__ == "__main__":
    # Test data loading and augmentations
    print("Testing CIFAR-10 data loading and augmentations...")
    
    # Print augmentation info
    print_augmentation_info()
    
    # Test data loaders
    train_loader, test_loader = get_dataloaders(batch_size=4, num_workers=0)
    
    # Test a batch
    for batch_idx, (data, target) in enumerate(train_loader):
        print(f"\nBatch {batch_idx + 1}:")
        print(f"Data shape: {data.shape}")
        print(f"Target shape: {target.shape}")
        print(f"Data range: [{data.min():.3f}, {data.max():.3f}]")
        print(f"Classes in batch: {[get_class_name(idx.item()) for idx in target]}")
        break
    
    print("\nData loading test completed successfully!")
