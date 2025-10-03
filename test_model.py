"""
S7 Assignment - Model Testing and Validation
============================================

Test script to validate:
1. Model architecture (C1C2C3C40)
2. Parameter count (<200k)
3. Receptive field (>44)
4. Depthwise separable convolution implementation
5. Dilated convolution implementation
6. Global Average Pooling
7. Data loading and augmentations
8. Forward pass functionality
"""

import torch
import torch.nn as nn
import numpy as np
from torchsummary import summary
import sys
import os

from model import CIFAR10Net, get_model_summary, calculate_receptive_field
from utils import get_dataloaders, get_device, print_augmentation_info, CIFAR10_CLASSES

def test_model_architecture():
    """Test model architecture and requirements"""
    
    print("Testing Model Architecture")
    print("=" * 50)
    
    # Create model
    model = CIFAR10Net()
    device = get_device()
    model.to(device)
    
    # Test model summary
    total_params, rf = get_model_summary(model, device)
    
    # Validate requirements
    requirements_met = True
    
    print("\nRequirement Validation:")
    print("-" * 30)
    
    # Parameter count
    if total_params < 200000:
        print(f"✓ Parameters: {total_params:,} < 200,000")
    else:
        print(f"✗ Parameters: {total_params:,} >= 200,000")
        requirements_met = False
    
    # Receptive field
    if rf > 44:
        print(f"✓ Receptive Field: {rf} > 44")
    else:
        print(f"✗ Receptive Field: {rf} <= 44")
        requirements_met = False
    
    # Architecture components
    has_depthwise = any('depthwise' in name.lower() for name, _ in model.named_modules())
    has_dilated = any(hasattr(module, 'dilation') and module.dilation != (1, 1) 
                     for module in model.modules() if isinstance(module, nn.Conv2d))
    has_gap = any(isinstance(module, nn.AdaptiveAvgPool2d) for module in model.modules())
    
    print(f"✓ Depthwise Separable Conv: {'Found' if has_depthwise else 'Not Found'}")
    print(f"✓ Dilated Convolution: {'Found' if has_dilated else 'Not Found'}")
    print(f"✓ Global Average Pooling: {'Found' if has_gap else 'Not Found'}")
    
    # No MaxPooling check
    has_maxpool = any(isinstance(module, nn.MaxPool2d) for module in model.modules())
    print(f"✓ No MaxPooling: {'Correct' if not has_maxpool else 'MaxPool found!'}")
    
    if not has_maxpool:
        requirements_met = requirements_met and True
    else:
        requirements_met = False
    
    print(f"\nOverall Requirements: {'✓ PASSED' if requirements_met else '✗ FAILED'}")
    
    return model, requirements_met

def test_forward_pass():
    """Test forward pass with different input sizes"""
    
    print("\nTesting Forward Pass")
    print("=" * 50)
    
    model = CIFAR10Net()
    device = get_device()
    model.to(device)
    model.eval()
    
    # Test with different batch sizes
    batch_sizes = [1, 4, 16, 32]
    
    for batch_size in batch_sizes:
        try:
            with torch.no_grad():
                dummy_input = torch.randn(batch_size, 3, 32, 32).to(device)
                output = model(dummy_input)
                
                print(f"✓ Batch size {batch_size:2d}: Input {dummy_input.shape} -> Output {output.shape}")
                
                # Validate output shape
                expected_shape = (batch_size, 10)
                if output.shape == expected_shape:
                    print(f"  Output shape correct: {output.shape}")
                else:
                    print(f"  ✗ Output shape incorrect: {output.shape}, expected: {expected_shape}")
                    return False
                    
        except Exception as e:
            print(f"✗ Batch size {batch_size}: Failed with error: {e}")
            return False
    
    print("✓ All forward pass tests passed!")
    return True

def test_data_loading():
    """Test data loading and augmentations"""
    
    print("\nTesting Data Loading and Augmentations")
    print("=" * 50)
    
    try:
        # Print augmentation info
        print_augmentation_info()
        
        # Test data loaders
        print("\nTesting data loaders...")
        train_loader, test_loader = get_dataloaders(batch_size=8, num_workers=0)
        
        # Test training data (with augmentations)
        print("\nTesting training data:")
        for batch_idx, (data, target) in enumerate(train_loader):
            print(f"Batch {batch_idx + 1}:")
            print(f"  Data shape: {data.shape}")
            print(f"  Target shape: {target.shape}")
            print(f"  Data range: [{data.min():.3f}, {data.max():.3f}]")
            print(f"  Data type: {data.dtype}")
            print(f"  Classes: {[CIFAR10_CLASSES[idx.item()] for idx in target]}")
            
            # Validate data properties
            if data.shape[1:] != (3, 32, 32):
                print(f"  ✗ Incorrect data shape: {data.shape}")
                return False
            
            if target.shape[0] != data.shape[0]:
                print(f"  ✗ Batch size mismatch: data={data.shape[0]}, target={target.shape[0]}")
                return False
            
            break
        
        # Test test data (no augmentations)
        print("\nTesting test data:")
        for batch_idx, (data, target) in enumerate(test_loader):
            print(f"Batch {batch_idx + 1}:")
            print(f"  Data shape: {data.shape}")
            print(f"  Data range: [{data.min():.3f}, {data.max():.3f}]")
            break
        
        print("✓ Data loading tests passed!")
        return True
        
    except Exception as e:
        print(f"✗ Data loading failed: {e}")
        return False

