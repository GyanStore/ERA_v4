"""
MNIST S6 Results Visualization
==============================

Target: Visualize training results and model performance
Results: Comprehensive plots and analysis of all three models
Analysis: Performance comparison and requirement verification
"""

import torch
import matplotlib.pyplot as plt
import numpy as np
import json
import os
from model import create_model

def load_results(model_name):
    """Load training results from JSON file"""
    try:
        with open(f'{model_name.lower()}_results.json', 'r') as f:
            return json.load(f)
    except FileNotFoundError:
        print(f"Results file for {model_name} not found. Please run train.py first.")
        return None

def plot_training_history(all_results):
    """Plot training history for all models"""
    fig, axes = plt.subplots(2, 2, figsize=(15, 10))
    fig.suptitle('MNIST S6 Training Results - All Models', fontsize=16, fontweight='bold')
    
    colors = ['blue', 'red', 'green']
    model_names = ['Model_1', 'Model_2', 'Model_3']
    
    for i, (model_name, color) in enumerate(zip(model_names, colors)):
        results = all_results.get(model_name)
        if results and 'history' in results:
            history = results['history']
            epochs = history['epochs']
            
            # Plot training accuracy
            axes[0, 0].plot(epochs, history['train_acc'], color=color, label=f'{model_name}', linewidth=2)
            axes[0, 0].set_title('Training Accuracy', fontweight='bold')
            axes[0, 0].set_xlabel('Epoch')
            axes[0, 0].set_ylabel('Accuracy (%)')
            axes[0, 0].grid(True, alpha=0.3)
            axes[0, 0].legend()
            
            # Plot validation accuracy
            axes[0, 1].plot(epochs, history['val_acc'], color=color, label=f'{model_name}', linewidth=2)
            axes[0, 1].axhline(y=99.4, color='black', linestyle='--', alpha=0.7, label='Target 99.4%')
            axes[0, 1].set_title('Validation Accuracy', fontweight='bold')
            axes[0, 1].set_xlabel('Epoch')
            axes[0, 1].set_ylabel('Accuracy (%)')
            axes[0, 1].grid(True, alpha=0.3)
            axes[0, 1].legend()
            
            # Plot training loss
            axes[1, 0].plot(epochs, history['train_loss'], color=color, label=f'{model_name}', linewidth=2)
            axes[1, 0].set_title('Training Loss', fontweight='bold')
            axes[1, 0].set_xlabel('Epoch')
            axes[1, 0].set_ylabel('Loss')
            axes[1, 0].grid(True, alpha=0.3)
            axes[1, 0].legend()
            
            # Plot validation loss
            axes[1, 1].plot(epochs, history['val_loss'], color=color, label=f'{model_name}', linewidth=2)
            axes[1, 1].set_title('Validation Loss', fontweight='bold')
            axes[1, 1].set_xlabel('Epoch')
            axes[1, 1].set_ylabel('Loss')
            axes[1, 1].grid(True, alpha=0.3)
            axes[1, 1].legend()
    
    plt.tight_layout()
    plt.savefig('training_results.png', dpi=300, bbox_inches='tight')
    plt.show()

def plot_model_comparison(all_results):
    """Plot model comparison charts"""
    fig, axes = plt.subplots(1, 3, figsize=(18, 6))
    fig.suptitle('MNIST S6 Model Comparison', fontsize=16, fontweight='bold')
    
    model_names = ['Model_1', 'Model_2', 'Model_3']
    parameters = []
    val_accuracies = []
    test_accuracies = []
    
    for model_name in model_names:
        results = all_results.get(model_name)
        if results:
            parameters.append(results['parameters'])
            val_accuracies.append(results['best_val_accuracy'])
            test_accuracies.append(results['final_test_accuracy'])
    
    # Parameter comparison
    bars1 = axes[0].bar(model_names, parameters, color=['skyblue', 'lightcoral', 'lightgreen'])
    axes[0].axhline(y=8000, color='red', linestyle='--', alpha=0.7, label='Parameter Limit (8,000)')
    axes[0].set_title('Parameter Count', fontweight='bold')
    axes[0].set_ylabel('Parameters')
    axes[0].grid(True, alpha=0.3)
    axes[0].legend()
    
    # Add value labels on bars
    for bar, param in zip(bars1, parameters):
        height = bar.get_height()
        axes[0].text(bar.get_x() + bar.get_width()/2., height + 50,
                    f'{param:,}', ha='center', va='bottom', fontweight='bold')
    
    # Validation accuracy comparison
    bars2 = axes[1].bar(model_names, val_accuracies, color=['skyblue', 'lightcoral', 'lightgreen'])
    axes[1].axhline(y=99.4, color='red', linestyle='--', alpha=0.7, label='Target 99.4%')
    axes[1].set_title('Best Validation Accuracy', fontweight='bold')
    axes[1].set_ylabel('Accuracy (%)')
    axes[1].grid(True, alpha=0.3)
    axes[1].legend()
    
    # Add value labels on bars
    for bar, acc in zip(bars2, val_accuracies):
        height = bar.get_height()
        axes[1].text(bar.get_x() + bar.get_width()/2., height + 0.1,
                    f'{acc:.2f}%', ha='center', va='bottom', fontweight='bold')
    
    # Test accuracy comparison
    bars3 = axes[2].bar(model_names, test_accuracies, color=['skyblue', 'lightcoral', 'lightgreen'])
    axes[2].axhline(y=99.4, color='red', linestyle='--', alpha=0.7, label='Target 99.4%')
    axes[2].set_title('Final Test Accuracy', fontweight='bold')
    axes[2].set_ylabel('Accuracy (%)')
    axes[2].grid(True, alpha=0.3)
    axes[2].legend()
    
    # Add value labels on bars
    for bar, acc in zip(bars3, test_accuracies):
        height = bar.get_height()
        axes[2].text(bar.get_x() + bar.get_width()/2., height + 0.1,
                    f'{acc:.2f}%', ha='center', va='bottom', fontweight='bold')
    
    plt.tight_layout()
    plt.savefig('model_comparison.png', dpi=300, bbox_inches='tight')
    plt.show()

