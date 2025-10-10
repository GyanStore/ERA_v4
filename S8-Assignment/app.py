"""
HuggingFace Spaces Gradio App for ResNet CIFAR-100 Classifier

This app provides an interactive interface for classifying CIFAR-100 images
using a trained ResNet model.
"""

import gradio as gr
import torch
import torch.nn.functional as F
import torchvision.transforms as transforms
import numpy as np
from PIL import Image
import json
import os
from typing import Dict, List, Tuple

# Import our model
from resnet_model import get_model
from data_utils import CIFAR100_CLASSES, CIFAR100_MEAN, CIFAR100_STD


class CIFAR100Classifier:
    """
    CIFAR-100 image classifier using trained ResNet model
    """
    
    def __init__(self, model_path: str = "best_model.pth", model_name: str = "resnet18"):
        self.device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        self.model_name = model_name
        self.classes = CIFAR100_CLASSES
        
        # Load model
        self.model = self._load_model(model_path, model_name)
        
        # Setup transforms
        self.transform = transforms.Compose([
            transforms.Resize((32, 32)),
            transforms.ToTensor(),
            transforms.Normalize(CIFAR100_MEAN, CIFAR100_STD)
        ])
        
        # Load training info if available
        self.training_info = self._load_training_info()
    
    def _load_model(self, model_path: str, model_name: str):
        """Load the trained model"""
        # Create model
        model = get_model(model_name, num_classes=100)
        
        # Load weights if available
        if os.path.exists(model_path):
            try:
                checkpoint = torch.load(model_path, map_location=self.device)
                
                # Handle different checkpoint formats
                if 'state_dict' in checkpoint:
                    state_dict = checkpoint['state_dict']
                else:
                    state_dict = checkpoint
                
                # Remove 'module.' prefix if present (from DataParallel)
                if any(key.startswith('module.') for key in state_dict.keys()):
                    state_dict = {key.replace('module.', ''): value 
                                for key, value in state_dict.items()}
                
                model.load_state_dict(state_dict)
                print(f"✅ Loaded model from {model_path}")
                
            except Exception as e:
                print(f"⚠️  Could not load model weights: {e}")
                print("Using randomly initialized model")
        else:
            print(f"⚠️  Model file {model_path} not found. Using randomly initialized model")
        
        model.to(self.device)
        model.eval()
        return model
    
    def _load_training_info(self):
        """Load training information if available"""
        info_files = [
            "training_results.json",
            "training_info.json"
        ]
        
        for info_file in info_files:
            if os.path.exists(info_file):
                try:
                    with open(info_file, 'r') as f:
                        return json.load(f)
                except Exception as e:
                    print(f"Could not load {info_file}: {e}")
        
        return None
    
    def predict(self, image: Image.Image) -> Tuple[Dict[str, float], str]:
        """
        Predict the class of an input image
        
        Args:
            image: PIL Image
            
        Returns:
            Tuple of (confidence_dict, prediction_text)
        """
        try:
            # Preprocess image
            if image.mode != 'RGB':
                image = image.convert('RGB')
            
            # Transform image
            input_tensor = self.transform(image).unsqueeze(0).to(self.device)
            
            # Make prediction
            with torch.no_grad():
                outputs = self.model(input_tensor)
                probabilities = F.softmax(outputs, dim=1)
                
            # Get top 5 predictions
            top5_prob, top5_idx = torch.topk(probabilities, 5)
            top5_prob = top5_prob.cpu().numpy()[0]
            top5_idx = top5_idx.cpu().numpy()[0]
            
            # Create confidence dictionary for Gradio
            confidence_dict = {}
            for i in range(5):
                class_name = self.classes[top5_idx[i]]
                confidence = float(top5_prob[i])
                confidence_dict[class_name] = confidence
            
            # Create prediction text
            prediction_text = f"**Top Prediction:** {self.classes[top5_idx[0]]} ({top5_prob[0]:.2%})\n\n"
            prediction_text += "**Top 5 Predictions:**\n"
            for i in range(5):
                class_name = self.classes[top5_idx[i]]
                confidence = top5_prob[i]
                prediction_text += f"{i+1}. {class_name}: {confidence:.2%}\n"
            
            return confidence_dict, prediction_text
            
        except Exception as e:
            error_msg = f"Error during prediction: {str(e)}"
            return {}, error_msg
    
    def get_model_info(self) -> str:
        """Get model information"""
        info_text = f"## Model Information\n\n"
        info_text += f"**Architecture:** {self.model_name.upper()}\n"
        info_text += f"**Dataset:** CIFAR-100 (100 classes)\n"
        info_text += f"**Input Size:** 32×32 RGB images\n"
        info_text += f"**Device:** {self.device}\n\n"
        
        if self.training_info:
            info_text += f"## Training Results\n\n"
            if 'best_accuracy' in self.training_info:
                info_text += f"**Best Accuracy:** {self.training_info['best_accuracy']:.2f}%\n"
            if 'epochs' in self.training_info:
                info_text += f"**Training Epochs:** {self.training_info['epochs']}\n"
            if 'target_reached_epoch' in self.training_info and self.training_info['target_reached_epoch']:
                info_text += f"**Target Reached:** Epoch {self.training_info['target_reached_epoch']}\n"
        
        return info_text


# Initialize classifier
classifier = CIFAR100Classifier()

# Create example images
def create_examples():
    """Create example images for the interface"""
    examples = []
    example_dir = "examples"
    
    if os.path.exists(example_dir):
        for filename in os.listdir(example_dir):
            if filename.lower().endswith(('.png', '.jpg', '.jpeg')):
                examples.append(os.path.join(example_dir, filename))
    
    return examples[:5]  # Limit to 5 examples

