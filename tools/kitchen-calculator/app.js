"use strict";

/**
 * Kitchen Cleaning Calculator Application
 * 
 * A comprehensive tool for calculating and optimizing professional kitchen cleaning quotes.
 * Allows for detailed cost breakdowns, profit optimization, and professional quote generation.
 * 
 * @author Christian Reyes
 * @version 2.4.0
 */

// ===== Use Shared Modules =====
const $ = utils.$;
const formatCurrency = utils.formatCurrency;
const debounce = utils.debounce;
const setDisplay = (id, show, displayValue = 'block') => utils.setDisplay(id, show, displayValue);

// ===== Global Variables =====
let debouncedCalculate;

// ===== Touch Event Support =====
const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

// ===== Application State =====
const state = {
    // Core Data
    useSubcontractor: false,
    subcontractorCost: 0,
    workers: 2,
    hours: 4,
    days: 1,
    materialsPerDay: 50,
    equipmentPerDay: 40,
    isHoliday: false,
    outsideHouston: false,
    includeInsurance: true,

    // Configuration
    config: {
        regularPayRate: 16,
        supervisorPayRate: 18,
        transportCostPerDay: 150,
        outsideHoustonTransportCostPerDay: 300,
        workCompRate: 1.88,
        glRate: 7.33,
        payrollTaxRate: 17,  // Payroll tax percentage
        targetCostPercentage: 62  // Target cost percentage for optimization
    },

    // Options
    options: {
        includeTransport: true,
        includeMaterials: true,
        includeEquipment: true,
        enableRounding: true,
        roundingMethod: 'up',
        roundingValue: 50,
        useCustomMarkup: false,
        customMarkupPercentage: 120,
        commissionPercentage: 20,
        enableCommissionSplit: false,
        commissionSplits: [10, 10],
        regularSuppliesPercentage: 6,
        additionalEquipmentPercentage: 2.75,
        uniformSafetyPercentage: 2.5,
        communicationsPercentage: 1,
        overheadPercentage: 5,
        enableInitialFee: false,
        initialFeeValue: 150,
        enableResidualPercentage: false,
        residualPercentageValue: 10,
        enableAutoCostOptimization: false
    },

    // UI State
    ui: {
        sectionStates: {},
        operationalCostsExpanded: false,
        isDarkMode: false,
        isCalculating: false,
        hasUnsavedConfigChanges: false,
        highlightedElements: new Set(),
        valueHistory: {}, // For tracking value changes
        toastQueue: [],
        quotePDFGenerated: false, // Track if quote PDF has been generated
        lastClientInfo: null // Store client info from last PDF generation
    },

    // Calculation results cache
    results: {
        laborCost: 0,
        laborTax: 0,
        workCompCost: 0,
        transportCost: 0,
        materialsCost: 0,
        equipmentCost: 0,
        operationalCosts: 0,
        subtotal: 0,
        residualAmount: 0,
        markup: 0,
        markupPercentage: 0,
        holidaySurcharge: 0,
        totalPrice: 0,
        generalLiabilityCost: 0,
        franchiseTaxCost: 0,
        initialFeeAmount: 0,
        roundingAdjustment: 0,
        grandTotal: 0,
        netProfit: 0,
        costPercentage: 0,
        profitPercentage: 0,
        salesCommission: 0,
        finalCompanyProfit: 0,
        splitCommissions: []
    },

    // History for undo/redo functionality
    history: {
        snapshots: [],
        currentIndex: -1,
        maxSnapshots: 20
    }
};

// ===== Helper Functions =====

/**
 * Extract numeric value from currency string
 * @param {string} str - Currency string
 * @returns {number} - Extracted numeric value
 */
const extractNumericValue = str => {
    if (typeof str !== 'string') return 0;
    return parseFloat(str.replace(/[^0-9.-]+/g, '')) || 0;
};


/**
 * Round an amount using the desired method.
 * @param {number} amount - Value to round.
 * @param {'up'|'down'|'nearest'} method - Rounding mode.
 * @param {number} value - Step value for rounding.
 * @returns {number} - Rounded amount
 */
const roundAmount = (amount, method = 'up', value = 50) => {
    if (!value) return amount;
    switch (method) {
        case 'up': return Math.ceil(amount / value) * value;
        case 'down': return Math.floor(amount / value) * value;
        case 'nearest': default: return Math.round(amount / value) * value;
    }
};

// Work Order service management
let workOrderServiceId = 2;

/**
 * Add a new service to the Work Order
 */
function addWorkOrderService() {
    const serviceId = workOrderServiceId++;
    const serviceHTML = `
        <div class="work-order-service-item bg-ios-gray-1 rounded-xl p-4" data-service-id="${serviceId}">
            <div class="flex items-start justify-between gap-3">
                <div class="flex-1 space-y-3">
                    <div>
                        <label class="block text-sm font-medium text-ios-gray-6 mb-1">Service Title <span class="text-danger-red">*</span></label>
                        <input type="text" required class="work-order-service-title w-full px-3 py-2 bg-white rounded-xl border-0 focus:outline-none focus:ring-2 focus:ring-brand-blue transition-colors duration-200" placeholder="e.g., Detail Cleaning" value="">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-ios-gray-6 mb-1">Service Description <span class="text-danger-red">*</span></label>
                        <textarea required class="work-order-service-description w-full px-3 py-2 bg-white rounded-xl border-0 focus:outline-none focus:ring-2 focus:ring-brand-blue transition-colors duration-200 resize-none" rows="3" placeholder="Describe the service scope..."></textarea>
                    </div>
                </div>
                <button type="button" class="remove-work-order-service-btn p-2 text-danger-red hover:bg-danger-red hover:bg-opacity-10 rounded-lg transition-colors" aria-label="Remove service">
                    <i class="fas fa-trash-alt"></i>
                </button>
            </div>
        </div>
    `;
    
    $('workOrderServicesContainer').insertAdjacentHTML('beforeend', serviceHTML);
    showNotification('New service added', 'success');
}

/**
 * Remove a service from the Work Order
 * @param {HTMLElement} serviceItem - The service item element to remove
 */
function removeWorkOrderService(serviceItem) {
    const serviceItems = document.querySelectorAll('.work-order-service-item');
    if (serviceItems.length <= 1) {
        showNotification('You must have at least one service', 'error');
        return;
    }
    
    serviceItem.remove();
    showNotification('Service removed', 'info');
    updateWorkOrderPreview();
}

/**
 * Update Work Order preview
 */
function updateWorkOrderPreview() {
    // Get first service title for preview
    const firstServiceTitle = document.querySelector('.work-order-service-title')?.value || '';
    const woPreviewService = $('woPreviewService');
    if (woPreviewService) {
        woPreviewService.textContent = firstServiceTitle || '-';
    }
}

/**
 * Calculate markup percentage based on contract length or custom value.
 * @param {number} days - Number of service days.
 * @returns {number} - Calculated markup percentage
 */
const calculateMarkupPercentage = (days) => {
    if (state.options.useCustomMarkup) return state.options.customMarkupPercentage;
    const baseMarkup = 120;
    if (days === 1) return baseMarkup;
    const minMarkup = 35;
    const daysEffect = Math.min(1, (days - 1) / 29);
    let markup = baseMarkup - (baseMarkup - minMarkup) * daysEffect;
    return Math.round(markup);
};

/**
 * Create a deep copy of an object
 * @param {Object} obj - Object to clone
 * @returns {Object} - Deep copy of the object
 */
const deepClone = (obj) => utils.deepClone(obj);

/**
 * Highlight an element to draw attention to changes
 * @param {string} id - Element ID to highlight
 * @param {string} [className='highlight-change'] - Class to add for highlighting
 * @param {number} [duration=1500] - Duration of the highlight in milliseconds
 */
const highlightElement = (id, className = 'highlight-change', duration = 1500) => {
    const el = $(id);
    if (!el) return;

    // Don't highlight if this element is already highlighted
    if (state.ui.highlightedElements.has(id)) return;

    // Store current value for comparison
    const currentValue = el.textContent;
    const previousValue = state.ui.valueHistory[id] || currentValue;

    // Check if value has changed significantly (more than 0.5%)
    const oldValue = extractNumericValue(previousValue);
    const newValue = extractNumericValue(currentValue);

    if (!isNaN(oldValue) && !isNaN(newValue) && oldValue !== 0) {
        const percentChange = Math.abs((newValue - oldValue) / oldValue) * 100;

        if (percentChange > 0.5) {
            // Add to set of highlighted elements
            state.ui.highlightedElements.add(id);

            // Add special class for an increase or decrease
            const changeClass = newValue > oldValue ? 'value-increased' : 'value-decreased';
            el.classList.add(className, changeClass);

            // Show notification for significant changes (more than 15%)
            if (percentChange > 15) {
                const changeType = newValue > oldValue ? 'increased' : 'decreased';
                const message = `<strong>${el.closest('.result-row, .profit-row, .result-total')?.querySelector('.label')?.textContent || 'Value'}</strong> ${changeType} by ${Math.round(percentChange)}%`;
                queueToast(message, changeType === 'increased' ? 'warning' : 'success');
            }

            // Remove the highlight after duration
            setTimeout(() => {
                el.classList.remove(className, changeClass);
                state.ui.highlightedElements.delete(id);
            }, duration);
        }
    }

    // Update stored value
    state.ui.valueHistory[id] = currentValue;
};

/**
 * Queue a toast notification
 * @param {string} message - Message to display
 * @param {string} [type='info'] - Notification type
 */
const queueToast = (message, type = 'info') => {
    state.ui.toastQueue.push({ message, type });

    // If this is the only item in the queue, show it immediately
    if (state.ui.toastQueue.length === 1) {
        processToastQueue();
    }
};

/**
 * Process the toast queue
 */
const processToastQueue = () => {
    if (state.ui.toastQueue.length === 0) return;

    const { message, type } = state.ui.toastQueue[0];
    showNotification(message, type);

    // Remove from queue and process next item after delay
    setTimeout(() => {
        state.ui.toastQueue.shift();
        if (state.ui.toastQueue.length > 0) {
            processToastQueue();
        }
    }, 3500); // Slightly longer than notification display time
};

/**
 * Save a snapshot of the current state for undo/redo functionality
 */
const saveSnapshot = () => {
    // Create a deep copy of the relevant parts of the state
    const snapshot = {
        useSubcontractor: state.useSubcontractor,
        subcontractorCost: state.subcontractorCost,
        workers: state.workers,
        hours: state.hours,
        days: state.days,
        materialsPerDay: state.materialsPerDay,
        equipmentPerDay: state.equipmentPerDay,
        largeHoods: state.largeHoods,
        smallHoods: state.smallHoods,
        hoodCleaningFrequency: state.hoodCleaningFrequency,
        isHoliday: state.isHoliday,
        outsideHouston: state.outsideHouston,
        includeInsurance: state.includeInsurance,
        options: deepClone(state.options)
    };

    // If we've used undo and then make changes, remove the future snapshots
    if (state.history.currentIndex < state.history.snapshots.length - 1) {
        state.history.snapshots = state.history.snapshots.slice(0, state.history.currentIndex + 1);
    }

    // Add the snapshot and update the index
    state.history.snapshots.push(snapshot);
    state.history.currentIndex = state.history.snapshots.length - 1;

    // Limit the number of snapshots
    if (state.history.snapshots.length > state.history.maxSnapshots) {
        state.history.snapshots.shift();
        state.history.currentIndex--;
    }

    // Enable/disable undo/redo buttons (if they exist)
    updateUndoRedoButtons();
};

/**
 * Update the state of undo/redo buttons
 */
const updateUndoRedoButtons = () => {
    const undoBtn = document.getElementById('undoBtn');
    const redoBtn = document.getElementById('redoBtn');

    if (undoBtn) {
        undoBtn.disabled = state.history.currentIndex <= 0;
        undoBtn.setAttribute('aria-disabled', state.history.currentIndex <= 0);
    }

    if (redoBtn) {
        redoBtn.disabled = state.history.currentIndex >= state.history.snapshots.length - 1;
        redoBtn.setAttribute('aria-disabled', state.history.currentIndex >= state.history.snapshots.length - 1);
    }
};

/**
 * Apply a snapshot from history for undo/redo
 * @param {number} index - Index of the snapshot to apply
 */
const applySnapshot = (index) => {
    if (index < 0 || index >= state.history.snapshots.length) return;

    const snapshot = state.history.snapshots[index];

    // Apply the snapshot to the state
    Object.assign(state, {
        useSubcontractor: snapshot.useSubcontractor,
        subcontractorCost: snapshot.subcontractorCost,
        workers: snapshot.workers,
        hours: snapshot.hours,
        days: snapshot.days,
        materialsPerDay: snapshot.materialsPerDay,
        equipmentPerDay: snapshot.equipmentPerDay,
        largeHoods: snapshot.largeHoods,
        smallHoods: snapshot.smallHoods,
        hoodCleaningFrequency: snapshot.hoodCleaningFrequency,
        isHoliday: snapshot.isHoliday,
        outsideHouston: snapshot.outsideHouston,
        includeInsurance: snapshot.includeInsurance,
        options: deepClone(snapshot.options)
    });

    // Update the UI to match the state
    updateUIFromState();
    calculateAll();

    // Update the current index and button states
    state.history.currentIndex = index;
    updateUndoRedoButtons();
};

/**
 * Implement undo functionality
 */
const undo = () => {
    if (state.history.currentIndex > 0) {
        applySnapshot(state.history.currentIndex - 1);
        queueToast('Changes undone', 'info');
    }
};

/**
 * Implement redo functionality
 */
const redo = () => {
    if (state.history.currentIndex < state.history.snapshots.length - 1) {
        applySnapshot(state.history.currentIndex + 1);
        queueToast('Changes restored', 'info');
    }
};


// ===== DOM Utilities =====

/**
 * Set the text content of an element
 * @param {string} id - Element ID
 * @param {string} content - Content to set
 */
const setContent = (id, content) => {
    const el = $(id);
    if (el) el.textContent = content;
};

/**
 * Set the HTML content of an element
 * @param {string} id - Element ID
 * @param {string} content - HTML content to set
 */
const setHTML = (id, content) => {
    const el = $(id);
    if (el) el.innerHTML = content;
};

/**
 * Toggle a class on an element
 * @param {string} id - Element ID
 * @param {string} className - Class to toggle
 * @param {boolean} condition - Whether to add or remove the class
 */
const toggleClass = (id, className, condition) => {
    const el = $(id);
    if (el) el.classList.toggle(className, condition);
};

/**
 * Set loading state for UI during calculations
 * @param {boolean} isLoading - Whether the calculator is loading
 */
const setLoadingState = (isLoading) => {
    state.ui.isCalculating = isLoading;
    document.body.classList.toggle('loading', isLoading);
};

/**
 * Check if browser supports required features
 * @returns {Object} - Object with support status for each feature
 */
const checkBrowserSupport = () => {
    const support = {
        html2canvas: typeof window.html2canvas !== 'undefined',
        jsPDF: typeof window.jspdf !== 'undefined',
        localStorage: false,
        downloadAPI: 'download' in document.createElement('a')
    };

    // Check localStorage
    try {
        localStorage.setItem('test', 'test');
        localStorage.removeItem('test');
        support.localStorage = true;
    } catch (e) {
        support.localStorage = false;
    }

    return support;
};

// ===== Event Handlers =====

/**
 * Initialize all event listeners
 */
