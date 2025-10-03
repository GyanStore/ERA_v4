#!/usr/bin/env python3
"""
S7 Assignment - Quick Start Script
==================================

This script provides a simple interface to run the assignment components.
"""

import sys
import subprocess
import os

def run_command(cmd, description):
    """Run a command and handle errors"""
    print(f"\n{'='*60}")
    print(f"Running: {description}")
    print(f"Command: {cmd}")
    print(f"{'='*60}")
    
    try:
        result = subprocess.run(cmd, shell=True, check=True, capture_output=False)
        print(f"✅ {description} completed successfully!")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ {description} failed with exit code {e.returncode}")
        return False
    except Exception as e:
        print(f"❌ {description} failed with error: {e}")
        return False

def main():
    """Main function to run assignment components"""
    
    print("🚀 S7 Assignment - CIFAR-10 CNN")
    print("=" * 50)
    print("Choose an option:")
    print("1. Test model architecture (quick)")
    print("2. Test model architecture (comprehensive)")
    print("3. Install dependencies")
    print("4. Train model")
    print("5. Run all tests and train")
    print("6. Show model summary")
    print("0. Exit")
    
    while True:
        try:
            choice = input("\nEnter your choice (0-6): ").strip()
            
            if choice == "0":
                print("👋 Goodbye!")
                sys.exit(0)
                
            elif choice == "1":
                print("\n🧪 Running quick model test...")
                success = run_command("python simple_test.py", "Quick Model Test")
                if success:
                    print("\n✅ Model architecture validated!")
                    print("💡 Ready to train with: python train.py")
                
            elif choice == "2":
                print("\n🧪 Running comprehensive model test...")
                success = run_command("python test_model.py", "Comprehensive Model Test")
                if success:
                    print("\n✅ All tests passed!")
                else:
                    print("\n⚠️  Some tests failed. Check dependencies.")
                
            elif choice == "3":
                print("\n📦 Installing dependencies...")
                success = run_command("pip install -r requirements.txt", "Dependency Installation")
                if success:
                    print("\n✅ Dependencies installed!")
                
            elif choice == "4":
                print("\n🏋️ Starting model training...")
                print("⚠️  This will take 15-20 minutes to reach 85% accuracy")
                confirm = input("Continue? (y/N): ").strip().lower()
                if confirm in ['y', 'yes']:
                    success = run_command("python train.py", "Model Training")
                    if success:
                        print("\n🎉 Training completed!")
                else:
                    print("Training cancelled.")
                
            elif choice == "5":
                print("\n🔄 Running complete workflow...")
                
                # Install dependencies
                print("\n📦 Step 1: Installing dependencies...")
                if not run_command("pip install -r requirements.txt", "Dependency Installation"):
                    print("❌ Failed to install dependencies. Continuing anyway...")
                
                # Test model
                print("\n🧪 Step 2: Testing model architecture...")
                if not run_command("python simple_test.py", "Model Architecture Test"):
                    print("❌ Model test failed. Aborting.")
                    continue
                
                # Train model
                print("\n🏋️ Step 3: Training model...")
                print("⚠️  This will take 15-20 minutes")
                confirm = input("Continue with training? (y/N): ").strip().lower()
                if confirm in ['y', 'yes']:
                    run_command("python train.py", "Model Training")
                else:
                    print("Training skipped.")
                
            elif choice == "6":
                print("\n📊 Showing model summary...")
                success = run_command("python -c \"from model import *; model = CIFAR10Net(); get_model_summary(model)\"", "Model Summary")
                
            else:
                print("❌ Invalid choice. Please enter 0-6.")
                
        except KeyboardInterrupt:
            print("\n\n👋 Interrupted by user. Goodbye!")
            sys.exit(0)
        except Exception as e:
            print(f"❌ Error: {e}")

if __name__ == "__main__":
    # Change to script directory
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    main()
