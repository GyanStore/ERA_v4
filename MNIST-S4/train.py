import torch
import torch.nn as nn
import torch.optim as optim
import torch.nn.functional as F
from torch.utils.data import DataLoader
from torchvision import datasets, transforms
import time
import numpy as np
from model import create_model

def get_data_loaders(batch_size=256):
    """
    Create data loaders with optimized transforms for 1-epoch training
    """
    # Training transforms with minimal augmentation for 1 epoch
    train_transform = transforms.Compose([
        transforms.ToTensor(),
        transforms.Normalize((0.1307,), (0.3081,)),  # MNIST mean and std
        transforms.RandomRotation(3),  # Very slight rotation
        transforms.RandomAffine(degrees=0, translate=(0.02, 0.02)),  # Minimal translation
    ])
    
    # Test transforms (no augmentation)
    test_transform = transforms.Compose([
        transforms.ToTensor(),
        transforms.Normalize((0.1307,), (0.3081,))
    ])
    
    # Download and load datasets
    train_dataset = datasets.MNIST('./data', train=True, download=True, transform=train_transform)
    test_dataset = datasets.MNIST('./data', train=False, transform=test_transform)
    
    # Create data loaders with larger batch size for efficiency
    train_loader = DataLoader(train_dataset, batch_size=batch_size, shuffle=True, num_workers=2, pin_memory=True)
    test_loader = DataLoader(test_dataset, batch_size=batch_size, shuffle=False, num_workers=2, pin_memory=True)
    
    print(f"Training samples: {len(train_dataset)}")
    print(f"Test samples: {len(test_dataset)}")
    print(f"Batch size: {batch_size}")
    
    return train_loader, test_loader

def train_epoch(model, device, train_loader, optimizer, scheduler, epoch, log_interval=50):
    """Train for one epoch with learning rate scheduling"""
    model.train()
    train_loss = 0
    correct = 0
    total = 0
    
    for batch_idx, (data, target) in enumerate(train_loader):
        data, target = data.to(device), target.to(device)
        
        optimizer.zero_grad()
        output = model(data)
        loss = F.cross_entropy(output, target)
        loss.backward()
        
        # Gradient clipping for stability
        torch.nn.utils.clip_grad_norm_(model.parameters(), max_norm=1.0)
        
        optimizer.step()
        scheduler.step()  # Update learning rate after each batch
        
        # Statistics
        train_loss += loss.item()
        pred = output.argmax(dim=1, keepdim=True)
        correct += pred.eq(target.view_as(pred)).sum().item()
        total += target.size(0)
        
        if batch_idx % log_interval == 0:
            accuracy = 100. * correct / total
            current_lr = scheduler.get_last_lr()[0]
            print(f'Train Epoch: {epoch} [{batch_idx * len(data)}/{len(train_loader.dataset)} '
                  f'({100. * batch_idx / len(train_loader):.0f}%)]\t'
                  f'Loss: {loss.item():.6f}\tAccuracy: {accuracy:.2f}%\tLR: {current_lr:.6f}')
    
    final_train_accuracy = 100. * correct / total
    avg_train_loss = train_loss / len(train_loader)
    
    return avg_train_loss, final_train_accuracy

def test(model, device, test_loader):
    """Test the model"""
    model.eval()
    test_loss = 0
    correct = 0
    
    with torch.no_grad():
        for data, target in test_loader:
            data, target = data.to(device), target.to(device)
            output = model(data)
            test_loss += F.cross_entropy(output, target, reduction='sum').item()
            pred = output.argmax(dim=1, keepdim=True)
            correct += pred.eq(target.view_as(pred)).sum().item()
    
    test_loss /= len(test_loader.dataset)
    test_accuracy = 100. * correct / len(test_loader.dataset)
    
    print(f'\nTest set: Average loss: {test_loss:.4f}, '
          f'Accuracy: {correct}/{len(test_loader.dataset)} ({test_accuracy:.2f}%)\n')
    
    return test_loss, test_accuracy

def main():
    """Main training function"""
    # Set random seeds for reproducibility
    torch.manual_seed(42)
    np.random.seed(42)
    
    # Device configuration
    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    print(f"Using device: {device}")
    
    # Create model and move to device
    model = create_model()
    model.to(device)
    
    # Get data loaders with larger batch size
    train_loader, test_loader = get_data_loaders(batch_size=256)
    
    # Optimized optimizer and scheduler for 1-epoch training
    optimizer = optim.AdamW(model.parameters(), lr=0.002, weight_decay=1e-3)
    scheduler = optim.lr_scheduler.OneCycleLR(
        optimizer, 
        max_lr=0.015,  # Higher max learning rate for faster convergence
        epochs=1,
        steps_per_epoch=len(train_loader),
        pct_start=0.3,  # Longer warmup for stability
        anneal_strategy='cos',
        div_factor=10,  # Start with lr/10
        final_div_factor=100  # End with max_lr/100
    )
    
    print("="*60)
    print("STARTING TRAINING")
    print("="*60)
    
    start_time = time.time()
    
    # Train for 1 epoch
    train_loss, train_accuracy = train_epoch(model, device, train_loader, optimizer, scheduler, 1)
    
    # Test the model
    test_loss, test_accuracy = test(model, device, test_loader)
    
    end_time = time.time()
    training_time = end_time - start_time
    
    print("="*60)
    print("TRAINING COMPLETED")
    print("="*60)
    print(f"Training Time: {training_time:.2f} seconds")
    print(f"Final Train Accuracy: {train_accuracy:.2f}%")
    print(f"Final Test Accuracy: {test_accuracy:.2f}%")
    print(f"Model Parameters: {model.count_parameters():,}")
    
    # Check if we met the requirements
    if test_accuracy >= 95.0:
        print("✓ SUCCESS: Achieved 95%+ test accuracy!")
    else:
        print(f"✗ FAILED: Test accuracy {test_accuracy:.2f}% < 95%")
    
    if model.count_parameters() < 25000:
        print("✓ SUCCESS: Model has fewer than 25,000 parameters!")
    else:
        print(f"✗ FAILED: Model has {model.count_parameters():,} parameters >= 25,000")
    
    # Save the model
    torch.save(model.state_dict(), 'mnist_efficient_model.pth')
    print("Model saved as 'mnist_efficient_model.pth'")
    
    # Save training logs
    logs = {
        'train_accuracy': train_accuracy,
        'test_accuracy': test_accuracy,
        'train_loss': train_loss,
        'test_loss': test_loss,
        'parameters': model.count_parameters(),
        'training_time': training_time,
        'epochs': 1
    }
    
    torch.save(logs, 'training_logs.pth')
    print("Training logs saved as 'training_logs.pth'")
    
    return model, logs

if __name__ == "__main__":
    model, logs = main()