function initEventListeners() {
    // Tab navigation
    $('quotationTab').addEventListener('click', () => {
        // Check for unsaved changes in config
        if (state.ui.hasUnsavedConfigChanges) {
            if (confirm('You have unsaved changes in Configuration. Would you like to save them before leaving?')) {
                $('saveConfigBtn').click();
            } else {
                state.ui.hasUnsavedConfigChanges = false;
                updateUnsavedChangesIndicator();
            }
        }
        showContent('quotationContent');
    });

    $('configTab').addEventListener('click', () => showContent('configContent'));

    $('breakdownTab').addEventListener('click', () => {
        // Check for unsaved changes in config
        if (state.ui.hasUnsavedConfigChanges) {
            if (confirm('You have unsaved changes in Configuration. Would you like to save them before leaving?')) {
                $('saveConfigBtn').click();
            } else {
                state.ui.hasUnsavedConfigChanges = false;
                updateUnsavedChangesIndicator();
            }
        }

        showContent('quotationContent');
        const resultsEl = document.querySelector('.results-column') || document.querySelector('.result-section');
        if (resultsEl) resultsEl.scrollIntoView({ behavior: 'smooth' });
    });

    $('resetBtn').addEventListener('click', resetCalculator);
    $('darkModeToggle').addEventListener('click', toggleDarkMode);

    // Toggle sections
    document.querySelectorAll('.toggle-section').forEach(button => {
        button.addEventListener('click', function () {
            toggleSection(this.getAttribute('data-target'), this);
        });
    });

    // Advanced options toggle with keyboard support
    $('advancedOptionsToggle').addEventListener('click', function () {
        const content = $('advancedOptionsContent');
        const icon = this.querySelector('i.fas');
        content.classList.toggle('hidden');
        content.classList.toggle('visible');
        icon.className = content.classList.contains('visible') ? 'fas fa-chevron-up' : 'fas fa-chevron-down';
        this.setAttribute('aria-expanded', content.classList.contains('visible'));
        content.setAttribute('aria-hidden', !content.classList.contains('visible'));
    });
    
    // Add keyboard support for advanced options toggle
    $('advancedOptionsToggle').addEventListener('keydown', function(e) {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            this.click();
        }
    });

    // Operational costs toggle
    $('operationalCostsRow').addEventListener('click', function () {
        this.classList.toggle('expanded');
        const icon = this.querySelector('i.fas');
        const details = $('operationalCostsDetails');

        if (this.classList.contains('expanded')) {
            details.classList.remove('hidden');
            icon.className = 'fas fa-chevron-up';
            state.ui.operationalCostsExpanded = true;
            this.setAttribute('aria-expanded', 'true');
        } else {
            details.classList.add('hidden');
            icon.className = 'fas fa-chevron-down';
            state.ui.operationalCostsExpanded = false;
            this.setAttribute('aria-expanded', 'false');
        }
    });
    
    // Add keyboard support for operational costs toggle
    $('operationalCostsRow').addEventListener('keydown', function(e) {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            this.click();
        }
    });

    // Setup checkbox handlers using event delegation
    document.addEventListener('change', e => {
        if (e.target.type === 'checkbox') {
            handleCheckboxChange(e.target);
        }
    });

    // Handle numeric input and percentage input changes with debounce
    const debouncedInputHandler = debounce(e => {
        if (e.target.type === 'number' || e.target.classList.contains('commission-split-input')) {
            handleNumericInput(e.target);
        }

        // Track configuration changes
        if (e.target.closest('#configContent')) {
            state.ui.hasUnsavedConfigChanges = true;
            updateUnsavedChangesIndicator();
        }
    }, 300);
    
    document.addEventListener('input', debouncedInputHandler);

    // Add commission split button
    $('addCommissionSplitBtn').addEventListener('click', function () {
        state.options.commissionSplits.push(0);
        updateCommissionSplitInputs();
        saveSnapshot();
        calculateAll();
    });

    // Markup Slider
    $('markupSlider').addEventListener('input', function () {
        const value = parseInt(this.value);
        state.options.customMarkupPercentage = value;
        $('markupInput').value = Math.round(value);
        // Clear any manual grand total target when manually adjusting markup
        delete state.manualGrandTotalTarget;
        calculateAll();
    });
    
    // Handle markup input for values beyond slider range
    $('markupInput').addEventListener('change', function () {
        const value = parseFloat(this.value) || 0;
        if (value >= 0) {
            state.options.customMarkupPercentage = value;
            // Update slider to max if value exceeds slider range
            $('markupSlider').value = Math.min(1000, Math.round(value));
            // Clear any manual grand total target when manually adjusting markup
            delete state.manualGrandTotalTarget;
            calculateAll();
        }
    });

    // Save configuration button
    $('saveConfigBtn').addEventListener('click', function () {
        if (!validateAllInputs()) {
            showNotification('Please fix the errors before saving configuration.', 'error');
            return;
        }

        // Update configuration values with additional validation
        const regularRate = parseFloat($('regularPayRate').value) || 16;
        const supervisorRate = parseFloat($('supervisorPayRate').value) || 18;
        
        // Ensure supervisor rate is at least equal to regular rate
        if (supervisorRate < regularRate) {
            showNotification('Supervisor pay rate must be at least equal to regular worker rate.', 'error');
            return;
        }
        
        state.config.regularPayRate = regularRate;
        state.config.supervisorPayRate = supervisorRate;
        state.config.transportCostPerDay = Math.max(0, parseFloat($('transportCostConfig').value) || 150);
        state.config.outsideHoustonTransportCostPerDay = Math.max(0, parseFloat($('outsideHoustonTransportConfig').value) || 300);
        state.config.largeHoodPrice = Math.max(1, parseFloat($('largeHoodPriceConfig').value) || 650);
        state.config.smallHoodPrice = Math.max(1, parseFloat($('smallHoodPriceConfig').value) || 550);
        state.config.workCompRate = Math.max(0, parseFloat($('workCompRate').value) || 1.88);
        state.config.glRate = Math.max(0, parseFloat($('glRate').value) || 7.33);
        state.config.payrollTaxRate = Math.max(0, Math.min(50, parseFloat($('payrollTaxRate').value) || 17));
        state.config.targetCostPercentage = Math.max(30, Math.min(90, parseFloat($('targetCostPercentage').value) || 62));
        state.config.largeHoodInternalCost = Math.max(1, parseFloat($('largeHoodInternalCost').value) || 250);
        state.config.smallHoodInternalCost = Math.max(1, parseFloat($('smallHoodInternalCost').value) || 200);
        
        // Validate hood pricing logic
        if (state.config.largeHoodInternalCost >= state.config.largeHoodPrice) {
            showNotification('Warning: Large hood internal cost is higher than selling price!', 'error');
            return;
        }
        if (state.config.smallHoodInternalCost >= state.config.smallHoodPrice) {
            showNotification('Warning: Small hood internal cost is higher than selling price!', 'error');
            return;
        }

        // Reset unsaved changes indicator
        state.ui.hasUnsavedConfigChanges = false;
        updateUnsavedChangesIndicator();

        // Update UI elements that display configuration values
        updateHoodPriceLabels();
        updateInsuranceDetails();

        saveSnapshot();
        calculateAll();
        showContent('quotationContent');
        showNotification('Configuration saved successfully.', 'success');
    });

    // Print and Export buttons
    $('printQuoteBtn').addEventListener('click', function () {
        preparePdfOrPrint('print');
    });

    $('downloadPdfBtn').addEventListener('click', async function () {
        await preparePdfOrPrint('pdf');
    });

    $('screenshotBtn').addEventListener('click', async function() {
        await captureScreenshot();
    });
    
    // Download link click handler (prevent default navigation)
    document.addEventListener('click', function(e) {
        if (e.target.id === 'downloadLink' || e.target.closest('#downloadLink')) {
            const link = e.target.id === 'downloadLink' ? e.target : e.target.closest('#downloadLink');
            if (link.href && link.href !== '#' && link.href.startsWith('data:')) {
                // Allow the download to proceed
                return true;
            } else {
                // Prevent navigation if no valid data URL
                e.preventDefault();
                showNotification('Please capture a screenshot first.', 'warning');
            }
        }
    });

    // Modal close buttons
    document.querySelectorAll('.close-modal').forEach(btn => {
        btn.addEventListener('click', function () {
            const modal = this.closest('.modal');
            if (modal) {
                modal.classList.remove('visible');
                setTimeout(() => { modal.style.display = 'none'; }, 300);
            }
        });
    });
    
    // Close modal when clicking outside of it
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', function(e) {
            if (e.target === this) {
                this.classList.remove('visible');
                setTimeout(() => { this.style.display = 'none'; }, 300);
            }
        });
    });
    
    // Client info modal event listeners
    const clientInfoForm = $('clientInfoForm');
    if (clientInfoForm) {
        clientInfoForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            // Collect client information
            const clientInfo = {
                companyName: $('companyName').value.trim(),
                contactName: $('contactName').value.trim(),
                contactPosition: $('contactPosition').value.trim(),
                contactPhone: $('contactPhone').value.trim(),
                contactEmail: $('contactEmail').value.trim(),
                serviceLocation: $('serviceLocation').value.trim(),
                salesTeam: []
            };
            
            // Collect sales team
            const salesInputs = document.querySelectorAll('input[name="salesPerson[]"]');
            salesInputs.forEach(input => {
                const value = input.value.trim();
                if (value) {
                    clientInfo.salesTeam.push(value);
                }
            });
            
            // Validate required fields
            if (!clientInfo.companyName) {
                showNotification('Company name is required', 'error');
                $('companyName').focus();
                return;
            }
            
            // Close modal
            const modal = $('clientInfoModal');
            modal.classList.remove('visible');
            setTimeout(() => { modal.style.display = 'none'; }, 300);
            
            // Store client info for later use
            state.ui.lastClientInfo = clientInfo;
            
            // Generate PDF with client info
            await generatePDF(clientInfo);
        });
    }
    
    // Add sales person button
    const addSalesPersonBtn = $('addSalesPersonBtn');
    if (addSalesPersonBtn) {
        addSalesPersonBtn.addEventListener('click', addSalesPersonRow);
    }
    
    // Cancel client info button
    const cancelClientInfoBtn = $('cancelClientInfoBtn');
    if (cancelClientInfoBtn) {
        cancelClientInfoBtn.addEventListener('click', function() {
            const modal = $('clientInfoModal');
            modal.classList.remove('visible');
            setTimeout(() => { modal.style.display = 'none'; }, 300);
        });
    }
    
    // Generate Work Order button
    const generateWorkOrderBtn = $('generateWorkOrderBtn');
    if (generateWorkOrderBtn) {
        generateWorkOrderBtn.addEventListener('click', function() {
            showWorkOrderModal();
        });
    }
    
    // Test Work Order button
    const testWorkOrderBtn = $('testWorkOrderBtn');
    if (testWorkOrderBtn) {
        testWorkOrderBtn.addEventListener('click', async function() {
            await generateTestWorkOrder();
        });
    }
    
    // Work Order form submission
    const workOrderForm = $('workOrderForm');
    if (workOrderForm) {
        workOrderForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            // Collect services data
            const services = [];
            const serviceItems = document.querySelectorAll('.work-order-service-item');
            let hasValidService = false;
            
            serviceItems.forEach(item => {
                const title = item.querySelector('.work-order-service-title').value.trim();
                const description = item.querySelector('.work-order-service-description').value.trim();
                
                if (title || description) {
                    hasValidService = true;
                    services.push({ title, description });
                }
            });
            
            if (!hasValidService) {
                showNotification('Please add at least one service with title or description', 'error');
                return;
            }
            
            // Collect work order data
            const workOrderData = {
                services: services,
                paymentTerms: $('paymentTerms').value,
                status: $('workOrderStatus').value,
                workOrderNumber: generateWorkOrderNumber()
            };
            
            // Validate required fields
            if (!workOrderData.paymentTerms) {
                showNotification('Please select payment terms', 'error');
                return;
            }
            
            // Close modal
            const modal = $('workOrderModal');
            modal.classList.remove('visible');
            setTimeout(() => { modal.style.display = 'none'; }, 300);
            
            // Generate Work Order PDF
            await generateWorkOrderPDF(workOrderData);
        });
    }
    
    // Add Work Order Service button
    const addWorkOrderServiceBtn = $('addWorkOrderServiceBtn');
    if (addWorkOrderServiceBtn) {
        addWorkOrderServiceBtn.addEventListener('click', function() {
            addWorkOrderService();
        });
    }
    
    // Handle work order service removal using event delegation
    document.addEventListener('click', function(e) {
        if (e.target.closest('.remove-work-order-service-btn')) {
            const serviceItem = e.target.closest('.work-order-service-item');
            if (serviceItem) {
                removeWorkOrderService(serviceItem);
            }
        }
    });
    
    // Handle work order service input changes for preview
    document.addEventListener('input', function(e) {
        if (e.target.classList.contains('work-order-service-title')) {
            updateWorkOrderPreview();
        }
    });
    
    // Cancel work order button
    const cancelWorkOrderBtn = $('cancelWorkOrderBtn');
    if (cancelWorkOrderBtn) {
        cancelWorkOrderBtn.addEventListener('click', function() {
            const modal = $('workOrderModal');
            modal.classList.remove('visible');
            setTimeout(() => { modal.style.display = 'none'; }, 300);
        });
    }
    
    // Grand Total editing functionality
    const toggleGrandTotalEditBtn = $('toggleGrandTotalEdit');
    const grandTotalDisplay = $('grandTotal');
    const grandTotalInput = $('grandTotalInput');
    
    if (toggleGrandTotalEditBtn && grandTotalDisplay && grandTotalInput) {
        // Toggle edit mode
        toggleGrandTotalEditBtn.addEventListener('click', function() {
            const isEditing = !grandTotalInput.classList.contains('hidden');
            
            if (isEditing) {
                // Exit edit mode
                grandTotalInput.classList.add('hidden');
                grandTotalDisplay.classList.remove('hidden');
                setDisplay('manualAdjustIndicator', false);
            } else {
                // Enter edit mode
                const currentValue = extractNumericValue(grandTotalDisplay.textContent);
                grandTotalInput.value = Math.round(currentValue);
                grandTotalInput.setAttribute('min', currentValue);
                grandTotalInput.setAttribute('placeholder', `Min: $${currentValue.toLocaleString()}`);
                grandTotalInput.classList.remove('hidden');
                grandTotalDisplay.classList.add('hidden');
                grandTotalInput.focus();
                grandTotalInput.select();
            }
        });
        
        // Track if we're processing to avoid double processing
        let isProcessing = false;
        
        // Function to process the manual grand total
        const processManualGrandTotal = (input) => {
            if (isProcessing) return;
            
            const newValue = parseFloat(input.value) || 0;
            const currentValue = extractNumericValue(grandTotalDisplay.textContent);
            
            console.log('Processing manual grand total:', newValue, 'Current:', currentValue);
            
            // Only allow values greater than or equal to the calculated value
            if (newValue < currentValue) {
                console.log('Value too low. Minimum allowed:', currentValue);
                showNotification(`The minimum Grand Total is $${currentValue.toLocaleString()}. You can only increase the price.`, 'warning');
                input.value = currentValue;
                input.classList.add('hidden');
                grandTotalDisplay.classList.remove('hidden');
                return;
            }
            
            if (newValue > 0) {
                isProcessing = true;
                applyManualGrandTotal(newValue);
                // Reset flag after a short delay
                setTimeout(() => { isProcessing = false; }, 500);
            }
            
            input.classList.add('hidden');
            grandTotalDisplay.classList.remove('hidden');
        };
        
        // Handle input changes
        grandTotalInput.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                processManualGrandTotal(this);
            } else if (e.key === 'Escape') {
                e.preventDefault();
                this.classList.add('hidden');
                grandTotalDisplay.classList.remove('hidden');
                setDisplay('manualAdjustIndicator', false);
                isProcessing = false;
            }
        });
        
        // Handle blur (clicking outside)
        grandTotalInput.addEventListener('blur', function() {
            // Small delay to allow Enter key to process first
            setTimeout(() => {
                if (!this.classList.contains('hidden')) {
                    processManualGrandTotal(this);
                }
            }, 100);
        });
    }
    
    // Close modal with Escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            document.querySelectorAll('.modal.visible').forEach(modal => {
                modal.classList.remove('visible');
                setTimeout(() => { modal.style.display = 'none'; }, 300);
            });
        }
    });

    // Initialize profit options classes
    updateProfitOptionClasses();
    updatePercentageDisplays();
    updateInsuranceDetails();

    // Initialize configuration values
    $('workCompRate').value = state.config.workCompRate;
    $('glRate').value = state.config.glRate;
    $('largeHoodPriceConfig').value = state.config.largeHoodPrice;
    $('smallHoodPriceConfig').value = state.config.smallHoodPrice;
    $('transportCostConfig').value = state.config.transportCostPerDay;
    $('outsideHoustonTransportConfig').value = state.config.outsideHoustonTransportCostPerDay;

    // Add keyboard shortcuts
    document.addEventListener('keydown', handleKeyboardShortcuts);

    // Save initial state for undo/redo
    saveSnapshot();

    // Add input event listeners for config fields to track changes
    document.querySelectorAll('#configContent input').forEach(input => {
        input.addEventListener('change', () => {
            state.ui.hasUnsavedConfigChanges = true;
            updateUnsavedChangesIndicator();
        });
    });

    // Add undo/redo button listeners
    if ($('undoBtn')) {
        $('undoBtn').addEventListener('click', undo);
    }

    if ($('redoBtn')) {
        $('redoBtn').addEventListener('click', redo);
    }

    // Check browser support after a delay to allow libraries to load
    setTimeout(() => {
        const support = checkBrowserSupport();

        // Alert for missing features only if they're still missing after delay
        if (!support.html2canvas || !support.jsPDF) {
            const missingFeatures = [];
            if (!support.html2canvas) missingFeatures.push('HTML2Canvas (screenshot capture)');
            if (!support.jsPDF) missingFeatures.push('jsPDF (PDF generation)');

            // Only show warning if libraries truly failed to load
            console.warn('Missing export libraries:', missingFeatures);
            // Don't show notification immediately - libraries might still be loading
        }
    }, 2000); // Wait 2 seconds for libraries to load
}