def print_detailed_results(all_results):
    """Print detailed results for all models"""
    print("🎯 MNIST S6 DETAILED RESULTS")
    print("="*80)
    
    for model_name in ['Model_1', 'Model_2', 'Model_3']:
        results = all_results.get(model_name)
        if results:
            print(f"\n{model_name} Results:")
            print("-" * 50)
            print(f"Parameters: {results['parameters']:,}")
            print(f"Best Val Accuracy: {results['best_val_accuracy']:.2f}%")
            print(f"Final Test Accuracy: {results['final_test_accuracy']:.2f}%")
            print(f"Epochs Trained: {results['epochs_trained']}")
            print(f"Training Time: {results['training_time']:.2f} seconds")
            
            # Requirements check
            param_check = results['parameters'] < 8000
            acc_check = results['best_val_accuracy'] >= 99.4
            epoch_check = results['epochs_trained'] <= 15
            
            print(f"\nRequirements Check:")
            print(f"  Parameters < 8,000: {'✅ PASS' if param_check else '❌ FAIL'} ({results['parameters']:,})")
            print(f"  Val Accuracy ≥ 99.4%: {'✅ PASS' if acc_check else '❌ FAIL'} ({results['best_val_accuracy']:.2f}%)")
            print(f"  Epochs ≤ 15: {'✅ PASS' if epoch_check else '❌ FAIL'} ({results['epochs_trained']})")
            
            overall_status = "✅ ALL REQUIREMENTS MET" if (param_check and acc_check and epoch_check) else "❌ REQUIREMENTS NOT MET"
            print(f"  Overall: {overall_status}")

def analyze_model_efficiency(all_results):
    """Analyze model efficiency metrics"""
    print(f"\n📊 EFFICIENCY ANALYSIS")
    print("="*80)
    
    for model_name in ['Model_1', 'Model_2', 'Model_3']:
        results = all_results.get(model_name)
        if results:
            params = results['parameters']
            val_acc = results['best_val_accuracy']
            test_acc = results['final_test_accuracy']
            
            # Efficiency metrics
            params_per_percent = params / val_acc
            param_utilization = val_acc / params * 1000  # per 1K params
            training_speed = 60000 / results['training_time']  # samples per second
            
            print(f"\n{model_name} Efficiency:")
            print(f"  Parameters per 1% accuracy: {params_per_percent:.0f}")
            print(f"  Parameter utilization: {param_utilization:.2f}% per 1K params")
            print(f"  Training speed: {training_speed:.0f} samples/second")
            print(f"  Accuracy consistency: {val_acc - test_acc:.2f}% (val - test)")

def main():
    """Main visualization function"""
    print("MNIST S6 Results Visualization")
    print("="*50)
    
    # Load all results
    all_results = {}
    for model_name in ['Model_1', 'Model_2', 'Model_3']:
        results = load_results(model_name)
        if results:
            all_results[model_name] = results
    
    if not all_results:
        print("No results found. Please run train.py first.")
        return
    
    # Print detailed results
    print_detailed_results(all_results)
    
    # Analyze efficiency
    analyze_model_efficiency(all_results)
    
    # Create visualizations
    print(f"\n📈 Creating visualizations...")
    plot_training_history(all_results)
    plot_model_comparison(all_results)
    
    print(f"\n🎉 Visualization complete!")
    print(f"📁 Plots saved as 'training_results.png' and 'model_comparison.png'")

if __name__ == "__main__":
    main()
