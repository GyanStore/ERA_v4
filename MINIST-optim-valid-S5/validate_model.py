import torch
import torch.nn as nn
from model import create_final_model

def validate_requirements():
    """Validate all assignment requirements"""
    print("="*60)
    print("MNIST MODEL REQUIREMENTS VALIDATION")
    print("="*60)
    
    # Create model
    model = create_final_model()
    
    # Check parameter count
    param_count = model.count_parameters()
    print(f"\n🔢 PARAMETER COUNT CHECK")
    print(f"Total parameters: {param_count:,}")
    print(f"Requirement: < 20,000")
    print(f"Status: {'✅ PASS' if param_count < 20000 else '❌ FAIL'}")
    
    # Check Batch Normalization usage
    bn_layers = [name for name, module in model.named_modules() if isinstance(module, nn.BatchNorm2d)]
    print(f"\n🔧 BATCH NORMALIZATION CHECK")
    print(f"BatchNorm layers found: {len(bn_layers)}")
    print(f"Layer names: {bn_layers}")
    print(f"Status: {'✅ PASS' if len(bn_layers) > 0 else '❌ FAIL'}")
    
    # Check Dropout usage
    dropout_layers = [name for name, module in model.named_modules() if isinstance(module, nn.Dropout)]
    dropout_rates = [module.p for name, module in model.named_modules() if isinstance(module, nn.Dropout)]
    print(f"\n🎯 DROPOUT CHECK")
    print(f"Dropout layers found: {len(dropout_layers)}")
    print(f"Dropout rates: {dropout_rates}")
    print(f"Status: {'✅ PASS' if len(dropout_layers) > 0 else '❌ FAIL'}")
    
    # Check GAP or FC usage
    gap_layers = [name for name, module in model.named_modules() if isinstance(module, nn.AdaptiveAvgPool2d)]
    fc_layers = [name for name, module in model.named_modules() if isinstance(module, nn.Linear)]
    print(f"\n🌐 GAP/FC CHECK")
    print(f"GAP layers: {gap_layers}")
    print(f"FC layers: {fc_layers}")
    print(f"Status: {'✅ PASS' if len(gap_layers) > 0 or len(fc_layers) > 0 else '❌ FAIL'}")
    
    # Overall status
    all_passed = (param_count < 20000 and 
                  len(bn_layers) > 0 and 
                  len(dropout_layers) > 0 and 
                  (len(gap_layers) > 0 or len(fc_layers) > 0))
    
    print(f"\n🏆 OVERALL STATUS: {'✅ ALL REQUIREMENTS MET' if all_passed else '❌ REQUIREMENTS NOT MET'}")
    
    return all_passed

if __name__ == "__main__":
    validate_requirements()