/**
 * Update the unsaved changes indicator
 */
function updateUnsavedChangesIndicator() {
    const configTab = $('configTab');
    if (!configTab) return;

    if (state.ui.hasUnsavedConfigChanges) {
        if (!configTab.querySelector('.unsaved-indicator')) {
            const indicator = document.createElement('span');
            indicator.className = 'unsaved-indicator';
            indicator.setAttribute('aria-label', 'Unsaved changes');
            indicator.textContent = '*';
            configTab.appendChild(indicator);
        }
    } else {
        const indicator = configTab.querySelector('.unsaved-indicator');
        if (indicator) {
            indicator.remove();
        }
    }
}

/**
 * Handle checkbox changes
 * @param {HTMLInputElement} checkbox - The checkbox that changed
 */
function handleCheckboxChange(checkbox) {
    // Track configuration changes
    if (checkbox.closest('#configContent')) {
        state.ui.hasUnsavedConfigChanges = true;
        updateUnsavedChangesIndicator();
    }

    const checkboxHandlers = {
        'enableInitialFee': checked => {
            state.options.enableInitialFee = checked;
            setDisplay('initialFeeContainer', checked);
        },
        'enableResidualPercentage': checked => {
            state.options.enableResidualPercentage = checked;
            setDisplay('residualPercentageContainer', checked);
            updateProfitOptionClasses();
        },
        'useCustomMarkup': checked => {
            if (state.options.enableAutoCostOptimization && checked) {
                $('useCustomMarkup').checked = false;
                return;
            }
            state.options.useCustomMarkup = checked;
            setDisplay('markupSliderContainer', checked);
            updateProfitOptionClasses();
        },
        'enableAutoCostOptimization': checked => {
            state.options.enableAutoCostOptimization = checked;
            if (checked) {
                $('useCustomMarkup').checked = false;
                state.options.useCustomMarkup = false;
                setDisplay('markupSliderContainer', false);
            }
            updateProfitOptionClasses();
        },
        'includeTransport': checked => state.options.includeTransport = checked,
        'includeMaterials': checked => state.options.includeMaterials = checked,
        'includeEquipment': checked => state.options.includeEquipment = checked,
        'isHoliday': checked => state.isHoliday = checked,
        'outsideHouston': checked => state.outsideHouston = checked,
        'useSubcontractor': checked => {
            state.useSubcontractor = checked;
            $('subcontractorDetails').classList.toggle('hidden', !checked);
            $('subcontractorDetails').classList.toggle('visible', checked);
        },
        'enableRounding': checked => state.options.enableRounding = checked,
        'includeInsurance': checked => state.includeInsurance = checked,
        'enableCommissionSplit': checked => {
            state.options.enableCommissionSplit = checked;
            setDisplay('splitCommissionContainer', checked);
            setDisplay('salesCommissionRow', !checked);
            setDisplay('splitCommissionRows', checked);
            updateCommissionSplitDisplay();
        }
    };

    if (checkboxHandlers[checkbox.id]) {
        checkboxHandlers[checkbox.id](checkbox.checked);
        saveSnapshot();
        if (typeof debouncedCalculate !== 'undefined') {
            debouncedCalculate();
        } else {
            calculateAll();
        }
    }
}

/**
 * Handle numeric input changes
 * @param {HTMLInputElement} input - The input element that changed
 */
function handleNumericInput(input) {
    // Handle percentage inputs
    const percentageInputMap = {
        'regularSuppliesPercentage': 'regularSuppliesPercentage',
        'additionalEquipmentPercentage': 'additionalEquipmentPercentage',
        'uniformSafetyPercentage': 'uniformSafetyPercentage',
        'communicationsPercentage': 'communicationsPercentage',
        'overheadPercentage': 'overheadPercentage',
        'commissionPercentage': 'commissionPercentage',
        'residualPercentageValue': 'residualPercentageValue',
    };

    if (percentageInputMap[input.id]) {
        const value = parseFloat(input.value) || 0;

        if (input.id === 'residualPercentageValue') {
            state.options.residualPercentageValue = value;
            setContent('residualPercentageDisplay', value);
        } else if (input.id === 'commissionPercentage') {
            state.options.commissionPercentage = value;
            setContent('commissionPercentageDisplay', value);
        } else {
            state.options[input.id] = value;
        }

        updatePercentageDisplays();
        saveSnapshot();
        if (typeof debouncedCalculate !== 'undefined') {
            debouncedCalculate();
        } else {
            calculateAll();
        }
        return;
    }

    // Handle commission split inputs
    if (input.classList.contains('commission-split-input')) {
        const index = parseInt(input.id.replace('commissionSplit', '')) - 1;
        if (!isNaN(index) && index >= 0 && index < state.options.commissionSplits.length) {
            state.options.commissionSplits[index] = parseFloat(input.value) || 0;
            updateCommissionSplitTotals();
            saveSnapshot();
            if (typeof debouncedCalculate !== 'undefined') {
                debouncedCalculate();
            } else {
                calculateAll();
            }
        }
        return;
    }

    // Handle numeric value inputs
    const valueInputMap = {
        'workers': { stateKey: 'workers', min: 0 }, // Changed min to 0 to allow 0 workers
        'hours': { stateKey: 'hours', min: 1 },
        'days': { stateKey: 'days', min: 1 },
        'materials': { stateKey: 'materialsPerDay', min: 0 },
        'equipment': { stateKey: 'equipmentPerDay', min: 0 },
        'largeHoods': { stateKey: 'largeHoods', min: 0 },
        'smallHoods': { stateKey: 'smallHoods', min: 0 },
        'hoodFrequency': { stateKey: 'hoodCleaningFrequency', min: 1 },
        'subcontractorCost': { stateKey: 'subcontractorCost', min: 0 },
        'initialFeeValue': { stateKey: 'options.initialFeeValue', min: 0 },
        'markupInput': { stateKey: 'options.customMarkupPercentage', min: 20 }
    };

    if (valueInputMap[input.id]) {
        const { stateKey, min } = valueInputMap[input.id];
        validateInput(input);

        // Parse value and enforce minimum
        let value = Math.max(min, parseFloat(input.value) || min);

        // Special handling for markup input
        if (input.id === 'markupInput') {
            input.value = value;
            state.options.customMarkupPercentage = value;
            $('markupSlider').value = Math.min(1000, value); // Match slider max
            saveSnapshot();
            calculateAll();
            return;
        }

        // Set state value
        if (stateKey.includes('.')) {
            const [obj, prop] = stateKey.split('.');
            state[obj][prop] = value;
        } else {
            state[stateKey] = value;
        }

        // Special validation: ensure we have workers OR hoods
        if (input.id === 'workers' || input.id === 'largeHoods' || input.id === 'smallHoods') {
            // Only proceed with calculation if validation passes
            if (!validateWorkersWithHoods()) {
                // Restore previous valid value
                input.value = state[stateKey] || min;
                return;
            }
        }

        saveSnapshot();
        calculateAll();
    }
}

/**
 * Validate that we have workers or hoods
 */
function validateWorkersWithHoods() {
    // Validate that we have at least workers OR hoods
    if (state.workers === 0 && state.largeHoods === 0 && state.smallHoods === 0) {
        showNotification("You must have at least one worker or one hood to clean.", "error");
        // Don't force workers=1, let user decide
        return false;
    }
    return true;
}

/**
 * Handle keyboard shortcuts
 * @param {KeyboardEvent} e - Keyboard event
 */
function handleKeyboardShortcuts(e) {
    // Only handle shortcuts with modifier keys
    if (e.ctrlKey || e.metaKey) {
        switch (e.key.toLowerCase()) {
            case 'z':
                if (e.shiftKey) {
                    e.preventDefault();
                    redo();
                } else {
                    e.preventDefault();
                    undo();
                }
                break;
            case 'p':
                e.preventDefault();
                preparePdfOrPrint('print');
                break;
            case 's':
                if ($('configTab').classList.contains('active')) {
                    e.preventDefault();
                    $('saveConfigBtn').click();
                }
                break;
            case 'd':
                e.preventDefault();
                toggleDarkMode();
                break;
        }
    }
}

// ===== Validation Functions =====

/**
 * Validate a single input field
 * @param {HTMLInputElement} input - Input to validate
 * @returns {boolean} - Whether the input is valid
 */
function validateInput(input) {
    const errorElement = document.getElementById(input.id + 'Error');
    if (!errorElement) return true;

    let isValid = true, errorMsg = '';
    const min = parseFloat(input.getAttribute('min'));
    const max = parseFloat(input.getAttribute('max'));
    const value = parseFloat(input.value);

    if (input.value === '' || isNaN(value)) {
        isValid = false;
        errorMsg = 'Please enter a valid number';
    } else if (!isNaN(min) && value < min) {
        isValid = false;
        errorMsg = `Minimum value is ${min}`;
    } else if (!isNaN(max) && value > max) {
        isValid = false;
        errorMsg = `Maximum value is ${max}`;
    }

    input.classList.toggle('invalid-input', !isValid);
    if (isValid) {
        errorElement.classList.add('hidden');
    } else {
        errorElement.classList.remove('hidden');
        errorElement.textContent = errorMsg;
    }
    input.setAttribute('aria-invalid', !isValid);

    return isValid;
}

/**
 * Validate all inputs in the form
 * @returns {boolean} - Whether all inputs are valid
 */
function validateAllInputs() {
    let isValid = true;
    document.querySelectorAll('input[type="number"]').forEach(input => {
        if (!validateInput(input)) isValid = false;
    });
    return isValid;
}

/**
 * Initialize validation for all input fields
 */
function initValidation() {
    document.querySelectorAll('input[type="number"]').forEach(input => {
        input.addEventListener('input', () => validateInput(input));
        validateInput(input);
    });
}

// ===== UI Update Functions =====

/**
 * Update profit option classes based on current state
 */
function updateProfitOptionClasses() {
    const customMarkupOption = $('customMarkupOption');
    const optimizeCostOption = $('optimizeCostOption');
    const residualOption = $('residualOption');

    // Reset classes first
    customMarkupOption.classList.remove('active', 'disabled');
    optimizeCostOption.classList.remove('active', 'disabled');
    residualOption.classList.remove('active');

    // Update based on state
    if (state.options.enableAutoCostOptimization) {
        optimizeCostOption.classList.add('active');
        customMarkupOption.classList.add('disabled');
        // Add accessibility attributes
        optimizeCostOption.setAttribute('aria-selected', true);
        customMarkupOption.setAttribute('aria-disabled', true);
    } else if (state.options.useCustomMarkup) {
        customMarkupOption.classList.add('active');
        customMarkupOption.setAttribute('aria-selected', true);
    }

    if (state.options.enableResidualPercentage) {
        residualOption.classList.add('active');
        residualOption.setAttribute('aria-selected', true);
    }
}

/**
 * Update percentage displays in UI
 */
function updatePercentageDisplays() {
    const percentageFields = ['regularSupplies', 'additionalEquipment', 'uniformSafety', 'communications', 'overhead'];
    percentageFields.forEach(field => {
        const percentage = state.options[field + 'Percentage'];
        document.querySelectorAll(`#${field}PercDisplay, #${field}PercDisplay2`).forEach(el => {
            if (el) el.textContent = percentage;
        });
    });
}

/**
 * Update hood price labels
 */
function updateHoodPriceLabels() {
    setContent('largeHoodPrice', `$${state.config.largeHoodPrice} each`);
    setContent('smallHoodPrice', `$${state.config.smallHoodPrice} each`);
}

/**
 * Update insurance details display
 */
function updateInsuranceDetails() {
    setContent('workCompDetails', `$${state.config.workCompRate} per $100 of labor cost`);
    setContent('generalLiabilityDetails', `$${state.config.glRate} per $1,000 of total price`);
}

/**
 * Update commission split input UI
 */
function updateCommissionSplitInputs() {
    const splitsWrapper = $('commissionSplitsWrapper');
    const splitRows = $('splitCommissionRowsContent');

    // Clear existing inputs and rows
    splitsWrapper.innerHTML = '';
    splitRows.innerHTML = '';

    // Create input for each split
    state.options.commissionSplits.forEach((percentage, index) => {
        // Create input field
        const inputContainer = document.createElement('div');
        inputContainer.className = 'percentage-option';
        inputContainer.style.marginBottom = '8px';
        inputContainer.innerHTML = `
            <label for="commissionSplit${index + 1}">Commission ${index + 1}</label>
            <input type="number" id="commissionSplit${index + 1}" min="0" max="100" step="0.1" value="${percentage}" class="commission-split-input">
        `;

        // Add delete button if more than 2 splits
        if (state.options.commissionSplits.length > 2) {
            const deleteBtn = document.createElement('button');
            deleteBtn.innerHTML = '<i class="fas fa-times" aria-hidden="true"></i>';
            deleteBtn.style.marginLeft = '5px';
            deleteBtn.style.background = '#e74c3c';
            deleteBtn.style.color = 'white';
            deleteBtn.style.border = 'none';
            deleteBtn.style.borderRadius = '4px';
            deleteBtn.style.padding = '3px 6px';
            deleteBtn.style.cursor = 'pointer';
            deleteBtn.dataset.index = index;
            deleteBtn.setAttribute('aria-label', `Remove Commission ${index + 1}`);
            deleteBtn.addEventListener('click', function () {
                const idx = parseInt(this.dataset.index);
                state.options.commissionSplits.splice(idx, 1);
                updateCommissionSplitInputs();
                saveSnapshot();
                calculateAll();
            });
            inputContainer.appendChild(deleteBtn);
        }

        splitsWrapper.appendChild(inputContainer);

        // Create result row
        const resultRow = document.createElement('div');
        resultRow.className = 'profit-row commission-split-row';
        resultRow.dataset.index = index + 1;
        resultRow.innerHTML = `
            <div class="label">Commission ${index + 1} (<span class="commission-split-display">${percentage}</span>%):</div>
            <div class="value commission-split-value">$0.00</div>
        `;
        splitRows.appendChild(resultRow);
    });

    // Update totals
    updateCommissionSplitTotals();
}

/**
 * Update commission split totals
 */
function updateCommissionSplitTotals() {
    const totalPercentage = state.options.commissionSplits.reduce((sum, val) => sum + val, 0);
    setContent('totalCommissionSplit', totalPercentage + '%');
    setContent('totalCommissionSplitDisplay', totalPercentage);
}

/**
 * Update commission split display values
 * @param {Array} splitCommissions - Array of commission splits
 */
function updateCommissionSplitDisplay(splitCommissions) {
    splitCommissions.forEach((commission, index) => {
        const rows = document.querySelectorAll('.commission-split-row');
        if (index < rows.length) {
            const percentageDisplay = rows[index].querySelector('.commission-split-display');
            const valueDisplay = rows[index].querySelector('.commission-split-value');

            if (percentageDisplay) percentageDisplay.textContent = commission.percentage;
            if (valueDisplay) valueDisplay.textContent = formatCurrency(commission.amount);

            // Highlight if values changed
            if (valueDisplay) highlightElement(valueDisplay.id || `commission-split-value-${index}`);
        }
    });
}

/**
 * Show notification to user
 * @param {string} message - Message to display
 * @param {string} type - Notification type (success, error, warning)
 * @param {number} [duration=3000] - How long to show the notification
 */
function showNotification(message, type = 'info', duration = 3000) {
    notificationManager.show(message, type, duration);
}

// ===== Tab and Section Management =====

/**
 * Toggle a section's visibility
 * @param {string} sectionId - ID of section to toggle
 * @param {HTMLElement} button - Toggle button
 */
function toggleSection(sectionId, button) {
    const section = $(sectionId);
    const icon = button.querySelector('i');

    if (section.classList.contains('hidden')) {
        section.classList.remove('hidden');
        icon.className = 'fas fa-chevron-up';
        state.ui.sectionStates[sectionId] = 'open';
        button.setAttribute('aria-expanded', 'true');
        section.setAttribute('aria-hidden', 'false');
    } else {
        section.classList.add('hidden');
        icon.className = 'fas fa-chevron-down';
        state.ui.sectionStates[sectionId] = 'closed';
        button.setAttribute('aria-expanded', 'false');
        section.setAttribute('aria-hidden', 'true');
    }
}

/**
 * Show a specific content tab
 * @param {string} contentId - ID of content to show
 */
