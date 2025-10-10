# 🖼️ ResNet CIFAR-100 Classifier

A complete implementation of ResNet architectures trained from scratch on CIFAR-100 to achieve 73% top-1 accuracy, with HuggingFace Spaces deployment.

## 🎯 Assignment Objectives

- ✅ Train ResNet model from scratch on CIFAR-100
- ✅ Achieve 73% top-1 accuracy target
- ✅ No pre-trained models allowed
- ✅ Create live HuggingFace Spaces application
- ✅ Comprehensive logging and documentation

## 🏗️ Architecture

### ResNet Implementation
- **ResNet-18**: 2-2-2-2 layer configuration with BasicBlocks
- **ResNet-34**: 3-4-6-3 layer configuration with BasicBlocks  
- **ResNet-50**: 3-4-6-3 layer configuration with Bottleneck blocks

### Key Features
- Residual connections for gradient flow
- Batch normalization for stable training
- ReLU activation functions
- Adaptive average pooling
- He weight initialization

## 📊 Dataset: CIFAR-100

- **Classes**: 100 categories
- **Training Images**: 50,000 (500 per class)
- **Test Images**: 10,000 (100 per class)
- **Image Size**: 32×32 RGB
- **Superclasses**: 20 groups of 5 related classes

### Class Categories
Animals, vehicles, objects, natural scenes, food, household items, and more. See `data_utils.py` for complete class list.

## 🚀 Quick Start

### 1. Installation

```bash
# Clone or download the repository
cd S8-Assignment

# Install dependencies
pip install -r requirements.txt
```

### 2. Training

```bash
# Basic training with ResNet-18
python train.py --model resnet18 --epochs 100

# Advanced training with ResNet-34
python train.py --model resnet34 --epochs 150 --batch-size 128 --lr 0.1

# Resume training from checkpoint
python train.py --resume checkpoints/checkpoint_epoch_50.pth --epochs 100
```

### 3. HuggingFace Deployment

```bash
# Export model for HuggingFace Spaces
python export_for_huggingface.py --from-results

# Test Gradio app locally
python app.py
```

## 📋 Training Options

### Model Architectures
```bash
--model resnet18    # Fast training, good for experimentation
--model resnet34    # Better accuracy, moderate training time  
--model resnet50    # Best accuracy, longer training time
```

### Optimizers
```bash
--optimizer sgd     # SGD with momentum (recommended)
--optimizer adam    # Adam optimizer
--optimizer adamw   # AdamW optimizer
```

### Learning Rate Schedulers
```bash
--scheduler cosine_warm    # Cosine annealing with warm restarts (recommended)
--scheduler cosine         # Standard cosine annealing
--scheduler multistep      # Multi-step decay
--scheduler onecycle       # One cycle learning rate
```

### Advanced Options
```bash
--mixed-precision          # Enable mixed precision training (default: True)
--strong-augment          # Use strong data augmentation (default: True)
--label-smoothing 0.1     # Label smoothing factor
--batch-size 128          # Batch size
--lr 0.1                  # Initial learning rate
--weight-decay 5e-4       # Weight decay
```

## 📈 Training Strategy

### Data Augmentation
- Random crop with padding
- Random horizontal flip
- Random rotation (±15°)
- Color jitter (brightness, contrast, saturation, hue)
- Random affine transformations
- Random erasing
- Normalization with CIFAR-100 statistics

### Optimization Techniques
- **Mixed Precision**: Faster training with lower memory usage
- **Cosine Annealing with Warm Restarts**: Better convergence
- **Label Smoothing**: Improved generalization
- **Strong Augmentation**: Robust feature learning

### Expected Performance
- **ResNet-18**: ~70-75% accuracy in 80-100 epochs
- **ResNet-34**: ~72-76% accuracy in 100-120 epochs
- **ResNet-50**: ~74-78% accuracy in 120-150 epochs

## 📁 Project Structure

```
S8-Assignment/
├── resnet_model.py           # ResNet architecture implementation
├── data_utils.py             # CIFAR-100 data loading and augmentation
├── train.py                  # Main training script
├── utils.py                  # Utility functions and metrics
├── app.py                    # Gradio app for HuggingFace Spaces
├── export_for_huggingface.py # Export script for deployment
├── requirements.txt          # Python dependencies
├── README.md                 # This file
├── checkpoints/              # Model checkpoints (created during training)
├── logs/                     # Training logs (created during training)
└── huggingface_space/        # Exported HuggingFace Space (created by export script)
```

## 🔧 Key Components

### 1. ResNet Model (`resnet_model.py`)
- Complete ResNet implementation from scratch
- Support for ResNet-18, 34, 50, 101, 152
- Optimized for CIFAR-100 (32×32 images)
- Model factory function and parameter counting

### 2. Data Pipeline (`data_utils.py`)
- CIFAR-100 dataset loading and preprocessing
- Advanced augmentation strategies
- Optimized data loaders with multi-processing
- Dataset visualization and analysis tools

### 3. Training Engine (`train.py`)
- Comprehensive training loop with validation
- Multiple optimizer and scheduler support
- Mixed precision training
- Automatic checkpointing and logging
- Real-time monitoring and metrics

### 4. Utilities (`utils.py`)
- Training metrics and progress tracking
- Model evaluation and analysis
- Visualization tools for results
- Checkpoint management
- GPU memory monitoring

### 5. Gradio App (`app.py`)
- Interactive web interface for model inference
- Image upload and classification
- Top-5 predictions with confidence scores
- Model information and training details

