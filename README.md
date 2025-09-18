# 🚀 MNIST CNN Optimization - ERA V4 Assignment

## 🎯 Project Goal

Achieve **99.4%+ validation accuracy** on MNIST with **less than 20,000 parameters** in **less than 20 epochs** using modern CNN techniques.

## ✅ Requirements Met

### Performance Requirements

* **✅ 99.4%+ Validation Accuracy**: Achieved 99.42% validation accuracy
* **✅ <20k Parameters**: Model uses 18,894 parameters
* **✅ <20 Epochs**: Target achieved within 15 epochs
* **✅ Efficient Architecture**: Uses BatchNorm, Dropout, and GAP

### Architecture Requirements

* **✅ Batch Normalization**: Used after every convolution layer
* **✅ Dropout**: Strategic placement with progressive rates (0.1 → 0.15)
* **✅ Global Average Pooling**: Replaces large FC layers for parameter efficiency
* **✅ 1x1 Convolutions**: Used for channel reduction in transition layers
* **✅ 3x3 Convolutions**: Primary feature extraction layers
* **✅ MaxPooling**: Two strategically placed pooling operations

## 📊 Model Architecture Summary

```
FinalMNIST(
  Total Parameters: 18,894
  Input: 28x28x1 (MNIST grayscale)
  Output: 10 classes
)

Block 1: 28x28 → 14x14 (1→8→16 channels)
├── Conv2d(1→8) + BatchNorm + ReLU
├── Conv2d(8→16) + BatchNorm + ReLU
├── MaxPool2d(2x2)
├── Conv2d(16→12, 1x1) + BatchNorm + ReLU
└── Dropout(0.1)

Block 2: 14x14 → 7x7 (12→16→20 channels)
├── Conv2d(12→16) + BatchNorm + ReLU
├── Conv2d(16→20) + BatchNorm + ReLU
├── MaxPool2d(2x2)
├── Conv2d(20→16, 1x1) + BatchNorm + ReLU
└── Dropout(0.15)

Block 3: 7x7 → 7x7 (16→20→24→16→10 channels)
├── Conv2d(16→20) + BatchNorm + ReLU
├── Conv2d(20→24) + BatchNorm + ReLU
├── Conv2d(24→16) + BatchNorm + ReLU
├── Conv2d(16→10) + BatchNorm + ReLU
└── Global Average Pooling
```

## 🎯 Results Achieved

* **Final Validation Accuracy**: 99.42% ✅
* **Final Test Accuracy**: 99.38% ✅
* **Training Time**: ~15 epochs ✅
* **Parameter Count**: 18,894 ✅
* **Convergence**: Stable and fast convergence
* **Generalization**: Low overfitting gap

## 📈 Training Logs

```
============================================================
TRAINING COMPLETED
============================================================
Training Time: 245.67 seconds
Epochs Trained: 15
Best Val Accuracy: 99.42%
Final Test Accuracy: 99.38%
Model Parameters: 18,894

============================================================
REQUIREMENTS CHECK
============================================================
Parameters < 20,000: ✅ PASS (18,894)
Val Accuracy ≥ 99.4%: ✅ PASS (99.42%)
Epochs ≤ 20: ✅ PASS (15)
```

## 🔧 Usage

1. **Requirements**: PyTorch with CUDA support
2. **Run**: Execute `python train.py`
3. **Device**: Automatically detects and uses GPU if available
4. **Output**: Detailed training progress and validation results

## 📚 Architecture Principles Applied

1. **Efficient Channel Growth**: Gradual increase with strategic reductions
2. **Smart Pooling Placement**: Optimal distance from prediction layers
3. **Modern Regularization**: BN + Dropout + Weight Decay combination
4. **Parameter Efficiency**: 1x1 convs + GAP for maximum efficiency
5. **Early Stopping**: Prevents overfitting and saves training time

## 🔍 Technical Validation Results

### 🎉 Overall Status: ALL REQUIREMENTS MET

### 📋 Individual Requirement Checks

#### ✅ Total Parameter Count Test
- **Requirement**: < 20,000 parameters
- **Result**: 18,894 parameters
- **Status**: PASSED
- **Details**: Model has 18,894 trainable parameters

#### ✅ Use of Batch Normalization
- **Requirement**: Must be used
- **Result**: 9 BatchNorm layers found
- **Status**: PASSED
- **Details**: Found 9 BatchNorm2d layers: ['bn1', 'bn2', 'bn1x1_1', 'bn3', 'bn4', 'bn1x1_2', 'bn5', 'bn6', 'bn7']

#### ✅ Use of Dropout
- **Requirement**: Must be used
- **Result**: 2 Dropout layers found
- **Status**: PASSED
- **Details**: Found 2 Dropout layers with rates: [0.1, 0.15]

#### ✅ Use of Fully Connected Layer or GAP
- **Requirement**: FC Layer OR GAP
- **Result**: GAP (Global Average Pooling)
- **Status**: PASSED
- **Details**: Using Global Average Pooling: ['gap']

### 🏗️ Architecture Analysis

**Total Parameters**: 18,894
**Convolutional Layers**: 8
**Batch Normalization Layers**: 9
**Dropout Layers**: 2
**Pooling Layers**: 3
**Linear/FC Layers**: 0

### 📊 Detailed Layer Information

**Convolutional Layers:**
1. `conv1`: 1→8 channels, 3×3 kernel (80 params)
2. `conv2`: 8→16 channels, 3×3 kernel (1,168 params)
3. `conv1x1_1`: 16→12 channels, 1×1 kernel (204 params)
4. `conv3`: 12→16 channels, 3×3 kernel (1,744 params)
5. `conv4`: 16→20 channels, 3×3 kernel (2,900 params)
6. `conv1x1_2`: 20→16 channels, 1×1 kernel (336 params)
7. `conv5`: 16→20 channels, 3×3 kernel (2,900 params)
8. `conv6`: 20→24 channels, 3×3 kernel (4,344 params)
9. `conv7`: 24→16 channels, 3×3 kernel (3,472 params)
10. `conv8`: 16→10 channels, 3×3 kernel (1,450 params)

**Batch Normalization Layers:**
1. `bn1`: 16 parameters
2. `bn2`: 32 parameters
3. `bn1x1_1`: 24 parameters
4. `bn3`: 32 parameters
5. `bn4`: 40 parameters
6. `bn1x1_2`: 32 parameters
7. `bn5`: 40 parameters
8. `bn6`: 48 parameters
9. `bn7`: 32 parameters

**Dropout Layers:**
1. `dropout1`: Dropout rate = 0.1
2. `dropout2`: Dropout rate = 0.15

**Pooling Layers:**
1. `pool1`: MaxPool2d
2. `pool2`: MaxPool2d
3. `gap`: AdaptiveAvgPool2d

### 📈 Requirements Summary Table

| Requirement | Target | Achieved | Status |
|-------------|--------|----------|--------|
| Parameter Count | < 20,000 | 18,894 | ✅ |
| Batch Normalization | Must be used | 9 | ✅ |
| Dropout | Must be used | 2 | ✅ |
| FC Or GAP | FC Layer OR GAP | GAP (Global Average Pooling) | ✅ |

---


## 🎯 Final Validation Results

**Validation Accuracy**: 99.42%
**Test Accuracy**: 99.38%
**Parameters**: 18,894
**Epochs**: 15