function showContent(contentId) {
    // Hide all content sections
    document.querySelectorAll('.calculator-content').forEach(section => {
        section.classList.add('hidden');
        section.classList.remove('block');
        section.setAttribute('aria-hidden', 'true');
    });

    // Show requested section
    $(contentId).classList.remove('hidden');
    $(contentId).classList.add('block');
    $(contentId).setAttribute('aria-hidden', 'false');

    // Update tab selection
    document.querySelectorAll('.nav-tab').forEach(tab => {
        tab.classList.remove('active', 'bg-ios-gray-6', 'text-white');
        tab.classList.add('bg-ios-gray-1', 'text-ios-gray-6');
        tab.setAttribute('aria-selected', 'false');
    });

    // Set active tab
    let tabId;
    switch (contentId) {
        case 'quotationContent': tabId = 'quotationTab'; break;
        case 'configContent': tabId = 'configTab'; break;
        default: tabId = 'quotationTab';
    }

    $(tabId).classList.add('active', 'bg-ios-gray-6', 'text-white');
    $(tabId).classList.remove('bg-ios-gray-1', 'text-ios-gray-6');
    $(tabId).setAttribute('aria-selected', 'true');
}

/**
 * Reset calculator to default state
 */
function resetCalculator() {
    if (!confirm('Are you sure you want to reset the calculator? All current data will be lost.')) return;

    // Save UI state and config
    const uiSectionStates = state.ui.sectionStates;
    const isDarkMode = state.ui.isDarkMode;
    const savedConfig = { ...state.config };

    // Reset state to defaults but keep saved config
    Object.assign(state, {
        useSubcontractor: false,
        subcontractorCost: 0,
        workers: 2,
        hours: 4,
        days: 1,
        materialsPerDay: 50,
        equipmentPerDay: 40,
        largeHoods: 0,
        smallHoods: 0,
        hoodCleaningFrequency: 1,
        isHoliday: false,
        outsideHouston: false,
        includeInsurance: true,
        config: savedConfig,
        options: {
            includeTransport: true,
            includeMaterials: true,
            includeEquipment: true,
            enableRounding: true,
            roundingMethod: 'up',
            roundingValue: 50,
            useCustomMarkup: false,
            customMarkupPercentage: 120,
            commissionPercentage: 20,
            enableCommissionSplit: false,
            commissionSplits: [10, 10],
            regularSuppliesPercentage: 6,
            additionalEquipmentPercentage: 2.75,
            uniformSafetyPercentage: 2.5,
            communicationsPercentage: 1,
            overheadPercentage: 5,
            enableInitialFee: false,
            initialFeeValue: 150,
            enableResidualPercentage: false,
            residualPercentageValue: 10,
            enableAutoCostOptimization: false
        },
        ui: {
            sectionStates: uiSectionStates,
            operationalCostsExpanded: false,
            isDarkMode: isDarkMode,
            hasUnsavedConfigChanges: false,
            highlightedElements: new Set(),
            valueHistory: {},
            toastQueue: [],
            quotePDFGenerated: false,
            lastClientInfo: null
        }
    });

    // Reset history
    state.history = {
        snapshots: [],
        currentIndex: -1,
        maxSnapshots: 20
    };

    updateUIFromState();
    calculateAll();
    showContent('quotationContent');
    saveSnapshot();
    updateUnsavedChangesIndicator();
    
    // Reset Work Order button state
    const workOrderBtn = $('generateWorkOrderBtn');
    if (workOrderBtn) {
        workOrderBtn.disabled = true;
        workOrderBtn.title = 'Generate a quote PDF first';
    }
    
    showNotification('Calculator has been reset successfully.', 'success');
}

/**
 * Toggle dark mode styles
 */
function toggleDarkMode() {
    state.ui.isDarkMode = darkModeManager.toggle();
    
    const btn = $('darkModeToggle');
    if (btn) {
        const icon = btn.querySelector('i');
        if (icon) {
            icon.className = state.ui.isDarkMode ? 'fas fa-sun' : 'fas fa-moon';
        }
        btn.setAttribute('aria-pressed', state.ui.isDarkMode);
    }
    
    // Update message based on current mode
    showNotification(`${state.ui.isDarkMode ? 'Dark' : 'Light'} mode activated`, 'info');
}

// ===== Update UI From State =====

/**
 * Update UI to match state values
 */
function updateUIFromState() {
    // Basic fields
    $('useSubcontractor').checked = state.useSubcontractor;
    $('subcontractorDetails').classList.toggle('hidden', !state.useSubcontractor);
    $('subcontractorDetails').classList.toggle('visible', state.useSubcontractor);
    $('subcontractorCost').value = state.subcontractorCost;
    $('workers').value = state.workers;
    $('hours').value = state.hours;
    $('days').value = state.days;
    $('materials').value = state.materialsPerDay;
    $('equipment').value = state.equipmentPerDay;
    $('isHoliday').checked = state.isHoliday;
    $('outsideHouston').checked = state.outsideHouston;
    $('includeInsurance').checked = state.includeInsurance;

    // Hood cleaning
    $('largeHoods').value = state.largeHoods;
    $('smallHoods').value = state.smallHoods;
    $('hoodFrequency').value = state.hoodCleaningFrequency;

    // Config values
    $('regularPayRate').value = state.config.regularPayRate;
    $('supervisorPayRate').value = state.config.supervisorPayRate;
    $('transportCostConfig').value = state.config.transportCostPerDay;
    $('outsideHoustonTransportConfig').value = state.config.outsideHoustonTransportCostPerDay;
    $('largeHoodPriceConfig').value = state.config.largeHoodPrice;
    $('smallHoodPriceConfig').value = state.config.smallHoodPrice;
    $('workCompRate').value = state.config.workCompRate;
    $('glRate').value = state.config.glRate;
    $('payrollTaxRate').value = state.config.payrollTaxRate;
    $('targetCostPercentage').value = state.config.targetCostPercentage;
    $('largeHoodInternalCost').value = state.config.largeHoodInternalCost;
    $('smallHoodInternalCost').value = state.config.smallHoodInternalCost;

    // Update display values
    updateHoodPriceLabels();
    updateInsuranceDetails();

    // Option checkboxes
    $('includeTransport').checked = state.options.includeTransport;
    $('includeMaterials').checked = state.options.includeMaterials;
    $('includeEquipment').checked = state.options.includeEquipment;
    $('enableAutoCostOptimization').checked = state.options.enableAutoCostOptimization;
    $('enableRounding').checked = state.options.enableRounding;
    $('enableCommissionSplit').checked = state.options.enableCommissionSplit;
    $('useCustomMarkup').checked = state.options.useCustomMarkup;
    $('enableInitialFee').checked = state.options.enableInitialFee;
    $('enableResidualPercentage').checked = state.options.enableResidualPercentage;

    // Toggle containers based on options
    setDisplay('splitCommissionContainer', state.options.enableCommissionSplit);
    setDisplay('salesCommissionRow', !state.options.enableCommissionSplit);
    setDisplay('splitCommissionRows', state.options.enableCommissionSplit);
    setDisplay('markupSliderContainer', state.options.useCustomMarkup);
    setDisplay('initialFeeContainer', state.options.enableInitialFee);
    setDisplay('residualPercentageContainer', state.options.enableResidualPercentage);

    // Update profit option visuals
    updateProfitOptionClasses();

    // Update slider and numeric inputs
    $('markupSlider').value = state.options.customMarkupPercentage;
    $('markupInput').value = state.options.customMarkupPercentage;
    $('initialFeeValue').value = state.options.initialFeeValue;
    $('residualPercentageValue').value = state.options.residualPercentageValue;
    $('residualPercentageDisplay').textContent = state.options.residualPercentageValue;
    $('regularSuppliesPercentage').value = state.options.regularSuppliesPercentage;
    $('additionalEquipmentPercentage').value = state.options.additionalEquipmentPercentage;
    $('uniformSafetyPercentage').value = state.options.uniformSafetyPercentage;
    $('communicationsPercentage').value = state.options.communicationsPercentage;
    $('overheadPercentage').value = state.options.overheadPercentage;
    $('commissionPercentage').value = state.options.commissionPercentage;
    $('commissionPercentageDisplay').textContent = state.options.commissionPercentage;

    // Update commission split inputs
    updateCommissionSplitInputs();

    // Update percentage displays
    updatePercentageDisplays();

    // Apply dark mode if enabled
    document.body.classList.toggle('dark-mode', state.ui.isDarkMode);
    if ($('darkModeToggle')) {
        const icon = $('darkModeToggle').querySelector('i');
        if (icon) icon.className = state.ui.isDarkMode ? 'fas fa-sun' : 'fas fa-moon';
        $('darkModeToggle').setAttribute('aria-pressed', state.ui.isDarkMode);
    }

    // Update unsaved changes indicator
    updateUnsavedChangesIndicator();
}

/**
 * Update UI based on subcontractor selection
 * @param {boolean} isSubcontractor - Whether using a subcontractor
 * @param {number} internalCost - Internal cost calculation
 * @param {number} subcontractorCost - Subcontractor cost
 * @param {number} extraBenefit - Extra benefit from using subcontractor
 */
function updateUIForSubcontractor(isSubcontractor, internalCost, subcontractorCost, extraBenefit) {
    if (isSubcontractor) {
        // Cross out internal costs since they're not what we'll actually pay
        document.querySelectorAll('#laborCost, #laborTax, #workCompCost, #transportCost, #materialsCost, #equipmentCost, #hoodCleaningCost')
            .forEach(el => el.classList.add('text-crossed'));

        // Explain they are reference costs for final price calculation
        const costsText = 'Reference cost used for final price calculation';
        setHTML('laborDetails', costsText);
        setHTML('laborTaxDetails', costsText);
        setHTML('workCompDetails', costsText);
        setHTML('transportDetails', costsText);
        setHTML('materialsDetails', costsText);
        setHTML('equipmentDetails', costsText);
        setHTML('hoodCleaningDetails', costsText);

        // Show subcontractor cost and additional benefit
        setContent('subcontractorCostDisplay', formatCurrency(subcontractorCost));
        setContent('extraBenefitValue', formatCurrency(extraBenefit));
        toggleClass('extraBenefitValue', 'text-highlight', extraBenefit > 0);

        // Show clearer text about savings
        setDisplay('extraBenefitRow', true);
        setHTML('extraBenefitDetails', 'Savings from using subcontractor instead of internal team (difference between internal costs and subcontractor cost)');

        // Also show these savings in profit breakdown section
        setDisplay('subcontractorSavingRow', true);
        setContent('subcontractorSaving', formatCurrency(extraBenefit));
    } else {
        // If not using a subcontractor, remove any cross-out styling
        document.querySelectorAll('#laborCost, #laborTax, #workCompCost, #transportCost, #materialsCost, #equipmentCost, #hoodCleaningCost')
            .forEach(el => el.classList.remove('text-crossed'));

        // Generate labor details text
        let laborDetails = '';
        if (state.workers > 0) {
            if (state.days === 1 && state.workers > 1) {
                laborDetails = `${state.workers - 1} workers at ${formatCurrency(state.config.regularPayRate)}/hr × ${state.hours} hrs<br>` +
                    `1 supervisor at ${formatCurrency(state.config.supervisorPayRate)}/hr × ${state.hours} hrs`;
            } else if (state.workers > 0) {
                laborDetails = `${state.workers} workers at ${formatCurrency(state.config.regularPayRate)}/hr × ${state.hours} hrs × ${state.days} days`;
            }

            // Add hood labor costs if there are any hoods
            if (state.largeHoods > 0 || state.smallHoods > 0) {
                laborDetails += `<br>Plus hood cleaning labor costs`;
            }
        } else if (state.largeHoods > 0 || state.smallHoods > 0) {
            laborDetails = `Labor costs for hood cleaning only`;
        }

        // Set details for each row
        setHTML('laborDetails', laborDetails);
        setHTML('laborTaxDetails', "17% mandatory employment taxes on labor");
        setHTML('workCompDetails', `$${state.config.workCompRate} per $100 of labor cost`);

        // Transport details based on location
        let transportDetails = '';
        if (state.options.includeTransport) {
            const transportRate = state.outsideHouston ?
                formatCurrency(state.config.outsideHoustonTransportCostPerDay) :
                formatCurrency(state.config.transportCostPerDay);

            transportDetails = `${transportRate} per day × ${state.days} days`;

            if (state.days > 7) {
                transportDetails += " (with long-term contract discount)";
            }

            if (state.outsideHouston) {
                transportDetails += " - Outside Houston rate";
            }
        } else {
            transportDetails = "Transport cost excluded";
        }
        setHTML('transportDetails', transportDetails);

        // Materials and equipment details
        let materialsDetails = "";
        if (state.options.includeMaterials) {
            materialsDetails = `${formatCurrency(state.materialsPerDay)} per day × ${state.days} days`;

            // Add hood materials if there are any hoods
            if (state.largeHoods > 0 || state.smallHoods > 0) {
                materialsDetails += `<br>Plus materials for hood cleaning`;
            }
        } else {
            materialsDetails = "Materials cost excluded";
        }
        setHTML('materialsDetails', materialsDetails);

        setHTML('equipmentDetails', state.options.includeEquipment ?
            `${formatCurrency(state.equipmentPerDay)} per day × ${state.days} days` :
            "Equipment cost excluded");

        // Hood cleaning details
        let hoodDetails = '';
        if (state.largeHoods > 0) {
            hoodDetails += `${state.largeHoods} large hoods at $${state.config.largeHoodPrice} each<br>`;
        }
        if (state.smallHoods > 0) {
            hoodDetails += `${state.smallHoods} small hoods at $${state.config.smallHoodPrice} each<br>`;
        }
        if (state.hoodCleaningFrequency > 1) {
            hoodDetails += `Frequency: ${state.hoodCleaningFrequency} times (with discount)`;
        }


        setHTML('hoodCleaningDetails', hoodDetails);

        // Hide subcontractor-related rows
        setDisplay('extraBenefitRow', false);
        setDisplay('subcontractorSavingRow', false);
    }
}

// ===== Calculation Engine =====

/**
 * Calculate the required markup percentage to achieve a target grand total
 * @param {number} targetGrandTotal - The desired grand total
 * @returns {number} - The calculated markup percentage
 */
