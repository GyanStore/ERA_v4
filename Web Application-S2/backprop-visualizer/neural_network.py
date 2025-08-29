import numpy as np
import copy

class NeuralNetwork:
    def __init__(self, layer_sizes, learning_rate=0.1, activation='sigmoid'):
        """
        Initialize neural network
        
        Args:
            layer_sizes: List of layer sizes [input_size, hidden1_size, ..., output_size]
            learning_rate: Learning rate for gradient descent
            activation: Activation function ('sigmoid', 'tanh', 'relu')
        """
        self.layer_sizes = layer_sizes
        self.learning_rate = learning_rate
        self.activation = activation
        self.num_layers = len(layer_sizes)
        
        # Initialize weights and biases
        self.weights = []
        self.biases = []
        self.initial_weights = []
        self.initial_biases = []
        
        for i in range(self.num_layers - 1):
            # He initialization for better training
            w = np.random.randn(layer_sizes[i+1], layer_sizes[i]) * np.sqrt(2.0 / layer_sizes[i])
            b = np.zeros((layer_sizes[i+1], 1))
            
            self.weights.append(w)
            self.biases.append(b)
            
            # Store initial values for reset
            self.initial_weights.append(w.copy())
            self.initial_biases.append(b.copy())
    
    def sigmoid(self, x):
        """Sigmoid activation function"""
        return 1 / (1 + np.exp(-np.clip(x, -500, 500)))
    
    def sigmoid_derivative(self, x):
        """Derivative of sigmoid function"""
        s = self.sigmoid(x)
        return s * (1 - s)
    
    def tanh(self, x):
        """Tanh activation function"""
        return np.tanh(x)
    
    def tanh_derivative(self, x):
        """Derivative of tanh function"""
        return 1 - np.tanh(x)**2
    
    def relu(self, x):
        """ReLU activation function"""
        return np.maximum(0, x)
    
    def relu_derivative(self, x):
        """Derivative of ReLU function"""
        return np.where(x > 0, 1, 0)
    
    def activate(self, x):
        """Apply activation function"""
        if self.activation == 'sigmoid':
            return self.sigmoid(x)
        elif self.activation == 'tanh':
            return self.tanh(x)
        elif self.activation == 'relu':
            return self.relu(x)
        else:
            return self.sigmoid(x)
    
    def activate_derivative(self, x):
        """Apply activation function derivative"""
        if self.activation == 'sigmoid':
            return self.sigmoid_derivative(x)
        elif self.activation == 'tanh':
            return self.tanh_derivative(x)
        elif self.activation == 'relu':
            return self.relu_derivative(x)
        else:
            return self.sigmoid_derivative(x)
    
    def forward_pass(self, X):
        """
        Forward pass through the network
        
        Args:
            X: Input data (batch_size, input_features)
            
        Returns:
            Dictionary containing outputs and activations for each layer
        """
        # Ensure X is 2D and transpose if needed
        if X.ndim == 1:
            X = X.reshape(-1, 1)
        
        # If X is (batch_size, features), transpose to (features, batch_size)
        if X.shape[0] != self.layer_sizes[0]:
            X = X.T
        
        batch_size = X.shape[1]
        
        # Store activations and outputs for each layer
        activations = [X]  # Input layer
        outputs = []       # Pre-activation values
        
        current_input = X
        
        for i in range(self.num_layers - 1):
            # Linear transformation: z = W*x + b
            z = np.dot(self.weights[i], current_input) + self.biases[i]
            outputs.append(z)
            
            # Apply activation function
            a = self.activate(z)
            activations.append(a)
            
            current_input = a
        
        return {
            'outputs': outputs,
            'activations': activations,
            'final_output': activations[-1]
        }
    
    def backward_pass(self, X, y):
        """
        Backward pass (backpropagation)
        
        Args:
            X: Input data
            y: Target values
            
        Returns:
            Dictionary containing gradients and weight updates
        """
        # Ensure y is 2D and transpose if needed
        if y.ndim == 1:
            y = y.reshape(-1, 1)
        
        # If y is (batch_size, features), transpose to (features, batch_size)
        if y.shape[0] != self.layer_sizes[-1]:
            y = y.T
        
        # Debug data shapes
        self.debug_data_shapes(X, y)
        
        # Forward pass to get activations
        forward_results = self.forward_pass(X)
        activations = forward_results['activations']
        outputs = forward_results['outputs']
        
        batch_size = activations[0].shape[1]
        
        # Initialize gradients
        weight_gradients = [np.zeros_like(w) for w in self.weights]
        bias_gradients = [np.zeros_like(b) for b in self.biases]
        
        # Calculate output layer error
        delta = activations[-1] - y  # MSE derivative
        
        # Backpropagate error through layers
        for layer in range(self.num_layers - 2, -1, -1):
            # Gradient for weights
            weight_gradients[layer] = np.dot(delta, activations[layer].T) / batch_size
            
            # Gradient for biases
            bias_gradients[layer] = np.sum(delta, axis=1, keepdims=True) / batch_size
            
            # Calculate error for next layer back
            if layer > 0:
                # outputs array has indices 0 to num_layers-2
                # For layer i, we need outputs[i-1] which corresponds to the pre-activation of layer i
                output_index = layer - 1
                if 0 <= output_index < len(outputs):
                    delta = np.dot(self.weights[layer].T, delta) * self.activate_derivative(outputs[output_index])
                else:
                    print(f"Warning: output_index {output_index} out of range for outputs array of length {len(outputs)}")
                    break
        
        # Update weights and biases
        for i in range(len(self.weights)):
            self.weights[i] -= self.learning_rate * weight_gradients[i]
            self.biases[i] -= self.learning_rate * bias_gradients[i]
        
        return {
            'weight_gradients': [g.tolist() for g in weight_gradients],
            'bias_gradients': [g.tolist() for g in bias_gradients],
            'weight_updates': [(-self.learning_rate * g).tolist() for g in weight_gradients],
            'bias_updates': [(-self.learning_rate * g).tolist() for g in bias_gradients]
        }
    
    def calculate_loss(self, y_true, y_pred):
        """Calculate mean squared error loss"""
        return np.mean((y_true - y_pred) ** 2)
    
    def get_network_state(self):
        """Get current state of the network for visualization"""
        return {
            'weights': [w.tolist() for w in self.weights],
            'biases': [b.tolist() for b in self.biases],
            'layer_sizes': self.layer_sizes,
            'learning_rate': self.learning_rate,
            'activation': self.activation
        }
    
    def debug_data_shapes(self, X, y):
        """Debug method to check data shapes"""
        print(f"Input X shape: {X.shape}")
        print(f"Target y shape: {y.shape}")
        print(f"Expected input size: {self.layer_sizes[0]}")
        print(f"Expected output size: {self.layer_sizes[-1]}")
        
        # Check if we need to transpose
        if X.shape[0] != self.layer_sizes[0]:
            print(f"Will transpose X from {X.shape} to {X.T.shape}")
        if y.shape[0] != self.layer_sizes[-1]:
            print(f"Will transpose y from {y.shape} to {y.T.shape}")
    
    def get_total_parameters(self):
        """Calculate total number of parameters in the network"""
        total = 0
        for w in self.weights:
            total += w.size
        for b in self.biases:
            total += b.size
        return total
    
    def reset_weights(self):
        """Reset weights and biases to initial values"""
        for i in range(len(self.weights)):
            self.weights[i] = self.initial_weights[i].copy()
            self.biases[i] = self.initial_biases[i].copy()
    
    def predict(self, X):
        """Make predictions with the network"""
        forward_results = self.forward_pass(X)
        return forward_results['final_output'] 