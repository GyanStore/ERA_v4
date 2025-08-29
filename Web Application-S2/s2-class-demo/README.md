# CNN Receptive Field Designer

A Flask-based web application for designing and analyzing CNN architectures with real-time receptive field calculations.

## Features

- **Input Image Settings**: Configure height, width, and channels
- **Layer Management**: Add Conv2D, MaxPool2D, AvgPool2D, and Fully Connected layers
- **Real-time Calculations**: See output shapes, receptive fields, and jumps update instantly
- **Export/Import**: Save and load architectures as JSON
- **Example Networks**: Pre-built example architectures to learn from

## Installation

1. **Install Python dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

2. **Run the application:**
   ```bash
   python app.py
   ```

3. **Open in browser:**
   Navigate to `http://127.0.0.1:5000`

## How to Use

1. **Set Input Image**: Configure the initial image dimensions (H×W×C)
2. **Add Layers**: Choose layer type and parameters (kernel, stride, padding, dilation)
3. **Watch Results**: See how each layer affects output shape, receptive field, and jump
4. **Experiment**: Try different configurations and see immediate feedback
5. **Save/Load**: Export your designs as JSON or load existing ones

## Understanding the Math

- **Effective Kernel**: `k_eff = d × (k - 1) + 1`
- **Output Size**: `n_out = floor((n_in + 2p - k_eff) / s) + 1`
- **Receptive Field**: `RF_out = RF_in + (k_eff - 1) × jump_in`
- **Jump**: `jump_out = jump_in × s`

## 🧠 CNN Fundamentals Explained

### What is a Receptive Field?
The **receptive field** is the area of the input image that each output pixel "sees" or "cares about". Think of it like this:
- **Input pixel**: Can only see itself (1×1 receptive field)
- **After Conv3×3**: Each output pixel sees a 3×3 area of the input
- **After multiple layers**: The receptive field grows, allowing later layers to see larger patterns

### Key Parameters Explained

#### 1. **Kernel (k)**
- **What it is**: The size of the "window" that slides over the image
- **Examples**: 
  - `k=3`: 3×3 window (9 pixels)
  - `k=5`: 5×5 window (25 pixels)
- **Effect**: Larger kernels capture larger patterns but require more computation

#### 2. **Stride (s)**
- **What it is**: How many pixels the kernel "jumps" each time it moves
- **Examples**:
  - `s=1`: Kernel moves 1 pixel at a time (dense coverage)
  - `s=2`: Kernel jumps 2 pixels (reduces output size, increases receptive field)
- **Effect**: Higher stride = smaller output, larger receptive field

#### 3. **Padding (p)**
- **What it is**: Extra pixels added around the input image
- **Examples**:
  - `p=0`: No padding (output shrinks)
  - `p=1`: Add 1 pixel border (maintains size with k=3)
  - `p=2**: Add 2 pixel border (maintains size with k=5)
- **Effect**: Padding controls output size and receptive field growth

#### 4. **Dilation (d)**
- **What it is**: Spacing between kernel elements
- **Examples**:
  - `d=1`: Normal kernel (elements are adjacent)
  - `d=2`: Kernel elements are 2 pixels apart (larger effective coverage)
- **Effect**: Dilation increases receptive field without increasing parameters

### Mathematical Formulas

#### **Effective Kernel Size**
```
k_effective = d × (k - 1) + 1
```

#### **Output Size**
```
H_out = floor((H_in + 2p - k_effective) / s) + 1
W_out = floor((W_in + 2p - k_effective) / s) + 1
```

#### **Receptive Field Growth**
```
RF_out = RF_in + (k_effective - 1) × jump_in
```

#### **Jump (Effective Stride)**
```
jump_out = jump_in × s
```

### How Architecture Changes with More Layers

#### **Layer 1: Conv3×3, s=1, p=1**
- Input: 224×224×3
- Output: 224×224×64
- RF: 3×3
- Jump: 1×1

#### **Layer 2: Conv3×3, s=1, p=1**
- Input: 224×224×64 (from Layer 1)
- Output: 224×224×64
- RF: 3 + (3-1)×1 = 5×5
- Jump: 1×1 = 1×1

#### **Layer 3: MaxPool2×2, s=2, p=0**
- Input: 224×224×64
- Output: 112×112×64
- RF: 5 + (2-1)×1 = 6×6
- Jump: 1×2 = 2×2

#### **Layer 4: Conv3×3, s=1, p=1**
- Input: 112×112×64
- Output: 112×112×128
- RF: 6 + (3-1)×2 = 10×10
- Jump: 2×1 = 2×2

### What Happens to the Image?

#### **Conv3×3, s=1, p=1**
- **Size**: Stays 224×224 (padding maintains size)
- **Channels**: Changes from 3 to 64
- **Receptive field**: Each output pixel sees 3×3 input area
- **Pattern detection**: Learns to detect edges, textures, simple shapes

#### **MaxPool2×2, s=2, p=0**
- **Size**: Reduces to 112×112 (downsampling)
- **Channels**: Stays 64
- **Receptive field**: Grows to 6×6
- **Effect**: Makes the network more robust to small translations

#### **Conv3×3, s=1, p=1 (after pooling)**
- **Size**: Stays 112×112
- **Channels**: Changes to 128
- **Receptive field**: Grows to 10×10
- **Pattern detection**: Can now detect larger, more complex patterns

### Why This Matters

1. **Feature Hierarchy**: Early layers detect simple features (edges), later layers detect complex patterns (faces, objects)
2. **Computational Efficiency**: Pooling reduces computation while increasing receptive field
3. **Translation Invariance**: Larger receptive fields make the network robust to object position changes
4. **Parameter Efficiency**: Small kernels with many layers are more efficient than large kernels

### Practical Examples to Try

1. **Upload an image** (any size)
2. **Add Conv3×3, s=1, p=1** → See how size stays the same
3. **Add MaxPool2×2, s=2, p=0** → See how size halves and RF grows
4. **Add another Conv3×3, s=1, p=1** → See how RF grows significantly
5. **Experiment with different parameters** to understand the relationships

## Example Architecture

Try the "Load Example" button to see a VGG-style network with:
- Conv3×3 layers with padding
- MaxPool2×2 for downsampling
- Fully connected layers at the end

## Tips

- If you see "⚠️ output <= 0", your kernel/padding/stride combination is invalid
- Receptive field grows with each layer, showing how much of the input each output pixel "sees"
- Jump (effective stride) shows how much the input "jumps" between output pixels 