function calculateRequiredMarkup(targetGrandTotal) {
    console.log('calculateRequiredMarkup - Target:', targetGrandTotal);
    
    // Validate target
    if (!targetGrandTotal || isNaN(targetGrandTotal) || targetGrandTotal <= 0) {
        console.error('Invalid target grand total:', targetGrandTotal);
        return 100; // Default markup
    }
    
    // Get all the current values from state
    const {
        useSubcontractor = false, 
        subcontractorCost = 0, 
        workers = 0, 
        hours = 0, 
        days = 0,
        materialsPerDay = 0, 
        equipmentPerDay = 0, 
        largeHoods = 0, 
        smallHoods = 0,
        hoodCleaningFrequency = 0, 
        isHoliday = false, 
        outsideHouston = false, 
        includeInsurance = false
    } = state;
    
    const { config = {}, options = {} } = state;
    
    // Ensure numeric values
    const numWorkers = Number(workers) || 0;
    const numHours = Number(hours) || 0;
    const numDays = Number(days) || 0;
    
    // Calculate all base costs (same as in calculateAll)
    
    // Labor cost
    let laborCost = 0;
    if (!useSubcontractor && numWorkers > 0) {
        const regularPayRate = Number(config.regularPayRate) || 0;
        const supervisorPayRate = Number(config.supervisorPayRate) || 0;
        
        if (numDays === 1 && numWorkers > 1) {
            const regularWorkerCost = (numWorkers - 1) * numHours * regularPayRate;
            const supervisorCost = numHours * supervisorPayRate;
            laborCost = regularWorkerCost + supervisorCost;
        } else {
            laborCost = numWorkers * numHours * numDays * regularPayRate;
        }
    }
    
    // Hood cleaning costs
    const numLargeHoods = Number(largeHoods) || 0;
    const numSmallHoods = Number(smallHoods) || 0;
    const numHoodCleaningFrequency = Number(hoodCleaningFrequency) || 0;
    const largeHoodPrice = Number(config.largeHoodPrice) || 0;
    const smallHoodPrice = Number(config.smallHoodPrice) || 0;
    const largeHoodInternalCost = Number(config.largeHoodInternalCost) || 0;
    const smallHoodInternalCost = Number(config.smallHoodInternalCost) || 0;
    
    const largeHoodCost = numLargeHoods * largeHoodPrice * numHoodCleaningFrequency;
    const smallHoodCost = numSmallHoods * smallHoodPrice * numHoodCleaningFrequency;
    const hoodCleaningCost = largeHoodCost + smallHoodCost;
    
    const largeHoodInternalCostTotal = numLargeHoods * largeHoodInternalCost * numHoodCleaningFrequency;
    const smallHoodInternalCostTotal = numSmallHoods * smallHoodInternalCost * numHoodCleaningFrequency;
    const hoodCleaningInternalCost = largeHoodInternalCostTotal + smallHoodInternalCostTotal;
    
    // Add hood labor to total labor cost
    if (!useSubcontractor && (numLargeHoods > 0 || numSmallHoods > 0)) {
        const regularPayRate = Number(config.regularPayRate) || 0;
        const hoodLaborHours = (numLargeHoods * 4 + numSmallHoods * 3) * numHoodCleaningFrequency;
        const hoodLaborCost = hoodLaborHours * regularPayRate;
        laborCost += hoodLaborCost;
    }
    
    // Labor tax and workers comp
    const payrollTaxRate = Number(config.payrollTaxRate) || 15;
    const workCompRate = Number(config.workCompRate) || 0;
    const laborTax = laborCost * (payrollTaxRate / 100);
    const workCompCost = laborCost * (workCompRate / 100);
    
    // Transport cost
    let transportCost = 0;
    if (options.includeTransport) {
        const transportPerDay = Number(config.transportCostPerDay) || 0;
        const outsideHoustonTransportPerDay = Number(config.outsideHoustonTransportCostPerDay) || 0;
        const baseTransportCost = outsideHouston ? 
            outsideHoustonTransportPerDay : 
            transportPerDay;
        transportCost = baseTransportCost * numDays;
        
        // Apply discounts for long-term contracts
        if (numDays > 21) {
            transportCost *= 0.7;
        } else if (numDays > 7) {
            transportCost *= 0.8;
        }
    }
    
    // Materials and equipment
    const numMaterialsPerDay = Number(materialsPerDay) || 0;
    const numEquipmentPerDay = Number(equipmentPerDay) || 0;
    const materialsCost = options.includeMaterials ? (numMaterialsPerDay * numDays) : 0;
    const equipmentCost = options.includeEquipment ? (numEquipmentPerDay * numDays) : 0;
    
    // Base costs sum
    const baseCosts = laborCost + laborTax + workCompCost + transportCost + 
        materialsCost + equipmentCost;
    
    // Operational costs
    const regularSupplies = Number(options.regularSuppliesPercentage) || 0;
    const additionalEquipment = Number(options.additionalEquipmentPercentage) || 0;
    const uniformSafety = Number(options.uniformSafetyPercentage) || 0;
    const communications = Number(options.communicationsPercentage) || 0;
    const overhead = Number(options.overheadPercentage) || 0;
    
    const operationalCosts = baseCosts * (
        (regularSupplies + 
         additionalEquipment + 
         uniformSafety + 
         communications + 
         overhead) / 100
    );
    
    // Subtotal calculations
    const hoodCleaningProfit = hoodCleaningCost - hoodCleaningInternalCost;
    const internalCostSubtotal = baseCosts + operationalCosts + hoodCleaningInternalCost;
    const subtotal = internalCostSubtotal + hoodCleaningProfit;
    
    // Apply residual percentage
    let adjustedSubtotal = subtotal;
    if (options.enableResidualPercentage) {
        const residualPercentageValue = Number(options.residualPercentageValue) || 0;
        const residualAmount = subtotal * (residualPercentageValue / 100);
        adjustedSubtotal += residualAmount;
    }
    
    // Now calculate backwards from the target grand total
    // Remove initial fee from target
    const initialFeeValue = Number(options.initialFeeValue) || 0;
    const initialFee = options.enableInitialFee ? initialFeeValue : 0;
    let targetBeforeInitialFee = targetGrandTotal - initialFee;
    
    // Remove franchise tax and insurance from the calculation
    // targetBeforeInitialFee = totalPrice + (totalPrice * glRate/1000) + (totalPrice * 0.0075)
    // targetBeforeInitialFee = totalPrice * (1 + glRate/1000 + 0.0075)
    const glRate = Number(config.glRate) || 0;
    const glRateFactor = includeInsurance ? (glRate / 1000) : 0;
    const franchiseTaxRate = 0.0075;
    const totalPriceFactor = 1 + glRateFactor + franchiseTaxRate;
    
    let targetTotalPrice = targetBeforeInitialFee / totalPriceFactor;
    
    // If rounding is enabled, we need to iterate to find the exact value
    if (options.enableRounding) {
        let testPrice = targetTotalPrice;
        let iterations = 0;
        const maxIterations = 100;
        
        while (iterations < maxIterations) {
            const testGrandTotal = testPrice * totalPriceFactor + initialFee;
            const roundedGrandTotal = roundAmount(testGrandTotal, 'up', 50);
            
            if (Math.abs(roundedGrandTotal - targetGrandTotal) < 0.01) {
                break; // Close enough
            }
            
            // Adjust test price
            const diff = targetGrandTotal - roundedGrandTotal;
            testPrice += diff / totalPriceFactor;
            iterations++;
        }
        
        targetTotalPrice = testPrice;
    }
    
    // Remove holiday surcharge to get base price
    let targetAfterMarkup;
    if (isHoliday) {
        targetAfterMarkup = targetTotalPrice / 1.25;
    } else {
        targetAfterMarkup = targetTotalPrice;
    }
    
    // Calculate required markup percentage
    if (adjustedSubtotal <= 0) {
        console.log('WARNING: adjustedSubtotal is 0 or negative:', adjustedSubtotal);
        // If we have no costs but want a specific grand total, we need a very high markup
        if (targetGrandTotal > 0) {
            return 10000; // Very high markup to achieve the target
        }
        return 100; // Default markup if no costs
    }
    
    const requiredMarkup = ((targetAfterMarkup / adjustedSubtotal) - 1) * 100;
    
    console.log('Required markup calculated:', requiredMarkup, {
        targetAfterMarkup,
        adjustedSubtotal,
        laborCost,
        baseCosts,
        operationalCosts
    });
    
    // Check for NaN or invalid values
    if (isNaN(requiredMarkup)) {
        console.error('Markup calculation resulted in NaN', {
            targetGrandTotal,
            targetAfterMarkup,
            adjustedSubtotal
        });
        return 100; // Default fallback
    }
    
    // Return with higher precision for better accuracy
    return Math.max(0, requiredMarkup);
}

/**
 * Apply a manually set grand total by adjusting the markup
 * @param {number} targetGrandTotal - The desired grand total
 */
function applyManualGrandTotal(targetGrandTotal) {
    console.log('applyManualGrandTotal called with:', targetGrandTotal);
    
    // Validate input
    if (!targetGrandTotal || targetGrandTotal <= 0 || isNaN(targetGrandTotal)) {
        console.error('Invalid grand total value:', targetGrandTotal);
        return;
    }
    
    // Store the target for verification
    state.manualGrandTotalTarget = targetGrandTotal;
    
    // Calculate required markup with higher precision
    const requiredMarkup = calculateRequiredMarkup(targetGrandTotal);
    console.log('Required markup calculated:', requiredMarkup);
    
    // Check if markup is valid
    if (isNaN(requiredMarkup) || requiredMarkup < 0) {
        console.error('Invalid markup calculated:', requiredMarkup);
        showNotification('Unable to calculate required markup. Please check your inputs.', 'error');
        return;
    }
    
    // Round the markup to avoid decimals
    const roundedMarkup = Math.round(requiredMarkup);
    
    // Update state with new markup
    state.options.useCustomMarkup = true;
    state.options.customMarkupPercentage = roundedMarkup;
    state.options.enableAutoCostOptimization = false;
    
    // Update UI elements
    $('useCustomMarkup').checked = true;
    $('enableAutoCostOptimization').checked = false;
    $('markupSlider').value = Math.min(1000, roundedMarkup);
    $('markupInput').value = roundedMarkup;
    setDisplay('markupSliderContainer', true);
    
    // Update profit option classes
    updateProfitOptionClasses();
    
    // Save snapshot for undo
    saveSnapshot();
    
    // Recalculate with new markup
    calculateAll();
    
    // Verify the result and fine-tune if necessary
    setTimeout(() => {
        const grandTotalElement = $('grandTotal');
        if (grandTotalElement) {
            const calculatedTotal = extractNumericValue(grandTotalElement.textContent);
            console.log('Calculated total after first pass:', calculatedTotal, 'Target:', targetGrandTotal);
            const diff = Math.abs(calculatedTotal - targetGrandTotal);
            
            // If the difference is significant (more than $1), try to adjust
            if (diff > 1 && calculatedTotal > 0) {
                // Calculate adjustment factor
                const adjustmentFactor = targetGrandTotal / calculatedTotal;
                const adjustedMarkup = Math.round(roundedMarkup * adjustmentFactor);
                
                console.log('Adjusting markup from', roundedMarkup, 'to', adjustedMarkup);
                
                // Apply adjusted markup
                state.options.customMarkupPercentage = adjustedMarkup;
                $('markupInput').value = adjustedMarkup;
                
                // Recalculate once more
                calculateAll();
            }
        }
        
        // Show manual adjustment indicator
        setDisplay('manualAdjustIndicator', true);
        
        // Add a highlight effect to the markup row
        const markupRow = $('markupRow');
        if (markupRow) {
            markupRow.classList.add('ring-2', 'ring-optimize-color', 'ring-opacity-50');
            setTimeout(() => {
                markupRow.classList.remove('ring-2', 'ring-optimize-color', 'ring-opacity-50');
            }, 3000);
        }
    }, 100); // Small delay to ensure DOM is updated
}

/**
 * Perform all calculations and update the UI
 */
