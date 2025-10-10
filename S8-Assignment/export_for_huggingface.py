"""
Export Script for HuggingFace Spaces Deployment

This script prepares the trained model and creates all necessary files
for deployment on HuggingFace Spaces.
"""

import torch
import os
import json
import shutil
from datetime import datetime
from pathlib import Path
import argparse

from resnet_model import get_model, count_parameters


def export_model_for_huggingface(
    checkpoint_path: str,
    output_dir: str = "huggingface_space",
    model_name: str = "resnet18",
    space_name: str = "cifar100-resnet-classifier"
):
    """
    Export trained model for HuggingFace Spaces deployment
    
    Args:
        checkpoint_path: Path to the trained model checkpoint
        output_dir: Directory to create the HuggingFace Space
        model_name: Name of the model architecture
        space_name: Name for the HuggingFace Space
    """
    
    print(f"🚀 Exporting model for HuggingFace Spaces...")
    print(f"📁 Checkpoint: {checkpoint_path}")
    print(f"📂 Output directory: {output_dir}")
    print(f"🏗️  Model: {model_name}")
    
    # Create output directory
    os.makedirs(output_dir, exist_ok=True)
    
    # 1. Load and export the model
    print("\n📦 Loading and exporting model...")
    model = get_model(model_name, num_classes=100)
    
    if os.path.exists(checkpoint_path):
        checkpoint = torch.load(checkpoint_path, map_location='cpu')
        
        # Handle different checkpoint formats
        if 'state_dict' in checkpoint:
            state_dict = checkpoint['state_dict']
            training_info = {
                'best_accuracy': checkpoint.get('best_acc', 0.0),
                'epoch': checkpoint.get('epoch', 0),
                'target_reached_epoch': checkpoint.get('target_reached_epoch', None),
                'model_name': model_name
            }
        else:
            state_dict = checkpoint
            training_info = {'model_name': model_name}
        
        # Remove 'module.' prefix if present (from DataParallel)
        if any(key.startswith('module.') for key in state_dict.keys()):
            state_dict = {key.replace('module.', ''): value 
                         for key, value in state_dict.items()}
        
        model.load_state_dict(state_dict)
        print(f"✅ Model loaded successfully")
        
        # Save training info
        with open(os.path.join(output_dir, 'training_info.json'), 'w') as f:
            json.dump(training_info, f, indent=2)
    else:
        print(f"⚠️  Checkpoint not found: {checkpoint_path}")
        print("Creating space with randomly initialized model")
        training_info = {'model_name': model_name, 'note': 'randomly_initialized'}
    
    # Save the model
    model_path = os.path.join(output_dir, 'best_model.pth')
    torch.save(model.state_dict(), model_path)
    print(f"💾 Model saved to: {model_path}")
    
    # 2. Copy necessary Python files
    print("\n📋 Copying Python files...")
    files_to_copy = [
        'app.py',
        'resnet_model.py',
        'data_utils.py'
    ]
    
    for file_name in files_to_copy:
        if os.path.exists(file_name):
            shutil.copy2(file_name, output_dir)
            print(f"✅ Copied: {file_name}")
        else:
            print(f"⚠️  File not found: {file_name}")
    
    # 3. Create requirements.txt for HuggingFace Spaces
    print("\n📝 Creating requirements.txt...")
    requirements_content = """torch>=1.9.0
torchvision>=0.10.0
gradio>=3.0.0
numpy>=1.21.0
Pillow>=8.3.0
matplotlib>=3.4.0
scikit-learn>=1.0.0
"""
    
    with open(os.path.join(output_dir, 'requirements.txt'), 'w') as f:
        f.write(requirements_content)
    print("✅ Requirements.txt created")
    
    # 4. Create README.md for the Space
    print("\n📄 Creating README.md...")
    readme_content = f"""---
title: {space_name}
emoji: 🖼️
colorFrom: blue
colorTo: red
sdk: gradio
sdk_version: 3.50.2
app_file: app.py
pinned: false
license: apache-2.0
---

# CIFAR-100 ResNet Classifier

This is a **{model_name.upper()}** model trained from scratch on the CIFAR-100 dataset to classify images into 100 different categories.

## 🎯 Model Performance

- **Architecture**: {model_name.upper()}
- **Dataset**: CIFAR-100 (100 classes)
- **Target Accuracy**: 73%
- **Training**: From scratch (no pre-trained weights)

## 🚀 How to Use

1. Upload an image (any size - it will be resized to 32x32)
2. The model will predict the top 5 most likely CIFAR-100 classes
3. View confidence scores for each prediction

## 📊 CIFAR-100 Classes

The model can classify images into 100 categories including:
- Animals (mammals, fish, birds, insects, reptiles)
- Vehicles (cars, trucks, trains, planes)
- Objects (furniture, food, household items)
- Natural scenes (trees, flowers, landscapes)
- And many more!

## 🛠️ Technical Details

- **Framework**: PyTorch
- **Architecture**: ResNet with residual connections
- **Input Size**: 32×32 RGB images
- **Output**: 100-class classification
- **Training**: Advanced data augmentation, mixed precision, cosine annealing

## 🏆 Training Highlights

- Achieved target accuracy through careful hyperparameter tuning
- Used advanced training techniques:
  - Mixed precision training for efficiency
  - Strong data augmentation for robustness
  - Cosine annealing with warm restarts
  - Label smoothing for better generalization

## 📚 About CIFAR-100

CIFAR-100 is a challenging dataset with:
- 60,000 32×32 color images
- 100 classes (600 images per class)
- 50,000 training images
- 10,000 test images
- Organized into 20 superclasses

## 🔗 Links

- [Original Paper: Deep Residual Learning for Image Recognition](https://arxiv.org/abs/1512.03385)
- [CIFAR-100 Dataset](https://www.cs.toronto.edu/~kriz/cifar.html)

Built with ❤️ for ERA V4 Session 8 Assignment
"""
    
    with open(os.path.join(output_dir, 'README.md'), 'w') as f:
        f.write(readme_content)
    print("✅ README.md created")
    
    # 5. Create .gitignore
    print("\n🚫 Creating .gitignore...")
    gitignore_content = """__pycache__/
*.py[cod]
*$py.class
*.so
.Python
build/
develop-eggs/
dist/
downloads/
eggs/
.eggs/
lib/
lib64/
parts/
sdist/
var/
wheels/
*.egg-info/
.installed.cfg
*.egg
MANIFEST

# PyTorch
*.pth
*.pt

# Jupyter Notebook
.ipynb_checkpoints

# Environment
.env
.venv
env/
venv/
ENV/
env.bak/
venv.bak/

# IDE
.vscode/
.idea/
*.swp
*.swo
*~

# OS
.DS_Store
Thumbs.db

# Logs
logs/
*.log

# Data
data/
checkpoints/
"""
    
    with open(os.path.join(output_dir, '.gitignore'), 'w') as f:
        f.write(gitignore_content)
    print("✅ .gitignore created")
    
    # 6. Create example images directory (if examples exist)
    examples_dir = os.path.join(output_dir, 'examples')
    if os.path.exists('examples'):
        shutil.copytree('examples', examples_dir, dirs_exist_ok=True)
        print("✅ Example images copied")
    else:
        os.makedirs(examples_dir, exist_ok=True)
        print("📁 Examples directory created (empty)")
    
    # 7. Create deployment instructions
    print("\n📋 Creating deployment instructions...")
    instructions = f"""# HuggingFace Spaces Deployment Instructions

## 🚀 Quick Deploy

1. **Create a new Space on HuggingFace:**
   - Go to https://huggingface.co/spaces
   - Click "Create new Space"
   - Choose "Gradio" as the SDK
   - Name your space: `{space_name}`

2. **Upload files:**
   - Upload all files from this directory to your Space
   - Make sure `app.py` is in the root directory

3. **Your Space will automatically build and deploy!**

## 📁 Files in this export:

- `app.py` - Main Gradio application
- `resnet_model.py` - ResNet model implementation
- `data_utils.py` - Data utilities and CIFAR-100 classes
- `best_model.pth` - Trained model weights
- `requirements.txt` - Python dependencies
- `README.md` - Space documentation
- `training_info.json` - Training metadata
- `examples/` - Example images (if available)

## 🔧 Customization:

- Edit `README.md` to update the Space description
- Add example images to `examples/` directory
- Modify `app.py` to change the interface
- Update model info in `training_info.json`

## 🌐 After deployment:

Your Space will be available at:
`https://huggingface.co/spaces/YOUR_USERNAME/{space_name}`

## 📊 Model Info:

- Architecture: {model_name.upper()}
- Classes: 100 (CIFAR-100)
- Input: 32x32 RGB images
- Framework: PyTorch + Gradio

## 🎯 Performance:

Check `training_info.json` for detailed training results and accuracy metrics.

---

Built for ERA V4 Session 8 Assignment
Generated on: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
"""
    
    with open(os.path.join(output_dir, 'DEPLOYMENT.md'), 'w') as f:
        f.write(instructions)
    print("✅ Deployment instructions created")
    
    # 8. Summary
    print(f"\n🎉 Export completed successfully!")
    print(f"📂 All files saved to: {output_dir}")
    print(f"\n📋 Next steps:")
    print(f"1. Go to https://huggingface.co/spaces")
    print(f"2. Create a new Gradio Space")
    print(f"3. Upload all files from '{output_dir}' directory")
    print(f"4. Your Space will automatically deploy!")
    
    # List all created files
    print(f"\n📁 Created files:")
    for root, dirs, files in os.walk(output_dir):
        level = root.replace(output_dir, '').count(os.sep)
        indent = ' ' * 2 * level
        print(f"{indent}{os.path.basename(root)}/")
        subindent = ' ' * 2 * (level + 1)
        for file in files:
            file_size = os.path.getsize(os.path.join(root, file))
            size_str = f"({file_size:,} bytes)" if file_size > 0 else ""
            print(f"{subindent}{file} {size_str}")
    
    return output_dir


