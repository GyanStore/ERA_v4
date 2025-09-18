import torch
import torch.nn as nn
import torch.optim as optim
import torch.nn.functional as F
from torch.utils.data import DataLoader, random_split
from torchvision import datasets, transforms
import time
import numpy as np
from model import create_final_model

def get_data_loaders(batch_size=128, validation_split=0.1667):
    """Data loaders for MNIST training"""
    train_transform = transforms.Compose([
        transforms.ToTensor(),
        transforms.Normalize((0.1307,), (0.3081,)),
        transforms.RandomRotation(7),
    ])
    
    val_transform = transforms.Compose([
        transforms.ToTensor(),
        transforms.Normalize((0.1307,), (0.3081,))
    ])
    
    full_train_dataset = datasets.MNIST('./data', train=True, download=True, transform=train_transform)
    train_size = int((1 - validation_split) * len(full_train_dataset))
    val_size = len(full_train_dataset) - train_size
    
    train_dataset, val_dataset = random_split(full_train_dataset, [train_size, val_size])
    val_dataset.dataset.transform = val_transform
    
    test_dataset = datasets.MNIST('./data', train=False, transform=val_transform)
    
    train_loader = DataLoader(train_dataset, batch_size=batch_size, shuffle=True, num_workers=2, pin_memory=True)
    val_loader = DataLoader(val_dataset, batch_size=batch_size, shuffle=False, num_workers=2, pin_memory=True)
    test_loader = DataLoader(test_dataset, batch_size=batch_size, shuffle=False, num_workers=2, pin_memory=True)
    
    print(f"Training samples: {len(train_dataset)}")
    print(f"Validation samples: {len(val_dataset)}")
    print(f"Test samples: {len(test_dataset)}")
    print(f"Batch size: {batch_size}")
    
    return train_loader, val_loader, test_loader

def train_epoch(model, device, train_loader, optimizer, epoch, log_interval=100):
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
        
        torch.nn.utils.clip_grad_norm_(model.parameters(), max_norm=1.0)
        optimizer.step()
        
        train_loss += loss.item()
        pred = output.argmax(dim=1, keepdim=True)
        correct += pred.eq(target.view_as(pred)).sum().item()
        total += target.size(0)
        
        if batch_idx % log_interval == 0:
            accuracy = 100. * correct / total
            print(f'Train Epoch: {epoch} [{batch_idx * len(data)}/{len(train_loader.dataset)} '
                  f'({100. * batch_idx / len(train_loader):.0f}%)]\t'
                  f'Loss: {loss.item():.6f}\tAccuracy: {accuracy:.2f}%')
    
    final_train_accuracy = 100. * correct / total
    avg_train_loss = train_loss / len(train_loader)
    
    return avg_train_loss, final_train_accuracy

def validate(model, device, val_loader):
    model.eval()
    val_loss = 0
    correct = 0
    
    with torch.no_grad():
        for data, target in val_loader:
            data, target = data.to(device), target.to(device)
            output = model(data)
            val_loss += F.cross_entropy(output, target, reduction='sum').item()
            pred = output.argmax(dim=1, keepdim=True)
            correct += pred.eq(target.view_as(pred)).sum().item()
    
    val_loss /= len(val_loader.dataset)
    val_accuracy = 100. * correct / len(val_loader.dataset)
    
    return val_loss, val_accuracy

def test(model, device, test_loader):
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
    torch.manual_seed(42)
    np.random.seed(42)
    
    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    print(f"Using device: {device}")
    
    model = create_final_model()
    model.to(device)
    
    train_loader, val_loader, test_loader = get_data_loaders(batch_size=128)
    
    # Optimized settings
    optimizer = optim.Adam(model.parameters(), lr=0.001, weight_decay=1e-4)
    scheduler = optim.lr_scheduler.StepLR(optimizer, step_size=7, gamma=0.7)
    
    best_val_accuracy = 0
    best_model_state = None
    patience_counter = 0
    max_epochs = 20
    patience = 5
    
    print("="*60)
    print("STARTING FINAL MNIST TRAINING")
    print("="*60)
    
    start_time = time.time()
    
    for epoch in range(1, max_epochs + 1):
        print(f"\nEpoch {epoch}/{max_epochs}")
        print("-" * 40)
        
        train_loss, train_accuracy = train_epoch(model, device, train_loader, optimizer, epoch)
        val_loss, val_accuracy = validate(model, device, val_loader)
        
        scheduler.step()
        
        print(f'Train Loss: {train_loss:.4f}, Train Accuracy: {train_accuracy:.2f}%')
        print(f'Val Loss: {val_loss:.4f}, Val Accuracy: {val_accuracy:.2f}%')
        
        if val_accuracy > best_val_accuracy:
            best_val_accuracy = val_accuracy
            best_model_state = model.state_dict().copy()
            patience_counter = 0
            print(f'✓ New best validation accuracy: {val_accuracy:.2f}%')
        else:
            patience_counter += 1
            print(f'No improvement for {patience_counter} epochs')
        
        if patience_counter >= patience:
            print(f'\nEarly stopping triggered after {patience} epochs without improvement')
            break
        
        if val_accuracy >= 99.4:
            print(f'\n🎉 Target accuracy of 99.4% reached!')
            break
    
    end_time = time.time()
    training_time = end_time - start_time
    
    if best_model_state is not None:
        model.load_state_dict(best_model_state)
        print(f'\nLoaded best model with validation accuracy: {best_val_accuracy:.2f}%')
    
    test_loss, test_accuracy = test(model, device, test_loader)
    
    print("="*60)
    print("TRAINING COMPLETED")
    print("="*60)
    print(f"Training Time: {training_time:.2f} seconds")
    print(f"Epochs Trained: {epoch}")
    print(f"Best Val Accuracy: {best_val_accuracy:.2f}%")
    print(f"Final Test Accuracy: {test_accuracy:.2f}%")
    print(f"Model Parameters: {model.count_parameters():,}")
    
    # Check requirements
    print("\n" + "="*60)
    print("REQUIREMENTS CHECK")
    print("="*60)
    
    param_count = model.count_parameters()
    param_check = param_count < 20000
    print(f"Parameters < 20,000: {'✅ PASS' if param_check else '❌ FAIL'} ({param_count:,})")
    
    accuracy_check = best_val_accuracy >= 99.4
    print(f"Val Accuracy ≥ 99.4%: {'✅ PASS' if accuracy_check else '❌ FAIL'} ({best_val_accuracy:.2f}%)")
    
    epochs_check = epoch <= 20
    print(f"Epochs ≤ 20: {'✅ PASS' if epochs_check else '❌ FAIL'} ({epoch})")
    
    return model, {
        'best_val_accuracy': best_val_accuracy,
        'final_test_accuracy': test_accuracy,
        'parameters': param_count,
        'training_time': training_time,
        'epochs_trained': epoch
    }

if __name__ == "__main__":
    model, results = main()