function calculateAll() {
    if (!validateAllInputs()) {
        console.log('Validation failed in calculateAll');
        return;
    }

    // Set loading state
    setLoadingState(true);

    // Use setTimeout to allow the browser to update the UI with the loading state
    setTimeout(() => {
        try {
            const {
                useSubcontractor, subcontractorCost, workers, hours, days, materialsPerDay,
                equipmentPerDay, largeHoods, smallHoods, hoodCleaningFrequency,
                isHoliday, outsideHouston, includeInsurance,
                config, options
            } = state;

            // Calculate hood cleaning costs first
            let hoodCleaningCost = 0, hoodCleaningInternalCost = 0, showHoodCleaning = false;

            if (largeHoods > 0 || smallHoods > 0) {
                hoodCleaningCost = ((largeHoods * config.largeHoodPrice) +
                    (smallHoods * config.smallHoodPrice)) * hoodCleaningFrequency;
                
                // Calculate internal cost (what we pay to our provider)
                hoodCleaningInternalCost = ((largeHoods * config.largeHoodInternalCost) +
                    (smallHoods * config.smallHoodInternalCost)) * hoodCleaningFrequency;

                // Apply quantity discount - clearer progression
                if (hoodCleaningFrequency > 1) {
                    // 2x = 5% off, 3x = 10% off, 4x = 15% off, 5x+ = 20% off
                    const discountPercentage = Math.min(20, (hoodCleaningFrequency - 1) * 5);
                    hoodCleaningCost *= (1 - discountPercentage / 100);
                    hoodCleaningInternalCost *= (1 - discountPercentage / 100); // Apply same discount to internal cost
                }

                showHoodCleaning = true;
            }

            // Regular labor cost calculation
            let supervisors = 0, regularWorkers = workers;
            let regularLaborCost = 0;

            if (workers > 0) {
                // Always assign 1 supervisor if there are multiple workers (not just for 1 day)
                if (workers > 1) {
                    supervisors = 1;
                    regularWorkers = workers - 1;
                }

                regularLaborCost = (regularWorkers * config.regularPayRate * hours * days) +
                    (supervisors * config.supervisorPayRate * hours * days);
            }

            // Total labor cost (only regular labor now)
            const laborCost = regularLaborCost;
            const laborTax = laborCost * (config.payrollTaxRate / 100); // Configurable tax on labor costs

            // Worker's Compensation
            const workCompCost = includeInsurance ? (laborCost * config.workCompRate / 100) : 0;

            // Transport cost calculation
            let transportCost = 0;
            if (options.includeTransport) {
                // Choose appropriate transport cost based on location
                const dailyTransportCost = outsideHouston ?
                    config.outsideHoustonTransportCostPerDay : config.transportCostPerDay;
                transportCost = dailyTransportCost * days;

                // Apply discounts for longer contracts (non-compounding)
                if (days > 21) {
                    transportCost *= 0.7; // 30% discount for 21+ days
                } else if (days > 7) {
                    transportCost *= 0.8; // 20% discount for 8-21 days
                }
            }

            // Materials and equipment (regular only)
            const materialsCost = options.includeMaterials ? (materialsPerDay * days) : 0;
            const equipmentCost = options.includeEquipment ? equipmentPerDay * days : 0;

            // Base costs sum (without hood cleaning)
            const baseCosts = laborCost + laborTax + workCompCost + transportCost +
                materialsCost + equipmentCost;

            // Operational costs calculation
            const regularSuppliesCost = baseCosts * (options.regularSuppliesPercentage / 100);
            const additionalEquipmentCost = baseCosts * (options.additionalEquipmentPercentage / 100);
            const uniformSafetyCost = baseCosts * (options.uniformSafetyPercentage / 100);
            const communicationsCost = baseCosts * (options.communicationsPercentage / 100);
            const overheadCost = baseCosts * (options.overheadPercentage / 100);

            // Total operational costs
            const operationalCosts = regularSuppliesCost + additionalEquipmentCost +
                uniformSafetyCost + communicationsCost + overheadCost;

            // Subtotal (now including hood cleaning profit margin)
            const hoodCleaningProfit = hoodCleaningCost - hoodCleaningInternalCost;
            const internalCostSubtotal = baseCosts + operationalCosts + hoodCleaningInternalCost;
            const directCosts = internalCostSubtotal;
            const subtotal = internalCostSubtotal + hoodCleaningProfit;

            // Apply residual percentage
            let residualPercentageAmount = 0;
            let adjustedSubtotal = subtotal;

            if (options.enableResidualPercentage) {
                residualPercentageAmount = subtotal * (options.residualPercentageValue / 100);
                adjustedSubtotal += residualPercentageAmount;
            }

            // Calculate markup percentage
            let markupPercentage = calculateMarkupPercentage(days);

            // Target cost percentage optimization
            const targetCostPercentage = config.targetCostPercentage;
            let isOptimizationActive = false;

            if (options.enableAutoCostOptimization) {
                isOptimizationActive = true;
                // Prevent division by zero and invalid calculations
                if (adjustedSubtotal > 0 && targetCostPercentage > 0 && targetCostPercentage < 100) {
                    markupPercentage = Math.round(((directCosts * 100 / targetCostPercentage) / adjustedSubtotal - 1) * 100);
                    // Validate markup is at least 0
                    markupPercentage = Math.max(0, markupPercentage);
                } else {
                    markupPercentage = 120; // Default fallback
                }
            }

            // Apply markup
            const markup = adjustedSubtotal * (markupPercentage / 100);

            // Total after markup (hood cleaning already included in subtotal)
            const totalAfterMarkup = adjustedSubtotal + markup;
            
            // Holiday surcharge
            const holidaySurcharge = isHoliday ? totalAfterMarkup * 0.25 : 0;

            // Total Price (before any rounding, initial fee, or insurance)
            let totalPrice = totalAfterMarkup + holidaySurcharge;

            // Calculate General Liability Insurance
            const generalLiabilityCost = includeInsurance ? (totalPrice * config.glRate / 1000) : 0;
            
            // Calculate Franchise Tax (0.75% of total price)
            const franchiseTaxCost = totalPrice * 0.0075;

            // Initial Fee
            let initialFeeAmount = options.enableInitialFee ? options.initialFeeValue : 0;

            // Calculate grand total with rounding
            let preRoundingTotal = totalPrice + generalLiabilityCost + franchiseTaxCost + initialFeeAmount;
            let roundingAdjustment = 0;
            let grandTotal = preRoundingTotal;

            if (options.enableRounding) {
                const roundedTotal = roundAmount(preRoundingTotal, 'up', 50);
                roundingAdjustment = roundedTotal - preRoundingTotal;
                grandTotal = roundedTotal;
            }

            // Calculate cost and profit percentages
            let totalCostPercentage = 0;
            let extraBenefit = 0;

            if (useSubcontractor) {
                totalCostPercentage = totalPrice > 0 ? Math.round((subcontractorCost / totalPrice) * 100) : 0;
                extraBenefit = internalCostSubtotal - subcontractorCost;
            } else {
                totalCostPercentage = totalPrice > 0 ? Math.round((directCosts / totalPrice) * 100) : 0;
            }

            const totalProfitPercentage = 100 - totalCostPercentage;
            const isTargetAchieved = (totalCostPercentage === targetCostPercentage);

            // Net profit calculation
            let netProfit = 0;
            if (useSubcontractor) {
                // When using subcontractor, we still have operational costs, insurance and taxes to pay
                netProfit = grandTotal - subcontractorCost - operationalCosts - generalLiabilityCost - franchiseTaxCost;
            } else {
                netProfit = grandTotal - directCosts;
            }

            // Sales commission calculation
            let salesCommission = 0;
            let splitCommissions = [];

            if (options.enableCommissionSplit) {
                // Calculate each split commission - optimize by calculating total first
                const totalCommissionPercentage = options.commissionSplits.reduce((sum, perc) => sum + perc, 0);
                
                // Prevent negative commissions if netProfit is negative
                if (netProfit > 0) {
                    splitCommissions = options.commissionSplits.map(percentage => {
                        const commissionAmount = netProfit * (percentage / 100);
                        return { percentage, amount: commissionAmount };
                    });
                    
                    // Total commission amount
                    salesCommission = netProfit * (totalCommissionPercentage / 100);
                } else {
                    // If no profit, no commission
                    splitCommissions = options.commissionSplits.map(percentage => ({ percentage, amount: 0 }));
                    salesCommission = 0;
                }
            } else {
                // Standard commission - only if there's profit
                salesCommission = netProfit > 0 ? netProfit * (options.commissionPercentage / 100) : 0;
            }

            // Final profit
            const finalCompanyProfit = netProfit - salesCommission;
            
            // Validation warnings
            if (netProfit < 0) {
                showNotification('Warning: Net profit is negative. Consider adjusting markup or reducing costs.', 'warning');
            }
            
            if (markupPercentage < 10) {
                showNotification('Warning: Markup is very low (<10%). This may not be sustainable.', 'warning');
            } else if (markupPercentage > 300) {
                showNotification('Warning: Markup is very high (>300%). This may not be competitive.', 'warning');
            }

            // Save results in state for easier access
            state.results = {
                laborCost,
                laborTax,
                workCompCost,
                transportCost,
                materialsCost,
                equipmentCost,
                hoodCleaningCost,
                operationalCosts,
                subtotal,
                residualPercentageAmount,
                markup,
                markupPercentage,
                holidaySurcharge,
                totalPrice,
                generalLiabilityCost,
                franchiseTaxCost,
                initialFeeAmount,
                roundingAdjustment,
                grandTotal,
                netProfit,
                costPercentage: totalCostPercentage,
                profitPercentage: totalProfitPercentage,
                salesCommission,
                finalCompanyProfit,
                extraBenefit,
                splitCommissions,
                isOptimizationActive,
                isTargetAchieved
            };

            // Update UI based on calculations
            updateUIForSubcontractor(useSubcontractor, internalCostSubtotal, subcontractorCost, extraBenefit);

            // Show/hide rows based on conditions
            setDisplay('holidayRow', isHoliday);
            setDisplay('hoodCleaningRow', showHoodCleaning);
            setDisplay('roundingRow', options.enableRounding);
            setDisplay('initialFeeRow', options.enableInitialFee);
            setDisplay('residualPercentageRow', options.enableResidualPercentage);
            setDisplay('workCompRow', includeInsurance);
            setDisplay('generalLiabilityRow', includeInsurance);
            setDisplay('grandTotalRow', true); // Always show
            setDisplay('salesCommissionRow', !options.enableCommissionSplit);
            setDisplay('splitCommissionRows', options.enableCommissionSplit);

            // Update split commission displays
            if (options.enableCommissionSplit) {
                updateCommissionSplitDisplay(splitCommissions);
                const totalSplitPercent = options.commissionSplits.reduce((sum, value) => sum + value, 0);
                setContent('totalCommissionSplitDisplay', totalSplitPercent);
                setContent('totalSplitCommission', formatCurrency(salesCommission));
            }

            // Show/hide optimization indicators
            setDisplay('optimizationBadge', isOptimizationActive);
            setDisplay('targetAchievedBadge', isTargetAchieved);

            // Update operational costs display
            setContent('operationalCostsValue', formatCurrency(operationalCosts));
            setContent('regularSuppliesValue', formatCurrency(regularSuppliesCost));
            setContent('additionalEquipmentValue', formatCurrency(additionalEquipmentCost));
            setContent('uniformSafetyValue', formatCurrency(uniformSafetyCost));
            setContent('communicationsValue', formatCurrency(communicationsCost));
            setContent('overheadValue', formatCurrency(overheadCost));

            if (options.enableInitialFee) {
                setContent('initialFeeAmount', formatCurrency(initialFeeAmount));
            }

            if (options.enableResidualPercentage) {
                setContent('residualPercentageDisplay', options.residualPercentageValue);
                setContent('residualPercentageAmount', formatCurrency(residualPercentageAmount));
            }

            // Display rounding details
            if (options.enableRounding) {
                setHTML('roundingDetails', 'Rounding Grand Total up to the next $50');
            }

            // Subcontractor UI updates
            setDisplay('subcontractorRow', useSubcontractor);
            setDisplay('extraBenefitRow', useSubcontractor);

            // Operational costs details display
            setDisplay('operationalCostsDetails', $('operationalCostsRow').classList.contains('expanded'));
            setDisplay('regularSuppliesRow', !useSubcontractor, 'flex');
            setDisplay('additionalEquipmentRow', !useSubcontractor, 'flex');
            setDisplay('uniformSafetyRow', !useSubcontractor, 'flex');

            // Cost percentage display
            setContent('totalCostPercentage', `${totalCostPercentage}%`);
            setContent('totalProfitPercentage', `${totalProfitPercentage}%`);
            $('costPercentageFill').style.width = `${totalCostPercentage}%`;
            $('costPercentageFill').setAttribute('aria-valuenow', totalCostPercentage);
            setContent('percentageTextOverlay', `${totalCostPercentage}%`);

            // Update total and grand total
            setContent('totalPrice', formatCurrency(totalPrice));
            setContent('generalLiabilityCost', formatCurrency(generalLiabilityCost));
            setContent('franchiseTaxCost', formatCurrency(franchiseTaxCost));
            setContent('workCompCost', formatCurrency(workCompCost));
            setContent('roundingAdjustment', formatCurrency(roundingAdjustment));
            setContent('grandTotal', formatCurrency(grandTotal));

            // Update cost display
            setContent('laborCost', formatCurrency(laborCost));
            setContent('laborTax', formatCurrency(laborTax));
            setContent('transportCost', formatCurrency(transportCost));
            setContent('materialsCost', formatCurrency(materialsCost));
            setContent('equipmentCost', formatCurrency(equipmentCost));
            setContent('hoodCleaningCost', formatCurrency(hoodCleaningCost));
            setContent('subtotal', formatCurrency(subtotal));
            setContent('markup', formatCurrency(markup));
            setContent('markupPercentage', Math.round(markupPercentage));
            setContent('profitMarkupPercentage', Math.round(markupPercentage));
            setContent('holidaySurcharge', formatCurrency(holidaySurcharge));
            setContent('netProfit', formatCurrency(netProfit));
            setContent('salesCommission', formatCurrency(salesCommission));
            setContent('finalCompanyProfit', formatCurrency(finalCompanyProfit));
            setContent('profitMarkup', formatCurrency(markup));
            
            // Add animation to final profit when it updates
            const profitElement = $('finalCompanyProfit');
            profitElement.classList.remove('updated');
            void profitElement.offsetWidth; // Force reflow
            profitElement.classList.add('updated');

            // Set color of cost percentage bar based on value
            if (totalCostPercentage > 75) {
                $('costPercentageFill').style.backgroundColor = '#e74c3c';
            } else if (totalCostPercentage > 65) {
                $('costPercentageFill').style.backgroundColor = '#f39c12';
            } else {
                $('costPercentageFill').style.backgroundColor = '#27ae60';
            }

            // Special coloring for 62% target
            if (isTargetAchieved) {
                $('costPercentageFill').style.backgroundColor = 'var(--optimize-color)';
            }

            // Set markup details text based on option
            let markupDetailsText = '';
            if (isOptimizationActive) {
                markupDetailsText = 'Automatically optimized for 62% cost ratio';
                $('markupRow').classList.add('optimization-active');
            } else if (options.useCustomMarkup) {
                markupDetailsText = 'Using custom markup percentage';
                $('markupRow').classList.remove('optimization-active');
            } else {
                markupDetailsText = `Calculated based on contract length of ${days} days`;
                $('markupRow').classList.remove('optimization-active');
            }
            setHTML('markupDetails', markupDetailsText);

            // No highlighting - clean iOS style

            // Clear loading state
            setLoadingState(false);
        } catch (error) {
            console.error("Calculation error:", error);
            setLoadingState(false);
            
            // Provide more specific error messages
            let errorMessage = "There was an error during calculation. ";
            if (error.message.includes('toFixed')) {
                errorMessage += "Invalid numeric value detected.";
            } else if (error.message.includes('undefined')) {
                errorMessage += "Missing required data.";
            } else {
                errorMessage += "Please check your inputs and try again.";
            }
            
            showNotification(errorMessage, "error");
            
            // Reset results to prevent showing incorrect data
            Object.keys(state.results).forEach(key => {
                if (typeof state.results[key] === 'number') {
                    state.results[key] = 0;
                }
            });
        }
    }, 100); // Small delay to allow the loading indicator to render
}

// ===== PDF and Print Functions =====

/**
 * Prepare for PDF generation or printing
 * @param {string} mode - 'pdf' or 'print'
 */
async function preparePdfOrPrint(mode) {
    // Add date stamp for printing (check if element exists first)
    const summaryContent = document.querySelector('#summaryContent');
    if (summaryContent) {
        summaryContent.setAttribute('data-print-date', new Date().toLocaleDateString());
    }

    if (mode === 'print') {
        // Show print preview modal first
        showPrintPreview();
    } else if (mode === 'pdf') {
        // Show client info modal instead of generating PDF directly
        showClientInfoModal();
    }
}

/**
 * Show print preview modal
 */
function showPrintPreview() {
    // Check if modal exists
    let modal = $('printPreviewModal');

    // Create modal if it doesn't exist
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'printPreviewModal';
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <span class="close-modal" aria-label="Close preview">&times;</span>
                <h2>Print Preview</h2>
                <p>Your quote is ready to print.</p>
                <div id="printPreviewContent"></div>
                <div class="modal-actions">
                    <button id="confirmPrintBtn" class="action-btn print-btn">
                        <i class="fas fa-print" aria-hidden="true"></i> Print Quote
                    </button>
                    <button class="action-btn" id="cancelPrintBtn">
                        Cancel
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        // Add event listeners for the new modal
        modal.querySelector('.close-modal').addEventListener('click', () => {
            modal.classList.remove('visible');
            setTimeout(() => { modal.style.display = 'none'; }, 300);
        });

        modal.querySelector('#cancelPrintBtn').addEventListener('click', () => {
            modal.classList.remove('visible');
            setTimeout(() => { modal.style.display = 'none'; }, 300);
        });

        modal.querySelector('#confirmPrintBtn').addEventListener('click', () => {
            modal.classList.remove('visible');
            setTimeout(() => {
                modal.style.display = 'none';
                window.print();
            }, 300);
        });
    }

    // If modal already exists, ensure event listeners are attached
    else {
        // Re-attach event listeners in case they were lost
        const closeBtn = modal.querySelector('.close-modal');
        const cancelBtn = modal.querySelector('#cancelPrintBtn');
        const confirmBtn = modal.querySelector('#confirmPrintBtn');
        
        // Remove old listeners and add new ones
        if (closeBtn) {
            closeBtn.onclick = () => {
                modal.classList.remove('visible');
                setTimeout(() => { modal.style.display = 'none'; }, 300);
            };
        }
        
        if (cancelBtn) {
            cancelBtn.onclick = () => {
                modal.classList.remove('visible');
                setTimeout(() => { modal.style.display = 'none'; }, 300);
            };
        }
        
        if (confirmBtn) {
            confirmBtn.onclick = () => {
                modal.classList.remove('visible');
                setTimeout(() => {
                    modal.style.display = 'none';
                    window.print();
                }, 300);
            };
        }
    }

    // Clone summary content for preview
    const previewContent = modal.querySelector('#printPreviewContent');
    if (previewContent) {
        previewContent.innerHTML = '';

        const contentClone = $('summaryContent').cloneNode(true);

        // Remove action buttons from clone
        const actionButtons = contentClone.querySelector('.action-buttons');
        if (actionButtons) {
            actionButtons.remove();
        }

        previewContent.appendChild(contentClone);
    }

    // Show the modal
    modal.style.display = 'block';
    setTimeout(() => modal.classList.add('visible'), 10);
}

/**
 * Load export libraries (jsPDF and html2canvas)
 */
async function loadExportLibraries() {
    return new Promise((resolve, reject) => {
        // Check if libraries are already loaded
        if (typeof window.jspdf !== 'undefined' && typeof window.html2canvas !== 'undefined') {
            resolve();
            return;
        }
        
        // Libraries are included via CDN in HTML, wait for them to load
        let attempts = 0;
        const checkInterval = setInterval(() => {
            attempts++;
            const jsPdfLoaded = typeof window.jspdf !== 'undefined';
            const html2canvasLoaded = typeof window.html2canvas !== 'undefined';
            
            if (jsPdfLoaded && html2canvasLoaded) {
                clearInterval(checkInterval);
                resolve();
            } else if (attempts > 50) { // Increased attempts for slower connections
                clearInterval(checkInterval);
                console.error('Failed to load export libraries after 5 seconds');
                reject(new Error('Failed to load export libraries. Please check your internet connection.'));
            }
        }, 100);
    });
}

/**
 * Show client information modal
 */
function showClientInfoModal() {
    const modal = $('clientInfoModal');
    if (!modal) return;
    
    // Clear form
    $('clientInfoForm').reset();
    
    // Remove any extra sales person rows
    const container = $('salesTeamContainer');
    const extraRows = container.querySelectorAll('.sales-person-row:not(:first-child)');
    extraRows.forEach(row => row.remove());
    
    // Show modal
    modal.style.display = 'flex';
    setTimeout(() => {
        modal.classList.add('visible');
        $('companyName').focus();
    }, 10);
}

/**
 * Add sales person row
 */