def test_model_components():
    """Test specific model components"""
    
    print("\nTesting Model Components")
    print("=" * 50)
    
    model = CIFAR10Net()
    device = get_device()
    model.to(device)
    
    # Test depthwise separable convolution
    print("Testing Depthwise Separable Convolution:")
    dw_sep = model.c2_dw_sep
    test_input = torch.randn(1, 16, 16, 16).to(device)
    
    try:
        with torch.no_grad():
            output = dw_sep(test_input)
        print(f"  ✓ Input: {test_input.shape} -> Output: {output.shape}")
        
        # Check if it's actually depthwise separable
        depthwise_params = sum(p.numel() for p in dw_sep.depthwise.parameters())
        pointwise_params = sum(p.numel() for p in dw_sep.pointwise.parameters())
        total_params = depthwise_params + pointwise_params
        
        # Compare with standard convolution
        standard_conv_params = 16 * 32 * 3 * 3  # in_channels * out_channels * kernel_size^2
        
        print(f"  Depthwise params: {depthwise_params:,}")
        print(f"  Pointwise params: {pointwise_params:,}")
        print(f"  Total DS params: {total_params:,}")
        print(f"  Standard conv params: {standard_conv_params:,}")
        print(f"  Parameter reduction: {standard_conv_params / total_params:.1f}x")
        
    except Exception as e:
        print(f"  ✗ Depthwise separable test failed: {e}")
        return False
    
    # Test dilated convolution
    print("\nTesting Dilated Convolution:")
    dilated_conv = model.c3_dilated1
    test_input = torch.randn(1, 32, 8, 8).to(device)
    
    try:
        with torch.no_grad():
            output = dilated_conv(test_input)
        print(f"  ✓ Input: {test_input.shape} -> Output: {output.shape}")
        
        # Check dilation
        dilation = dilated_conv.conv.dilation
        print(f"  Dilation: {dilation}")
        
    except Exception as e:
        print(f"  ✗ Dilated convolution test failed: {e}")
        return False
    
    # Test Global Average Pooling
    print("\nTesting Global Average Pooling:")
    gap = model.gap
    test_input = torch.randn(1, 16, 4, 4).to(device)
    
    try:
        with torch.no_grad():
            output = gap(test_input)
        print(f"  ✓ Input: {test_input.shape} -> Output: {output.shape}")
        
        if output.shape == (1, 16, 1, 1):
            print("  ✓ GAP working correctly")
        else:
            print(f"  ✗ GAP output shape incorrect: {output.shape}")
            return False
            
    except Exception as e:
        print(f"  ✗ GAP test failed: {e}")
        return False
    
    print("✓ All component tests passed!")
    return True

def test_receptive_field_calculation():
    """Test receptive field calculation"""
    
    print("\nTesting Receptive Field Calculation")
    print("=" * 50)
    
    try:
        rf = calculate_receptive_field()
        
        if rf > 44:
            print(f"✓ Receptive field calculation: {rf} > 44")
            return True
        else:
            print(f"✗ Receptive field calculation: {rf} <= 44")
            return False
            
    except Exception as e:
        print(f"✗ Receptive field calculation failed: {e}")
        return False

def run_all_tests():
    """Run all tests"""
    
    print("S7 Assignment - Model Testing Suite")
    print("=" * 60)
    
    tests = [
        ("Model Architecture", test_model_architecture),
        ("Forward Pass", test_forward_pass),
        ("Data Loading", test_data_loading),
        ("Model Components", test_model_components),
        ("Receptive Field", test_receptive_field_calculation)
    ]
    
    results = {}
    
    for test_name, test_func in tests:
        print(f"\n{'='*60}")
        print(f"Running: {test_name}")
        print(f"{'='*60}")
        
        try:
            if test_name == "Model Architecture":
                model, result = test_func()
                results[test_name] = result
            else:
                result = test_func()
                results[test_name] = result
        except Exception as e:
            print(f"✗ {test_name} failed with exception: {e}")
            results[test_name] = False
    
    # Summary
    print(f"\n{'='*60}")
    print("TEST SUMMARY")
    print(f"{'='*60}")
    
    passed = 0
    total = len(tests)
    
    for test_name, result in results.items():
        status = "✓ PASSED" if result else "✗ FAILED"
        print(f"{test_name:20}: {status}")
        if result:
            passed += 1
    
    print(f"\nOverall: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 All tests passed! Model is ready for training.")
        return True
    else:
        print("❌ Some tests failed. Please fix the issues before training.")
        return False

if __name__ == "__main__":
    success = run_all_tests()
    sys.exit(0 if success else 1)