# Gradio interface functions
def classify_image(image):
    """Classify uploaded image"""
    if image is None:
        return {}, "Please upload an image"
    
    confidence_dict, prediction_text = classifier.predict(image)
    return confidence_dict, prediction_text

def get_info():
    """Get model information"""
    return classifier.get_model_info()

# Create Gradio interface
def create_interface():
    """Create the Gradio interface"""
    
    # Custom CSS for better styling
    css = """
    .gradio-container {
        font-family: 'Helvetica Neue', Arial, sans-serif;
    }
    .header {
        text-align: center;
        margin-bottom: 30px;
    }
    .footer {
        text-align: center;
        margin-top: 30px;
        color: #666;
    }
    """
    
    with gr.Blocks(css=css, title="CIFAR-100 ResNet Classifier") as interface:
        
        # Header
        gr.HTML("""
        <div class="header">
            <h1>🖼️ CIFAR-100 Image Classifier</h1>
            <p>Upload an image to classify it into one of 100 CIFAR-100 categories using a trained ResNet model</p>
        </div>
        """)
        
        with gr.Row():
            with gr.Column(scale=1):
                # Input section
                gr.HTML("<h3>📤 Upload Image</h3>")
                image_input = gr.Image(
                    type="pil",
                    label="Upload an image",
                    height=300
                )
                
                classify_btn = gr.Button(
                    "🔍 Classify Image",
                    variant="primary",
                    size="lg"
                )
                
                # Examples
                examples = create_examples()
                if examples:
                    gr.Examples(
                        examples=examples,
                        inputs=image_input,
                        label="📋 Example Images"
                    )
            
            with gr.Column(scale=1):
                # Output section
                gr.HTML("<h3>📊 Prediction Results</h3>")
                
                # Confidence plot
                confidence_plot = gr.Label(
                    label="Top 5 Predictions",
                    num_top_classes=5
                )
                
                # Detailed results
                prediction_text = gr.Markdown(
                    label="Detailed Results",
                    value="Upload an image to see predictions"
                )
        
        # Model information section
        with gr.Row():
            with gr.Column():
                gr.HTML("<h3>ℹ️ Model Information</h3>")
                info_btn = gr.Button("Show Model Info")
                model_info = gr.Markdown()
        
        # Event handlers
        classify_btn.click(
            fn=classify_image,
            inputs=image_input,
            outputs=[confidence_plot, prediction_text]
        )
        
        image_input.change(
            fn=classify_image,
            inputs=image_input,
            outputs=[confidence_plot, prediction_text]
        )
        
        info_btn.click(
            fn=get_info,
            outputs=model_info
        )
        
        # Footer
        gr.HTML("""
        <div class="footer">
            <p>Built with ❤️ using PyTorch and Gradio | ResNet trained from scratch on CIFAR-100</p>
            <p>🎯 Target: 73% accuracy | 🏆 Achieved through advanced training techniques</p>
        </div>
        """)
    
    return interface

# CIFAR-100 class information
def get_class_info():
    """Get information about CIFAR-100 classes"""
    class_info = """
    ## CIFAR-100 Classes
    
    The CIFAR-100 dataset contains 100 classes grouped into 20 superclasses:
    
    **Animals:**
    - Aquatic mammals: beaver, dolphin, otter, seal, whale
    - Fish: aquarium_fish, flatfish, ray, shark, trout
    - Flowers: orchid, poppy, rose, sunflower, tulip
    - Food containers: bottle, bowl, can, cup, plate
    - Fruit and vegetables: apple, mushroom, orange, pear, sweet_pepper
    - Household electrical devices: clock, keyboard, lamp, telephone, television
    - Household furniture: bed, chair, couch, table, wardrobe
    - Insects: bee, beetle, butterfly, caterpillar, cockroach
    - Large carnivores: bear, leopard, lion, tiger, wolf
    - Large man-made outdoor things: bridge, castle, house, road, skyscraper
    - Large natural outdoor scenes: cloud, forest, mountain, plain, sea
    - Large omnivores and herbivores: camel, cattle, chimpanzee, elephant, kangaroo
    - Medium-sized mammals: fox, porcupine, possum, raccoon, skunk
    - Non-insect invertebrates: crab, lobster, snail, spider, worm
    - People: baby, boy, girl, man, woman
    - Reptiles: crocodile, dinosaur, lizard, snake, turtle
    - Small mammals: hamster, mouse, rabbit, shrew, squirrel
    - Trees: maple_tree, oak_tree, palm_tree, pine_tree, willow_tree
    - Vehicles 1: bicycle, bus, motorcycle, pickup_truck, train
    - Vehicles 2: lawn_mower, rocket, streetcar, tank, tractor
    """
    return class_info

# Main app
def main():
    """Main function to launch the app"""
    print("🚀 Launching CIFAR-100 ResNet Classifier...")
    print(f"📱 Device: {classifier.device}")
    print(f"🏗️  Model: {classifier.model_name}")
    print("="*50)
    
    # Create and launch interface
    interface = create_interface()
    
    # Launch with appropriate settings
    interface.launch(
        server_name="0.0.0.0",  # Allow external access
        server_port=7860,       # Standard Gradio port
        share=False,            # Set to True for public sharing
        show_error=True,        # Show errors in interface
        quiet=False             # Show startup logs
    )

if __name__ == "__main__":
    main()
