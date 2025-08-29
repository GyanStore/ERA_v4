from flask import Flask, render_template, request, jsonify
import numpy as np
import json
from neural_network import NeuralNetwork

app = Flask(__name__)

# Global neural network instance
nn = None

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/api/initialize", methods=["POST"])
def initialize_network():
    """Initialize a new neural network with specified architecture"""
    global nn
    
    data = request.get_json()
    layer_sizes = data.get('layer_sizes', [2, 3, 1])
    learning_rate = data.get('learning_rate', 0.1)
    activation = data.get('activation', 'sigmoid')
    
    try:
        nn = NeuralNetwork(layer_sizes, learning_rate, activation)
        return jsonify({
            'success': True,
            'message': f'Neural network initialized with layers: {layer_sizes}',
            'total_params': nn.get_total_parameters()
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 400

@app.route("/api/train", methods=["POST"])
def train_network():
    """Train the neural network for one epoch"""
    global nn
    
    if nn is None:
        return jsonify({'success': False, 'error': 'Network not initialized'}), 400
    
    data = request.get_json()
    X = np.array(data.get('X', []))
    y = np.array(data.get('y', []))
    
    if len(X) == 0 or len(y) == 0:
        return jsonify({'success': False, 'error': 'Training data is empty'}), 400
    
    try:
        # Forward pass
        forward_results = nn.forward_pass(X)
        
        # Backward pass
        backward_results = nn.backward_pass(X, y)
        
        # Get current state for visualization
        network_state = nn.get_network_state()
        
        # Convert numpy arrays to lists for JSON serialization
        forward_results_serializable = {
            'outputs': [output.tolist() for output in forward_results['outputs']],
            'activations': [activation.tolist() for activation in forward_results['activations']],
            'final_output': forward_results['final_output'].tolist()
        }
        
        return jsonify({
            'success': True,
            'forward_results': forward_results_serializable,
            'backward_results': backward_results,
            'network_state': network_state,
            'loss': float(nn.calculate_loss(y, forward_results['final_output']))
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 400

@app.route("/api/predict", methods=["POST"])
def predict():
    """Make predictions with the trained network"""
    global nn
    
    if nn is None:
        return jsonify({'success': False, 'error': 'Network not initialized'}), 400
    
    data = request.get_json()
    X = np.array(data.get('X', []))
    
    try:
        forward_results = nn.forward_pass(X)
        return jsonify({
            'success': True,
            'predictions': forward_results['outputs'][-1].tolist(),
            'activations': [layer.tolist() for layer in forward_results['activations']]
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 400

@app.route("/api/reset", methods=["POST"])
def reset_network():
    """Reset the neural network to initial state"""
    global nn
    
    if nn is None:
        return jsonify({'success': False, 'error': 'Network not initialized'}), 400
    
    try:
        nn.reset_weights()
        return jsonify({
            'success': True,
            'message': 'Network weights reset to initial state'
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 400

if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5001) 