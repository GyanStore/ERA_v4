"""
CIFAR-100 Data Loading and Augmentation Utilities

This module provides optimized data loading, augmentation, and preprocessing
for CIFAR-100 dataset to achieve maximum performance with ResNet models.
"""

import torch
import torch.nn as nn
import torchvision
import torchvision.transforms as transforms
from torch.utils.data import DataLoader, Dataset
import numpy as np
import matplotlib.pyplot as plt
import os
from typing import Tuple, Dict, List


# CIFAR-100 dataset statistics
CIFAR100_MEAN = (0.5071, 0.4867, 0.4408)
CIFAR100_STD = (0.2675, 0.2565, 0.2761)

# CIFAR-100 class names
CIFAR100_CLASSES = [
    'apple', 'aquarium_fish', 'baby', 'bear', 'beaver', 'bed', 'bee', 'beetle',
    'bicycle', 'bottle', 'bowl', 'boy', 'bridge', 'bus', 'butterfly', 'camel',
    'can', 'castle', 'caterpillar', 'cattle', 'chair', 'chimpanzee', 'clock',
    'cloud', 'cockroach', 'couch', 'crab', 'crocodile', 'cup', 'dinosaur',
    'dolphin', 'elephant', 'flatfish', 'forest', 'fox', 'girl', 'hamster',
    'house', 'kangaroo', 'keyboard', 'lamp', 'lawn_mower', 'leopard', 'lion',
    'lizard', 'lobster', 'man', 'maple_tree', 'motorcycle', 'mountain', 'mouse',
    'mushroom', 'oak_tree', 'orange', 'orchid', 'otter', 'palm_tree', 'pear',
    'pickup_truck', 'pine_tree', 'plain', 'plate', 'poppy', 'porcupine',
    'possum', 'rabbit', 'raccoon', 'ray', 'road', 'rocket', 'rose',
    'sea', 'seal', 'shark', 'shrew', 'skunk', 'skyscraper', 'snail', 'snake',
    'spider', 'squirrel', 'streetcar', 'sunflower', 'sweet_pepper', 'table',
    'tank', 'telephone', 'television', 'tiger', 'tractor', 'train', 'trout',
    'tulip', 'turtle', 'wardrobe', 'whale', 'willow_tree', 'wolf', 'woman',
    'worm'
]


class CIFAR100Augmentation:
    """
    Advanced data augmentation strategies for CIFAR-100
    """
    
    @staticmethod
    def get_train_transforms(strong_augment=True):
        """
        Get training transforms with various augmentation strategies
        
        Args:
            strong_augment: Whether to use strong augmentation
        """
        if strong_augment:
            # Strong augmentation for better generalization
            transforms_list = [
                transforms.RandomCrop(32, padding=4, padding_mode='reflect'),
                transforms.RandomHorizontalFlip(p=0.5),
                transforms.RandomRotation(15),
                transforms.ColorJitter(
                    brightness=0.2,
                    contrast=0.2,
                    saturation=0.2,
                    hue=0.1
                ),
                transforms.RandomAffine(
                    degrees=0,
                    translate=(0.1, 0.1),
                    scale=(0.9, 1.1)
                ),
                transforms.ToTensor(),
                transforms.Normalize(CIFAR100_MEAN, CIFAR100_STD),
                transforms.RandomErasing(p=0.1, scale=(0.02, 0.33))
            ]
        else:
            # Light augmentation for faster convergence
            transforms_list = [
                transforms.RandomCrop(32, padding=4),
                transforms.RandomHorizontalFlip(p=0.5),
                transforms.ToTensor(),
                transforms.Normalize(CIFAR100_MEAN, CIFAR100_STD)
            ]
        
        return transforms.Compose(transforms_list)
    
    @staticmethod
    def get_test_transforms():
        """Get test/validation transforms (no augmentation)"""
        return transforms.Compose([
            transforms.ToTensor(),
            transforms.Normalize(CIFAR100_MEAN, CIFAR100_STD)
        ])
    
    @staticmethod
    def get_inference_transforms():
        """Get transforms for inference (same as test)"""
        return CIFAR100Augmentation.get_test_transforms()


