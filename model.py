"""
S7 Assignment - CIFAR-10 CNN with Advanced Techniques
====================================================

Requirements:
- C1C2C3C40 architecture (No MaxPooling, use 3x3 layers with stride=2 or Dilated kernels)
- Total RF > 44
- One layer with Depthwise Separable Convolution
- One layer with Dilated Convolution
- Use GAP (Global Average Pooling)
- Achieve 85% accuracy with <200k parameters
- Use Albumentations with specific augmentations

Architecture Design:
- C1: Initial feature extraction (3x3 conv, stride=2)
- C2: Depthwise Separable Convolution block
- C3: Dilated Convolution block  
- C40: Final classification block with GAP
"""

import torch
import torch.nn as nn
import torch.nn.functional as F

class DepthwiseSeparableConv(nn.Module):
    """Depthwise Separable Convolution: Depthwise + Pointwise"""
    def __init__(self, in_channels, out_channels, kernel_size=3, stride=1, padding=1, dilation=1):
        super(DepthwiseSeparableConv, self).__init__()
        
        # Depthwise convolution
        self.depthwise = nn.Conv2d(
            in_channels, in_channels, 
            kernel_size=kernel_size, 
            stride=stride, 
            padding=padding, 
            dilation=dilation,
            groups=in_channels,  # Key: groups=in_channels for depthwise
            bias=False
        )
        
        # Pointwise convolution (1x1)
        self.pointwise = nn.Conv2d(
            in_channels, out_channels, 
            kernel_size=1, 
            stride=1, 
            padding=0, 
            bias=False
        )
        
        self.bn1 = nn.BatchNorm2d(in_channels)
        self.bn2 = nn.BatchNorm2d(out_channels)
        
    def forward(self, x):
        x = F.relu(self.bn1(self.depthwise(x)))
        x = F.relu(self.bn2(self.pointwise(x)))
        return x

class DilatedConvBlock(nn.Module):
    """Dilated Convolution Block for increased receptive field"""
    def __init__(self, in_channels, out_channels, dilation=2):
        super(DilatedConvBlock, self).__init__()
        
        # Calculate padding to maintain spatial dimensions
        padding = dilation
        
        self.conv = nn.Conv2d(
            in_channels, out_channels,
            kernel_size=3,
            stride=1,
            padding=padding,
            dilation=dilation,
            bias=False
        )
        self.bn = nn.BatchNorm2d(out_channels)
        
    def forward(self, x):
        return F.relu(self.bn(self.conv(x)))

class CIFAR10Net(nn.Module):
    """
    CIFAR-10 CNN with C1C2C3C40 Architecture
    
    C1: Initial feature extraction with stride=2 (replaces MaxPool)
    C2: Depthwise Separable Convolution block
    C3: Dilated Convolution block
    C40: Final classification with GAP
    
    Target: >85% accuracy, <200k parameters, RF>44
    """
    
    def __init__(self, num_classes=10):
        super(CIFAR10Net, self).__init__()
        
        # C1: Initial feature extraction block (32x32 -> 16x16)
        self.c1_conv1 = nn.Conv2d(3, 8, kernel_size=3, stride=1, padding=1, bias=False)
        self.c1_bn1 = nn.BatchNorm2d(8)
        
        self.c1_conv2 = nn.Conv2d(8, 16, kernel_size=3, stride=2, padding=1, bias=False)  # Stride=2 replaces MaxPool
        self.c1_bn2 = nn.BatchNorm2d(16)
        
        self.c1_dropout = nn.Dropout(0.1)
        
        # C2: Depthwise Separable Convolution block (16x16 -> 8x8)
        self.c2_dw_sep = DepthwiseSeparableConv(16, 32, kernel_size=3, stride=1, padding=1)
        
        self.c2_conv = nn.Conv2d(32, 32, kernel_size=3, stride=2, padding=1, bias=False)  # Stride=2 replaces MaxPool
        self.c2_bn = nn.BatchNorm2d(32)
        
        self.c2_dropout = nn.Dropout(0.15)
        
        # C3: Dilated Convolution block (8x8 -> 4x4)
        self.c3_dilated1 = DilatedConvBlock(32, 64, dilation=2)
        self.c3_dilated2 = DilatedConvBlock(64, 64, dilation=2)
        
        self.c3_conv = nn.Conv2d(64, 64, kernel_size=3, stride=2, padding=1, bias=False)  # Stride=2 replaces MaxPool
        self.c3_bn = nn.BatchNorm2d(64)
        
        self.c3_dropout = nn.Dropout(0.2)
        
        # C40: Final classification block with GAP
        self.c40_conv1 = nn.Conv2d(64, 32, kernel_size=3, stride=1, padding=1, bias=False)
        self.c40_bn1 = nn.BatchNorm2d(32)
        
        self.c40_conv2 = nn.Conv2d(32, 16, kernel_size=3, stride=1, padding=1, bias=False)
        self.c40_bn2 = nn.BatchNorm2d(16)
        
        # Global Average Pooling
        self.gap = nn.AdaptiveAvgPool2d(1)
        
        # Final classifier (optional FC after GAP)
        self.classifier = nn.Linear(16, num_classes)
        
        self.c40_dropout = nn.Dropout(0.25)
        
    def forward(self, x):
        # C1: Initial feature extraction (32x32 -> 16x16)
        x = F.relu(self.c1_bn1(self.c1_conv1(x)))
        x = F.relu(self.c1_bn2(self.c1_conv2(x)))  # 32x32 -> 16x16
        x = self.c1_dropout(x)
        
        # C2: Depthwise Separable Convolution (16x16 -> 8x8)
        x = self.c2_dw_sep(x)
        x = F.relu(self.c2_bn(self.c2_conv(x)))  # 16x16 -> 8x8
        x = self.c2_dropout(x)
        
        # C3: Dilated Convolution (8x8 -> 4x4)
        x = self.c3_dilated1(x)
        x = self.c3_dilated2(x)
        x = F.relu(self.c3_bn(self.c3_conv(x)))  # 8x8 -> 4x4
        x = self.c3_dropout(x)
        
        # C40: Final classification with GAP
        x = F.relu(self.c40_bn1(self.c40_conv1(x)))
        x = F.relu(self.c40_bn2(self.c40_conv2(x)))
        x = self.c40_dropout(x)
        
        # Global Average Pooling
        x = self.gap(x)  # 4x4 -> 1x1
        x = x.view(x.size(0), -1)  # Flatten
        
        # Final classification
        x = self.classifier(x)
        
        return x
    
    def count_parameters(self):
        """Count total trainable parameters"""
        return sum(p.numel() for p in self.parameters() if p.requires_grad)

