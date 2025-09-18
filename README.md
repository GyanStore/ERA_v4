# ERA V4 - Deep Learning Projects Collection

Welcome to ERA V4, a comprehensive collection of deep learning projects showcasing various techniques and optimizations. This repository contains multiple projects demonstrating different aspects of neural networks, from efficient MNIST classification to advanced visualization tools.

## 🚀 Projects Overview

### 1. MINIST-optim-valid-S5 - Ultra-Efficient MNIST Classification
**Location**: `MINIST-optim-valid-S5/`

A highly optimized MNIST digit classification model that achieves **98.04% accuracy** with only **6,786 parameters** in just **1 training epoch**. This project demonstrates advanced techniques for creating efficient neural networks under strict constraints.

#### Key Features:
- ✅ **Parameter Constraint**: Model has **6,786 parameters** (< 25,000 limit)
- ✅ **Accuracy Target**: Achieved **98.04% test accuracy** (> 95% requirement)  
- ✅ **Training Efficiency**: Reached target in **1 epoch only**
- ✅ **Modern Architecture**: Uses depthwise separable convolutions
- ✅ **Excellent Generalization**: No overfitting observed

#### Architecture Highlights:
- **Depthwise Separable Convolutions**: 9× parameter reduction with minimal accuracy loss
- **Smart Channel Progression**: 1→12→24→48→32→10
- **Global Average Pooling**: Eliminates huge dense layers
- **Batch Normalization**: Enables fast, stable training
- **OneCycleLR Scheduler**: Superconvergence in single epoch

#### Quick Start:
```bash
cd MINIST-optim-valid-S5/
pip install -r requirements.txt
python train.py  # Train the model
python test_model.py  # Test architecture
```

### 2. MNIST-S4 - Efficient Model Implementation
**Location**: `MNIST-S4/`

The original implementation of the efficient MNIST model with comprehensive documentation and analysis.

### 3. Gemini-S3 - Neural Network Visualization
**Location**: `Gemini-S3/backprop-visualizer/`

Advanced neural network visualization tool with interactive backpropagation visualization and Gemini AI chat integration.

### 4. Web Application-S2 - Interactive Learning Tools
**Location**: `Web Application-S2/`

Web-based applications for neural network visualization and interactive learning experiences.

### 5. Lambda-S4 - Serverless Deployment
**Location**: `Lambda-S4/`

AWS Lambda deployment configurations and serverless architecture implementations.

### 6. Chroma Plugins-S1 - Browser Extensions
**Location**: `Chroma Plugins-S1/`

Browser extensions for enhanced web browsing experience with AI-powered features.

## 🎯 Project Structure

```
ERA V4/
├── MINIST-optim-valid-S5/          # Ultra-efficient MNIST model
├── MNIST-S4/                       # Original MNIST implementation  
├── Gemini-S3/                      # Neural network visualization
├── Web Application-S2/             # Interactive web tools
├── Lambda-S4/                      # Serverless deployment
├── Chroma Plugins-S1/              # Browser extensions
└── README.md                       # This file
```

## 🚀 Getting Started

1. **Clone the repository**:
```bash
git clone https://github.com/GyanStore/ERA_v4.git
cd ERA_v4
```

2. **Choose a project** and navigate to its directory:
```bash
cd MINIST-optim-valid-S5/  # For MNIST classification
# or
cd Gemini-S3/backprop-visualizer/  # For visualization tools
```

3. **Install dependencies**:
```bash
pip install -r requirements.txt
```

4. **Run the project**:
```bash
python train.py  # For training models
python app.py    # For web applications
```

## 📊 Key Achievements

| Project | Parameters | Accuracy | Training Time | Special Features |
|---------|------------|----------|---------------|------------------|
| **MINIST-optim-valid-S5** | 6,786 | 98.04% | 1 epoch | Depthwise separable convs |
| **MNIST-S4** | 6,786 | 98.04% | 1 epoch | Efficient architecture |
| **Gemini-S3** | - | - | - | AI-powered visualization |
| **Web App-S2** | - | - | - | Interactive learning |

## 🛠️ Technologies Used

- **PyTorch**: Deep learning framework
- **Python**: Programming language
- **Flask**: Web application framework
- **JavaScript**: Frontend interactivity
- **AWS Lambda**: Serverless deployment
- **Chrome Extensions**: Browser integration
- **Google Gemini**: AI integration

## 📚 Learning Resources

Each project includes comprehensive documentation:
- Detailed README files with architecture explanations
- Code comments and inline documentation
- Training logs and performance analysis
- Usage instructions and examples

## 🤝 Contributing

This repository contains educational projects demonstrating various deep learning techniques. Feel free to:
- Study the implementations
- Experiment with different architectures
- Suggest improvements
- Use as learning material

## 📄 License

This project is for educational purposes. Please refer to individual project directories for specific licensing information.

## 👨‍💻 Author

**Shruthi Chinnasamy**  
Deep Learning Enthusiast | ERA V4 Participant

---

*This repository showcases the journey of learning and implementing various deep learning concepts, from basic neural networks to advanced optimization techniques.*