class CIFAR100DataModule:
    """
    Complete data module for CIFAR-100 with optimized loading
    """
    
    def __init__(
        self,
        data_dir: str = './data',
        batch_size: int = 128,
        num_workers: int = 4,
        pin_memory: bool = True,
        strong_augment: bool = True,
        download: bool = True
    ):
        self.data_dir = data_dir
        self.batch_size = batch_size
        self.num_workers = num_workers
        self.pin_memory = pin_memory
        self.strong_augment = strong_augment
        self.download = download
        
        # Initialize transforms
        self.train_transforms = CIFAR100Augmentation.get_train_transforms(strong_augment)
        self.test_transforms = CIFAR100Augmentation.get_test_transforms()
        
        # Initialize datasets
        self.train_dataset = None
        self.test_dataset = None
        self.train_loader = None
        self.test_loader = None
        
    def prepare_data(self):
        """Download CIFAR-100 dataset if needed"""
        if self.download:
            # Download train set
            torchvision.datasets.CIFAR100(
                root=self.data_dir,
                train=True,
                download=True
            )
            
            # Download test set
            torchvision.datasets.CIFAR100(
                root=self.data_dir,
                train=False,
                download=True
            )
    
    def setup_datasets(self):
        """Setup train and test datasets"""
        # Training dataset
        self.train_dataset = torchvision.datasets.CIFAR100(
            root=self.data_dir,
            train=True,
            transform=self.train_transforms,
            download=False
        )
        
        # Test dataset
        self.test_dataset = torchvision.datasets.CIFAR100(
            root=self.data_dir,
            train=False,
            transform=self.test_transforms,
            download=False
        )
    
    def get_dataloaders(self) -> Tuple[DataLoader, DataLoader]:
        """Get optimized train and test dataloaders"""
        if self.train_dataset is None or self.test_dataset is None:
            self.prepare_data()
            self.setup_datasets()
        
        # Training dataloader with shuffle
        self.train_loader = DataLoader(
            self.train_dataset,
            batch_size=self.batch_size,
            shuffle=True,
            num_workers=self.num_workers,
            pin_memory=self.pin_memory,
            persistent_workers=True if self.num_workers > 0 else False,
            drop_last=True  # For stable batch norm
        )
        
        # Test dataloader without shuffle
        self.test_loader = DataLoader(
            self.test_dataset,
            batch_size=self.batch_size,
            shuffle=False,
            num_workers=self.num_workers,
            pin_memory=self.pin_memory,
            persistent_workers=True if self.num_workers > 0 else False
        )
        
        return self.train_loader, self.test_loader
    
    def get_dataset_info(self) -> Dict:
        """Get dataset information"""
        if self.train_dataset is None:
            self.prepare_data()
            self.setup_datasets()
        
        return {
            'num_classes': 100,
            'train_size': len(self.train_dataset),
            'test_size': len(self.test_dataset),
            'image_shape': (3, 32, 32),
            'mean': CIFAR100_MEAN,
            'std': CIFAR100_STD,
            'classes': CIFAR100_CLASSES
        }


def visualize_dataset_samples(
    dataloader: DataLoader,
    num_samples: int = 16,
    save_path: str = None,
    title: str = "CIFAR-100 Dataset Samples"
):
    """
    Visualize random samples from the dataset
    
    Args:
        dataloader: DataLoader to sample from
        num_samples: Number of samples to visualize
        save_path: Path to save the visualization
        title: Title for the plot
    """
    # Get a batch of data
    data_iter = iter(dataloader)
    images, labels = next(data_iter)
    
    # Select random samples
    indices = torch.randperm(len(images))[:num_samples]
    sample_images = images[indices]
    sample_labels = labels[indices]
    
    # Denormalize images for visualization
    mean = torch.tensor(CIFAR100_MEAN).view(3, 1, 1)
    std = torch.tensor(CIFAR100_STD).view(3, 1, 1)
    sample_images = sample_images * std + mean
    sample_images = torch.clamp(sample_images, 0, 1)
    
    # Create subplot
    rows = int(np.sqrt(num_samples))
    cols = int(np.ceil(num_samples / rows))
    
    fig, axes = plt.subplots(rows, cols, figsize=(12, 12))
    fig.suptitle(title, fontsize=16, fontweight='bold')
    
    for i in range(num_samples):
        row = i // cols
        col = i % cols
        
        if rows == 1:
            ax = axes[col] if cols > 1 else axes
        else:
            ax = axes[row, col]
        
        # Convert to numpy and transpose for matplotlib
        img = sample_images[i].permute(1, 2, 0).numpy()
        
        ax.imshow(img)
        ax.set_title(f"{CIFAR100_CLASSES[sample_labels[i]]}", fontsize=10)
        ax.axis('off')
    
    # Hide empty subplots
    for i in range(num_samples, rows * cols):
        row = i // cols
        col = i % cols
        if rows == 1:
            ax = axes[col] if cols > 1 else axes
        else:
            ax = axes[row, col]
        ax.axis('off')
    
    plt.tight_layout()
    
    if save_path:
        plt.savefig(save_path, dpi=300, bbox_inches='tight')
        print(f"Visualization saved to: {save_path}")
    
    plt.show()


