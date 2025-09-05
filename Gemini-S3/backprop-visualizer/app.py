from flask import Flask, render_template, request, jsonify
import numpy as np
import json
import requests
from neural_network import NeuralNetwork

app = Flask(__name__)

# Global neural network instance
nn = None

# Gemini API configuration
GEMINI_API_KEY = "AIzaSyA0arm212nZUmlURuXbbopV4XHWyhGwb5w"
GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent"

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

def get_network_context():
    """Get current network state and context for Gemini"""
    global nn
    
    context = {
        'network_initialized': nn is not None,
        'application': 'NEURALCHAT - Neural Network Backpropagation Visualizer'
    }
    
    if nn is not None:
        network_state = nn.get_network_state()
        context.update({
            'layer_sizes': network_state['layer_sizes'],
            'learning_rate': network_state['learning_rate'],
            'activation': network_state['activation'],
            'total_parameters': nn.get_total_parameters(),
            'weights_shapes': [w.shape for w in nn.weights],
            'biases_shapes': [b.shape for b in nn.biases]
        })
    
    return context

def create_system_prompt(context, user_question):
    """Create a comprehensive system prompt for Gemini"""
    
    base_prompt = """You are an AI assistant for NEURALCHAT, a neural network backpropagation visualization application. 
You specialize in explaining neural networks, backpropagation, machine learning concepts, and helping users understand their current network configuration.

CURRENT APPLICATION CONTEXT:
"""
    
    if context['network_initialized']:
        base_prompt += f"""
- Network Architecture: {' → '.join(map(str, context['layer_sizes']))} layers
- Learning Rate: {context['learning_rate']}
- Activation Function: {context['activation']}
- Total Parameters: {context['total_parameters']}
- Network is currently initialized and ready for training
"""
    else:
        base_prompt += """
- No network is currently initialized
- User needs to configure and initialize a network first
"""
    
    base_prompt += """

GUIDELINES:
1. Provide clear, educational explanations about neural networks and backpropagation
2. Reference the user's current network configuration when relevant
3. Use analogies and examples to make complex concepts accessible
4. Suggest practical next steps for using the NEURALCHAT application
5. Keep responses concise but informative (2-3 paragraphs max)
6. Use emojis sparingly for visual appeal
7. Focus on the mathematical and conceptual aspects of neural networks

TOPICS YOU CAN HELP WITH:
- Neural network architecture design
- Backpropagation algorithm explanation
- Activation functions (sigmoid, tanh, ReLU)
- Loss functions and optimization
- Training process and convergence
- Overfitting and regularization
- Layer size selection and network depth
- Learning rate tuning
- Gradient descent and weight updates

USER QUESTION: """ + user_question
    
    return base_prompt

@app.route("/api/chat", methods=["POST"])
def chat_with_gemini():
    """Chat with Gemini AI about neural networks and backpropagation"""
    
    try:
        data = request.get_json()
        user_message = data.get('message', '').strip()
        
        if not user_message:
            return jsonify({'success': False, 'error': 'Message is required'}), 400
        
        # Get current network context
        context = get_network_context()
        
        # Create system prompt with context
        system_prompt = create_system_prompt(context, user_message)
        
        # Prepare Gemini API request
        headers = {
            'Content-Type': 'application/json',
            'X-goog-api-key': GEMINI_API_KEY
        }
        
        payload = {
            "contents": [
                {
                    "parts": [
                        {
                            "text": system_prompt
                        }
                    ]
                }
            ],
            "generationConfig": {
                "temperature": 0.7,
                "topK": 40,
                "topP": 0.95,
                "maxOutputTokens": 1024,
            }
        }
        
        # Make request to Gemini API
        response = requests.post(
            GEMINI_API_URL,
            headers=headers,
            json=payload,
            timeout=30
        )
        
        if response.status_code == 200:
            gemini_response = response.json()
            
            # Extract the response text
            if 'candidates' in gemini_response and len(gemini_response['candidates']) > 0:
                candidate = gemini_response['candidates'][0]
                if 'content' in candidate and 'parts' in candidate['content']:
                    ai_message = candidate['content']['parts'][0]['text']
                    
                    return jsonify({
                        'success': True,
                        'message': ai_message,
                        'context': {
                            'network_initialized': context['network_initialized'],
                            'layer_sizes': context.get('layer_sizes'),
                            'total_parameters': context.get('total_parameters')
                        }
                    })
                else:
                    return jsonify({'success': False, 'error': 'Invalid response format from Gemini'}), 500
            else:
                return jsonify({'success': False, 'error': 'No response from Gemini'}), 500
        else:
            error_details = response.text
            return jsonify({
                'success': False, 
                'error': f'Gemini API error: {response.status_code}',
                'details': error_details
            }), 500
            
    except requests.exceptions.Timeout:
        return jsonify({'success': False, 'error': 'Request timeout - Gemini API is taking too long'}), 500
    except requests.exceptions.RequestException as e:
        return jsonify({'success': False, 'error': f'Network error: {str(e)}'}), 500
    except Exception as e:
        return jsonify({'success': False, 'error': f'Unexpected error: {str(e)}'}), 500

if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5001) 