function addSalesPersonRow() {
    const container = $('salesTeamContainer');
    const rowCount = container.querySelectorAll('.sales-person-row').length + 1;
    
    const newRow = document.createElement('div');
    newRow.className = 'sales-person-row mb-2';
    newRow.innerHTML = `
        <div class="flex items-center gap-2">
            <div class="flex-1">
                <label for="salesPerson${rowCount}" class="block text-sm font-medium text-ios-gray-6 mb-1">Sales Person ${rowCount}</label>
                <input type="text" id="salesPerson${rowCount}" name="salesPerson[]"
                    class="w-full px-3 py-2 bg-ios-gray-1 rounded-xl border-0 focus:outline-none focus:ring-2 focus:ring-brand-blue transition-colors duration-200"
                    placeholder="Enter sales person name">
            </div>
            <button type="button" class="remove-sales-person mt-6 p-2 text-danger-red hover:bg-ios-gray-1 rounded-lg" title="Remove">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;
    
    container.appendChild(newRow);
    
    // Add remove event listener
    newRow.querySelector('.remove-sales-person').addEventListener('click', function() {
        newRow.remove();
        // Renumber remaining rows
        updateSalesPersonNumbers();
    });
}

/**
 * Update sales person row numbers
 */
function updateSalesPersonNumbers() {
    const container = $('salesTeamContainer');
    const rows = container.querySelectorAll('.sales-person-row');
    
    rows.forEach((row, index) => {
        const label = row.querySelector('label');
        const input = row.querySelector('input');
        const num = index + 1;
        
        if (label) {
            label.textContent = `Sales Person ${num}`;
            label.setAttribute('for', `salesPerson${num}`);
        }
        if (input) {
            input.id = `salesPerson${num}`;
        }
    });
}

/**
 * Show work order modal
 */
function showWorkOrderModal() {
    const modal = $('workOrderModal');
    if (!modal) return;
    
    // Check if quote PDF has been generated
    if (!state.ui.quotePDFGenerated || !state.ui.lastClientInfo) {
        showNotification('Please generate a quote PDF first with client information', 'warning');
        return;
    }
    
    // Clear form
    $('workOrderForm').reset();
    
    // Reset services to default single service
    workOrderServiceId = 2;
    $('workOrderServicesContainer').innerHTML = `
        <div class="work-order-service-item bg-ios-gray-1 rounded-xl p-4" data-service-id="1">
            <div class="flex items-start justify-between gap-3">
                <div class="flex-1 space-y-3">
                    <div>
                        <label class="block text-sm font-medium text-ios-gray-6 mb-1">Service Title <span class="text-danger-red">*</span></label>
                        <input type="text" required class="work-order-service-title w-full px-3 py-2 bg-white rounded-xl border-0 focus:outline-none focus:ring-2 focus:ring-brand-blue transition-colors duration-200" placeholder="e.g., Detail Cleaning" value="">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-ios-gray-6 mb-1">Service Description <span class="text-danger-red">*</span></label>
                        <textarea required class="work-order-service-description w-full px-3 py-2 bg-white rounded-xl border-0 focus:outline-none focus:ring-2 focus:ring-brand-blue transition-colors duration-200 resize-none" rows="3" placeholder="Describe the service scope..."></textarea>
                    </div>
                </div>
                <button type="button" class="remove-work-order-service-btn p-2 text-danger-red hover:bg-danger-red hover:bg-opacity-10 rounded-lg transition-colors" aria-label="Remove service">
                    <i class="fas fa-trash-alt"></i>
                </button>
            </div>
        </div>
    `;
    
    // Update preview with data from last PDF generation
    const companyName = state.ui.lastClientInfo.companyName || 'Not specified';
    const grandTotal = $('grandTotal').textContent || '$0.00';
    
    $('woPreviewCompany').textContent = companyName;
    $('woPreviewService').textContent = '-';
    $('woPreviewTotal').textContent = grandTotal;
    $('woPreviewNumber').textContent = 'Will be generated';
    
    // Show modal
    modal.style.display = 'flex';
    setTimeout(() => {
        modal.classList.add('visible');
        const firstServiceTitle = document.querySelector('.work-order-service-title');
        if (firstServiceTitle) firstServiceTitle.focus();
    }, 10);
}

/**
 * Generate unique work order number
 */
function generateWorkOrderNumber() {
    // Format: 1000516YYYYM where YYYY is year and M is a sequential number
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    
    return `10005${year}${month}${day}${random}`;
}

/**
 * Generate a PDF of the quote
 */
async function generatePDF(clientInfo = null) {
    // Show loading notification
    showNotification("Loading PDF generator...", "info");
    
    try {
        // Load libraries if not already loaded
        await loadExportLibraries();
        
        // Debug: Check what's available
        console.log('Library check:', {
            'window.jspdf': typeof window.jspdf,
            'window.jspdf.jsPDF': window.jspdf ? typeof window.jspdf.jsPDF : 'N/A',
            'window.html2canvas': typeof window.html2canvas
        });
        
        // Check if libraries are available after loading
        const jsPdfAvailable = typeof window.jspdf !== 'undefined' && window.jspdf.jsPDF;
        const html2canvasAvailable = typeof window.html2canvas !== 'undefined';
        
        if (!jsPdfAvailable || !html2canvasAvailable) {
            throw new Error('Failed to load required libraries');
        }
    } catch (error) {
        console.error('Failed to load export libraries:', error);
        showNotification("Failed to load PDF generator. Please check your internet connection.", "error");
        return;
    }

    // Generate PDF when libraries are available
    showNotification("Preparing PDF...", "info");

    try {
            // Get the original summary content element
            const originalSummary = document.querySelector('#summaryContent');
            if (!originalSummary) {
                throw new Error('Summary content not found');
            }

            // Hide action buttons temporarily
            const actionButtons = originalSummary.querySelector('.action-buttons');
            if (actionButtons) {
                actionButtons.style.display = 'none';
            }
            
            // Force calculation update to ensure all values are current
            calculateAll();

            // Create quote number
            const quoteNumber = 'PFS-' + new Date().getFullYear() + '-' + Math.floor(Math.random() * 10000).toString().padStart(4, '0');

            // Create and format current date
            const currentDate = new Date();
            const formattedDate = currentDate.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });

            // Set up PDF document
            const doc = new window.jspdf.jsPDF({
                orientation: 'p',
                unit: 'pt',
                format: 'a4',
                compress: true
            });

            // Define colors
            const brandBlue = '#03143A';
            const brandRed = '#C70532';

            // Add logo and header
            doc.setFillColor(brandBlue);
            doc.rect(0, 0, doc.internal.pageSize.getWidth(), 80, 'F');

            doc.setTextColor(255);
            doc.setFontSize(22);
            doc.setFont('helvetica', 'bold');
            doc.text('Prime Facility Services Group', 40, 35);

            doc.setFontSize(16);
            doc.setFont('helvetica', 'normal');
            doc.text('Professional Kitchen Cleaning Quote', 40, 60);

            // Add quote details
            doc.setTextColor(80);
            doc.setFillColor(245, 245, 245);
            doc.rect(0, 80, doc.internal.pageSize.getWidth(), 60, 'F');

            doc.setFontSize(12);
            doc.text(`Quote #: ${quoteNumber}`, 40, 100);
            doc.text(`Date: ${formattedDate}`, 40, 120);
            doc.text(`Valid until: ${new Date(currentDate.setMonth(currentDate.getMonth() + 1)).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            })}`, 300, 100);
            
            
            // Add client information section if available
            let yPosition = 160;
            if (clientInfo && clientInfo.companyName) {
                // Use a more compact design with two columns
                doc.setFillColor(250, 250, 250);
                doc.rect(0, 140, doc.internal.pageSize.getWidth(), 70, 'F');
                
                doc.setFontSize(13);
                doc.setFont('helvetica', 'bold');
                doc.setTextColor(brandBlue);
                doc.text('Quote For:', 40, 160);
                
                doc.setFontSize(11);
                doc.setFont('helvetica', 'normal');
                doc.setTextColor(80);
                
                // Left column
                doc.setFont('helvetica', 'bold');
                doc.text(clientInfo.companyName, 40, 175);
                doc.setFont('helvetica', 'normal');
                
                if (clientInfo.serviceLocation) {
                    doc.setFontSize(10);
                    doc.text(clientInfo.serviceLocation, 40, 188);
                }
                
                // Right column - contact info
                let rightX = 320;
                let rightY = 160;
                
                if (clientInfo.contactName || clientInfo.contactPosition) {
                    doc.setFontSize(10);
                    doc.setFont('helvetica', 'bold');
                    doc.text('Contact:', rightX, rightY);
                    doc.setFont('helvetica', 'normal');
                    rightY += 15;
                    
                    if (clientInfo.contactName) {
                        doc.text(clientInfo.contactName + (clientInfo.contactPosition ? ` - ${clientInfo.contactPosition}` : ''), rightX, rightY);
                        rightY += 13;
                    }
                }
                
                if (clientInfo.contactPhone) {
                    doc.setFontSize(10);
                    doc.text(clientInfo.contactPhone, rightX, rightY);
                    rightY += 13;
                }
                
                if (clientInfo.contactEmail) {
                    doc.setFontSize(10);
                    doc.text(clientInfo.contactEmail, rightX, rightY);
                    rightY += 13;
                }
                
                // Sales team at the bottom if exists
                if (clientInfo.salesTeam && clientInfo.salesTeam.length > 0) {
                    doc.setFontSize(10);
                    doc.setFont('helvetica', 'italic');
                    doc.text(`Sales: ${clientInfo.salesTeam.join(', ')}`, 40, 200);
                }
                
                yPosition = 220; // Much more compact, saves about 50pt of vertical space
            }
            

            // Wait a bit for content to settle
            setTimeout(() => {
                // Get the actual dimensions of the content
                const scrollHeight = originalSummary.scrollHeight;
                const clientHeight = originalSummary.clientHeight;
                
                // Use html2canvas to render the original element directly
                window.html2canvas(originalSummary, {
                    scale: 2,
                    useCORS: true,
                    logging: false,
                    backgroundColor: 'white',
                    scrollY: -window.scrollY,
                    windowWidth: originalSummary.scrollWidth,
                    windowHeight: scrollHeight
                }).then(canvas => {
                    // Restore action buttons
                    if (actionButtons) {
                        actionButtons.style.display = '';
                    }
                    
                    // Add quote content
                    const imgData = canvas.toDataURL('image/png');
                    const imgWidth = 520;
                    const imgHeight = canvas.height * imgWidth / canvas.width;

                // Calculate if we need multiple pages
                const pageHeight = doc.internal.pageSize.getHeight();
                const pageWidth = doc.internal.pageSize.getWidth();
                // yPosition is already set based on whether client info was added
                
                // Calculate available space for content
                const availableHeight = pageHeight - yPosition - 180; // Leave space for terms & footer
                
                // If image is too tall, scale it down to fit
                if (imgHeight > availableHeight) {
                    const scaleFactor = availableHeight / imgHeight;
                    const scaledWidth = imgWidth * scaleFactor;
                    const scaledHeight = imgHeight * scaleFactor;
                    doc.addImage(imgData, 'PNG', 40, yPosition, scaledWidth, scaledHeight);
                    yPosition = yPosition + scaledHeight + 20;
                } else {
                    // Image fits with original size
                    doc.addImage(imgData, 'PNG', 40, yPosition, imgWidth, imgHeight);
                    yPosition = yPosition + imgHeight + 20;
                }

                // Add Terms & Conditions
                if (yPosition + 120 > pageHeight) {
                    doc.addPage();
                    yPosition = 40;
                }
                
                // Add terms and conditions (more compact)
                doc.setFillColor(245, 245, 245);
                doc.rect(40, yPosition, 520, 60, 'F');

                doc.setFontSize(9);
                doc.setTextColor(80);
                doc.setFont('helvetica', 'bold');
                doc.text('Terms & Conditions:', 50, yPosition + 15);

                doc.setFont('helvetica', 'normal');
                doc.setFontSize(8);
                doc.text('This quote is valid for 30 days. Payment terms: 50% deposit, balance due upon completion.', 50, yPosition + 30);
                doc.text('All services are subject to our standard terms and conditions. Contact us to schedule your service.', 50, yPosition + 45);

                // Add contact information at the bottom of the current page
                doc.setDrawColor(200);
                doc.line(40, pageHeight - 60, pageWidth - 40, pageHeight - 60);

                doc.setFontSize(9);
                doc.setTextColor(100);
                doc.text('Prime Facility Services Group | Phone: (877) 312-4924 | Email: marketing@primefacilityservicesgroup.com', pageWidth / 2, pageHeight - 40, { align: 'center' });
                doc.text('www.primefacilityservicesgroup.com', pageWidth / 2, pageHeight - 25, { align: 'center' });
                
                // Add developer credit subtly
                doc.setFontSize(7);
                doc.setTextColor(150);
                doc.text('Designed and developed by Christian Reyes', pageWidth / 2, pageHeight - 10, { align: 'center' });

                // Save the PDF
                doc.save(`kitchen-cleaning-quote-${quoteNumber}.pdf`);
                
                // Mark that quote PDF has been generated and enable Work Order button
                state.ui.quotePDFGenerated = true;
                const workOrderBtn = $('generateWorkOrderBtn');
                if (workOrderBtn) {
                    workOrderBtn.disabled = false;
                    workOrderBtn.title = 'Generate Work Order for this quote';
                }

                showNotification("PDF generated successfully! You can now generate a Work Order.", "success");
                }).catch(err => {
                    // Restore action buttons on error
                    if (actionButtons) {
                        actionButtons.style.display = '';
                    }
                    console.error('Error generating PDF:', err);
                    showNotification("Error generating PDF. Please try again.", "error");
                });
            }, 500); // Wait 500ms for content to render
        } catch (error) {
            console.error('PDF generation error:', error);
            showNotification("PDF generation failed. Please try printing instead.", "error");
        }
}

/**
 * Capture screenshot of summary section
 */
async function captureScreenshot() {
    try {
        // Show loading notification
        showNotification("Loading screenshot tool...", "info");
        
        // Load libraries if not already loaded
        await loadExportLibraries();
        
        // Check if html2canvas is available
        if (typeof window.html2canvas === 'undefined') {
            throw new Error('Failed to load html2canvas library');
        }

        // Show loading notification
        showNotification("Creating screenshot...", "info");

        // Get the quote summary section
        const element = document.getElementById('summaryContent');

        // Use html2canvas to create a screenshot
        window.html2canvas(element, {
            scale: 2,
            useCORS: true,
            logging: false,
            allowTaint: false,
            backgroundColor: 'white'
        }).then(canvas => {
            // Show the modal
            const modal = document.getElementById('screenshotModal');
            modal.style.display = 'block';
            setTimeout(() => modal.classList.add('visible'), 10);

            // Clear previous screenshot
            const container = document.getElementById('screenshotContainer');
            container.innerHTML = '';

            // Add the canvas to the modal
            canvas.style.width = '100%';
            canvas.style.height = 'auto';
            canvas.style.borderRadius = '8px';
            canvas.style.boxShadow = '0 4px 15px rgba(0,0,0,0.2)';
            container.appendChild(canvas);

            // Set up download link
            const downloadLink = document.getElementById('downloadLink');

            // Create quote number for filename
            const quoteNumber = 'PFS-' + new Date().getFullYear() + '-' + Math.floor(Math.random() * 10000).toString().padStart(4, '0');

            // Set download attributes
            downloadLink.href = canvas.toDataURL('image/png');
            downloadLink.download = `kitchen-cleaning-quote-${quoteNumber}.png`;

            showNotification("Screenshot created successfully!", "success");
        }).catch(error => {
            console.error('Screenshot error:', error);
            showNotification("Error creating screenshot. Please try printing instead.", "error");
        });
    } catch (error) {
        console.error('Screenshot error:', error);
        showNotification("Error creating screenshot. Please try printing instead.", "error");
    }
}

// ===== Application Initialization =====

/**
 * Add loading indicator to the page
 */
function addLoadingIndicator() {
    // Create loading indicator if it doesn't exist
    if (!document.querySelector('.loading-indicator')) {
        const loadingIndicator = document.createElement('div');
        loadingIndicator.className = 'loading-indicator';
        loadingIndicator.setAttribute('role', 'progressbar');
        loadingIndicator.setAttribute('aria-busy', 'true');
        loadingIndicator.setAttribute('aria-label', 'Loading...');
        document.body.appendChild(loadingIndicator);
    }
}

/**
 * Create undo/redo buttons if they don't exist
 */
function addUndoRedoButtons() {
    // Check if buttons already exist
    if ($('undoBtn')) return;

    // Find the button container (where reset and dark mode buttons are)
    const buttonContainer = $('darkModeToggle')?.parentElement;
    if (!buttonContainer) return;

    // Create undo button
    const undoBtn = document.createElement('button');
    undoBtn.id = 'undoBtn';
    undoBtn.className = 'flex items-center justify-center w-10 h-10 rounded-lg text-gray-600 hover:bg-ios-gray-2 text-sm transition-all hover:shadow-sm active:scale-95';
    undoBtn.disabled = true;
    undoBtn.setAttribute('aria-disabled', true);
    undoBtn.setAttribute('aria-label', 'Undo last change');
    undoBtn.setAttribute('title', 'Undo');
    undoBtn.innerHTML = '<i class="fas fa-undo"></i>';
    undoBtn.addEventListener('click', undo);

    // Create redo button
    const redoBtn = document.createElement('button');
    redoBtn.id = 'redoBtn';
    redoBtn.className = 'flex items-center justify-center w-10 h-10 rounded-lg text-gray-600 hover:bg-ios-gray-2 text-sm transition-all hover:shadow-sm active:scale-95';
    redoBtn.disabled = true;
    redoBtn.setAttribute('aria-disabled', true);
    redoBtn.setAttribute('aria-label', 'Redo last change');
    redoBtn.setAttribute('title', 'Redo');
    redoBtn.innerHTML = '<i class="fas fa-redo"></i>';
    redoBtn.addEventListener('click', redo);

    // Add buttons before the reset button
    buttonContainer.insertBefore(undoBtn, $('resetBtn'));
    buttonContainer.insertBefore(redoBtn, $('resetBtn'));
}

/**
 * Add or update accessibility attributes
 */
function enhanceAccessibility() {
    // Add proper roles to main elements
    const container = document.querySelector('.container');
    if (container) container.setAttribute('role', 'application');

    // Add accessibility attributes to form elements
    document.querySelectorAll('input, select').forEach(el => {
        if (!el.hasAttribute('aria-label') && !el.getAttribute('id')) {
            const label = el.closest('.input-field')?.querySelector('label');
            if (label) {
                el.setAttribute('aria-label', label.textContent);
            }
        }
    });

    // Make expandable sections accessible
    document.querySelectorAll('.toggle-section').forEach(btn => {
        const targetId = btn.getAttribute('data-target');
        const target = $(targetId);

        if (target && btn) {
            btn.setAttribute('aria-expanded', !target.classList.contains('hidden-section'));
            btn.setAttribute('aria-controls', targetId);
            target.setAttribute('aria-hidden', target.classList.contains('hidden-section'));
        }
    });

    // Enhance options accessibility
    document.querySelectorAll('.profit-option').forEach(option => {
        option.setAttribute('role', 'option');
        if (option.classList.contains('active')) {
            option.setAttribute('aria-selected', 'true');
        }
        if (option.classList.contains('disabled')) {
            option.setAttribute('aria-disabled', 'true');
        }
    });

    // Make tooltips accessible
    document.querySelectorAll('.tooltip').forEach(tooltip => {
        tooltip.setAttribute('role', 'tooltip');
        tooltip.setAttribute('tabindex', '0');
    });
}

/**
 * Initialize the application
 */