def create_space_from_training_results(
    results_dir: str = "./checkpoints",
    output_dir: str = "huggingface_space"
):
    """
    Create HuggingFace Space from training results directory
    
    Args:
        results_dir: Directory containing training checkpoints and results
        output_dir: Output directory for the HuggingFace Space
    """
    
    print(f"🔍 Looking for best model in: {results_dir}")
    
    # Find the best model checkpoint
    best_model_path = None
    best_accuracy = 0.0
    
    if os.path.exists(results_dir):
        # Look for best_model.pth first
        best_path = os.path.join(results_dir, 'best_model.pth')
        if os.path.exists(best_path):
            best_model_path = best_path
            print(f"✅ Found best_model.pth")
        else:
            # Look for target models or other checkpoints
            for filename in os.listdir(results_dir):
                if filename.endswith('.pth'):
                    filepath = os.path.join(results_dir, filename)
                    try:
                        checkpoint = torch.load(filepath, map_location='cpu')
                        if isinstance(checkpoint, dict) and 'best_acc' in checkpoint:
                            acc = checkpoint['best_acc']
                            if acc > best_accuracy:
                                best_accuracy = acc
                                best_model_path = filepath
                    except:
                        continue
    
    if best_model_path:
        print(f"📦 Using model: {best_model_path}")
        if best_accuracy > 0:
            print(f"🏆 Model accuracy: {best_accuracy:.2f}%")
    else:
        print("⚠️  No suitable model checkpoint found")
        best_model_path = "dummy_path"  # Will create with random weights
    
    # Determine model architecture (try to infer from checkpoint or use default)
    model_name = "resnet18"  # Default
    
    if best_model_path and os.path.exists(best_model_path):
        try:
            checkpoint = torch.load(best_model_path, map_location='cpu')
            if 'args' in checkpoint and hasattr(checkpoint['args'], 'model'):
                model_name = checkpoint['args'].model
            elif isinstance(checkpoint, dict) and 'model_name' in checkpoint:
                model_name = checkpoint['model_name']
        except:
            pass
    
    print(f"🏗️  Detected model architecture: {model_name}")
    
    # Export the model
    return export_model_for_huggingface(
        checkpoint_path=best_model_path,
        output_dir=output_dir,
        model_name=model_name
    )


