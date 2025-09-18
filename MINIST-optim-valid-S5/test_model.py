import torch
import torch.nn.functional as F
from model import create_model
import numpy as np

def test_model_architecture():
    """Test the model architecture and parameter count"""
    print("Testing Model Architecture...")
    print("="*50)
    
    # Create model
    model = create_model()
    
    # Test input shape
    dummy_input = torch.randn(1, 1, 28, 28)
    output = model(dummy_input)
    
    print(f"Input shape: {dummy_input.shape}")
    print(f"Output shape: {output.shape}")
    print(f"Output should be: torch.Size([1, 10])")
    
    # Verify output shape
    assert output.shape == torch.Size([1, 10]), f"Expected output shape [1, 10], got {output.shape}"
    print("✓ Output shape is correct")
    
    # Test with batch
    batch_input = torch.randn(32, 1, 28, 28)
    batch_output = model(batch_input)
    print(f"Batch input shape: {batch_input.shape}")
    print(f"Batch output shape: {batch_output.shape}")
    
    assert batch_output.shape == torch.Size([32, 10]), f"Expected batch output shape [32, 10], got {batch_output.shape}"
    print("✓ Batch processing works correctly")
    
    # Check parameter count
    param_count = model.count_parameters()
    print(f"Total parameters: {param_count:,}")
    
    if param_count < 25000:
        print("✓ Parameter count is within limit")
    else:
        print("✗ Parameter count exceeds 25,000 limit")
    
    print("\nModel Architecture:")
    print(model)
    
    return model

def analyze_model_layers():
    """Analyze each layer's parameter contribution"""
    print("\nDetailed Parameter Analysis:")
    print("="*50)
    
    model = create_model()
    total_params = 0
    
    for name, param in model.named_parameters():
        if param.requires_grad:
            param_count = param.numel()
            total_params += param_count
            print(f"{name:25} | Shape: {str(param.shape):15} | Params: {param_count:,}")
    
    print("-" * 70)
    print(f"{'Total Parameters':25} | {'':<15} | {total_params:,}")
    
    return total_params

if __name__ == "__main__":
    # Test the model
    model = test_model_architecture()
    
    # Analyze parameters
    total_params = analyze_model_layers()
    
    print(f"\nFinal Summary:")
    print("="*50)
    print(f"✓ Model created successfully")
    print(f"✓ Total parameters: {total_params:,}")
    print(f"✓ Parameter limit check: {'PASSED' if total_params < 25000 else 'FAILED'}")
    print(f"✓ Ready for training!")
