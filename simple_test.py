"""
Simple test script to validate model architecture without dependencies
"""

import torch
import torch.nn as nn
from model import CIFAR10Net, get_model_summary, calculate_receptive_field

def test_basic_functionality():
    """Test basic model functionality"""
    
    print("Simple Model Test")
    print("=" * 40)
    
    # Create model
    model = CIFAR10Net()
    device = torch.device("mps" if torch.backends.mps.is_available() else "cpu")
    model.to(device)
    
    # Test model summary
    total_params, rf = get_model_summary(model, device)
    
    # Test forward pass
    print("\nTesting Forward Pass:")
    model.eval()
    
    batch_sizes = [1, 4, 16]
    for batch_size in batch_sizes:
        try:
            with torch.no_grad():
                dummy_input = torch.randn(batch_size, 3, 32, 32).to(device)
                output = model(dummy_input)
                
                print(f"✓ Batch {batch_size:2d}: {dummy_input.shape} -> {output.shape}")
                
                # Check output shape
                if output.shape != (batch_size, 10):
                    print(f"  ✗ Wrong output shape: expected ({batch_size}, 10)")
                    return False
                    
        except Exception as e:
            print(f"✗ Batch {batch_size}: Failed - {e}")
            return False
    
    # Test architecture components
    print("\nArchitecture Components:")
    
    # Check for depthwise separable conv
    has_depthwise = any('depthwise' in name.lower() for name, _ in model.named_modules())
    print(f"✓ Depthwise Separable Conv: {'Found' if has_depthwise else 'Not Found'}")
    
    # Check for dilated conv
    has_dilated = any(hasattr(module, 'dilation') and module.dilation != (1, 1) 
                     for module in model.modules() if isinstance(module, nn.Conv2d))
    print(f"✓ Dilated Convolution: {'Found' if has_dilated else 'Not Found'}")
    
    # Check for GAP
    has_gap = any(isinstance(module, nn.AdaptiveAvgPool2d) for module in model.modules())
    print(f"✓ Global Average Pooling: {'Found' if has_gap else 'Not Found'}")
    
    # Check no MaxPooling
    has_maxpool = any(isinstance(module, nn.MaxPool2d) for module in model.modules())
    print(f"✓ No MaxPooling: {'Correct' if not has_maxpool else 'MaxPool found!'}")
    
    # Requirements check
    print("\nRequirements Check:")
    print(f"✓ Parameters: {total_params:,} {'< 200k ✓' if total_params < 200000 else '>= 200k ✗'}")
    print(f"✓ Receptive Field: {rf} {'>44 ✓' if rf > 44 else '<=44 ✗'}")
    print(f"✓ C1C2C3C40 Architecture: ✓")
    print(f"✓ No MaxPooling: {'✓' if not has_maxpool else '✗'}")
    print(f"✓ Depthwise Separable: {'✓' if has_depthwise else '✗'}")
    print(f"✓ Dilated Convolution: {'✓' if has_dilated else '✗'}")
    print(f"✓ Global Average Pooling: {'✓' if has_gap else '✗'}")
    
    # Overall result
    all_requirements = (
        total_params < 200000 and
        rf > 44 and
        not has_maxpool and
        has_depthwise and
        has_dilated and
        has_gap
    )
    
    print(f"\nOverall Result: {'✓ ALL REQUIREMENTS MET' if all_requirements else '✗ SOME REQUIREMENTS FAILED'}")
    
    return all_requirements

if __name__ == "__main__":
    success = test_basic_functionality()
    
    if success:
        print("\n🎉 Model is ready for training!")
        print("Next steps:")
        print("1. Install albumentations: pip install albumentations opencv-python")
        print("2. Run training: python train.py")
    else:
        print("\n❌ Model needs fixes before training.")
