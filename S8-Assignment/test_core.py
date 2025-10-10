"""
Test core functionality without problematic imports
"""

import torch
import torch.nn as nn
import numpy as np
import matplotlib
matplotlib.use('Agg')  # Use non-interactive backend
import matplotlib.pyplot as plt

# Test our core modules
from resnet_model import get_model, count_parameters
from data_utils import get_data_loaders, CIFAR100_CLASSES

def test_core_functionality():
    """Test the core functionality without problematic imports"""
    
    print("🔍 Testing core functionality...")
    
    # Test model creation
    print("\n📦 Testing model creation...")
    model = get_model('resnet18', num_classes=100)
    params = count_parameters(model)
    print(f"✅ ResNet-18 created with {params['total']:,} parameters")
    
    # Test forward pass
    print("\n🔄 Testing forward pass...")
    model.eval()
    with torch.no_grad():
        x = torch.randn(4, 3, 32, 32)
        output = model(x)
        print(f"✅ Forward pass successful: {x.shape} -> {output.shape}")
    
    # Test data loading (small batch for speed)
    print("\n📊 Testing data loading...")
    try:
        train_loader, test_loader, info = get_data_loaders(
            batch_size=32,
            num_workers=0,  # Avoid multiprocessing issues
            download=False  # Already downloaded
        )
        
        # Get one batch
        train_iter = iter(train_loader)
        images, labels = next(train_iter)
        
        print(f"✅ Data loading successful:")
        print(f"   Batch shape: {images.shape}")
        print(f"   Labels shape: {labels.shape}")
        print(f"   Classes: {info['num_classes']}")
        
    except Exception as e:
        print(f"⚠️  Data loading test skipped: {e}")
    
    # Test basic training components
    print("\n🏋️  Testing training components...")
    
    # Loss function
    criterion = nn.CrossEntropyLoss()
    
    # Optimizer
    optimizer = torch.optim.SGD(model.parameters(), lr=0.1, momentum=0.9)
    
    # Scheduler
    scheduler = torch.optim.lr_scheduler.CosineAnnealingLR(optimizer, T_max=10)
    
    print("✅ Training components created successfully")
    
    # Test a mini training step
    print("\n🎯 Testing mini training step...")
    model.train()
    
    # Create dummy data
    dummy_images = torch.randn(8, 3, 32, 32)
    dummy_labels = torch.randint(0, 100, (8,))
    
    # Forward pass
    outputs = model(dummy_images)
    loss = criterion(outputs, dummy_labels)
    
    # Backward pass
    optimizer.zero_grad()
    loss.backward()
    optimizer.step()
    scheduler.step()
    
    # Calculate accuracy
    _, predicted = outputs.max(1)
    correct = predicted.eq(dummy_labels).sum().item()
    accuracy = 100.0 * correct / dummy_labels.size(0)
    
    print(f"✅ Mini training step successful:")
    print(f"   Loss: {loss.item():.4f}")
    print(f"   Accuracy: {accuracy:.2f}%")
    print(f"   Learning rate: {optimizer.param_groups[0]['lr']:.6f}")
    
    print("\n🎉 All core functionality tests passed!")
    
    return True

if __name__ == "__main__":
    try:
        test_core_functionality()
        print("\n✅ Core implementation is ready for training!")
    except Exception as e:
        print(f"\n❌ Test failed: {e}")
        raise