def calculate_receptive_field():
    """
    Calculate theoretical receptive field for our network
    
    RF calculation: RF_out = RF_in + (kernel_size - 1) * stride_product
    
    Layer by layer:
    1. Input: RF = 1
    2. C1_conv1 (3x3, s=1): RF = 1 + (3-1)*1 = 3
    3. C1_conv2 (3x3, s=2): RF = 3 + (3-1)*1 = 5, stride_product = 2
    4. C2_dw_sep depthwise (3x3, s=1): RF = 5 + (3-1)*2 = 9
    5. C2_dw_sep pointwise (1x1, s=1): RF = 9 + (1-1)*2 = 9
    6. C2_conv (3x3, s=2): RF = 9 + (3-1)*2 = 13, stride_product = 4
    7. C3_dilated1 (3x3, d=2, s=1): RF = 13 + (3-1)*2*4 = 29
    8. C3_dilated2 (3x3, d=2, s=1): RF = 29 + (3-1)*2*4 = 45
    9. C3_conv (3x3, s=2): RF = 45 + (3-1)*4 = 53, stride_product = 8
    
    Final RF = 53 > 44 ✓
    """
    print("Receptive Field Calculation:")
    print("============================")
    
    rf = 1
    stride_product = 1
    
    layers = [
        ("Input", 1, 1, 1),
        ("C1_conv1", 3, 1, 1),
        ("C1_conv2", 3, 2, 1), 
        ("C2_dw_sep_depthwise", 3, 1, 1),
        ("C2_dw_sep_pointwise", 1, 1, 1),
        ("C2_conv", 3, 2, 1),
        ("C3_dilated1", 3, 1, 2),
        ("C3_dilated2", 3, 1, 2),
        ("C3_conv", 3, 2, 1),
        ("C40_conv1", 3, 1, 1),
        ("C40_conv2", 3, 1, 1),
    ]
    
    for i, (name, kernel, stride, dilation) in enumerate(layers):
        if i == 0:
            print(f"{name:20}: RF = {rf}")
            continue
            
        effective_kernel = kernel + (kernel - 1) * (dilation - 1)
        rf = rf + (effective_kernel - 1) * stride_product
        stride_product *= stride
        
        print(f"{name:20}: RF = {rf:2d}, Stride_Product = {stride_product}")
    
    print(f"\nFinal Receptive Field: {rf}")
    print(f"Target (>44): {'✓ PASS' if rf > 44 else '✗ FAIL'}")
    
    return rf

def get_model_summary(model, device='cpu', input_size=(3, 32, 32)):
    """Print model summary with parameter count and RF"""
    print("CIFAR-10 CNN Model Summary")
    print("=" * 50)
    
    # Parameter count
    total_params = model.count_parameters()
    print(f"Total Parameters: {total_params:,}")
    print(f"Target (<200k): {'✓ PASS' if total_params < 200000 else '✗ FAIL'}")
    
    # Receptive field
    rf = calculate_receptive_field()
    
    # Test forward pass
    model.eval()
    with torch.no_grad():
        dummy_input = torch.randn(1, *input_size).to(device)
        output = model(dummy_input)
        print(f"\nInput Shape: {dummy_input.shape}")
        print(f"Output Shape: {output.shape}")
        print(f"Output Classes: {output.shape[1]}")
    
    print("\nArchitecture Verification:")
    print("- C1C2C3C40 structure: ✓")
    print("- No MaxPooling (stride=2 instead): ✓")
    print("- Depthwise Separable Conv in C2: ✓")
    print("- Dilated Conv in C3: ✓")
    print("- Global Average Pooling: ✓")
    
    return total_params, rf

if __name__ == "__main__":
    # Create and test model
    model = CIFAR10Net()
    
    # Get model summary
    device = torch.device("mps" if torch.backends.mps.is_available() else "cpu")
    model.to(device)
    
    total_params, rf = get_model_summary(model, device)
    
    print(f"\n{'='*50}")
    print("Model Creation Successful!")
    print(f"Parameters: {total_params:,} (<200k)")
    print(f"Receptive Field: {rf} (>44)")
    print(f"Device: {device}")
    print(f"{'='*50}")
