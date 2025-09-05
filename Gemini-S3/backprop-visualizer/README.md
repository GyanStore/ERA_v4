# 🧠 NEURALCHAT

**Advanced Neural Network Visualization & Learning Platform**

An interactive web application that visualizes neural network training in real-time, showing the forward pass, backward pass, and weight updates during backpropagation with real-time mathematical insights and text learning capabilities.

## ✨ Features

- **Interactive Neural Network Builder**: Configure layer sizes, learning rate, and activation functions
- **Real-time Training Visualization**: Watch weights and biases update during training
- **Forward Pass Display**: See activations flow through each layer
- **Backward Pass Details**: Visualize gradients and weight updates
- **Training Metrics**: Real-time loss tracking and parameter counting
- **Network Architecture**: Visual representation of the neural network structure
- **Quick Examples**: Pre-configured problems (XOR, AND, Linear Regression)
- **🤖 AI Chat Assistant**: Context-aware Gemini AI that explains neural networks and backpropagation

## 🚀 Getting Started

### Prerequisites
- Python 3.11+
- UV package manager

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd backprop-visualizer
   ```

2. **Install dependencies with UV**
   ```bash
   uv sync
   ```

3. **Run the application**
   ```bash
   uv run python app.py
   ```

4. **Open in browser**
   Navigate to `http://localhost:5001`

## 🏗️ Project Structure

```
backprop-visualizer/
├── app.py                 # Flask backend with API endpoints
├── neural_network.py      # Core neural network implementation
├── templates/
│   └── index.html        # Main web interface
├── static/
│   └── app.js            # Frontend JavaScript logic
├── pyproject.toml        # UV project configuration
├── uv.lock              # Locked dependencies
└── README.md            # This file
```

## 🧮 How It Works

### Neural Network Implementation
- **Custom backpropagation** implementation (no external ML libraries)
- **Multiple activation functions**: Sigmoid, Tanh, ReLU
- **He initialization** for better training
- **Mean Squared Error** loss function
- **Gradient descent** optimization

### Visualization Features
- **Real-time network drawing** with HTML5 Canvas
- **Weight visualization** with color-coded connections
- **Training progress charts** using Chart.js
- **Layer-by-layer breakdown** of forward and backward passes

## 📚 Learning Examples

### XOR Problem
- **Input**: `[[0,0], [0,1], [1,0], [1,1]]`
- **Target**: `[[0], [1], [1], [0]]`
- **Architecture**: `2,3,1` (2 inputs, 3 hidden, 1 output)
- **Why it's interesting**: Non-linearly separable, requires hidden layer

### AND Gate
- **Input**: `[[0,0], [0,1], [1,0], [1,1]]`
- **Target**: `[[0], [0], [0], [1]]`
- **Architecture**: `2,2,1` (2 inputs, 2 hidden, 1 output)
- **Why it's interesting**: Linearly separable, simpler problem

### Linear Regression
- **Input**: `[[1], [2], [3], [4], [5]]`
- **Target**: `[[2], [4], [6], [8], [10]]`
- **Architecture**: `1,3,1` (1 input, 3 hidden, 1 output)
- **Why it's interesting**: Continuous value prediction

## 🔧 API Endpoints

### `POST /api/initialize`
Initialize a new neural network
```json
{
  "layer_sizes": [2, 3, 1],
  "learning_rate": 0.1,
  "activation": "sigmoid"
}
```

### `POST /api/train`
Train the network for one epoch
```json
{
  "X": [[0,0], [0,1], [1,0], [1,1]],
  "y": [[0], [1], [1], [0]]
}
```

### `POST /api/predict`
Make predictions with the trained network
```json
{
  "X": [[0.5, 0.5]]
}
```

### `POST /api/reset`
Reset network weights to initial values

### `POST /api/chat`
Chat with Gemini AI assistant about neural networks
```json
{
  "message": "How does backpropagation work?"
}
```

## 🎯 Educational Value

This application helps understand:
- **Forward Propagation**: How data flows through the network
- **Backpropagation**: How errors are propagated backwards
- **Gradient Descent**: How weights are updated
- **Activation Functions**: Their role in non-linearity
- **Network Architecture**: Impact of layer sizes and connections

## 🚀 Deployment

### Local Development
```bash
uv run python app.py
```

### Production Deployment
1. **Build and test locally**
2. **Push to GitHub**
3. **Deploy to AWS EC2** (follow Flow.md instructions)
4. **Configure domain and SSL**

## 🔮 Future Enhancements

- **Batch training** with progress bars
- **Multiple optimization algorithms** (Adam, RMSprop)
- **Regularization techniques** (Dropout, L2)
- **Convolutional layers** support
- **Export trained models**
- **Real-time weight animation**

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is open source and available under the MIT License.

## 🙏 Acknowledgments

- **Flask** for the web framework
- **NumPy** for numerical computations
- **Chart.js** for beautiful charts
- **Tailwind CSS** for styling
- **HTML5 Canvas** for network visualization

---

**Built with ❤️ for learning neural networks and backpropagation!** 