def main():
    """Main function for command line usage"""
    parser = argparse.ArgumentParser(description='Export ResNet model for HuggingFace Spaces')
    
    parser.add_argument('--checkpoint', type=str, default='./checkpoints/best_model.pth',
                       help='Path to model checkpoint')
    parser.add_argument('--output-dir', type=str, default='./huggingface_space',
                       help='Output directory for HuggingFace Space')
    parser.add_argument('--model', type=str, default='resnet18',
                       choices=['resnet18', 'resnet34', 'resnet50'],
                       help='Model architecture')
    parser.add_argument('--space-name', type=str, default='cifar100-resnet-classifier',
                       help='Name for the HuggingFace Space')
    parser.add_argument('--from-results', action='store_true',
                       help='Auto-detect best model from results directory')
    parser.add_argument('--results-dir', type=str, default='./checkpoints',
                       help='Directory containing training results')
    
    args = parser.parse_args()
    
    if args.from_results:
        # Auto-detect and export from results directory
        output_dir = create_space_from_training_results(
            results_dir=args.results_dir,
            output_dir=args.output_dir
        )
    else:
        # Export specific checkpoint
        output_dir = export_model_for_huggingface(
            checkpoint_path=args.checkpoint,
            output_dir=args.output_dir,
            model_name=args.model,
            space_name=args.space_name
        )
    
    print(f"\n🌟 Ready for HuggingFace Spaces deployment!")
    print(f"📂 Space files: {output_dir}")


if __name__ == "__main__":
    main()
