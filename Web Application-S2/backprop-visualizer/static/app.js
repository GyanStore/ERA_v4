// Backpropagation Visualizer Frontend
class BackpropVisualizer {
    constructor() {
        console.log('BackpropVisualizer constructor called');
        this.trainingSteps = 0;
        this.lossHistory = [];
        this.lossChart = null;
        this.networkInitialized = false;
        this.selectedNeurons = [];
        this.animationId = null;
        this.connectionAnimPhase = 0;
        this.tooltipEl = null;
        this.autoTraining = { running: false, remaining: 0, handle: null };
        
        console.log('Initializing event listeners...');
        this.initializeEventListeners();
        console.log('Initializing loss chart...');
        this.initializeLossChart();
        console.log('Initializing sidebar updates...');
        this.initializeSidebarUpdates();
        this.initializeTooltip();
        console.log('BackpropVisualizer initialization complete');
    }
    
    initializeEventListeners() {
        console.log('Setting up event listeners...');
        
        // Network initialization
        const initBtn = document.getElementById('initializeBtn');
        if (initBtn) {
            console.log('Found initialize button, adding event listener');
            initBtn.addEventListener('click', () => {
                console.log('Initialize button clicked from event listener');
                this.initializeNetwork();
            });
        } else {
            console.error('Initialize button not found!');
        }
        
        // Training
        const trainBtn = document.getElementById('trainBtn');
        if (trainBtn) {
            console.log('Found train button, adding event listener');
            trainBtn.addEventListener('click', () => this.trainStep());
        } else {
            console.error('Train button not found!');
        }
        
        // Reset
        const resetBtn = document.getElementById('resetBtn');
        if (resetBtn) {
            console.log('Found reset button, adding event listener');
            resetBtn.addEventListener('click', () => this.resetNetwork());
        } else {
            console.error('Reset button not found!');
        }
        
        // Real-time validation
        const layerSizesInput = document.getElementById('layerSizes');
        if (layerSizesInput) {
            console.log('Found layer sizes input, adding event listener');
            layerSizesInput.addEventListener('input', () => this.validateLayerSizes());
        } else {
            console.error('Layer sizes input not found!');
        }
        
        const trainingXInput = document.getElementById('trainingX');
        if (trainingXInput) {
            console.log('Found training X input, adding event listener');
            trainingXInput.addEventListener('input', () => this.validateTrainingData());
        } else {
            console.error('Training X input not found!');
        }
        
        const trainingYInput = document.getElementById('trainingY');
        if (trainingYInput) {
            console.log('Found training Y input, adding event listener');
            trainingYInput.addEventListener('input', () => this.validateTrainingData());
        } else {
            console.error('Training Y input not found!');
        }
        
        // Add keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                switch(e.key) {
                    case 'i':
                        e.preventDefault();
                        console.log('Ctrl+I pressed, clicking initialize button');
                        document.getElementById('initializeBtn').click();
                        break;
                    case 't':
                        e.preventDefault();
                        document.getElementById('trainBtn').click();
                        break;
                    case 'r':
                        e.preventDefault();
                        document.getElementById('resetBtn').click();
                        break;
                }
            }
        });
        
        console.log('Event listeners setup complete');
        
        // Initialize collapsible sections
        this.initializeCollapsibleSections();
        
        // Initialize layer architecture features
        this.initializeLayerArchitecture();
        
        // Initialize text learning functionality
        this.initializeTextLearning();
        
        // Initialize example buttons
        this.initializeExampleButtons();
        this.initializeAutoTrain();
    }
    
    initializeCollapsibleSections() {
        // Mathematical Insights toggle
        const mathInsightsToggle = document.getElementById('mathInsightsToggle');
        const mathInsightsContent = document.getElementById('mathInsightsContent');
        const mathInsightsIcon = document.getElementById('mathInsightsIcon');
        
        if (mathInsightsToggle && mathInsightsContent && mathInsightsIcon) {
            mathInsightsToggle.addEventListener('click', () => {
                this.toggleCollapsibleSection(mathInsightsContent, mathInsightsIcon, mathInsightsToggle, 'Collapse', 'Expand');
            });
            
            // Set initial state (collapsed)
            this.setCollapsibleCollapsed(mathInsightsContent, mathInsightsIcon, mathInsightsToggle, 'Expand');
        }
        
        // Training Details toggle
        const trainingDetailsToggle = document.getElementById('trainingDetailsToggle');
        const trainingDetailsContent = document.getElementById('trainingDetailsContent');
        const trainingDetailsIcon = document.getElementById('trainingDetailsIcon');
        
        if (trainingDetailsToggle && trainingDetailsContent && trainingDetailsIcon) {
            trainingDetailsToggle.addEventListener('click', () => {
                this.toggleCollapsibleSection(trainingDetailsContent, trainingDetailsIcon, trainingDetailsToggle, 'Collapse', 'Expand');
            });
            
            // Set initial state (collapsed)
            this.setCollapsibleCollapsed(trainingDetailsContent, trainingDetailsIcon, trainingDetailsToggle, 'Expand');
        }
        
        // Examples toggle in sidebar
        const examplesToggle = document.getElementById('examplesToggle');
        const examplesContent = document.getElementById('examplesContent');
        const examplesIcon = document.getElementById('examplesIcon');
        
        if (examplesToggle && examplesContent && examplesIcon) {
            examplesToggle.addEventListener('click', () => {
                this.toggleCollapsibleSection(examplesContent, examplesIcon, examplesToggle, 'Collapse', 'Expand');
            });
            
            // Set initial state (expanded) - so users can see examples immediately
            this.setCollapsibleExpanded(examplesContent, examplesIcon, examplesToggle, 'Collapse');
        }
    }
    
    toggleCollapsibleSection(contentElement, iconElement, toggleButton, collapseText, expandText) {
        const isCollapsed = contentElement.style.maxHeight === '0px';
        
        if (isCollapsed) {
            // Expand
            this.setCollapsibleExpanded(contentElement, iconElement, toggleButton, collapseText);
        } else {
            // Collapse
            this.setCollapsibleCollapsed(contentElement, iconElement, toggleButton, expandText);
        }
    }
    
    setCollapsibleExpanded(contentElement, iconElement, toggleButton, collapseText) {
        // Ensure content has a minimum height for smooth animation
        const minHeight = Math.max(contentElement.scrollHeight, 100);
        contentElement.style.maxHeight = minHeight + 'px';
        iconElement.style.transform = 'rotate(90deg)';
        toggleButton.querySelector('span').textContent = collapseText;
        contentElement.classList.add('expanded');
        contentElement.classList.remove('collapsed');
    }
    
    setCollapsibleCollapsed(contentElement, iconElement, toggleButton, expandText) {
        contentElement.style.maxHeight = '0px';
        iconElement.style.transform = 'rotate(0deg)';
        toggleButton.querySelector('span').textContent = expandText;
        contentElement.classList.add('collapsed');
        contentElement.classList.remove('expanded');
    }
    
    // Method to refresh collapsible sections when content changes
    refreshCollapsibleSections() {
        const mathInsightsContent = document.getElementById('mathInsightsContent');
        const trainingDetailsContent = document.getElementById('trainingDetailsContent');
        const examplesContent = document.getElementById('examplesContent');
        
        // Refresh max-height for expanded sections
        if (mathInsightsContent && mathInsightsContent.classList.contains('expanded')) {
            mathInsightsContent.style.maxHeight = mathInsightsContent.scrollHeight + 'px';
        }
        
        if (trainingDetailsContent && trainingDetailsContent.classList.contains('expanded')) {
            trainingDetailsContent.style.maxHeight = trainingDetailsContent.scrollHeight + 'px';
        }
        
        if (examplesContent && examplesContent.classList.contains('expanded')) {
            examplesContent.style.maxHeight = examplesContent.scrollHeight + 'px';
        }
    }
    
    initializeSidebarUpdates() {
        // Update sidebar stats periodically
        setInterval(() => {
            this.updateSidebarStats();
        }, 1000);
    }

    initializeAutoTrain() {
        const autoBtn = document.getElementById('autoTrainBtn');
        const stepsInput = document.getElementById('autoSteps');
        if (!autoBtn || !stepsInput) return;

        autoBtn.addEventListener('click', async () => {
            if (!this.networkInitialized) {
                this.showNotification('Initialize the network first', 'warning');
                return;
            }

            if (!this.autoTraining.running) {
                const n = Math.max(1, Math.min(1000, parseInt(stepsInput.value || '0')));
                this.autoTraining.running = true;
                this.autoTraining.remaining = n;
                autoBtn.innerHTML = '<i class="fas fa-stop mr-1"></i>Stop';
                autoBtn.classList.remove('bg-green-600');
                autoBtn.classList.add('bg-red-600');

                const loop = async () => {
                    if (!this.autoTraining.running) return;
                    if (this.autoTraining.remaining <= 0) {
                        this.autoTraining.running = false;
                        autoBtn.innerHTML = '<i class="fas fa-infinity mr-1"></i>Auto';
                        autoBtn.classList.remove('bg-red-600');
                        autoBtn.classList.add('bg-green-600');
                        return;
                    }
                    await this.trainStep();
                    this.autoTraining.remaining -= 1;
                    this.autoTraining.handle = requestAnimationFrame(loop);
                };
                this.autoTraining.handle = requestAnimationFrame(loop);
            } else {
                this.autoTraining.running = false;
                if (this.autoTraining.handle) cancelAnimationFrame(this.autoTraining.handle);
                autoBtn.innerHTML = '<i class="fas fa-infinity mr-1"></i>Auto';
                autoBtn.classList.remove('bg-red-600');
                autoBtn.classList.add('bg-green-600');
            }
        });
    }
    
    updateSidebarStats() {
        const sidebarParams = document.getElementById('sidebarParams');
        const sidebarLoss = document.getElementById('sidebarLoss');
        const sidebarSteps = document.getElementById('sidebarSteps');
        
        if (sidebarParams) {
            const totalParams = document.getElementById('totalParams');
            if (totalParams) {
                sidebarParams.textContent = totalParams.textContent;
            }
        }
        
        if (sidebarLoss) {
            const currentLoss = document.getElementById('currentLoss');
            if (currentLoss) {
                sidebarLoss.textContent = currentLoss.textContent;
            }
        }
        
        if (sidebarSteps) {
            sidebarSteps.textContent = this.trainingSteps;
            console.log('Sidebar steps updated to:', this.trainingSteps);
        } else {
            console.log('Sidebar steps element not found');
        }
    }
    
    initializeLossChart() {
        const ctx = document.getElementById('lossChart').getContext('2d');
        this.lossChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'Training Loss',
                    data: [],
                    borderColor: 'rgb(59, 130, 246)',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    tension: 0.4,
                    fill: true,
                    pointRadius: 4,
                    pointHoverRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Loss',
                            color: '#374151'
                        },
                        grid: {
                            color: 'rgba(156, 163, 175, 0.2)'
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Training Step',
                            color: '#374151'
                        },
                        grid: {
                            color: 'rgba(156, 163, 175, 0.2)'
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        titleColor: 'white',
                        bodyColor: 'white',
                        borderColor: 'rgba(59, 130, 246, 0.5)',
                        borderWidth: 1
                    }
                },
                interaction: {
                    intersect: false,
                    mode: 'index'
                }
            }
        });
    }
    
    async initializeNetwork() {
        console.log('initializeNetwork called');
        
        const layerSizes = document.getElementById('layerSizes').value
            .split(',')
            .map(s => parseInt(s.trim()))
            .filter(n => !isNaN(n));
        
        console.log('Layer sizes:', layerSizes);
        
        const learningRate = parseFloat(document.getElementById('learningRate').value);
        const activation = document.getElementById('activationFunction').value;
        
        console.log('Learning rate:', learningRate, 'Activation:', activation);
        
        if (layerSizes.length < 2) {
            console.log('Invalid layer sizes');
            this.showNotification('Please enter valid layer sizes (e.g., 2,3,1)', 'error');
            return;
        }
        
        // Validate dimensions before initializing
        console.log('Validating dimensions...');
        if (!this.validateDataDimensions()) {
            console.log('Dimension validation failed');
            this.showNotification('Please fix dimension issues before initializing the network', 'warning');
            return;
        }
        
        console.log('Dimensions validated, proceeding with initialization...');
        
        // Show loading state
        const btn = document.getElementById('initializeBtn');
        const originalText = btn.innerHTML;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Initializing...';
        btn.disabled = true;
        
        try {
            console.log('Sending request to /api/initialize');
            const response = await fetch('/api/initialize', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    layer_sizes: layerSizes,
                    learning_rate: learningRate,
                    activation: activation
                })
            });
            
            console.log('Response received:', response);
            const data = await response.json();
            console.log('Response data:', data);
            
            if (data.success) {
                console.log('Network initialized successfully');
                this.networkInitialized = true;
                this.trainingSteps = 0;
                this.lossHistory = [];
                this.updateNetworkStatus('Network initialized successfully', 'success');
                this.updateTotalParams(data.total_params);
                this.visualizeNetwork(layerSizes);
                this.updateLossChart();
                this.clearTrainingInfo();
                this.showNotification('Network initialized successfully!', 'success');
                
                // Add success animation
                document.getElementById('networkVisualization').classList.add('neuron-glow');
                setTimeout(() => {
                    document.getElementById('networkVisualization').classList.remove('neuron-glow');
                }, 2000);
            } else {
                console.log('Initialization failed:', data.error);
                this.showNotification('Error: ' + data.error, 'error');
            }
        } catch (error) {
            console.error('Error during initialization:', error);
            this.showNotification('Failed to initialize network', 'error');
        } finally {
            // Restore button state
            btn.innerHTML = originalText;
            btn.disabled = false;
        }
    }
    
    async trainStep() {
        if (!this.networkInitialized) {
            this.showNotification('Please initialize the network first', 'warning');
            return;
        }
        
        // Capture button reference at the beginning
        const btn = document.getElementById('trainBtn');
        const originalText = btn.innerHTML;
        
        try {
            const X = JSON.parse(document.getElementById('trainingX').value);
            const y = JSON.parse(document.getElementById('trainingY').value);
            
            // Show loading state
            btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Training...';
            btn.disabled = true;
            
            console.log('Sending training request...');
            const response = await fetch('/api/train', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ X, y })
            });
            
            console.log('Training response received:', response);
            const data = await response.json();
            console.log('Training response data:', data);
            
            if (data.success) {
                console.log('Training step successful, updating UI...');
                console.log('Current training steps before increment:', this.trainingSteps);
                this.trainingSteps++;
                console.log('Training steps after increment:', this.trainingSteps);
                
                if (data.loss !== undefined) {
                    this.lossHistory.push(data.loss);
                    console.log('Loss added to history:', data.loss);
                } else {
                    console.warn('No loss value in response data');
                }
                
                // Update UI elements
                this.updateTrainingMetrics(data.loss || 0);
                this.updateTrainingSteps();
                this.updateLossChart();
                
                // Update training details if available
                if (data.forward_results) {
                    this.displayForwardPass(data.forward_results);
                } else {
                    console.warn('No forward results in response data');
                }
                
                if (data.backward_results) {
                    this.displayBackwardPass(data.backward_results);
                } else {
                    console.warn('No backward results in response data');
                }
                
                // Update network visualization if available
                if (data.network_state && data.network_state.layer_sizes && data.network_state.weights) {
                    this.visualizeNetwork(data.network_state.layer_sizes, data.network_state.weights);
                } else {
                    console.warn('No network state in response data');
                }
                
                // Show success feedback
                this.showNotification(`Training step ${this.trainingSteps} completed! Loss: ${(data.loss || 0).toFixed(6)}`, 'success');
                
                // Add training animation
                btn.classList.add('bg-green-700');
                setTimeout(() => {
                    btn.classList.remove('bg-green-700');
                }, 500);
            } else {
                console.log('Training failed:', data.error);
                this.showNotification('Error: ' + data.error, 'error');
            }
        } catch (error) {
            console.error('Error during training:', error);
            this.showNotification('Failed to train network. Check your input format.', 'error');
        } finally {
            // Restore button state using the captured reference
            console.log('Restoring button state...');
            btn.innerHTML = originalText;
            btn.disabled = false;
        }
    }
    
    async resetNetwork() {
        if (!this.networkInitialized) {
            this.showNotification('Please initialize the network first', 'warning');
            return;
        }
        
        try {
            const response = await fetch('/api/reset', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                }
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.trainingSteps = 0;
                this.lossHistory = [];
                this.updateNetworkStatus('Network weights reset', 'info');
                this.updateTrainingSteps();
                this.updateLossChart();
                this.clearTrainingInfo();
                this.showNotification('Network weights reset successfully!', 'success');
                
                // Refresh network visualization
                const layerSizes = document.getElementById('layerSizes').value
                    .split(',')
                    .map(s => parseInt(s.trim()))
                    .filter(n => !isNaN(n));
                this.visualizeNetwork(layerSizes);
            } else {
                this.showNotification('Error: ' + data.error, 'error');
            }
        } catch (error) {
            console.error('Error:', error);
            this.showNotification('Failed to reset network', 'error');
        }
    }
    
    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg transform transition-all duration-300 translate-x-full`;
        
        // Set colors based on type
        const colors = {
            success: 'bg-green-500 text-white',
            error: 'bg-red-500 text-white',
            warning: 'bg-yellow-500 text-white',
            info: 'bg-blue-500 text-white'
        };
        
        notification.className += ` ${colors[type]}`;
        notification.innerHTML = `
            <div class="flex items-center">
                <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : type === 'warning' ? 'exclamation-triangle' : 'info-circle'} mr-2"></i>
                <span>${message}</span>
                <button class="ml-4 hover:opacity-75" onclick="this.parentElement.parentElement.remove()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // Animate in
        setTimeout(() => {
            notification.classList.remove('translate-x-full');
        }, 100);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            notification.classList.add('translate-x-full');
            setTimeout(() => {
                if (notification.parentElement) {
                    notification.remove();
                }
            }, 300);
        }, 5000);
    }
    
    updateNetworkStatus(message, type = 'info') {
        const statusElement = document.getElementById('networkStatus');
        const statusDot = statusElement.previousElementSibling;
        
        statusElement.textContent = message;
        
        // Update status dot color
        const colors = {
            success: 'bg-green-500',
            error: 'bg-red-500',
            warning: 'bg-yellow-500',
            info: 'bg-blue-500'
        };
        
        statusDot.className = `w-2 h-2 ${colors[type]} rounded-full`;
    }
    
    visualizeNetwork(layerSizes, weights = null) {
        const container = document.getElementById('networkVisualization');
        container.innerHTML = '';
        
        // Create a responsive canvas that fills the container
        const canvas = document.createElement('canvas');
        canvas.style.width = '100%';
        canvas.style.height = '100%';
        canvas.width = container.offsetWidth;
        canvas.height = container.offsetHeight;
        container.appendChild(canvas);
        
        // Store canvas reference for interactions
        this.networkCanvas = canvas;
        this.networkCtx = canvas.getContext('2d');
        this.layerSizes = layerSizes;
        this.weights = weights;
        
        // Add event listeners for interactivity
        this.addNetworkInteractions();
        
        // Start animation loop
        this.startNetworkAnimation();
        
        // Draw the network
        this.drawNetwork(this.networkCtx, layerSizes, weights);
    }
    
    startNetworkAnimation() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        
        const animate = () => {
            if (this.networkCanvas && this.networkCtx && this.layerSizes) {
                this.connectionAnimPhase = (this.connectionAnimPhase + 0.015) % 1;
                this.drawNetwork(this.networkCtx, this.layerSizes, this.weights);
            }
            this.animationId = requestAnimationFrame(animate);
        };
        
        this.animationId = requestAnimationFrame(animate);
    }
    
    stopNetworkAnimation() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }
    
    addNetworkInteractions() {
        if (!this.networkCanvas) return;
        
        this.networkCanvas.addEventListener('mousemove', (e) => {
            this.handleNetworkHover(e);
        });
        
        this.networkCanvas.addEventListener('click', (e) => {
            this.handleNetworkClick(e);
        });
        
        this.networkCanvas.addEventListener('mouseleave', () => {
            this.clearHighlights();
            this.drawNetwork(this.networkCtx, this.layerSizes, this.weights);
            this.hideNeuronTooltip();
        });
        
        // Add touch support for mobile
        this.networkCanvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            const rect = this.networkCanvas.getBoundingClientRect();
            const x = touch.clientX - rect.left;
            const y = touch.clientY - rect.top;
            
            const neuron = this.findNeuronAt(x, y);
            if (neuron) {
                this.toggleNeuronSelection(neuron);
            }
        });
    }
    
    handleNetworkHover(e) {
        const rect = this.networkCanvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const neuron = this.findNeuronAt(x, y);
        if (neuron) {
            this.highlightConnections(neuron);
            this.showNeuronTooltip(neuron, e.clientX, e.clientY);
        } else {
            this.clearHighlights();
            this.hideNeuronTooltip();
            this.drawNetwork(this.networkCtx, this.layerSizes, this.weights);
        }
    }
    
    handleNetworkClick(e) {
        const rect = this.networkCanvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const neuron = this.findNeuronAt(x, y);
        if (neuron) {
            this.toggleNeuronSelection(neuron);
        }
    }
    
    findNeuronAt(x, y) {
        const canvas = this.networkCanvas;
        const width = canvas.width;
        const height = canvas.height;
        
        // Improved spacing for many layers
        const layerSpacing = Math.min(width / (this.layerSizes.length + 1), 160);
        const maxNeurons = Math.max(...this.layerSizes);
        const neuronSpacing = Math.min(height / (maxNeurons + 1), 42);
        
        // Calculate starting position to center the network
        const totalNetworkWidth = (this.layerSizes.length - 1) * layerSpacing;
        const startX = (width - totalNetworkWidth) / 2;
        
        for (let layer = 0; layer < this.layerSizes.length; layer++) {
            const layerX = startX + layer * layerSpacing;
            const neuronsInLayer = this.layerSizes[layer];
            const startY = (height - (neuronsInLayer - 1) * neuronSpacing) / 2;
            
            for (let neuron = 0; neuron < neuronsInLayer; neuron++) {
                const neuronY = startY + neuron * neuronSpacing;
                const neuronRadius = Math.min(14, Math.max(6, 18 - this.layerSizes.length * 0.6 - maxNeurons * 0.1));
                const distance = Math.sqrt((x - layerX) ** 2 + (y - neuronY) ** 2);
                
                if (distance <= neuronRadius + 4) { // Add small buffer for hover
                    return { layer, neuron, x: layerX, y: neuronY };
                }
            }
        }
        return null;
    }
    
    highlightConnections(neuron) {
        this.drawNetwork(this.networkCtx, this.layerSizes, this.weights, neuron);
    }
    
    clearHighlights() {
        this.selectedNeurons = [];
        this.drawNetwork(this.networkCtx, this.layerSizes, this.weights);
    }
    
    toggleNeuronSelection(neuron) {
        if (!this.selectedNeurons) this.selectedNeurons = [];
        
        const index = this.selectedNeurons.findIndex(n => n.layer === neuron.layer && n.neuron === neuron.neuron);
        if (index > -1) {
            this.selectedNeurons.splice(index, 1);
        } else {
            this.selectedNeurons.push(neuron);
        }
        
        this.drawNetwork(this.networkCtx, this.layerSizes, this.weights);
    }
    
    drawNetwork(ctx, layerSizes, weights = null, hoveredNeuron = null) {
        const canvas = ctx.canvas;
        const width = canvas.width;
        const height = canvas.height;
        
        // Clear canvas
        ctx.clearRect(0, 0, width, height);
        
        // Improved spacing for many layers
        const layerSpacing = Math.min(width / (layerSizes.length + 1), 160); // allow a bit more spacing
        const maxNeurons = Math.max(...layerSizes);
        const neuronSpacing = Math.min(height / (maxNeurons + 1), 42); // slightly more spacing
        
        // Calculate starting position to center the network
        const totalNetworkWidth = (layerSizes.length - 1) * layerSpacing;
        const startX = (width - totalNetworkWidth) / 2;
        
        // Draw connections first (behind neurons)
        this.drawConnections(ctx, layerSizes, weights, layerSpacing, neuronSpacing, height, hoveredNeuron, startX);
        
        // Draw neurons on top
        this.drawNeurons(ctx, layerSizes, layerSpacing, neuronSpacing, height, hoveredNeuron, startX);
        
        // Draw layer labels
        this.drawLayerLabels(ctx, layerSizes, layerSpacing, height, startX);
    }
    
    drawConnections(ctx, layerSizes, weights, layerSpacing, neuronSpacing, height, hoveredNeuron, startX) {
        if (!weights) return;
        
        for (let layer = 0; layer < layerSizes.length - 1; layer++) {
            const x = startX + layer * layerSpacing;
            const nextX = startX + (layer + 1) * layerSpacing;
            const neuronsInLayer = layerSizes[layer];
            const nextLayerSize = layerSizes[layer + 1];
            const startY = (height - (neuronsInLayer - 1) * neuronSpacing) / 2;
            const nextStartY = (height - (nextLayerSize - 1) * neuronSpacing) / 2;
            
            for (let fromNeuron = 0; fromNeuron < neuronsInLayer; fromNeuron++) {
                for (let toNeuron = 0; toNeuron < nextLayerSize; toNeuron++) {
                    const fromY = startY + fromNeuron * neuronSpacing;
                    const toY = nextStartY + toNeuron * neuronSpacing;
                    
                    // Check if this connection should be highlighted
                    const isHighlighted = hoveredNeuron && (
                        (hoveredNeuron.layer === layer && hoveredNeuron.neuron === fromNeuron) ||
                        (hoveredNeuron.layer === layer + 1 && hoveredNeuron.neuron === toNeuron)
                    );
                    
                    // Connection line
                    ctx.beginPath();
                    ctx.moveTo(x + 15, fromY);
                    ctx.lineTo(nextX - 15, toY);
                    
                    // Enhanced styling based on weight and highlight
                    if (weights[layer]) {
                        const weight = weights[layer][toNeuron][fromNeuron];
                        const intensity = Math.min(Math.abs(weight) * 2.5, 1);
                        const baseAlpha = isHighlighted ? 1 : 0.6;
                        if (isHighlighted) {
                            ctx.strokeStyle = '#F59E0B';
                            ctx.lineWidth = 3;
                            ctx.shadowColor = '#F59E0B';
                            ctx.shadowBlur = 10;
                        } else {
                            ctx.strokeStyle = weight > 0 ? 
                                `rgba(34, 197, 94, ${(intensity * baseAlpha).toFixed(3)})` : 
                                `rgba(239, 68, 68, ${(intensity * baseAlpha).toFixed(3)})`;
                            ctx.lineWidth = Math.max(1, 0.8 + intensity * 1.8);
                            ctx.shadowBlur = 0;
                        }
                    } else {
                        ctx.strokeStyle = isHighlighted ? '#F59E0B' : '#E5E7EB';
                        ctx.lineWidth = isHighlighted ? 3 : 1;
                        ctx.shadowBlur = isHighlighted ? 10 : 0;
                    }
                    
                    ctx.stroke();
                    ctx.shadowBlur = 0;

                    // Flowing dot animation along each connection
                    if (weights[layer]) {
                        const weight = weights[layer][toNeuron][fromNeuron];
                        const t = (this.connectionAnimPhase + layer * 0.07 + toNeuron * 0.03 + fromNeuron * 0.02) % 1;
                        const dotX = (1 - t) * (x + 15) + t * (nextX - 15);
                        const dotY = (1 - t) * fromY + t * toY;
                        ctx.beginPath();
                        ctx.arc(dotX, dotY, 2, 0, Math.PI * 2);
                        ctx.fillStyle = weight > 0 ? 'rgba(34, 197, 94, 0.9)' : 'rgba(239, 68, 68, 0.9)';
                        ctx.fill();
                    }
                }
            }
        }
    }
    
    drawNeurons(ctx, layerSizes, layerSpacing, neuronSpacing, height, hoveredNeuron, startX) {
        for (let layer = 0; layer < layerSizes.length; layer++) {
            const x = startX + layer * layerSpacing;
            const neuronsInLayer = layerSizes[layer];
            const startY = (height - (neuronsInLayer - 1) * neuronSpacing) / 2;
            
            for (let neuron = 0; neuron < neuronsInLayer; neuron++) {
                const y = startY + neuron * neuronSpacing;
                
                // Check if this neuron is hovered or selected
                const isHovered = hoveredNeuron && hoveredNeuron.layer === layer && hoveredNeuron.neuron === neuron;
                const isSelected = this.selectedNeurons && this.selectedNeurons.some(n => n.layer === layer && n.neuron === neuron);
                
                // Neuron circle with cleaner, smaller styling
                const maxNeurons = Math.max(...layerSizes);
                const neuronRadius = Math.min(14, Math.max(6, 18 - layerSizes.length * 0.6 - maxNeurons * 0.1)); // smaller & responsive
                ctx.beginPath();
                ctx.arc(x, y, neuronRadius, 0, 2 * Math.PI);
                
                // Color based on layer type
                let fillColor, strokeColor, strokeWidth;
                if (layer === 0) {
                    fillColor = isHovered ? '#60A5FA' : '#3B82F6';
                    strokeColor = isSelected ? '#F59E0B' : '#1E40AF';
                    strokeWidth = isSelected ? 3 : 1.5;
                } else if (layer === layerSizes.length - 1) {
                    fillColor = isHovered ? '#34D399' : '#10B981';
                    strokeColor = isSelected ? '#F59E0B' : '#059669';
                    strokeWidth = isSelected ? 3 : 1.5;
                } else {
                    fillColor = isHovered ? '#A78BFA' : '#8B5CF6';
                    strokeColor = isSelected ? '#F59E0B' : '#7C3AED';
                    strokeWidth = isSelected ? 3 : 1.5;
                }
                
                // Add subtle glow effect for hovered neurons
                if (isHovered) {
                    ctx.shadowColor = fillColor;
                    ctx.shadowBlur = 8;
                }
                
                // Add subtle pulsing animation for all neurons
                const time = Date.now() * 0.001;
                const pulse = Math.sin(time * 2 + layer * 0.5 + neuron * 0.3) * 0.1 + 0.9;
                ctx.globalAlpha = pulse;
                
                ctx.fillStyle = fillColor;
                ctx.fill();
                ctx.strokeStyle = strokeColor;
                ctx.lineWidth = strokeWidth;
                ctx.stroke();
                
                // Reset shadow
                ctx.shadowBlur = 0;
                
                // Neuron label with better contrast and smaller font for many layers
                const fontSize = Math.max(8, Math.min(12, 14 - layerSizes.length * 0.3));
                ctx.fillStyle = 'white';
                ctx.font = `bold ${fontSize}px Arial`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(neuron + 1, x, y);
                
                // Reset global alpha
                ctx.globalAlpha = 1.0;
                
                // Add tooltip-like effect for hovered neurons
                if (isHovered) {
                    this.drawNeuronTooltip(ctx, x, y, layer, neuron);
                }
            }
        }
    }
    
    drawNeuronTooltip(ctx, x, y, layer, neuron) {
        const label = layer === 0 ? 'Input' : 
                     layer === this.layerSizes.length - 1 ? 'Output' : `Hidden ${layer}`;
        
        // Tooltip background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(x + 25, y - 20, 120, 40);
        
        // Tooltip text
        ctx.fillStyle = 'white';
        ctx.font = '12px Arial';
        ctx.textAlign = 'left';
        ctx.fillText(`${label} Neuron`, x + 30, y - 5);
        ctx.fillText(`Position: ${layer + 1}:${neuron + 1}`, x + 30, y + 10);
    }
    
    drawLayerLabels(ctx, layerSizes, layerSpacing, height, startX) {
        ctx.fillStyle = '#374151';
        const fontSize = Math.max(10, Math.min(14, 16 - layerSizes.length * 0.3));
        ctx.font = `bold ${fontSize}px Arial`;
        ctx.textAlign = 'center';
        
        for (let layer = 0; layer < layerSizes.length; layer++) {
            const x = startX + layer * layerSpacing;
            const label = layer === 0 ? 'Input' : 
                         layer === layerSizes.length - 1 ? 'Output' : `Hidden ${layer}`;
            
            // Add subtle background for labels
            ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
            const labelWidth = Math.max(60, fontSize * label.length * 0.6);
            ctx.fillRect(x - labelWidth/2, height - 30, labelWidth, 20);
            
            ctx.fillStyle = '#374151';
            ctx.fillText(label, x, height - 15);
        }
    }
    
    updateNetworkStatus(message) {
        document.getElementById('networkStatus').textContent = message;
    }
    
    updateTotalParams(params) {
        document.getElementById('totalParams').textContent = params;
    }
    
    updateTrainingMetrics(loss) {
        document.getElementById('currentLoss').textContent = loss.toFixed(6);
    }
    
    updateTrainingSteps() {
        console.log('updateTrainingSteps called, current steps:', this.trainingSteps);
        const element = document.getElementById('trainingSteps');
        if (element) {
            element.textContent = this.trainingSteps;
            console.log('Updated training steps display to:', this.trainingSteps);
        } else {
            console.error('trainingSteps element not found!');
        }
    }
    
    updateLossChart() {
        this.lossChart.data.labels = Array.from({length: this.lossHistory.length}, (_, i) => i + 1);
        this.lossChart.data.datasets[0].data = this.lossHistory;
        this.lossChart.update('active');
    }
    
    displayForwardPass(forwardResults) {
        const container = document.getElementById('forwardPassInfo');
        container.innerHTML = '';
        
        const { activations, outputs } = forwardResults;
        
        // Display activations for each layer
        activations.forEach((layer, index) => {
            const layerDiv = document.createElement('div');
            layerDiv.className = 'mb-3 p-2 bg-blue-50 rounded';
            
            const layerName = index === 0 ? 'Input' : 
                             index === activations.length - 1 ? 'Output' : `Hidden ${index}`;
            
            layerDiv.innerHTML = `
                <div class="font-medium text-blue-800">${layerName} Layer</div>
                <div class="text-xs text-blue-600 font-mono">
                    Shape: ${layer.length}×${layer[0].length}<br>
                    Values: ${layer.flat().map(v => v.toFixed(4)).join(', ')}
                </div>
            `;
            
            container.appendChild(layerDiv);
        });
        
        // Display mathematical details
        this.displayForwardMath(forwardResults);
        
        // Refresh collapsible sections to adjust height
        setTimeout(() => this.refreshCollapsibleSections(), 100);
    }
    
    displayForwardMath(forwardResults) {
        const container = document.getElementById('forwardMathInfo');
        container.innerHTML = '';
        
        const { activations, outputs } = forwardResults;
        
        // Show the mathematical steps for forward pass
        for (let i = 0; i < activations.length - 1; i++) {
            const mathDiv = document.createElement('div');
            mathDiv.className = 'mb-3 p-3 bg-blue-50 rounded border-l-4 border-blue-400';
            
            const layerName = i === 0 ? 'Input→Hidden' : 
                             i === activations.length - 2 ? 'Hidden→Output' : `Hidden→Hidden`;
            
            const inputShape = activations[i].length;
            const outputShape = activations[i + 1].length;
            
            mathDiv.innerHTML = `
                <div class="font-medium text-blue-800 mb-2">${layerName} Calculation</div>
                <div class="text-xs text-blue-700 space-y-1">
                    <div><strong>Step 1:</strong> Linear Transformation</div>
                    <div class="font-mono">z = W × x + b</div>
                    <div class="font-mono">z = (${outputShape}×${inputShape}) × (${inputShape}×batch) + (${outputShape}×1)</div>
                    <div class="font-mono">z = ${outputShape}×batch</div>
                    
                    <div class="mt-2"><strong>Step 2:</strong> Activation Function</div>
                    <div class="font-mono">a = σ(z) or tanh(z) or ReLU(z)</div>
                    <div class="font-mono">a = ${outputShape}×batch</div>
                </div>
            `;
            
            container.appendChild(mathDiv);
        }
    }
    
    displayBackwardPass(backwardResults) {
        const container = document.getElementById('backwardPassInfo');
        container.innerHTML = '';
        
        const { weight_gradients, bias_gradients, weight_updates } = backwardResults;
        
        // Display gradients for each layer
        weight_gradients.forEach((layer, index) => {
            const layerDiv = document.createElement('div');
            layerDiv.className = 'mb-3 p-2 bg-green-50 rounded';
            
            const layerName = index === 0 ? 'Input→Hidden' : 
                             index === weight_gradients.length - 1 ? 'Hidden→Output' : `Hidden→Hidden`;
            
            const maxGrad = Math.max(...layer.flat().map(Math.abs));
            const avgGrad = layer.flat().reduce((sum, val) => sum + Math.abs(val), 0) / layer.flat().length;
            
            layerDiv.innerHTML = `
                <div class="font-medium text-green-800">${layerName} Gradients</div>
                <div class="text-xs text-green-600">
                    Max Gradient: ${maxGrad.toFixed(6)}<br>
                    Avg Gradient: ${avgGrad.toFixed(6)}<br>
                    Weight Updates: ${weight_updates[index].flat().map(v => v.toFixed(6)).join(', ')}
                </div>
            `;
            
            container.appendChild(layerDiv);
        });
        
        // Display mathematical details
        this.displayBackwardMath(backwardResults);
        this.displayWeightUpdateMath(backwardResults);
        
        // Refresh collapsible sections to adjust height
        setTimeout(() => this.refreshCollapsibleSections(), 100);
    }
    
    displayBackwardMath(backwardResults) {
        const container = document.getElementById('backwardMathInfo');
        container.innerHTML = '';
        
        const { weight_gradients, bias_gradients } = backwardResults;
        
        // Show the mathematical steps for backward pass
        for (let i = weight_gradients.length - 1; i >= 0; i--) {
            const mathDiv = document.createElement('div');
            mathDiv.className = 'mb-3 p-3 bg-green-50 rounded border-l-4 border-green-400';
            
            const layerName = i === 0 ? 'Input→Hidden' : 
                             i === weight_gradients.length - 1 ? 'Hidden→Output' : `Hidden→Hidden`;
            
            const maxGrad = Math.max(...weight_gradients[i].flat().map(Math.abs));
            const avgGrad = weight_gradients[i].flat().reduce((sum, val) => sum + Math.abs(val), 0) / weight_gradients[i].flat().length;
            
            mathDiv.innerHTML = `
                <div class="font-medium text-green-800 mb-2">${layerName} Backpropagation</div>
                <div class="text-xs text-green-700 space-y-1">
                    <div><strong>Step 1:</strong> Calculate Error</div>
                    <div class="font-mono">δ = ∂L/∂a (output layer)</div>
                    <div class="font-mono">δ = ∂L/∂z × σ'(z) (hidden layers)</div>
                    
                    <div class="mt-2"><strong>Step 2:</strong> Weight Gradients</div>
                    <div class="font-mono">∂L/∂W = δ × a_input^T</div>
                    <div class="font-mono">Max Gradient: ${maxGrad.toFixed(6)}</div>
                    <div class="font-mono">Avg Gradient: ${avgGrad.toFixed(6)}</div>
                    
                    <div class="mt-2"><strong>Step 3:</strong> Bias Gradients</div>
                    <div class="font-mono">∂L/∂b = Σ(δ)</div>
                </div>
            `;
            
            container.appendChild(mathDiv);
        }
    }
    
    displayWeightUpdateMath(backwardResults) {
        const container = document.getElementById('weightUpdateInfo');
        container.innerHTML = '';
        
        const { weight_updates, bias_updates } = backwardResults;
        const learningRate = parseFloat(document.getElementById('learningRate').value);
        
        // Show weight update calculations
        weight_updates.forEach((layer, index) => {
            const updateDiv = document.createElement('div');
            updateDiv.className = 'mb-3 p-3 bg-purple-50 rounded border-l-4 border-purple-400';
            
            const layerName = index === 0 ? 'Input→Hidden' : 
                             index === weight_updates.length - 1 ? 'Hidden→Output' : `Hidden→Hidden`;
            
            const maxUpdate = Math.max(...layer.flat().map(Math.abs));
            const avgUpdate = layer.flat().reduce((sum, val) => sum + Math.abs(val), 0) / layer.flat().length;
            
            updateDiv.innerHTML = `
                <div class="font-medium text-purple-800 mb-2">${layerName} Weight Updates</div>
                <div class="text-xs text-purple-700 space-y-1">
                    <div><strong>Update Rule:</strong></div>
                    <div class="font-mono">W_new = W_old - α × ∂L/∂W</div>
                    <div class="font-mono">W_new = W_old - ${learningRate} × gradient</div>
                    
                    <div class="mt-2"><strong>Update Statistics:</strong></div>
                    <div class="font-mono">Max Update: ${maxUpdate.toFixed(6)}</div>
                    <div class="font-mono">Avg Update: ${avgUpdate.toFixed(6)}</div>
                    <div class="font-mono">Learning Rate: ${learningRate}</div>
                </div>
            `;
            
            container.appendChild(updateDiv);
        });
    }
    
    // Chain rule visualization removed for cleaner UI
    
    // Chain rule canvas functions removed for cleaner UI
    
    clearTrainingInfo() {
        document.getElementById('forwardPassInfo').innerHTML = '<p>Initialize network to see forward pass details</p>';
        document.getElementById('backwardPassInfo').innerHTML = '<p>Train network to see backpropagation details</p>';
        document.getElementById('forwardMathInfo').innerHTML = '<p>Initialize network to see mathematical steps</p>';
        document.getElementById('backwardMathInfo').innerHTML = '<p>Train network to see gradient calculations</p>';
        document.getElementById('weightUpdateInfo').innerHTML = '<p>See how weights change with learning rate</p>';
    }

    validateLayerSizes() {
        const layerSizes = document.getElementById('layerSizes').value
            .split(',')
            .map(s => parseInt(s.trim()))
            .filter(n => !isNaN(n));
        
        const input = document.getElementById('layerSizes');
        const container = input.parentElement;
        
        // Remove existing validation styling
        container.classList.remove('ring-2', 'ring-red-500', 'ring-green-500');
        
        if (layerSizes.length < 2) {
            container.classList.add('ring-2', 'ring-red-500');
            this.showInputHint('Please enter at least 2 layer sizes (e.g., 2,3,1)', 'error');
            return false;
        }
        
        if (layerSizes.some(size => size < 1)) {
            container.classList.add('ring-2', 'ring-red-500');
            this.showInputHint('All layer sizes must be positive integers', 'error');
            return false;
        }
        
        container.classList.add('ring-2', 'ring-green-500');
        this.showInputHint(`✅ Valid architecture: ${layerSizes.join(' → ')}`, 'success');
        return true;
    }
    
    validateTrainingData() {
        try {
            const trainingX = JSON.parse(document.getElementById('trainingX').value);
            const trainingY = JSON.parse(document.getElementById('trainingY').value);
            
            const xInput = document.getElementById('trainingX');
            const yInput = document.getElementById('trainingY');
            
            // Remove existing validation styling
            xInput.classList.remove('ring-2', 'ring-red-500', 'ring-green-500');
            yInput.classList.remove('ring-2', 'ring-red-500', 'ring-green-500');
            
            if (!Array.isArray(trainingX) || trainingX.length === 0) {
                xInput.classList.add('ring-2', 'ring-red-500');
                this.showInputHint('Training data X must be a non-empty array', 'error');
                return false;
            }
            
            if (!Array.isArray(trainingY) || trainingY.length === 0) {
                yInput.classList.add('ring-2', 'ring-red-500');
                this.showInputHint('Training data Y must be a non-empty array', 'error');
                return false;
            }
            
            // Check if data is properly formatted
            const xFeatures = trainingX.length;
            const xBatchSize = Array.isArray(trainingX[0]) ? trainingX[0].length : 1;
            const yFeatures = trainingY.length;
            const yBatchSize = Array.isArray(trainingY[0]) ? trainingY[0].length : 1;
            
            if (xBatchSize !== yBatchSize) {
                xInput.classList.add('ring-2', 'ring-red-500');
                yInput.classList.add('ring-2', 'ring-red-500');
                this.showInputHint(`Batch size mismatch: X has ${xBatchSize} samples, Y has ${yBatchSize} samples`, 'error');
                return false;
            }
            
            // Add success styling
            xInput.classList.add('ring-2', 'ring-green-500');
            yInput.classList.add('ring-2', 'ring-green-500');
            this.showInputHint(`✅ Data validated: X(${xFeatures}×${xBatchSize}), Y(${yFeatures}×${yBatchSize})`, 'success');
            return true;
            
        } catch (error) {
            const xInput = document.getElementById('trainingX');
            const yInput = document.getElementById('trainingY');
            xInput.classList.add('ring-2', 'ring-red-500');
            yInput.classList.add('ring-2', 'ring-red-500');
            this.showInputHint('Invalid JSON format. Please check your data syntax.', 'error');
            return false;
        }
    }
    
    showInputHint(message, type = 'info') {
        // Remove existing hint
        const existingHint = document.getElementById('inputHint');
        if (existingHint) {
            existingHint.remove();
        }
        
        // Create hint element
        const hint = document.createElement('div');
        hint.id = 'inputHint';
        hint.className = `mt-2 text-sm ${type === 'success' ? 'text-green-600' : type === 'error' ? 'text-red-600' : 'text-blue-600'}`;
        hint.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'} mr-1"></i>
            ${message}
        `;
        
        // Insert after the training data section
        const trainingDataCard = document.querySelector('.bg-white.rounded-xl.shadow-lg.p-6.card-hover.border.border-gray-100');
        if (trainingDataCard) {
            trainingDataCard.appendChild(hint);
        }
    }
    
    // Dimension validation function
    validateDataDimensions() {
        try {
            const layerSizes = document.getElementById('layerSizes').value
                .split(',')
                .map(s => parseInt(s.trim()))
                .filter(n => !isNaN(n));
            
            const trainingX = JSON.parse(document.getElementById('trainingX').value);
            const trainingY = JSON.parse(document.getElementById('trainingY').value);
            
            if (layerSizes.length < 2) {
                this.showDimensionWarning('Please enter valid layer sizes (e.g., 2,3,1)', 'error');
                return false;
            }
            
            const inputSize = layerSizes[0];
            const outputSize = layerSizes[layerSizes.length - 1];
            
            // Check X dimensions
            if (!Array.isArray(trainingX) || trainingX.length === 0) {
                this.showDimensionWarning('Training data X must be a non-empty array', 'error');
                return false;
            }
            
            // Check Y dimensions
            if (!Array.isArray(trainingY) || trainingY.length === 0) {
                this.showDimensionWarning('Training data Y must be a non-empty array', 'error');
                return false;
            }
            
            // Validate X format: should be (features, batch_size)
            const xFeatures = trainingX.length;
            const xBatchSize = Array.isArray(trainingX[0]) ? trainingX[0].length : 1;
            
            if (xFeatures !== inputSize) {
                this.showDimensionWarning(
                    `Input dimension mismatch! X has ${xFeatures} features but network expects ${inputSize} inputs. ` +
                    `Data should be in format: (${inputSize}, batch_size)`, 
                    'error'
                );
                return false;
            }
            
            // Validate Y format: should be (output_features, batch_size)
            const yFeatures = trainingY.length;
            const yBatchSize = Array.isArray(trainingY[0]) ? trainingY[0].length : 1;
            
            if (yFeatures !== outputSize) {
                this.showDimensionWarning(
                    `Output dimension mismatch! Y has ${yFeatures} features but network expects ${outputSize} outputs. ` +
                    `Data should be in format: (${outputSize}, batch_size)`, 
                    'error'
                );
                return false;
            }
            
            // Check batch size consistency
            if (xBatchSize !== yBatchSize) {
                this.showDimensionWarning(
                    `Batch size mismatch! X has ${xBatchSize} samples but Y has ${yBatchSize} samples. ` +
                    `Both X and Y must have the same number of samples.`, 
                    'error'
                );
                return false;
            }
            
            // Show success message
            this.showDimensionWarning(
                `✅ Dimensions validated! Data format: X(${xFeatures}×${xBatchSize}), Y(${yFeatures}×${yBatchSize})`, 
                'success'
            );
            
            return true;
            
        } catch (error) {
            this.showDimensionWarning('Invalid data format. Please check your input data.', 'error');
            return false;
        }
    }
    
    // Show dimension warning/validation message
    showDimensionWarning(message, type = 'info') {
        // Remove any existing validation message first
        const existingContainer = document.getElementById('dimensionValidation');
        if (existingContainer) {
            existingContainer.remove();
        }
        
        // Create a new compact container
        const newContainer = document.createElement('div');
        newContainer.id = 'dimensionValidation';
        newContainer.className = `mt-2 p-2 rounded border text-xs ${this.getValidationColors(type)}`;
        
        // Make it very compact and inline
        newContainer.innerHTML = `
            <div class="flex items-center justify-between">
                <div class="flex items-center space-x-2">
                    <i class="fas fa-${this.getValidationIcon(type)} text-${this.getValidationTextColor(type)}-500"></i>
                    <span class="text-${this.getValidationTextColor(type)}-700">${message}</span>
                    ${type === 'error' ? `
                    <button onclick="toggleDataFormatGuide(this)" class="text-${this.getValidationTextColor(type)}-600 hover:text-${this.getValidationTextColor(type)}-700 underline text-xs">
                        📊 Format Guide
                    </button>
                    ` : ''}
                </div>
                <button onclick="this.parentElement.parentElement.remove()" class="text-gray-400 hover:text-gray-600 ml-2">
                    <i class="fas fa-times text-xs"></i>
                </button>
            </div>
            ${type === 'error' ? `
            <div id="dataFormatGuide" class="mt-2 p-2 bg-red-50 rounded border border-red-200 hidden">
                <div class="text-xs text-red-700 space-y-1">
                    <div>• X: (input_features, batch_size)</div>
                    <div>• Y: (output_features, batch_size)</div>
                    <div>• Example: X([[1,2,3], [4,5,6]]) for 2 features, 3 samples</div>
                </div>
            </div>
            ` : ''}
        `;
        
        // Insert as a small inline element after the training data section
        const trainingDataCard = document.querySelector('.bg-white.rounded-xl.shadow-lg.p-6.card-hover.border.border-gray-100');
        if (trainingDataCard) {
            // Insert right after the training data card, maintaining the grid layout
            trainingDataCard.parentNode.insertBefore(newContainer, trainingDataCard.nextSibling);
            
            // Add a small class to make it more compact
            newContainer.classList.add('validation-container');
        }
        
        // Auto-hide success messages after 2 seconds
        if (type === 'success') {
            setTimeout(() => {
                if (newContainer && newContainer.parentNode) {
                    newContainer.remove();
                }
            }, 2000);
        }
    }
    
    getValidationColors(type) {
        const colors = {
            success: 'bg-green-50 border-green-200',
            error: 'bg-red-50 border-red-200',
            warning: 'bg-yellow-50 border-yellow-200',
            info: 'bg-blue-50 border-blue-200'
        };
        return colors[type] || colors.info;
    }
    
    getValidationTextColor(type) {
        const colors = {
            success: 'green',
            error: 'red',
            warning: 'yellow',
            info: 'blue'
        };
        return colors[type] || 'blue';
    }
    
    getValidationIcon(type) {
        const icons = {
            success: 'check-circle',
            error: 'exclamation-circle',
            warning: 'exclamation-triangle',
            info: 'info-circle'
        };
        return icons[type] || 'info-circle';
    }

    initializeLayerArchitecture() {
        // Add event listener for layer sizes input
        const layerSizesInput = document.getElementById('layerSizes');
        if (layerSizesInput) {
            layerSizesInput.addEventListener('input', () => {
                this.updateLayerPreview();
                this.validateLayerSizes();
            });
            
            // Initial preview update
            this.updateLayerPreview();
        }
    }
    
    updateLayerPreview() {
        const layerSizesInput = document.getElementById('layerSizes');
        const layerPreviewContent = document.getElementById('layerPreviewContent');
        const layerPreview = document.getElementById('layerPreview');
        
        if (!layerSizesInput || !layerPreviewContent || !layerPreview) return;
        
        try {
            const layerSizes = layerSizesInput.value.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n));
            
            if (layerSizes.length >= 2) {
                const inputFeatures = layerSizes[0];
                const outputFeatures = layerSizes[layerSizes.length - 1];
                const hiddenLayers = layerSizes.slice(1, -1);
                
                let previewText = `Input: ${inputFeatures} features\n`;
                previewText += `Output: ${outputFeatures} features\n`;
                if (hiddenLayers.length > 0) {
                    previewText += `Hidden: ${hiddenLayers.join(', ')} layers\n`;
                } else {
                    previewText += `No hidden layers\n`;
                }
                previewText += `Total Params: ${this.calculateTotalParameters(layerSizes)}`;
                
                layerPreviewContent.textContent = previewText;
                layerPreview.classList.remove('hidden');
            } else {
                layerPreview.classList.add('hidden');
            }
        } catch (error) {
            layerPreview.classList.add('hidden');
        }
    }
    
    calculateTotalParameters(layerSizes) {
        let totalParams = 0;
        for (let i = 1; i < layerSizes.length; i++) {
            totalParams += layerSizes[i - 1] * layerSizes[i] + layerSizes[i]; // weights + biases
        }
        return totalParams;
    }
    
    initializeTextLearning() {
        // Add event listener for the generate data button
        const generateBtn = document.getElementById('generateTextBtn');
        if (generateBtn) {
            generateBtn.addEventListener('click', () => this.generateTextTrainingData());
        }
    }
    
    generateTextTrainingData() {
        const textInput = document.getElementById('textInput');
        if (!textInput) {
            this.showNotification('Text input field not found', 'error');
            return;
        }
        
        const text = textInput.value.trim();
        if (!text) {
            this.showNotification('Please enter a sentence first!', 'warning');
            return;
        }
        
        try {
            // Split the sentence into words and clean them
            const words = text.toLowerCase()
                .split(/\s+/)
                .filter(word => word.length > 0)
                .map(word => word.replace(/[^\w]/g, '')) // Remove punctuation
                .filter(word => word.length > 0); // Filter again after cleaning
            
            if (words.length < 3) {
                this.showNotification('Please enter at least 3 words for meaningful training!', 'warning');
                return;
            }
            
            // Create a simple vocabulary and word-to-index mapping
            const vocabulary = [...new Set(words)];
            const wordToIndex = {};
            vocabulary.forEach((word, index) => {
                wordToIndex[word] = index;
            });
            
            // Generate training data for next-word prediction
            const trainingX = [];
            const trainingY = [];
            
            // Create sequences: predict next word given current word
            for (let i = 0; i < words.length - 1; i++) {
                const currentWord = words[i];
                const nextWord = words[i + 1];
                
                // Convert words to one-hot encoded vectors
                const currentVector = new Array(vocabulary.length).fill(0);
                currentVector[wordToIndex[currentWord]] = 1;
                
                const nextVector = new Array(vocabulary.length).fill(0);
                nextVector[wordToIndex[nextWord]] = 1;
                
                trainingX.push(currentVector);
                trainingY.push(nextVector);
            }
            
            // Transpose the data to match expected dimensions (features, batch_size)
            const X_transposed = [];
            const y_transposed = [];
            
            for (let feature = 0; feature < vocabulary.length; feature++) {
                const featureRow = [];
                const outputRow = [];
                
                for (let pair = 0; pair < trainingX.length; pair++) {
                    featureRow.push(trainingX[pair][feature]);
                    outputRow.push(trainingY[pair][feature]);
                }
                
                X_transposed.push(featureRow);
                y_transposed.push(outputRow);
            }
            
            // Update the training data fields with properly dimensioned data
            const trainingXField = document.getElementById('trainingX');
            const trainingYField = document.getElementById('trainingY');
            
            if (trainingXField && trainingYField) {
                trainingXField.value = JSON.stringify(X_transposed);
                trainingYField.value = JSON.stringify(y_transposed);
                
                // Trigger validation
                this.validateTrainingData();
            }
            
            // Update layer sizes for text processing
            const layerSizesField = document.getElementById('layerSizes');
            if (layerSizesField) {
                const inputSize = vocabulary.length;
                const hiddenSize1 = Math.max(8, Math.min(inputSize * 2, 20)); // Cap at reasonable size
                const hiddenSize2 = Math.max(6, Math.min(inputSize, 16));
                layerSizesField.value = `${inputSize},${hiddenSize1},${hiddenSize2},${inputSize}`;
                
                // Trigger validation
                this.validateLayerSizes();
            }
            
            // Show preview with dimension information
            const preview = document.getElementById('textPreview');
            const previewText = document.getElementById('textTrainingPreview');
            
            if (preview && previewText) {
                previewText.innerHTML = `
                    <div class="space-y-2">
                        <div><strong>📝 Sentence:</strong> "${text}"</div>
                        <div><strong>🔤 Words:</strong> ${words.join(', ')}</div>
                        <div><strong>📊 Vocabulary size:</strong> ${vocabulary.length}</div>
                        <div><strong>🔄 Training pairs:</strong> ${trainingX.length}</div>
                        <div><strong>📐 Input shape:</strong> ${vocabulary.length} × ${trainingX.length}</div>
                        <div><strong>📐 Output shape:</strong> ${vocabulary.length} × ${trainingX.length}</div>
                        <div><strong>🧠 Network:</strong> ${vocabulary.length} → ${Math.max(8, Math.min(vocabulary.length * 2, 20))} → ${Math.max(6, Math.min(vocabulary.length, 16))} → ${vocabulary.length}</div>
                    </div>
                `;
                preview.classList.remove('hidden');
            }
            
            // Show success notification
            this.showNotification(`Text training data generated successfully! Vocabulary: ${vocabulary.length} words, Training pairs: ${trainingX.length}`, 'success');
            
            // Auto-initialize network if not already done
            if (!this.networkInitialized) {
                setTimeout(() => {
                    this.showNotification('Click "Initialize" to set up the network for text learning', 'info');
                }, 1000);
            }
            
        } catch (error) {
            console.error('Error generating text training data:', error);
            this.showNotification('Failed to generate text training data. Please check your input.', 'error');
        }
    }
    
    // Load predefined examples
    loadExample(type) {
        switch(type) {
            case 'xor':
                // XOR: 2 inputs, 1 output, 4 samples
                // Data format: (features, batch_size) = (2, 4) and (1, 4)
                document.getElementById('trainingX').value = '[[0,0,1,1], [0,1,0,1]]';
                document.getElementById('trainingY').value = '[[0,1,1,0]]';
                document.getElementById('layerSizes').value = '2,3,1';
                break;
            case 'and':
                // AND: 2 inputs, 1 output, 4 samples
                // Data format: (features, batch_size) = (2, 4) and (1, 4)
                document.getElementById('trainingX').value = '[[0,0,1,1], [0,1,0,1]]';
                document.getElementById('trainingY').value = '[[0,0,0,1]]';
                document.getElementById('layerSizes').value = '2,2,1';
                break;
            case 'regression':
                // Linear regression: 1 input, 1 output, 5 samples
                // Data format: (features, batch_size) = (1, 5) and (1, 5)
                document.getElementById('trainingX').value = '[[1,2,3,4,5]]';
                document.getElementById('trainingY').value = '[[2,4,6,8,10]]';
                document.getElementById('layerSizes').value = '1,3,1';
                break;
            case 'deep_classifier':
                // Deep classifier: 3 inputs, 1 output, 8 samples
                // Data format: (features, batch_size) = (3, 8) and (1, 8)
                document.getElementById('trainingX').value = '[[0,0,0,0,1,1,1,1], [0,0,1,1,0,0,1,1], [0,1,0,1,0,1,0,1]]';
                document.getElementById('trainingY').value = '[[0,1,1,0,1,0,0,1]]';
                document.getElementById('layerSizes').value = '3,8,12,16,20,16,12,8,6,4,2,1';
                break;
            case 'deep_regression':
                // Deep regression: 2 inputs, 1 output, 8 samples
                // Data format: (features, batch_size) = (2, 8) and (1, 8)
                document.getElementById('trainingX').value = '[[1,2,3,4,5,6,7,8], [2,4,6,8,10,12,14,16]]';
                document.getElementById('trainingY').value = '[[3,6,9,12,15,18,21,24]]';
                document.getElementById('layerSizes').value = '2,6,10,15,20,15,10,6,4,2,1';
                break;
            case 'image_classifier':
                // Image classifier: 4 inputs, 1 output, 16 samples
                // Data format: (features, batch_size) = (4, 16) and (1, 16)
                document.getElementById('trainingX').value = '[[0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1], [0,0,0,0,0,0,1,1,0,0,0,0,1,1,1,1], [0,0,1,1,0,0,1,1,0,0,1,1,0,0,1,1], [0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1]]';
                document.getElementById('trainingY').value = '[[0,0,0,1,0,1,1,1,0,1,1,1,1,1,1,1]]';
                document.getElementById('layerSizes').value = '4,8,12,16,20,16,12,8,6,4,1';
                break;
            case 'text_learning':
                // Load a sample sentence for text learning
                document.getElementById('textInput').value = 'My name is Shruthi and I love coding';
                this.generateTextTrainingData();
                return; // Don't show the success message here since generateTextTrainingData will handle it
        }
        
        // Show success message
        this.showNotification(`Loaded ${type.replace('_', ' ')} example successfully!`, 'success');
        
        // Validate dimensions after loading
        this.validateDataDimensions();
        
        // Update layer preview
        this.updateLayerPreview();
    }
    
    initializeExampleButtons() {
        // Add event listeners for all example buttons
        const examples = [
            { id: 'exampleXor', type: 'xor' },
            { id: 'exampleAnd', type: 'and' },
            { id: 'exampleRegression', type: 'regression' },
            { id: 'exampleDeepClassifier', type: 'deep_classifier' },
            { id: 'exampleDeepRegression', type: 'deep_regression' },
            { id: 'exampleImageClassifier', type: 'image_classifier' },
            { id: 'exampleTextLearning', type: 'text_learning' }
        ];
        
        examples.forEach(example => {
            const button = document.getElementById(example.id);
            if (button) {
                button.addEventListener('click', () => this.loadExample(example.type));
            }
        });
    }

    // Lightweight HTML tooltip for neuron hover
    initializeTooltip() {
        const el = document.createElement('div');
        el.style.position = 'fixed';
        el.style.pointerEvents = 'none';
        el.style.zIndex = '1000';
        el.style.padding = '6px 10px';
        el.style.borderRadius = '6px';
        el.style.background = 'rgba(0,0,0,0.8)';
        el.style.color = '#fff';
        el.style.fontSize = '12px';
        el.style.transform = 'translate(10px, 10px)';
        el.style.display = 'none';
        document.body.appendChild(el);
        this.tooltipEl = el;
    }

    showNeuronTooltip(neuron, clientX, clientY) {
        if (!this.tooltipEl) return;
        const label = neuron.layer === 0 ? 'Input' :
            neuron.layer === this.layerSizes.length - 1 ? 'Output' : `Hidden ${neuron.layer}`;
        this.tooltipEl.innerHTML = `<div style="white-space:nowrap"><strong>${label} Neuron</strong><br/>Pos: ${neuron.layer + 1}:${neuron.neuron + 1}</div>`;
        this.tooltipEl.style.left = clientX + 'px';
        this.tooltipEl.style.top = clientY + 'px';
        this.tooltipEl.style.display = 'block';
    }

    hideNeuronTooltip() {
        if (this.tooltipEl) this.tooltipEl.style.display = 'none';
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, initializing BackpropVisualizer...');
    window.visualizer = new BackpropVisualizer();
    console.log('BackpropVisualizer initialized:', window.visualizer);
}); 