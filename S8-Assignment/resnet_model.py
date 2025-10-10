"""
ResNet Implementation for CIFAR-100
Based on "Deep Residual Learning for Image Recognition" by He et al.

This implementation includes ResNet-18, ResNet-34, and ResNet-50 architectures
optimized for CIFAR-100 (32x32 images, 100 classes).
"""

import torch
import torch.nn as nn
import torch.nn.functional as F


class BasicBlock(nn.Module):
    """
    Basic Block for ResNet-18 and ResNet-34
    Two 3x3 convolutions with skip connection
    """
    expansion = 1

    def __init__(self, in_planes, planes, stride=1):
        super(BasicBlock, self).__init__()
        
        # First convolution
        self.conv1 = nn.Conv2d(in_planes, planes, kernel_size=3, stride=stride, 
                              padding=1, bias=False)
        self.bn1 = nn.BatchNorm2d(planes)
        
        # Second convolution
        self.conv2 = nn.Conv2d(planes, planes, kernel_size=3, stride=1, 
                              padding=1, bias=False)
        self.bn2 = nn.BatchNorm2d(planes)

        # Skip connection
        self.shortcut = nn.Sequential()
        if stride != 1 or in_planes != self.expansion * planes:
            self.shortcut = nn.Sequential(
                nn.Conv2d(in_planes, self.expansion * planes, kernel_size=1, 
                         stride=stride, bias=False),
                nn.BatchNorm2d(self.expansion * planes)
            )

    def forward(self, x):
        out = F.relu(self.bn1(self.conv1(x)))
        out = self.bn2(self.conv2(out))
        out += self.shortcut(x)
        out = F.relu(out)
        return out


class Bottleneck(nn.Module):
    """
    Bottleneck Block for ResNet-50, ResNet-101, ResNet-152
    1x1 -> 3x3 -> 1x1 convolutions with skip connection
    """
    expansion = 4

    def __init__(self, in_planes, planes, stride=1):
        super(Bottleneck, self).__init__()
        
        # 1x1 convolution (reduce dimensions)
        self.conv1 = nn.Conv2d(in_planes, planes, kernel_size=1, bias=False)
        self.bn1 = nn.BatchNorm2d(planes)
        
        # 3x3 convolution (main computation)
        self.conv2 = nn.Conv2d(planes, planes, kernel_size=3, stride=stride, 
                              padding=1, bias=False)
        self.bn2 = nn.BatchNorm2d(planes)
        
        # 1x1 convolution (expand dimensions)
        self.conv3 = nn.Conv2d(planes, self.expansion * planes, kernel_size=1, 
                              bias=False)
        self.bn3 = nn.BatchNorm2d(self.expansion * planes)

        # Skip connection
        self.shortcut = nn.Sequential()
        if stride != 1 or in_planes != self.expansion * planes:
            self.shortcut = nn.Sequential(
                nn.Conv2d(in_planes, self.expansion * planes, kernel_size=1, 
                         stride=stride, bias=False),
                nn.BatchNorm2d(self.expansion * planes)
            )

    def forward(self, x):
        out = F.relu(self.bn1(self.conv1(x)))
        out = F.relu(self.bn2(self.conv2(out)))
        out = self.bn3(self.conv3(out))
        out += self.shortcut(x)
        out = F.relu(out)
        return out


class ResNet(nn.Module):
    """
    ResNet Architecture for CIFAR-100
    
    Args:
        block: BasicBlock or Bottleneck
        num_blocks: List of number of blocks in each layer
        num_classes: Number of output classes (100 for CIFAR-100)
    """
    
    def __init__(self, block, num_blocks, num_classes=100):
        super(ResNet, self).__init__()
        self.in_planes = 64

        # Initial convolution (adapted for CIFAR-100's 32x32 images)
        self.conv1 = nn.Conv2d(3, 64, kernel_size=3, stride=1, padding=1, bias=False)
        self.bn1 = nn.BatchNorm2d(64)
        
        # ResNet layers
        self.layer1 = self._make_layer(block, 64, num_blocks[0], stride=1)
        self.layer2 = self._make_layer(block, 128, num_blocks[1], stride=2)
        self.layer3 = self._make_layer(block, 256, num_blocks[2], stride=2)
        self.layer4 = self._make_layer(block, 512, num_blocks[3], stride=2)
        
        # Final classifier
        self.avgpool = nn.AdaptiveAvgPool2d((1, 1))
        self.fc = nn.Linear(512 * block.expansion, num_classes)
        
        # Initialize weights
        self._initialize_weights()

    def _make_layer(self, block, planes, num_blocks, stride):
        """Create a layer with multiple blocks"""
        strides = [stride] + [1] * (num_blocks - 1)
        layers = []
        
        for stride in strides:
            layers.append(block(self.in_planes, planes, stride))
            self.in_planes = planes * block.expansion
            
        return nn.Sequential(*layers)

    def _initialize_weights(self):
        """Initialize model weights using He initialization"""
        for m in self.modules():
            if isinstance(m, nn.Conv2d):
                nn.init.kaiming_normal_(m.weight, mode='fan_out', nonlinearity='relu')
            elif isinstance(m, nn.BatchNorm2d):
                nn.init.constant_(m.weight, 1)
                nn.init.constant_(m.bias, 0)
            elif isinstance(m, nn.Linear):
                nn.init.normal_(m.weight, 0, 0.01)
                nn.init.constant_(m.bias, 0)

    def forward(self, x):
        # Initial convolution
        out = F.relu(self.bn1(self.conv1(x)))
        
        # ResNet layers
        out = self.layer1(out)
        out = self.layer2(out)
        out = self.layer3(out)
        out = self.layer4(out)
        
        # Global average pooling and classification
        out = self.avgpool(out)
        out = torch.flatten(out, 1)
        out = self.fc(out)
        
        return out

    def get_feature_maps(self, x):
        """Extract feature maps from different layers (for visualization)"""
        features = {}
        
        # Initial features
        out = F.relu(self.bn1(self.conv1(x)))
        features['conv1'] = out
        
        # Layer features
        out = self.layer1(out)
        features['layer1'] = out
        
        out = self.layer2(out)
        features['layer2'] = out
        
        out = self.layer3(out)
        features['layer3'] = out
        
        out = self.layer4(out)
        features['layer4'] = out
        
        return features