function initApp() {
    // Initialize debouncedCalculate
    debouncedCalculate = debounce(() => {
        calculateAll();
    }, 150);
    
    // Add loading indicator
    addLoadingIndicator();

    // Add undo/redo buttons
    addUndoRedoButtons();

    // Initialize event listeners
    initEventListeners();

    // Initialize validation
    initValidation();

    // Enhance accessibility
    enhanceAccessibility();

    // Update UI labels from config
    updateHoodPriceLabels();

    // Start with light mode by default
    // Initialize dark mode from manager
    state.ui.isDarkMode = darkModeManager.isDarkMode;
    if ($('darkModeToggle')) {
        const icon = $('darkModeToggle').querySelector('i');
        if (icon) {
            icon.className = state.ui.isDarkMode ? 'fas fa-sun' : 'fas fa-moon';
        }
        $('darkModeToggle').setAttribute('aria-pressed', state.ui.isDarkMode);
    }

    // Perform initial calculation
    calculateAll();

    // Check for missing required libraries after a delay to allow CDN loading
    setTimeout(() => {
        const support = checkBrowserSupport();
        if (!support.html2canvas || !support.jsPDF) {
            console.warn('Some export libraries not loaded. PDF or screenshot functionality may be limited.');
        }
    }, 1000);

    // Welcome notification for first-time users
    try {
        if (!localStorage.getItem('welcomeShown')) {
            setTimeout(() => {
                showNotification("Welcome to the Kitchen Cleaning Calculator! Enter your details and get an instant quote.", "info", 6000);
                localStorage.setItem('welcomeShown', 'true');
            }, 1000);
        }
    } catch (e) {
        // localStorage not available
    }
}

// ===== Mobile-Specific Functions =====

/**
 * Initialize mobile-specific enhancements
 */
function initMobileEnhancements() {
    // Prevent double-tap zoom on iOS
    let lastTouchEnd = 0;
    document.addEventListener('touchend', function(event) {
        const now = Date.now();
        if (now - lastTouchEnd <= 300) {
            event.preventDefault();
        }
        lastTouchEnd = now;
    }, false);

    // Improve input focus behavior on mobile
    const inputs = document.querySelectorAll('input[type="number"], input[type="text"]');
    inputs.forEach(input => {
        input.addEventListener('focus', function() {
            // Scroll the input into view with some padding
            setTimeout(() => {
                this.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 300);
        });
    });

    // Add touch feedback to buttons
    const buttons = document.querySelectorAll('button, .action-btn, .nav-tab');
    buttons.forEach(button => {
        button.addEventListener('touchstart', function() {
            this.style.opacity = '0.7';
        });
        button.addEventListener('touchend', function() {
            this.style.opacity = '1';
        });
    });

    // Improve toggle switches for touch
    const toggles = document.querySelectorAll('.toggle-switch');
    toggles.forEach(toggle => {
        toggle.addEventListener('touchstart', function(e) {
            e.preventDefault();
            const input = this.querySelector('input');
            input.checked = !input.checked;
            input.dispatchEvent(new Event('change', { bubbles: true }));
        });
    });

    // Add swipe gestures for navigation tabs
    let touchStartX = 0;
    let touchEndX = 0;
    const navTabs = document.querySelector('.nav-tabs');
    
    if (navTabs) {
        navTabs.addEventListener('touchstart', function(e) {
            touchStartX = e.changedTouches[0].screenX;
        });

        navTabs.addEventListener('touchend', function(e) {
            touchEndX = e.changedTouches[0].screenX;
            handleSwipe();
        });

        function handleSwipe() {
            if (touchEndX < touchStartX - 50) {
                // Swiped left - go to next tab
                const activeTab = document.querySelector('.nav-tab.active');
                const nextTab = activeTab.nextElementSibling;
                if (nextTab && nextTab.classList.contains('nav-tab') && !nextTab.id.includes('darkMode') && !nextTab.id.includes('reset')) {
                    nextTab.click();
                }
            }
            if (touchEndX > touchStartX + 50) {
                // Swiped right - go to previous tab
                const activeTab = document.querySelector('.nav-tab.active');
                const prevTab = activeTab.previousElementSibling;
                if (prevTab && prevTab.classList.contains('nav-tab')) {
                    prevTab.click();
                }
            }
        }
    }

    // Mobile-optimized modal handling
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        modal.addEventListener('touchmove', function(e) {
            // Allow scrolling within modal content
            const modalContent = e.target.closest('.modal-content');
            if (modalContent) {
                return;
            }
            e.preventDefault();
        }, { passive: false });
    });
}

/**
 * Handle mobile viewport height (addresses iOS Safari issues)
 */
function handleMobileViewport() {
    // First we get the viewport height and multiply it by 1% to get a value for a vh unit
    let vh = window.innerHeight * 0.01;
    // Then we set the value in the --vh custom property to the root of the document
    document.documentElement.style.setProperty('--vh', `${vh}px`);

    // Update on resize
    window.addEventListener('resize', () => {
        // We execute the same script as before
        let vh = window.innerHeight * 0.01;
        document.documentElement.style.setProperty('--vh', `${vh}px`);
    });

    // Handle orientation change
    window.addEventListener('orientationchange', () => {
        setTimeout(() => {
            let vh = window.innerHeight * 0.01;
            document.documentElement.style.setProperty('--vh', `${vh}px`);
        }, 500);
    });
}

/**
 * Generate test Work Order with sample data
 */
async function generateTestWorkOrder() {
    // Set test client info if not already set
    if (!state.ui.lastClientInfo) {
        state.ui.lastClientInfo = {
            companyName: 'Test Restaurant LLC',
            contactName: 'John Smith',
            contactPosition: 'General Manager',
            contactPhone: '(713) 555-1234',
            contactEmail: 'john.smith@testrestaurant.com',
            serviceLocation: '1234 Main Street, Houston, TX 77001',
            salesTeam: ['Maria Garcia', 'Robert Johnson']
        };
    }
    
    // Create test work order data
    const testWorkOrderData = {
        services: [
            {
                title: 'Deep Kitchen Cleaning Service',
                description: 'Complete deep cleaning of commercial kitchen including: hood and exhaust system cleaning, floor degreasing, equipment detail cleaning, wall and ceiling cleaning, and sanitization of all surfaces.'
            },
            {
                title: 'Monthly Maintenance Program',
                description: 'Regular monthly maintenance cleaning to maintain health code compliance and extend equipment life.'
            }
        ],
        paymentTerms: '30',
        status: 'Pending',
        workOrderNumber: generateWorkOrderNumber()
    };
    
    // Generate the work order
    await generateWorkOrderPDF(testWorkOrderData);
}

/**
 * Generate Work Order PDF
 */
/**
 * Generate Work Order PDF using HTML template
 */
const serviceGap = 6; // Espaciado compacto entre servicios

function generateWorkOrderHTML(workOrderData, clientInfo, grandTotal) {
    const services = workOrderData.services.map((service, index) => `
        <tr class="${index % 2 === 0 ? 'bg-gray-50' : ''}">
            <td class="px-4 py-2 align-top">
                <h4 class="font-bold text-sm text-black mb-1">${service.title}</h4>
                ${service.description ? `<p class="text-xs text-gray-600 pl-4">${service.description}</p>` : ''}
            </td>
            <td class="px-4 py-2 text-right align-middle"></td>
        </tr>
    `).join('');

    const currentDate = new Date().toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });

    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <script src="https://cdn.tailwindcss.com"></script>
        <style>
            @page {
                size: letter;
                margin: 0;
            }
            
            /* Estilos esenciales para impresión */
            * {
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
            }
            
            /* Reset font metrics for consistent rendering */
            body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                -webkit-font-smoothing: antialiased;
                -moz-osx-font-smoothing: grayscale;
            }
            
            /* Ajuste de centrado vertical */
            .total-row td {
                line-height: 1.5;
                padding-top: 0.75rem;
                padding-bottom: 0.75rem;
                vertical-align: middle;
                height: 3rem;
            }
            
            .footer-content {
                line-height: 1.5;
                min-height: 60px;
                display: flex;
                align-items: center;
            }
            
        </style>
    </head>
    <body>
        <div class="work-order-container w-[900px] h-[1169px] bg-white flex flex-col mx-auto">
            <!-- Header -->
            <div class="bg-[#03143A] text-white px-12 py-8 flex justify-between items-center h-[100px] shadow-md">
                <div class="h-[57.5px]">
                    <img src="../Logo Prime - Facility White No Background.png" alt="Prime Facility Services" class="logo h-full w-auto brightness-0 invert">
                </div>
                <div class="text-right">
                    <div class="text-2xl font-bold tracking-wide">WORK ORDER</div>
                    <div class="text-sm opacity-85 font-light">#${workOrderData.workOrderNumber}</div>
                </div>
            </div>
            
            <!-- Content -->
            <div class="flex-1 px-16 py-12 flex flex-col">
                <!-- Client Info -->
                <div class="grid grid-cols-3 gap-12 mb-10">
                    <div>
                        <label class="block text-[9px] font-semibold uppercase text-gray-600 mb-1.5 tracking-wider">Service Location</label>
                        <div class="text-sm text-black font-normal">
                            ${clientInfo.serviceLocation || 'Not specified'}
                        </div>
                    </div>
                    <div>
                        <label class="block text-[9px] font-semibold uppercase text-gray-600 mb-1.5 tracking-wider">Bill To</label>
                        <div class="text-sm text-black font-normal">
                            ${clientInfo.companyName}<br>
                            ${clientInfo.contactName ? `${clientInfo.contactName}<br>` : ''}
                            ${clientInfo.contactEmail ? `${clientInfo.contactEmail}` : ''}
                        </div>
                    </div>
                    <div>
                        <label class="block text-[9px] font-semibold uppercase text-gray-600 mb-1.5 tracking-wider">Order Details</label>
                        <div class="text-sm text-black font-normal">
                            <div class="mb-2">
                                <span class="text-[11px] text-gray-700 font-semibold">Status:</span> 
                                <span class="text-black font-semibold">${workOrderData.status}</span>
                            </div>
                            <div class="mb-2">
                                <span class="text-[11px] text-gray-700 font-semibold">Payment Terms:</span> 
                                <span class="text-black font-semibold">Net ${workOrderData.paymentTerms} Days</span>
                            </div>
                            <div>
                                <span class="text-[11px] text-gray-700 font-semibold">Date:</span> 
                                <span class="text-black">${currentDate}</span>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Services -->
                <div class="mb-4">
                    <table class="w-full border-collapse">
                        <thead class="bg-gray-100 border-b-2 border-[#03143A]">
                            <tr>
                                <th class="text-left px-4 py-3 text-[10px] font-bold uppercase text-[#03143A] tracking-wider">Service Description</th>
                                <th class="text-right px-4 py-3 text-[10px] font-bold uppercase text-[#03143A] tracking-wider">Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${services}
                        </tbody>
                    </table>
                    
                    <!-- Espacio antes del total -->
                    <div class="h-4"></div>
                    
                    <!-- Total como tabla separada -->
                    <table class="w-full border-collapse">
                        <tr class="bg-[#C70532] text-white total-row">
                            <td class="px-4 text-base font-bold" style="padding: 0;">
                                <div style="display: flex; align-items: center; justify-content: flex-start; height: 48px; padding: 0 16px; padding-bottom: 8px;">TOTAL</div>
                            </td>
                            <td class="px-4 text-base font-bold text-right" style="padding: 0;">
                                <div style="display: flex; align-items: center; justify-content: flex-end; height: 48px; padding: 0 16px; padding-bottom: 8px;">${grandTotal}</div>
                            </td>
                        </tr>
                    </table>
                </div>
                
                <!-- Terms -->
                <div class="mb-6">
                    <h2 class="text-base font-bold mb-4 text-gray-900">Terms & Conditions</h2>
                    <div class="grid grid-cols-2 gap-6">
                        <div>
                            <strong class="block text-gray-900 text-[11px] mb-1">Area Preparation:</strong>
                            <p class="text-[11px] text-gray-600 leading-relaxed">The client is responsible for ensuring the kitchen is accessible and cleared of personal items. All heavy equipment must be turned off, unplugged, and cooled before service begins.</p>
                        </div>
                        <div>
                            <strong class="block text-gray-900 text-[11px] mb-1">Service Limitations:</strong>
                            <p class="text-[11px] text-gray-600 leading-relaxed">We will clean to the highest standard possible with industry-approved methods and chemicals. However, we cannot guarantee removal of permanent stains, burns, or damage existing prior to service.</p>
                        </div>
                        <div>
                            <strong class="block text-gray-900 text-[11px] mb-1">Cancellation Policy:</strong>
                            <p class="text-[11px] text-gray-600 leading-relaxed">24-hour notice required for cancellation without charge. Same-day cancellations may incur a service fee.</p>
                        </div>
                        <div>
                            <strong class="block text-gray-900 text-[11px] mb-1">Taxes:</strong>
                            <p class="text-[11px] text-gray-600 leading-relaxed">All prices quoted are before the applicable 8.25% tax, which will be added to the final invoice.</p>
                        </div>
                    </div>
                </div>
                
                <!-- Signature -->
                <div class="grid grid-cols-2 gap-24 px-16 pt-8 pb-6">
                    <div>
                        <div class="border-b border-gray-300 h-10"></div>
                        <div class="text-[10px] font-bold uppercase text-gray-500 mt-2 tracking-wider">Authorized Signature</div>
                    </div>
                    <div>
                        <div class="border-b border-gray-300 h-10"></div>
                        <div class="text-[10px] font-bold uppercase text-gray-500 mt-2 tracking-wider">Date</div>
                    </div>
                </div>
            </div>
            
            <!-- Footer -->
            <div class="bg-[#03143A] text-white px-16 footer-content" style="display: flex; justify-content: space-between; align-items: center; min-height: 60px; padding-bottom: 12px;">
                <div style="line-height: 1.5;">8303 Westglen Drive, Houston, TX 77063</div>
                <div style="line-height: 1.5;">(713) 338-2553 | www.primefacilityservicesgroup.com</div>
            </div>
        </div>
    </body>
    </html>
    `;
}

async function generateWorkOrderPDF(workOrderData) {
    showNotification("Generating professional work order...", "info");
    
    try {
        await loadExportLibraries();
        
        if (typeof window.jspdf === 'undefined' || !window.jspdf.jsPDF || typeof window.html2canvas === 'undefined') {
            throw new Error('Required libraries not loaded');
        }

        // Use stored client information from the quote PDF
        const clientInfo = state.ui.lastClientInfo || {
            companyName: 'Not specified',
            contactName: '',
            contactEmail: '',
            contactPhone: '',
            serviceLocation: ''
        };
        
        // Get grand total from the calculator
        const grandTotal = $('grandTotal').textContent || '$0.00';
        
        // Generate HTML content
        const htmlContent = generateWorkOrderHTML(workOrderData, clientInfo, grandTotal);
        
        // Create a temporary container
        const tempContainer = document.createElement('div');
        tempContainer.style.position = 'absolute';
        tempContainer.style.left = '-9999px';
        tempContainer.style.top = '0';
        tempContainer.style.width = '900px'; // Ancho más amplio para mejor diseño
        tempContainer.innerHTML = htmlContent;
        document.body.appendChild(tempContainer);
        
        // Esperar a que Tailwind procese las clases
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Wait for images to load
        const workOrderContainer = tempContainer.querySelector('.work-order-container');
        const logo = tempContainer.querySelector('.logo');
        if (logo) {
            await new Promise((resolve) => {
                if (logo.complete) {
                    resolve();
                } else {
                    logo.onload = resolve;
                    logo.onerror = resolve;
                }
            });
        }
        
        // Generate PDF from HTML
        showNotification("Converting to PDF...", "info");
        
        const canvas = await window.html2canvas(workOrderContainer, {
            scale: 2, // Higher quality
            logging: false,
            useCORS: true,
            allowTaint: true,
            backgroundColor: '#ffffff',
            windowWidth: 900,
            windowHeight: 1169,
            scrollX: 0,
            scrollY: 0
        });
        
        // Create PDF
        const imgData = canvas.toDataURL('image/png');
        const pdf = new window.jspdf.jsPDF({
            orientation: 'p',
            unit: 'pt',
            format: 'letter',
            compress: true
        });
        
        const pageWidth = pdf.internal.pageSize.getWidth();
        const imgWidth = pageWidth;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        
        // Add image to PDF
        pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
        
        // Clean up
        document.body.removeChild(tempContainer);
        
        // Save PDF
        const sanitizedService = workOrderData.services[0]?.title.replace(/[^a-zA-Z0-9]/g, '') || 'Service';
        const sanitizedCompany = clientInfo.companyName.replace(/[^a-zA-Z0-9]/g, '');
        const fileName = `WO-${sanitizedService}-${sanitizedCompany}-${new Date().toISOString().split('T')[0]}.pdf`;
        pdf.save(fileName);
        
        showNotification("Work Order generated successfully!", "success");

    } catch (error) {
        console.error('Error generating Work Order:', error);
        showNotification("Error generating Work Order. Please try again.", "error");
    }
}

// Initialize the app when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', function() {
    initApp();
    
    // Mobile-specific initialization
    if (utils.isMobile() || hasTouch) {
        initMobileEnhancements();
    }
    
    // Handle viewport height
    handleMobileViewport();
});