def analyze_class_distribution(dataset, save_path: str = None):
    """
    Analyze and visualize class distribution in the dataset
    
    Args:
        dataset: CIFAR-100 dataset
        save_path: Path to save the analysis plot
    """
    # Count samples per class
    class_counts = torch.zeros(100)
    
    for _, label in dataset:
        class_counts[label] += 1
    
    # Create visualization
    plt.figure(figsize=(15, 8))
    
    # Bar plot
    plt.subplot(2, 1, 1)
    plt.bar(range(100), class_counts.numpy())
    plt.title('CIFAR-100 Class Distribution', fontsize=14, fontweight='bold')
    plt.xlabel('Class Index')
    plt.ylabel('Number of Samples')
    plt.grid(True, alpha=0.3)
    
    # Statistics
    plt.subplot(2, 1, 2)
    stats_text = f"""
    Dataset Statistics:
    Total Samples: {int(class_counts.sum())}
    Classes: 100
    Samples per Class: {int(class_counts[0])} (uniform distribution)
    Min Samples: {int(class_counts.min())}
    Max Samples: {int(class_counts.max())}
    Mean Samples: {class_counts.mean():.1f}
    Std Samples: {class_counts.std():.1f}
    """
    
    plt.text(0.1, 0.5, stats_text, fontsize=12, verticalalignment='center',
             bbox=dict(boxstyle="round,pad=0.3", facecolor="lightblue"))
    plt.axis('off')
    
    plt.tight_layout()
    
    if save_path:
        plt.savefig(save_path, dpi=300, bbox_inches='tight')
        print(f"Class distribution analysis saved to: {save_path}")
    
    plt.show()
    
    return class_counts


def get_data_loaders(
    batch_size: int = 128,
    num_workers: int = 4,
    data_dir: str = './data',
    strong_augment: bool = True,
    download: bool = True
) -> Tuple[DataLoader, DataLoader, Dict]:
    """
    Convenience function to get CIFAR-100 data loaders
    
    Args:
        batch_size: Batch size for data loaders
        num_workers: Number of worker processes
        data_dir: Directory to store/load data
        strong_augment: Whether to use strong augmentation
        download: Whether to download dataset if not present
    
    Returns:
        train_loader, test_loader, dataset_info
    """
    # Create data module
    data_module = CIFAR100DataModule(
        data_dir=data_dir,
        batch_size=batch_size,
        num_workers=num_workers,
        strong_augment=strong_augment,
        download=download
    )
    
    # Get data loaders
    train_loader, test_loader = data_module.get_dataloaders()
    dataset_info = data_module.get_dataset_info()
    
    return train_loader, test_loader, dataset_info


# Test the implementation
if __name__ == "__main__":
    print("Testing CIFAR-100 Data Utilities...")
    
    try:
        # Test data loading
        print("\n🔍 Testing data loading...")
        train_loader, test_loader, info = get_data_loaders(
            batch_size=64,
            num_workers=2,
            download=True
        )
        
        print(f"✅ Data loading successful!")
        print(f"   Train batches: {len(train_loader)}")
        print(f"   Test batches: {len(test_loader)}")
        print(f"   Train samples: {info['train_size']}")
        print(f"   Test samples: {info['test_size']}")
        print(f"   Classes: {info['num_classes']}")
        
        # Test batch loading
        print("\n🔍 Testing batch loading...")
        train_iter = iter(train_loader)
        images, labels = next(train_iter)
        
        print(f"✅ Batch loading successful!")
        print(f"   Batch shape: {images.shape}")
        print(f"   Labels shape: {labels.shape}")
        print(f"   Image range: [{images.min():.3f}, {images.max():.3f}]")
        print(f"   Sample labels: {labels[:10].tolist()}")
        
        # Test transforms
        print("\n🔍 Testing transforms...")
        augmentation = CIFAR100Augmentation()
        
        # Create dummy image
        dummy_image = torch.randint(0, 256, (32, 32, 3), dtype=torch.uint8)
        dummy_pil = transforms.ToPILImage()(dummy_image.permute(2, 0, 1))
        
        # Test train transforms
        train_transform = augmentation.get_train_transforms(strong_augment=True)
        transformed = train_transform(dummy_pil)
        
        print(f"✅ Transforms successful!")
        print(f"   Original shape: {dummy_image.shape}")
        print(f"   Transformed shape: {transformed.shape}")
        print(f"   Transformed range: [{transformed.min():.3f}, {transformed.max():.3f}]")
        
        # Visualize samples (optional - comment out if running headless)
        print("\n🔍 Creating sample visualization...")
        try:
            visualize_dataset_samples(
                train_loader,
                num_samples=16,
                save_path="cifar100_samples.png",
                title="CIFAR-100 Training Samples"
            )
            print("✅ Visualization created!")
        except Exception as e:
            print(f"⚠️  Visualization skipped (display not available): {e}")
        
        print("\n🎉 All data utility tests passed!")
        
    except Exception as e:
        print(f"❌ Error in data utilities: {e}")
        raise