def ResNet18(num_classes=100):
    """ResNet-18 for CIFAR-100"""
    return ResNet(BasicBlock, [2, 2, 2, 2], num_classes)


def ResNet34(num_classes=100):
    """ResNet-34 for CIFAR-100"""
    return ResNet(BasicBlock, [3, 4, 6, 3], num_classes)


def ResNet50(num_classes=100):
    """ResNet-50 for CIFAR-100"""
    return ResNet(Bottleneck, [3, 4, 6, 3], num_classes)


def ResNet101(num_classes=100):
    """ResNet-101 for CIFAR-100"""
    return ResNet(Bottleneck, [3, 4, 23, 3], num_classes)


def ResNet152(num_classes=100):
    """ResNet-152 for CIFAR-100"""
    return ResNet(Bottleneck, [3, 8, 36, 3], num_classes)


def get_model(model_name='resnet18', num_classes=100):
    """
    Factory function to get ResNet models
    
    Args:
        model_name: One of ['resnet18', 'resnet34', 'resnet50', 'resnet101', 'resnet152']
        num_classes: Number of output classes
    
    Returns:
        ResNet model
    """
    models = {
        'resnet18': ResNet18,
        'resnet34': ResNet34,
        'resnet50': ResNet50,
        'resnet101': ResNet101,
        'resnet152': ResNet152,
    }
    
    if model_name.lower() not in models:
        raise ValueError(f"Model {model_name} not supported. Choose from {list(models.keys())}")
    
    return models[model_name.lower()](num_classes)


def count_parameters(model):
    """Count total and trainable parameters"""
    total_params = sum(p.numel() for p in model.parameters())
    trainable_params = sum(p.numel() for p in model.parameters() if p.requires_grad)
    
    return {
        'total': total_params,
        'trainable': trainable_params,
        'total_mb': total_params * 4 / (1024 * 1024),  # Assuming float32
        'trainable_mb': trainable_params * 4 / (1024 * 1024)
    }


def model_summary(model, input_size=(3, 32, 32)):
    """Print model summary"""
    print(f"\n{'='*60}")
    print(f"Model: {model.__class__.__name__}")
    print(f"{'='*60}")
    
    # Parameter count
    params = count_parameters(model)
    print(f"Total parameters: {params['total']:,}")
    print(f"Trainable parameters: {params['trainable']:,}")
    print(f"Model size: {params['total_mb']:.2f} MB")
    
    # Test forward pass
    model.eval()
    with torch.no_grad():
        x = torch.randn(1, *input_size)
        output = model(x)
        print(f"Input shape: {x.shape}")
        print(f"Output shape: {output.shape}")
    
    print(f"{'='*60}\n")
    
    return params


# Test the implementation
if __name__ == "__main__":
    print("Testing ResNet implementations...")
    
    # Test all models
    models_to_test = ['resnet18', 'resnet34', 'resnet50']
    
    for model_name in models_to_test:
        print(f"\n🔍 Testing {model_name.upper()}...")
        
        try:
            # Create model
            model = get_model(model_name, num_classes=100)
            
            # Model summary
            params = model_summary(model)
            
            # Test forward pass
            model.eval()
            with torch.no_grad():
                x = torch.randn(4, 3, 32, 32)  # Batch of 4 CIFAR-100 images
                output = model(x)
                
                print(f"✅ Forward pass successful!")
                print(f"   Input: {x.shape}")
                print(f"   Output: {output.shape}")
                print(f"   Parameters: {params['total']:,}")
                
                # Test feature extraction
                features = model.get_feature_maps(x)
                print(f"   Feature maps extracted: {list(features.keys())}")
                
        except Exception as e:
            print(f"❌ Error testing {model_name}: {e}")
    
    print("\n🎉 All tests completed!")
    print("\n💡 Recommended models for CIFAR-100:")
    print("   - ResNet-18: Fast training, good for experimentation")
    print("   - ResNet-34: Better accuracy, moderate training time")
    print("   - ResNet-50: Best accuracy, longer training time")
