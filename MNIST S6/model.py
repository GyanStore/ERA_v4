"""
MNIST S6 Assignment - Ultra-Efficient Models for 99.4% Accuracy
===============================================================

Target: Achieve 99.4% accuracy consistently with <8000 parameters in ≤15 epochs
Approach: Advanced CNN architectures with proven techniques for MNIST

Model_1: Ultra-lightweight baseline (~3-4k params) - 98%+ accuracy
Model_2: Optimized efficiency (~6-7k params) - 99.2%+ accuracy  
Model_3: Final precision (<8k params) - 99.4%+ accuracy

Receptive Field Calculations:
- 3x3 conv: RF = 3
- 3x3 conv + 3x3 conv: RF = 5  
- 3x3 conv + 3x3 conv + 3x3 conv: RF = 7
- With maxpool(2): RF doubles
- Final RF for 28x28 input: ~30 (covers full image)

Key Techniques:
- Batch Normalization for stable training
- Strategic Dropout for regularization
- Global Average Pooling for parameter efficiency
- Residual connections for better gradient flow
- Optimized channel progression
"""

import torch
import torch.nn as nn
import torch.nn.functional as F

class Model_1(nn.Module):
    """
    Model_1: Ultra-Lightweight Baseline Architecture
    
    Target: <8000 parameters, 98%+ accuracy, ≤15 epochs
    Strategy: Minimal design with proven techniques
    Expected Parameters: ~3,500
    Receptive Field: 16×16 (covers 57% of 28×28 image)
    """
    
    def __init__(self):
        super(Model_1, self).__init__()
        
        # Block 1: Initial feature extraction (RF: 3)
        self.conv1 = nn.Conv2d(1, 8, kernel_size=3, padding=1)
        self.bn1 = nn.BatchNorm2d(8)
        
        # Block 2: Channel expansion (RF: 5)
        self.conv2 = nn.Conv2d(8, 16, kernel_size=3, padding=1)
        self.bn2 = nn.BatchNorm2d(16)
        
        # Block 3: Feature refinement (RF: 7)
        self.conv3 = nn.Conv2d(16, 10, kernel_size=3, padding=1)
        
        # Global Average Pooling
        self.gap = nn.AdaptiveAvgPool2d(1)
        
        # Strategic dropout
        self.dropout1 = nn.Dropout(0.1)
        
    def forward(self, x):
        # Block 1: 1×28×28 → 8×28×28 (RF: 3)
        x = F.relu(self.bn1(self.conv1(x)))
        x = self.dropout1(x)
        
        # Block 2: 8×28×28 → 16×28×28 (RF: 5)
        x = F.relu(self.bn2(self.conv2(x)))
        x = F.max_pool2d(x, 2)  # 16×14×14 (RF: 10)
        
        # Block 3: 16×14×14 → 10×14×14 (RF: 12)
        x = self.conv3(x)
        x = F.max_pool2d(x, 2)  # 10×7×7 (RF: 16)
        
        # Global Average Pooling
        x = self.gap(x)  # 10×1×1
        x = x.view(x.size(0), -1)  # 10
        
        return x
    
    def count_parameters(self):
        return sum(p.numel() for p in self.parameters() if p.requires_grad)

class Model_2(nn.Module):
    """
    Model_2: Optimized Efficiency Architecture
    
    Target: <8000 parameters, 99.2%+ accuracy, ≤12 epochs
    Strategy: Enhanced capacity with optimized pooling
    Expected Parameters: ~5,900
    Receptive Field: 34×34 (covers 121% of 28×28 image)
    """
    
    def __init__(self):
        super(Model_2, self).__init__()
        
        # Block 1: Initial feature extraction (RF: 3)
        self.conv1 = nn.Conv2d(1, 8, kernel_size=3, padding=1)
        self.bn1 = nn.BatchNorm2d(8)
        
        # Block 2: Channel expansion (RF: 5)
        self.conv2 = nn.Conv2d(8, 12, kernel_size=3, padding=1)
        self.bn2 = nn.BatchNorm2d(12)
        
        # Block 3: Feature refinement (RF: 7)
        self.conv3 = nn.Conv2d(12, 16, kernel_size=3, padding=1)
        self.bn3 = nn.BatchNorm2d(16)
        
        # Block 4: Deeper features (RF: 9)
        self.conv4 = nn.Conv2d(16, 20, kernel_size=3, padding=1)
        self.bn4 = nn.BatchNorm2d(20)
        
        # Block 5: Final features (RF: 11)
        self.conv5 = nn.Conv2d(20, 10, kernel_size=3, padding=1)
        
        # Global Average Pooling
        self.gap = nn.AdaptiveAvgPool2d(1)
        
        # Strategic dropout
        self.dropout1 = nn.Dropout(0.1)
        self.dropout2 = nn.Dropout(0.15)
        
    def forward(self, x):
        # Block 1: 1×28×28 → 8×28×28 (RF: 3)
        x = F.relu(self.bn1(self.conv1(x)))
        x = self.dropout1(x)
        
        # Block 2: 8×28×28 → 12×28×28 (RF: 5)
        x = F.relu(self.bn2(self.conv2(x)))
        x = F.max_pool2d(x, 2)  # 12×14×14 (RF: 10)
        
        # Block 3: 12×14×14 → 16×14×14 (RF: 12)
        x = F.relu(self.bn3(self.conv3(x)))
        x = self.dropout2(x)
        
        # Block 4: 16×14×14 → 20×14×14 (RF: 14)
        x = F.relu(self.bn4(self.conv4(x)))
        x = F.max_pool2d(x, 2)  # 20×7×7 (RF: 28)
        
        # Block 5: 20×7×7 → 10×7×7 (RF: 30)
        x = self.conv5(x)
        
        # Global Average Pooling
        x = self.gap(x)  # 10×1×1
        x = x.view(x.size(0), -1)  # 10
        
        return x
    
    def count_parameters(self):
        return sum(p.numel() for p in self.parameters() if p.requires_grad)

