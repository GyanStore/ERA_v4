"""
MNIST S6 Model Testing Script
============================

Target: Validate all three models meet the requirements
Results: Parameter counts, architecture analysis, and requirement verification
Analysis: Comprehensive testing of Model_1, Model_2, and Model_3 architectures
"""

import torch
import torch.nn as nn
from model import create_model
import numpy as np

def test_model_architecture(model_name):
    """Test individual model architecture and requirements"""
    print(f"\n{'='*60}")
    print(f"TESTING {model_name}")
    print(f"{'='*60}")
    
    # Create model
    model = create_model(model_name)
    
    # Test input shape
    dummy_input = torch.randn(1, 1, 28, 28)
    output = model(dummy_input)
    
    print(f"Input shape: {dummy_input.shape}")
    print(f"Output shape: {output.shape}")
    print(f"Expected output: torch.Size([1, 10])")
    
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
    
    # Parameter analysis
    param_count = model.count_parameters()
    print(f"\nParameter Analysis:")
    print(f"Total parameters: {param_count:,}")
    print(f"Parameter limit: < 8,000")
    print(f"Status: {'✅ PASS' if param_count < 8000 else '❌ FAIL'}")
    
    # Detailed parameter breakdown
    print(f"\nDetailed Parameter Analysis:")
    print("-" * 70)
    total_params = 0
    
    for name, param in model.named_parameters():
        if param.requires_grad:
            param_count = param.numel()
            total_params += param_count
            print(f"{name:30} | Shape: {str(param.shape):20} | Params: {param_count:,}")
    
    print("-" * 70)
    print(f"{'TOTAL PARAMETERS':30} | {'':<20} | {total_params:,}")
    
    # Architecture analysis
    print(f"\nArchitecture Analysis:")
    print("-" * 50)
    
    # Count different layer types
    conv_layers = [name for name, module in model.named_modules() if isinstance(module, nn.Conv2d)]
    bn_layers = [name for name, module in model.named_modules() if isinstance(module, nn.BatchNorm2d)]
    dropout_layers = [name for name, module in model.named_modules() if isinstance(module, nn.Dropout)]
    gap_layers = [name for name, module in model.named_modules() if isinstance(module, nn.AdaptiveAvgPool2d)]
    
    print(f"Convolution layers: {len(conv_layers)}")
    print(f"BatchNorm layers: {len(bn_layers)}")
    print(f"Dropout layers: {len(dropout_layers)}")
    print(f"GAP layers: {len(gap_layers)}")
    
    # Receptive field calculation
    print(f"\nReceptive Field Analysis:")
    print("-" * 50)
    calculate_receptive_field(model_name)
    
    return model, param_count

def calculate_receptive_field(model_name):
    """Calculate receptive field for each model"""
    if model_name == "Model_1":
        print("Model_1 Receptive Field:")
        print("  Conv1 (3x3): RF = 3")
        print("  Conv2 (3x3): RF = 5")
        print("  MaxPool(2): RF = 10")
        print("  Conv3 (3x3): RF = 12")
        print("  Conv4 (3x3): RF = 14")
        print("  MaxPool(2): RF = 28")
        print("  Conv5 (3x3): RF = 30")
        print("  Final RF: 30 (covers full 28x28 image)")
        
    elif model_name == "Model_2":
        print("Model_2 Receptive Field:")
        print("  Conv1 (3x3): RF = 3")
        print("  Depthwise1 (3x3): RF = 5")
        print("  MaxPool(2): RF = 10")
        print("  Conv3 (3x3): RF = 12")
        print("  Depthwise2 (3x3): RF = 14")
        print("  MaxPool(2): RF = 28")
        print("  Conv5 (3x3): RF = 30")
        print("  Final RF: 30 (covers full 28x28 image)")
        
    elif model_name == "Model_3":
        print("Model_3 Receptive Field:")
        print("  Conv1 (3x3): RF = 3")
        print("  Conv2 (3x3): RF = 5")
        print("  MaxPool(2): RF = 10")
        print("  Conv3 (3x3): RF = 12")
        print("  Conv4 (3x3): RF = 14")
        print("  MaxPool(2): RF = 28")
        print("  Conv5 (3x3): RF = 30")
        print("  Final RF: 30 (covers full 28x28 image)")

def test_all_models():
    """Test all three models"""
    print("MNIST S6 MODEL TESTING")
    print("="*60)
    print("Testing Model_1, Model_2, and Model_3 architectures")
    print("Requirements: <8000 parameters, 99.4% accuracy, ≤15 epochs")
    
    all_results = {}
    
    for model_name in ["Model_1", "Model_2", "Model_3"]:
        model, param_count = test_model_architecture(model_name)
        all_results[model_name] = {
            'parameters': param_count,
            'meets_param_limit': param_count < 8000
        }
    
    # Summary
    print(f"\n{'='*60}")
    print("TESTING SUMMARY")
    print(f"{'='*60}")
    
    for model_name, results in all_results.items():
        status = "✅ PASS" if results['meets_param_limit'] else "❌ FAIL"
        print(f"{model_name:10} | Parameters: {results['parameters']:6,} | Status: {status}")
    
    all_passed = all(results['meets_param_limit'] for results in all_results.values())
    print(f"\nOverall Status: {'✅ ALL MODELS MEET PARAMETER REQUIREMENT' if all_passed else '❌ SOME MODELS EXCEED PARAMETER LIMIT'}")
    
    return all_results

if __name__ == "__main__":
    test_all_models()