### 6. Export Tool (`export_for_huggingface.py`)
- Automated HuggingFace Spaces preparation
- Model weight conversion and optimization
- Complete deployment package creation
- Documentation and instructions generation

## 📊 Training Results Format

The training script generates comprehensive logs and results:

### Checkpoint Files
- `best_model.pth` - Best performing model
- `checkpoint_epoch_X.pth` - Regular checkpoints
- `target_model_epoch_X.pth` - First model to reach 73% target

### Training Logs
- Real-time console output with progress
- Detailed log files in `logs/` directory
- Training curves and visualizations
- JSON results with complete metrics

### Example Training Output
```
Epoch 50/100
Train Loss: 1.2345 | Train Acc: 85.67%
Test Loss: 1.5432 | Test Acc: 74.23%
Learning Rate: 0.001234 | GPU Memory: 0.78GB
✨ New best accuracy: 74.23%
🎯 Above target: 74.23% >= 73.0%
💾 Checkpoint saved: target_model_epoch_50.pth
```

## 🌐 HuggingFace Spaces Deployment

### Automatic Export
```bash
# Export best model automatically
python export_for_huggingface.py --from-results

# Export specific checkpoint
python export_for_huggingface.py --checkpoint checkpoints/best_model.pth
```

### Manual Deployment Steps
1. Run the export script to create `huggingface_space/` directory
2. Create a new Gradio Space on HuggingFace
3. Upload all files from `huggingface_space/` to your Space
4. Your app will automatically build and deploy!

### Space Features
- Interactive image classification interface
- Drag-and-drop image upload
- Top-5 predictions with confidence scores
- Model information and training details
- Example images for testing
- Responsive design for mobile and desktop

## 🎯 Achieving 73% Accuracy

### Recommended Configuration
```bash
python train.py \
    --model resnet18 \
    --epochs 100 \
    --batch-size 128 \
    --lr 0.1 \
    --optimizer sgd \
    --scheduler cosine_warm \
    --mixed-precision \
    --strong-augment \
    --label-smoothing 0.1
```

### Key Success Factors
1. **Strong Data Augmentation**: Essential for generalization
2. **Mixed Precision**: Enables larger batch sizes and faster training
3. **Cosine Annealing with Warm Restarts**: Better learning rate scheduling
4. **Label Smoothing**: Reduces overfitting
5. **Proper Weight Decay**: Regularization for better generalization

### Training Tips
- Monitor both training and validation accuracy
- Watch for overfitting (large gap between train/test accuracy)
- Use early stopping if validation accuracy plateaus
- Experiment with different learning rates and schedulers
- Consider longer training (150+ epochs) for ResNet-50

## 🔍 Troubleshooting

### Common Issues

**Out of Memory Error**
```bash
# Reduce batch size
python train.py --batch-size 64

# Reduce number of workers
python train.py --num-workers 2
```

**Slow Training**
```bash
# Enable mixed precision (should be default)
python train.py --mixed-precision

# Increase batch size if memory allows
python train.py --batch-size 256
```

**Poor Accuracy**
```bash
# Try stronger augmentation
python train.py --strong-augment

# Increase training epochs
python train.py --epochs 150

# Try different model
python train.py --model resnet34
```

**Checkpoint Loading Issues**
```bash
# Check checkpoint path
ls checkpoints/

# Use absolute path
python train.py --resume /full/path/to/checkpoint.pth
```

## 📚 References

1. **Deep Residual Learning for Image Recognition** - He et al. (2015)
   - [Paper](https://arxiv.org/abs/1512.03385)
   - Original ResNet architecture and methodology

2. **CIFAR-100 Dataset**
   - [Dataset Info](https://www.cs.toronto.edu/~kriz/cifar.html)
   - 100 classes, 32×32 images, challenging classification task

3. **Training Techniques**
   - Mixed Precision Training
   - Data Augmentation Strategies
   - Learning Rate Scheduling
   - Regularization Methods

## 🏆 Assignment Checklist

- ✅ **ResNet Implementation**: Complete from-scratch implementation
- ✅ **CIFAR-100 Training**: Full training pipeline with data augmentation
- ✅ **73% Accuracy Target**: Achievable with proper configuration
- ✅ **No Pre-training**: All models trained from random initialization
- ✅ **HuggingFace App**: Interactive Gradio application
- ✅ **Comprehensive Logging**: Detailed training logs and metrics
- ✅ **Documentation**: Complete README and code documentation
- ✅ **Deployment Ready**: One-click export for HuggingFace Spaces

## 🎉 Getting Started

1. **Install dependencies**: `pip install -r requirements.txt`
2. **Start training**: `python train.py --model resnet18 --epochs 100`
3. **Monitor progress**: Check logs in console and `logs/` directory
4. **Deploy to HuggingFace**: `python export_for_huggingface.py --from-results`
5. **Share your Space**: Upload to HuggingFace and share the link!

## 💡 Tips for Success

- Start with ResNet-18 for faster experimentation
- Monitor GPU memory usage and adjust batch size accordingly
- Use mixed precision training for efficiency
- Strong data augmentation is crucial for CIFAR-100
- Be patient - achieving 73% may take 80-120 epochs
- Save checkpoints regularly in case of interruption

---

**Built with ❤️ for ERA V4 Session 8 Assignment**

*Ready to train ResNet from scratch and deploy to HuggingFace Spaces!* 🚀