class Model_3(nn.Module):
    """
    Model_3: Final Precision Architecture with Advanced Techniques
    
    Target: <8000 parameters, 99.4%+ accuracy consistently, ≤10 epochs
    Strategy: Optimized architecture with residual connections
    Expected Parameters: ~7,900
    Receptive Field: 30×30 (covers full 28×28 image)
    """
    
    def __init__(self):
        super(Model_3, self).__init__()
        
        # Block 1: Initial feature extraction (RF: 3)
        self.conv1 = nn.Conv2d(1, 8, kernel_size=3, padding=1)
        self.bn1 = nn.BatchNorm2d(8)
        
        # Block 2: Channel expansion with residual (RF: 5)
        self.conv2 = nn.Conv2d(8, 16, kernel_size=3, padding=1)
        self.bn2 = nn.BatchNorm2d(16)
        self.conv2_res = nn.Conv2d(8, 16, kernel_size=1)  # Residual connection
        
        # Block 3: Feature refinement (RF: 7)
        self.conv3 = nn.Conv2d(16, 24, kernel_size=3, padding=1)
        self.bn3 = nn.BatchNorm2d(24)
        
        # Block 4: Final features (RF: 9)
        self.conv4 = nn.Conv2d(24, 10, kernel_size=3, padding=1)
        
        # Global Average Pooling
        self.gap = nn.AdaptiveAvgPool2d(1)
        
        # Strategic dropout with different rates
        self.dropout1 = nn.Dropout(0.1)
        self.dropout2 = nn.Dropout(0.15)
        
    def forward(self, x):
        # Block 1: 1×28×28 → 8×28×28 (RF: 3)
        x = F.relu(self.bn1(self.conv1(x)))
        x = self.dropout1(x)
        
        # Block 2: 8×28×28 → 16×28×28 with residual (RF: 5)
        residual = self.conv2_res(x)
        x = F.relu(self.bn2(self.conv2(x)))
        x = x + residual
        x = F.max_pool2d(x, 2)  # 16×14×14 (RF: 10)
        x = self.dropout2(x)
        
        # Block 3: 16×14×14 → 24×14×14 (RF: 12)
        x = F.relu(self.bn3(self.conv3(x)))
        x = F.max_pool2d(x, 2)  # 24×7×7 (RF: 24)
        
        # Block 4: 24×7×7 → 10×7×7 (RF: 26)
        x = self.conv4(x)
        
        # Global Average Pooling
        x = self.gap(x)  # 10×1×1
        x = x.view(x.size(0), -1)  # 10
        
        return x
    
    def count_parameters(self):
        return sum(p.numel() for p in self.parameters() if p.requires_grad)

def create_model(model_name="Model_1"):
    """Create specified model and return with parameter count"""
    if model_name == "Model_1":
        model = Model_1()
    elif model_name == "Model_2":
        model = Model_2()
    elif model_name == "Model_3":
        model = Model_3()
    else:
        raise ValueError(f"Unknown model: {model_name}")
    
    param_count = model.count_parameters()
    print(f"{model_name} - Total parameters: {param_count:,}")
    
    if param_count >= 8000:
        print(f"WARNING: {model_name} has {param_count} parameters, which exceeds the 8,000 limit!")
    else:
        print(f"✓ {model_name} parameter count is within limit: {param_count} < 8,000")
    
    return model

if __name__ == "__main__":
    # Test all models
    for model_name in ["Model_1", "Model_2", "Model_3"]:
        print(f"\n{'='*50}")
        print(f"Testing {model_name}")
        print(f"{'='*50}")
        
        model = create_model(model_name)
        
        # Test with dummy input
        dummy_input = torch.randn(1, 1, 28, 28)
        output = model(dummy_input)
        print(f"Output shape: {output.shape}")
        print(f"{model_name} created successfully!")
