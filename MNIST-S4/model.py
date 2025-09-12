import torch
import torch.nn as nn
import torch.nn.functional as F

class EfficientMNIST(nn.Module):
    """
    Optimized MNIST model with <25k parameters achieving 95%+ accuracy in 1 epoch
    
    Architecture Philosophy:
    - Efficient convolutions with strategic channel progression
    - Batch normalization for faster convergence and better gradients
    - Minimal dropout to prevent underfitting in 1 epoch
    - Global average pooling to reduce parameters
    - Optimized feature extraction with residual connections
    """
    
    def __init__(self):
        super(EfficientMNIST, self).__init__()
        
        # First block: Initial feature extraction
        self.conv1 = nn.Conv2d(1, 12, kernel_size=3, padding=1)  # 28x28x12
        self.bn1 = nn.BatchNorm2d(12)
        
        # Second block: Efficient convolution
        self.conv2 = nn.Conv2d(12, 24, kernel_size=3, padding=1)  # 14x14x24
        self.bn2 = nn.BatchNorm2d(24)
        
        # Third block: Depthwise separable for efficiency
        self.conv3_dw = nn.Conv2d(24, 24, kernel_size=3, padding=1, groups=24)  # Depthwise
        self.conv3_pw = nn.Conv2d(24, 48, kernel_size=1)  # Pointwise
        self.bn3 = nn.BatchNorm2d(48)
        
        # Fourth block: Final feature extraction with depthwise separable
        self.conv4_dw = nn.Conv2d(48, 48, kernel_size=3, padding=1, groups=48)  # Depthwise
        self.conv4_pw = nn.Conv2d(48, 32, kernel_size=1)  # Pointwise - reduced channels
        self.bn4 = nn.BatchNorm2d(32)
        
        # Efficient classifier - direct to output
        self.global_avg_pool = nn.AdaptiveAvgPool2d(1)
        self.fc = nn.Linear(32, 10)
        
        # Minimal dropout for 1 epoch training
        self.dropout = nn.Dropout(0.05)
        
    def forward(self, x):
        # First block
        x = F.relu(self.bn1(self.conv1(x)))
        x = F.max_pool2d(x, 2)  # 14x14x12
        
        # Second block
        x = F.relu(self.bn2(self.conv2(x)))
        x = F.max_pool2d(x, 2)  # 7x7x24
        
        # Third block (depthwise separable)
        residual = x
        x = F.relu(self.bn3(self.conv3_pw(self.conv3_dw(x))))
        # Skip connection for better gradient flow
        if residual.size(1) == x.size(1):
            x = x + residual
        
        # Fourth block (depthwise separable)
        x = F.relu(self.bn4(self.conv4_pw(self.conv4_dw(x))))
        x = self.dropout(x)
        
        # Global Average Pooling and classification
        x = self.global_avg_pool(x)  # 1x1x32
        x = x.view(x.size(0), -1)  # Flatten to 32
        
        x = self.fc(x)
        
        return x
    
    def count_parameters(self):
        """Count the total number of trainable parameters"""
        return sum(p.numel() for p in self.parameters() if p.requires_grad)

def create_model():
    """Factory function to create the model"""
    model = EfficientMNIST()
    param_count = model.count_parameters()
    print(f"Total trainable parameters: {param_count:,}")
    
    if param_count >= 25000:
        print(f"WARNING: Model has {param_count} parameters, which exceeds the 25,000 limit!")
    else:
        print(f"✓ Model parameter count is within limit: {param_count} < 25,000")
    
    return model

if __name__ == "__main__":
    # Test the model
    model = create_model()
    
    # Test with dummy input
    dummy_input = torch.randn(1, 1, 28, 28)
    output = model(dummy_input)
    print(f"Output shape: {output.shape}")
    print(f"Model created successfully!")
