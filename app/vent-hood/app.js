"use strict";

/**
 * Vent Hood Cleaning Calculator Application
 * 
 * A comprehensive tool for calculating and optimizing professional vent hood cleaning quotes.
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
    numberOfHoods: 1,
    sellingPrice: 650,
    subcontractorCostPerHood: 225,
    includeCommission: false,
    commissionPercentage: 20,
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

    // Configuration
    config: {
        regularPayRate: 16,
        supervisorPayRate: 18,
        transportCostPerDay: 150,
        outsideHoustonTransportCostPerDay: 300,
        largeHoodPrice: 650,
        smallHoodPrice: 550,
        largeHoodInternalCost: 250,  // Internal cost for large hood
        smallHoodInternalCost: 200,  // Internal cost for small hood
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
        hoodCleaningCost: 0,
        operationalCosts: 0,
        subtotal: 0,
        residualAmount: 0,
        markup: 0,
        markupPercentage: 0,
        holidaySurcharge: 0,
        totalPrice: 0,
        generalLiabilityCost: 0,
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

// Work Order service management - Not needed for Vent Hood Calculator
// Vent Hood has a fixed service: "Vent Hood Cleaning"

/**
 * Update Work Order preview
 */
// updateWorkOrderPreview - Not needed for Vent Hood Calculator

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
    if (el) {
        el.textContent = content;
    }
    // Removed console.warn to avoid cluttering the console for expected missing elements
    // Many elements referenced are for future Configuration/Breakdown tabs
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
 * Safe add event listener - only adds if element exists
 */
function safeAddEventListener(elementId, event, handler) {
    const element = $(elementId);
    if (element) {
        element.addEventListener(event, handler);
    }
}

/**
 * Initialize all event listeners
 */
function initEventListeners() {
    // Tab navigation
    safeAddEventListener('quotationTab', 'click', () => {
        // Check for unsaved changes in config
        if (state.ui.hasUnsavedConfigChanges) {
            if (confirm('You have unsaved changes in Configuration. Would you like to save them before leaving?')) {
                // Note: saveConfigBtn will be added when Configuration tab is implemented
                const saveBtn = $('saveConfigBtn');
                if (saveBtn) saveBtn.click();
            } else {
                state.ui.hasUnsavedConfigChanges = false;
                updateUnsavedChangesIndicator();
            }
        }
        showContent('quotationContent');
    });

    safeAddEventListener('configTab', 'click', () => showContent('configContent'));

    safeAddEventListener('breakdownTab', 'click', () => {
        // Check for unsaved changes in config
        if (state.ui.hasUnsavedConfigChanges) {
            if (confirm('You have unsaved changes in Configuration. Would you like to save them before leaving?')) {
                const saveBtn = $('saveConfigBtn');
                if (saveBtn) saveBtn.click();
            } else {
                state.ui.hasUnsavedConfigChanges = false;
                updateUnsavedChangesIndicator();
            }
        }

        showContent('quotationContent');
        const resultsEl = document.querySelector('.results-column') || document.querySelector('.result-section');
        if (resultsEl) resultsEl.scrollIntoView({ behavior: 'smooth' });
    });

    safeAddEventListener('resetBtn', 'click', resetCalculator);
    safeAddEventListener('darkModeToggle', 'click', toggleDarkMode);

    // Toggle sections
    document.querySelectorAll('.toggle-section').forEach(button => {
        button.addEventListener('click', function () {
            toggleSection(this.getAttribute('data-target'), this);
        });
    });

    // Advanced options toggle with keyboard support
    safeAddEventListener('advancedOptionsToggle', 'click', function () {
        const content = $('advancedOptionsContent');
        if (content) {
            const icon = this.querySelector('i.fas');
            content.classList.toggle('hidden');
            content.classList.toggle('visible');
            if (icon) {
                icon.className = content.classList.contains('visible') ? 'fas fa-chevron-up' : 'fas fa-chevron-down';
            }
            this.setAttribute('aria-expanded', content.classList.contains('visible'));
            content.setAttribute('aria-hidden', !content.classList.contains('visible'));
        }
    });
    
    // Add keyboard support for advanced options toggle
    safeAddEventListener('advancedOptionsToggle', 'keydown', function(e) {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            this.click();
        }
    });

    // Operational costs toggle
    safeAddEventListener('operationalCostsRow', 'click', function () {
        this.classList.toggle('expanded');
        const icon = this.querySelector('i.fas');
        const details = $('operationalCostsDetails');

        if (details) {
            if (this.classList.contains('expanded')) {
                details.classList.remove('hidden');
                if (icon) icon.className = 'fas fa-chevron-up';
                state.ui.operationalCostsExpanded = true;
                this.setAttribute('aria-expanded', 'true');
            } else {
                details.classList.add('hidden');
                if (icon) icon.className = 'fas fa-chevron-down';
                state.ui.operationalCostsExpanded = false;
                this.setAttribute('aria-expanded', 'false');
            }
        }
    });
    
    // Add keyboard support for operational costs toggle
    safeAddEventListener('operationalCostsRow', 'keydown', function(e) {
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
    safeAddEventListener('addCommissionSplitBtn', 'click', function () {
        state.options.commissionSplits.push(0);
        updateCommissionSplitInputs();
        saveSnapshot();
        calculateAll();
    });

    // Markup Slider
    safeAddEventListener('markupSlider', 'input', function () {
        const value = parseInt(this.value);
        state.options.customMarkupPercentage = value;
        const markupInput = $('markupInput');
        if (markupInput) markupInput.value = value;
        calculateAll();
    });
    
    // Handle markup input for values beyond slider range
    safeAddEventListener('markupInput', 'change', function () {
        const value = parseInt(this.value) || 0;
        if (value >= 0) {
            state.options.customMarkupPercentage = value;
            // Update slider to max if value exceeds slider range
            const markupSlider = $('markupSlider');
            if (markupSlider) markupSlider.value = Math.min(1000, value);
            calculateAll();
        }
    });

    // Save configuration button
    safeAddEventListener('saveConfigBtn', 'click', function () {
        if (!validateAllInputs()) {
            showNotification('Please fix the errors before saving configuration.', 'error');
            return;
        }

        // Update configuration values with additional validation
        const regularRateInput = $('regularPayRate');
        const supervisorRateInput = $('supervisorPayRate');
        const regularRate = regularRateInput ? parseFloat(regularRateInput.value) || 16 : 16;
        const supervisorRate = supervisorRateInput ? parseFloat(supervisorRateInput.value) || 18 : 18;
        
        // Ensure supervisor rate is at least equal to regular rate
        if (supervisorRate < regularRate) {
            showNotification('Supervisor pay rate must be at least equal to regular worker rate.', 'error');
            return;
        }
        
        state.config.regularPayRate = regularRate;
        state.config.supervisorPayRate = supervisorRate;
        const transportCostInput = $('transportCostConfig');
        const outsideHoustonInput = $('outsideHoustonTransportConfig');
        const largeHoodPriceInput = $('largeHoodPriceConfig');
        const smallHoodPriceInput = $('smallHoodPriceConfig');
        const workCompInput = $('workCompRate');
        const glInput = $('glRate');
        const payrollTaxInput = $('payrollTaxRate');
        const targetCostInput = $('targetCostPercentage');
        const largeHoodCostInput = $('largeHoodInternalCost');
        const smallHoodCostInput = $('smallHoodInternalCost');
        
        state.config.transportCostPerDay = Math.max(0, transportCostInput ? parseFloat(transportCostInput.value) || 150 : 150);
        state.config.outsideHoustonTransportCostPerDay = Math.max(0, outsideHoustonInput ? parseFloat(outsideHoustonInput.value) || 300 : 300);
        state.config.largeHoodPrice = Math.max(1, largeHoodPriceInput ? parseFloat(largeHoodPriceInput.value) || 650 : 650);
        state.config.smallHoodPrice = Math.max(1, smallHoodPriceInput ? parseFloat(smallHoodPriceInput.value) || 550 : 550);
        state.config.workCompRate = Math.max(0, workCompInput ? parseFloat(workCompInput.value) || 1.88 : 1.88);
        state.config.glRate = Math.max(0, glInput ? parseFloat(glInput.value) || 7.33 : 7.33);
        state.config.payrollTaxRate = Math.max(0, Math.min(50, payrollTaxInput ? parseFloat(payrollTaxInput.value) || 17 : 17));
        state.config.targetCostPercentage = Math.max(30, Math.min(90, targetCostInput ? parseFloat(targetCostInput.value) || 62 : 62));
        state.config.largeHoodInternalCost = Math.max(1, largeHoodCostInput ? parseFloat(largeHoodCostInput.value) || 250 : 250);
        state.config.smallHoodInternalCost = Math.max(1, smallHoodCostInput ? parseFloat(smallHoodCostInput.value) || 200 : 200);
        
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
    safeAddEventListener('printQuoteBtn', 'click', function () {
        preparePdfOrPrint('print');
    });

    safeAddEventListener('downloadPdfBtn', 'click', async function () {
        await preparePdfOrPrint('pdf');
    });

    safeAddEventListener('screenshotBtn', 'click', async function() {
        await captureScreenshot();
    });
    
    // Test Work Order button
    safeAddEventListener('testWorkOrderBtn', 'click', async function() {
        await testWorkOrder();
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
            const modal = this.closest('.modal-overlay');
            if (modal) {
                modal.classList.remove('visible');
                setTimeout(() => { modal.style.display = 'none'; }, 300);
            }
        });
    });
    
    // Close modal when clicking outside of it
    document.querySelectorAll('.modal-overlay').forEach(modal => {
        modal.addEventListener('click', function(e) {
            if (e.target === this) {
                this.classList.remove('visible');
                setTimeout(() => { this.style.display = 'none'; }, 300);
            }
        });
    });
    
    // Client info modal event listeners
    safeAddEventListener('clientInfoForm', 'submit', async function(e) {
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
            if (modal) {
                modal.classList.remove('visible');
                setTimeout(() => { modal.style.display = 'none'; }, 300);
            }
            
            // Store client info for later use
            state.ui.lastClientInfo = clientInfo;
            
            // Generate PDF with client info
            await generatePDF(clientInfo);
        });
    
    // Add sales person button
    safeAddEventListener('addSalesPersonBtn', 'click', addSalesPersonRow);
    
    // Cancel client info button
    safeAddEventListener('cancelClientInfo', 'click', function() {
        const modal = $('clientInfoModal');
        if (modal) {
            modal.classList.remove('visible');
            setTimeout(() => { modal.style.display = 'none'; }, 300);
        }
    });
    
    // Generate Work Order button
    safeAddEventListener('generateWorkOrderBtn', 'click', function() {
        showWorkOrderModal();
    });
    
    
    // Work Order form submission
    safeAddEventListener('workOrderForm', 'submit', async function(e) {
            e.preventDefault();
            
            // For vent hood, we have a fixed service
            const numberOfHoods = state.numberOfHoods || 1;
            const pricePerHood = state.sellingPrice || 650;
            const total = numberOfHoods * pricePerHood;
            
            const services = [{
                title: 'Vent Hood Cleaning',
                description: `${numberOfHoods} hood${numberOfHoods > 1 ? 's' : ''} at ${formatCurrency(pricePerHood)} per hood. Total: ${formatCurrency(total)}`
            }];
            
            // Get selected payment terms from within the form
            const form = $('workOrderForm');
            const selectedPaymentTerms = form.querySelector('input[name="paymentTerms"]:checked');
            const paymentTerms = selectedPaymentTerms ? selectedPaymentTerms.value : '';
            
            // Collect work order data
            const workOrderData = {
                services: services,
                businessName: $('workOrderBusinessName').value,
                contactName: $('workOrderContactName').value,
                email: $('workOrderEmail').value,
                phone: $('workOrderPhone').value,
                address: $('workOrderAddress').value,
                serviceDate: $('workOrderDate').value,
                serviceTime: $('workOrderTime').value,
                notes: $('workOrderNotes').value,
                paymentTerms: paymentTerms,
                workOrderNumber: generateWorkOrderNumber()
            };
            
            // Validate required fields
            if (!workOrderData.paymentTerms) {
                showNotification('Please select payment terms', 'error');
                return;
            }
            
            // Close modal
            const modal = $('workOrderModal');
            if (modal) {
                modal.classList.remove('visible');
                setTimeout(() => { modal.style.display = 'none'; }, 300);
            }
            
            // Generate Work Order PDF
            await generateWorkOrderPDF(workOrderData);
        });
    
    // Work Order service management - Not needed for Vent Hood Calculator
    // Vent Hood has fixed service details
    
    
    // Cancel work order button
    safeAddEventListener('cancelWorkOrder', 'click', function() {
        const modal = $('workOrderModal');
        if (modal) {
            modal.classList.remove('visible');
            setTimeout(() => { modal.style.display = 'none'; }, 300);
        }
    });
    
    // Grand Total editing functionality
    const toggleGrandTotalEditBtn = $('toggleGrandTotalEdit');
    const grandTotalDisplay = $('grandTotal');
    const grandTotalInput = $('grandTotalInput');
    
    if (toggleGrandTotalEditBtn && grandTotalDisplay && grandTotalInput) {
        // Toggle edit mode
        safeAddEventListener('toggleGrandTotalEdit', 'click', function() {
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
                grandTotalInput.classList.remove('hidden');
                grandTotalDisplay.classList.add('hidden');
                grandTotalInput.focus();
                grandTotalInput.select();
            }
        });
        
        // Handle input changes
        safeAddEventListener('grandTotalInput', 'keydown', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                const newValue = parseFloat(this.value) || 0;
                if (newValue > 0) {
                    applyManualGrandTotal(newValue);
                    this.classList.add('hidden');
                    grandTotalDisplay.classList.remove('hidden');
                }
            } else if (e.key === 'Escape') {
                e.preventDefault();
                this.classList.add('hidden');
                grandTotalDisplay.classList.remove('hidden');
                setDisplay('manualAdjustIndicator', false);
            }
        });
        
        // Handle blur (clicking outside)
        safeAddEventListener('grandTotalInput', 'blur', function() {
            const newValue = parseFloat(this.value) || 0;
            if (newValue > 0) {
                applyManualGrandTotal(newValue);
            }
            this.classList.add('hidden');
            grandTotalDisplay.classList.remove('hidden');
        });
    }
    
    // Close modal with Escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            document.querySelectorAll('.modal-overlay.visible').forEach(modal => {
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
    safeSetValue('workCompRate', state.config.workCompRate);
    safeSetValue('glRate', state.config.glRate);
    safeSetValue('largeHoodPriceConfig', state.config.largeHoodPrice);
    safeSetValue('smallHoodPriceConfig', state.config.smallHoodPrice);
    safeSetValue('transportCostConfig', state.config.transportCostPerDay);
    safeSetValue('outsideHoustonTransportConfig', state.config.outsideHoustonTransportCostPerDay);

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
    safeAddEventListener('undoBtn', 'click', undo);
    safeAddEventListener('redoBtn', 'click', redo);

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
        // Note: These handlers reference elements that will be added in Configuration tab
        'enableInitialFee': checked => {
            state.options.enableInitialFee = checked;
            setDisplay('initialFeeContainer', checked); // Will be in Configuration tab
        },
        'enableResidualPercentage': checked => {
            state.options.enableResidualPercentage = checked;
            setDisplay('residualPercentageContainer', checked); // Will be in Configuration tab
            updateProfitOptionClasses();
        },
        'useCustomMarkup': checked => {
            if (state.options.enableAutoCostOptimization && checked) {
                const customMarkupCheckbox = $('useCustomMarkup');
                if (customMarkupCheckbox) customMarkupCheckbox.checked = false;
                return;
            }
            state.options.useCustomMarkup = checked;
            setDisplay('markupSliderContainer', checked); // Will be in Configuration tab
            updateProfitOptionClasses();
        },
        'enableAutoCostOptimization': checked => {
            state.options.enableAutoCostOptimization = checked;
            if (checked) {
                const customMarkupCheckbox = $('useCustomMarkup');
                if (customMarkupCheckbox) customMarkupCheckbox.checked = false;
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
        'includeCommission': checked => {
            state.includeCommission = checked;
            const percentInput = $('commissionPercentage');
            const commissionRow = $('commissionRow');
            if (percentInput) {
                percentInput.disabled = !checked;
            }
            if (commissionRow) {
                commissionRow.style.display = checked ? 'block' : 'none';
            }
        },
        'useSubcontractor': checked => {
            state.useSubcontractor = checked;
            $('subcontractorDetails').classList.toggle('hidden', !checked);
            $('subcontractorDetails').classList.toggle('visible', checked);
        },
        'enableRounding': checked => state.options.enableRounding = checked,
        'includeInsurance': checked => state.includeInsurance = checked,
        'enableCommissionSplit': checked => {
            state.options.enableCommissionSplit = checked;
            setDisplay('splitCommissionContainer', checked); // Will be in Configuration tab
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
    console.log('handleNumericInput called for:', input.id, input.value);
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
        'numberOfHoods': { stateKey: 'numberOfHoods', min: 1 },
        'commissionPercentage': { stateKey: 'commissionPercentage', min: 0, max: 100 },
        'sellingPrice': { stateKey: 'sellingPrice', min: 0 },
        'subcontractorCostPerHood': { stateKey: 'subcontractorCostPerHood', min: 0 },
        'workers': { stateKey: 'workers', min: 0 }, // Changed min to 0 to allow 0 workers
        'hours': { stateKey: 'hours', min: 1 },
        'days': { stateKey: 'days', min: 1 },
        'materials': { stateKey: 'materialsPerDay', min: 0 },
        'equipment': { stateKey: 'equipmentPerDay', min: 0 },
        'largeHoods': { stateKey: 'largeHoods', min: 0 },
        'smallHoods': { stateKey: 'smallHoods', min: 0 },
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
            const markupSlider = $('markupSlider');
            if (markupSlider) markupSlider.value = Math.min(1000, value); // Match slider max
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

        // Special validation: ensure we have hoods
        if (input.id === 'numberOfHoods') {
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
    // Validate that we have at least hoods
    if (state.numberOfHoods === 0) {
        showNotification("You must have at least one hood to clean.", "error");
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
                const configTab = $('configTab');
                const saveBtn = $('saveConfigBtn');
                if (configTab && saveBtn && configTab.classList.contains('active')) {
                    e.preventDefault();
                    saveBtn.click();
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
    // These elements don't exist in the current Vent Hood Calculator HTML
    // This function is kept for potential future implementation
    // when Configuration tab content is added
    
    const customMarkupOption = $('customMarkupOption');
    const optimizeCostOption = $('optimizeCostOption');
    const residualOption = $('residualOption');

    // Exit early if elements don't exist
    if (!customMarkupOption || !optimizeCostOption || !residualOption) {
        return;
    }

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
    // These elements will be in Configuration tab when implemented
    // setContent('largeHoodPrice', `$${state.config.largeHoodPrice} each`);
    // setContent('smallHoodPrice', `$${state.config.smallHoodPrice} each`);
}

/**
 * Update insurance details display
 */
function updateInsuranceDetails() {
    // These elements will be in Configuration tab when implemented
    // setContent('workCompDetails', `$${state.config.workCompRate} per $100 of labor cost`);
    // setContent('generalLiabilityDetails', `$${state.config.glRate} per $1,000 of total price`);
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
        numberOfHoods: 1,
        sellingPrice: 650,
        subcontractorCostPerHood: 225,
        includeCommission: false,
        commissionPercentage: 20,
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
 * Safe helper to update element value
 */
function safeSetValue(elementId, value) {
    const element = $(elementId);
    if (element) element.value = value;
}

/**
 * Safe helper to update checkbox checked state
 */
function safeSetChecked(elementId, checked) {
    const element = $(elementId);
    if (element) element.checked = checked;
}

/**
 * Update UI to match state values
 */
function updateUIFromState() {
    // Basic fields
    safeSetValue('numberOfHoods', state.numberOfHoods);
    safeSetValue('sellingPrice', state.sellingPrice);
    safeSetValue('subcontractorCostPerHood', state.subcontractorCostPerHood);
    safeSetChecked('includeCommission', state.includeCommission);
    safeSetValue('commissionPercentage', state.commissionPercentage);
    safeSetChecked('useSubcontractor', state.useSubcontractor);
    
    const subcontractorDetails = $('subcontractorDetails');
    if (subcontractorDetails) {
        subcontractorDetails.classList.toggle('hidden', !state.useSubcontractor);
        subcontractorDetails.classList.toggle('visible', state.useSubcontractor);
    }
    
    safeSetValue('subcontractorCost', state.subcontractorCost);
    safeSetValue('workers', state.workers);
    safeSetValue('hours', state.hours);
    safeSetValue('days', state.days);
    safeSetValue('materials', state.materialsPerDay);
    safeSetValue('equipment', state.equipmentPerDay);
    safeSetChecked('isHoliday', state.isHoliday);
    safeSetChecked('outsideHouston', state.outsideHouston);
    safeSetChecked('includeInsurance', state.includeInsurance);

    // Hood cleaning
    safeSetValue('largeHoods', state.largeHoods);
    safeSetValue('smallHoods', state.smallHoods);

    // Config values
    safeSetValue('regularPayRate', state.config.regularPayRate);
    safeSetValue('supervisorPayRate', state.config.supervisorPayRate);
    safeSetValue('transportCostConfig', state.config.transportCostPerDay);
    safeSetValue('outsideHoustonTransportConfig', state.config.outsideHoustonTransportCostPerDay);
    safeSetValue('largeHoodPriceConfig', state.config.largeHoodPrice);
    safeSetValue('smallHoodPriceConfig', state.config.smallHoodPrice);
    safeSetValue('workCompRate', state.config.workCompRate);
    safeSetValue('glRate', state.config.glRate);
    safeSetValue('payrollTaxRate', state.config.payrollTaxRate);
    safeSetValue('targetCostPercentage', state.config.targetCostPercentage);
    safeSetValue('largeHoodInternalCost', state.config.largeHoodInternalCost);
    safeSetValue('smallHoodInternalCost', state.config.smallHoodInternalCost);

    // Update display values
    updateHoodPriceLabels();
    updateInsuranceDetails();

    // Option checkboxes
    safeSetChecked('includeTransport', state.options.includeTransport);
    safeSetChecked('includeMaterials', state.options.includeMaterials);
    safeSetChecked('includeEquipment', state.options.includeEquipment);
    safeSetChecked('enableAutoCostOptimization', state.options.enableAutoCostOptimization);
    safeSetChecked('enableRounding', state.options.enableRounding);
    safeSetChecked('enableCommissionSplit', state.options.enableCommissionSplit);
    safeSetChecked('useCustomMarkup', state.options.useCustomMarkup);
    safeSetChecked('enableInitialFee', state.options.enableInitialFee);
    safeSetChecked('enableResidualPercentage', state.options.enableResidualPercentage);

    // Toggle containers based on options
    // Note: Some of these containers will be in the Configuration tab when implemented
    setDisplay('splitCommissionContainer', state.options.enableCommissionSplit);
    setDisplay('salesCommissionRow', !state.options.enableCommissionSplit);
    setDisplay('splitCommissionRows', state.options.enableCommissionSplit);
    setDisplay('markupSliderContainer', state.options.useCustomMarkup);
    setDisplay('initialFeeContainer', state.options.enableInitialFee);
    setDisplay('residualPercentageContainer', state.options.enableResidualPercentage);

    // Update profit option visuals
    updateProfitOptionClasses();

    // Update slider and numeric inputs
    safeSetValue('markupSlider', state.options.customMarkupPercentage);
    safeSetValue('markupInput', state.options.customMarkupPercentage);
    safeSetValue('initialFeeValue', state.options.initialFeeValue);
    safeSetValue('residualPercentageValue', state.options.residualPercentageValue);
    
    const residualDisplay = $('residualPercentageDisplay');
    if (residualDisplay) residualDisplay.textContent = state.options.residualPercentageValue;
    
    safeSetValue('regularSuppliesPercentage', state.options.regularSuppliesPercentage);
    safeSetValue('additionalEquipmentPercentage', state.options.additionalEquipmentPercentage);
    safeSetValue('uniformSafetyPercentage', state.options.uniformSafetyPercentage);
    safeSetValue('communicationsPercentage', state.options.communicationsPercentage);
    safeSetValue('overheadPercentage', state.options.overheadPercentage);
    safeSetValue('commissionPercentage', state.options.commissionPercentage);
    
    const commissionDisplay = $('commissionPercentageDisplay');
    if (commissionDisplay) commissionDisplay.textContent = state.options.commissionPercentage;

    // Update commission split inputs
    updateCommissionSplitInputs();

    // Update percentage displays
    updatePercentageDisplays();

    // Apply dark mode if enabled
    document.body.classList.toggle('dark-mode', state.ui.isDarkMode);
    const darkModeToggle = $('darkModeToggle');
    if (darkModeToggle) {
        const icon = darkModeToggle.querySelector('i');
        if (icon) icon.className = state.ui.isDarkMode ? 'fas fa-sun' : 'fas fa-moon';
        darkModeToggle.setAttribute('aria-pressed', state.ui.isDarkMode);
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
    // Get all the current values from state
    const {
        useSubcontractor, subcontractorCost, workers, hours, days,
        materialsPerDay, equipmentPerDay, largeHoods, smallHoods,
        hoodCleaningFrequency, isHoliday, outsideHouston, includeInsurance
    } = state;
    
    const { config, options } = state;
    
    // Calculate all base costs (same as in calculateAll)
    
    // Labor cost
    let laborCost = 0;
    if (!useSubcontractor && workers > 0) {
        if (days === 1 && workers > 1) {
            const regularWorkerCost = (workers - 1) * hours * config.regularPayRate;
            const supervisorCost = hours * config.supervisorPayRate;
            laborCost = regularWorkerCost + supervisorCost;
        } else {
            laborCost = workers * hours * days * config.regularPayRate;
        }
    }
    
    // Hood cleaning costs
    const largeHoodCost = largeHoods * config.largeHoodPrice * hoodCleaningFrequency;
    const smallHoodCost = smallHoods * config.smallHoodPrice * hoodCleaningFrequency;
    const hoodCleaningCost = largeHoodCost + smallHoodCost;
    
    const largeHoodInternalCost = largeHoods * config.largeHoodInternalCost * hoodCleaningFrequency;
    const smallHoodInternalCost = smallHoods * config.smallHoodInternalCost * hoodCleaningFrequency;
    const hoodCleaningInternalCost = largeHoodInternalCost + smallHoodInternalCost;
    
    // Add hood labor to total labor cost
    if (!useSubcontractor && (largeHoods > 0 || smallHoods > 0)) {
        const hoodLaborHours = (largeHoods * 4 + smallHoods * 3) * hoodCleaningFrequency;
        const hoodLaborCost = hoodLaborHours * config.regularPayRate;
        laborCost += hoodLaborCost;
    }
    
    // Labor tax and workers comp
    const laborTax = laborCost * (config.payrollTaxRate / 100);
    const workCompCost = laborCost * (config.workCompRate / 100);
    
    // Transport cost
    let transportCost = 0;
    if (options.includeTransport) {
        const baseTransportCost = outsideHouston ? 
            config.outsideHoustonTransportCostPerDay : 
            config.transportCostPerDay;
        transportCost = baseTransportCost * days;
        
        // Apply discounts for long-term contracts
        if (days > 21) {
            transportCost *= 0.7;
        } else if (days > 7) {
            transportCost *= 0.8;
        }
    }
    
    // Materials and equipment
    const materialsCost = options.includeMaterials ? (materialsPerDay * days) : 0;
    const equipmentCost = options.includeEquipment ? equipmentPerDay * days : 0;
    
    // Base costs sum
    const baseCosts = laborCost + laborTax + workCompCost + transportCost + 
        materialsCost + equipmentCost;
    
    // Operational costs
    const operationalCosts = baseCosts * (
        (options.regularSuppliesPercentage + 
         options.additionalEquipmentPercentage + 
         options.uniformSafetyPercentage + 
         options.communicationsPercentage + 
         options.overheadPercentage) / 100
    );
    
    // Subtotal calculations
    const hoodCleaningProfit = hoodCleaningCost - hoodCleaningInternalCost;
    const internalCostSubtotal = baseCosts + operationalCosts + hoodCleaningInternalCost;
    const subtotal = internalCostSubtotal + hoodCleaningProfit;
    
    // Apply residual percentage
    let adjustedSubtotal = subtotal;
    if (options.enableResidualPercentage) {
        const residualAmount = subtotal * (options.residualPercentageValue / 100);
        adjustedSubtotal += residualAmount;
    }
    
    // Now calculate backwards from the target grand total
    // Remove initial fee and insurance from target to get the needed total price
    const initialFee = options.enableInitialFee ? options.initialFeeValue : 0;
    let targetBeforeRounding = targetGrandTotal - initialFee;
    
    // If rounding is enabled, we need to account for it
    if (options.enableRounding) {
        // Since we round up to nearest 50, the actual total before rounding could be up to 49.99 less
        // We'll aim for the middle of the range
        targetBeforeRounding -= 25;
    }
    
    // Calculate target total price (before insurance)
    let targetTotalPrice;
    if (includeInsurance) {
        // totalPrice + (totalPrice * glRate / 1000) = targetBeforeRounding
        // totalPrice * (1 + glRate/1000) = targetBeforeRounding
        targetTotalPrice = targetBeforeRounding / (1 + config.glRate / 1000);
    } else {
        targetTotalPrice = targetBeforeRounding;
    }
    
    // Remove holiday surcharge to get base price
    let targetAfterMarkup;
    if (isHoliday) {
        // totalAfterMarkup * 1.25 = targetTotalPrice
        targetAfterMarkup = targetTotalPrice / 1.25;
    } else {
        targetAfterMarkup = targetTotalPrice;
    }
    
    // Calculate required markup percentage
    // adjustedSubtotal + (adjustedSubtotal * markupPercentage/100) = targetAfterMarkup
    // adjustedSubtotal * (1 + markupPercentage/100) = targetAfterMarkup
    // markupPercentage = ((targetAfterMarkup / adjustedSubtotal) - 1) * 100
    
    if (adjustedSubtotal <= 0) {
        return 100; // Default markup if no costs
    }
    
    const requiredMarkup = ((targetAfterMarkup / adjustedSubtotal) - 1) * 100;
    
    // Ensure markup is at least 0 (no upper limit)
    return Math.max(0, Math.round(requiredMarkup));
}

/**
 * Apply a manually set grand total by adjusting the markup
 * @param {number} targetGrandTotal - The desired grand total
 */
function applyManualGrandTotal(targetGrandTotal) {
    // Calculate required markup
    const requiredMarkup = calculateRequiredMarkup(targetGrandTotal);
    
    // Update state with new markup
    state.options.useCustomMarkup = true;
    state.options.customMarkupPercentage = requiredMarkup;
    state.options.enableAutoCostOptimization = false;
    
    // Update UI elements
    safeSetChecked('useCustomMarkup', true);
    safeSetChecked('enableAutoCostOptimization', false);
    safeSetValue('markupSlider', requiredMarkup);
    safeSetValue('markupInput', requiredMarkup);
    setDisplay('markupSliderContainer', true);
    
    // Update profit option classes
    updateProfitOptionClasses();
    
    // Save snapshot for undo
    saveSnapshot();
    
    // Recalculate with new markup
    calculateAll();
    
    // Show manual adjustment indicator
    setDisplay('manualAdjustIndicator', true);
    
    // Add a highlight effect to the markup row
    const markupRow = $('markupRow');
    if (markupRow) {
        markupRow.classList.add('ring-2', 'ring-optimize-color', 'ring-opacity-50');
        setTimeout(() => {
            markupRow.classList.remove('ring-2', 'ring-optimize-color', 'ring-opacity-50');
        }, 2000);
    }
}

function calculateAll() {
    console.log('calculateAll called');
    const isValid = validateAllInputs();
    console.log('Validation result:', isValid);
    if (!isValid) return;

    // Set loading state
    setLoadingState(true);

    // Use setTimeout to allow the browser to update the UI with the loading state
    setTimeout(() => {
        try {
            const {
                numberOfHoods, sellingPrice, subcontractorCostPerHood,
                config, options
            } = state;

            // 1. Main calculations
            const scTotal = numberOfHoods * subcontractorCostPerHood;  // Total SC
            const spTotal = numberOfHoods * sellingPrice;  // Total SP

            // 2. SC-based calculations
            const laborCost = scTotal * 0.455;  // 45.5% of SC
            const workCompCost = laborCost * 0.0188;  // 1.88% of Labor
            const regularSuppliesCost = scTotal * 0.06;  // 6% of SC
            const additionalEquipmentCost = scTotal * 0.0275;  // 2.75% of SC
            const uniformSafetyCost = scTotal * 0.025;  // 2.5% of SC
            const communicationsCost = scTotal * 0.01;  // 1% of SC
            const overheadCost = scTotal * 0.05;  // 5% of SC
            
            // Total operational costs (17.25% of SC)
            const operationalCosts = regularSuppliesCost + additionalEquipmentCost + 
                                   uniformSafetyCost + communicationsCost + overheadCost;
            
            // Remaining SC after deducting labor, workers comp, and operational costs
            const remainingSC = scTotal - (laborCost + workCompCost + operationalCosts);
            
            // Transport and Materials/Equipment from remaining SC
            const transportCost = remainingSC * 0.30;  // 30% of remaining SC
            const materialsCost = remainingSC * 0.70;  // 70% of remaining SC (materials + equipment combined)
            const equipmentCost = 0; // Combined with materials

            // 3. SP-based calculations
            const generalLiabilityCost = spTotal * 0.00733;  // 0.733% of SP
            const franchiseTax = spTotal * 0.0075;  // 0.75% of SP
            const externalCosts = generalLiabilityCost + franchiseTax;

            // 4. Final totals
            const totalCompanyCost = scTotal + operationalCosts + externalCosts;
            const grossProfit = spTotal - totalCompanyCost;
            const grossMargin = spTotal > 0 ? (grossProfit / spTotal) : 0;
            const grossMarginPercentage = Math.round(grossMargin * 100);
            
            // 5. Commission calculation
            let commissionAmount = 0;
            if (state.includeCommission && grossProfit > 0) {
                commissionAmount = grossProfit * (state.commissionPercentage / 100);
            }

            // Save results in state for easier access
            state.results = {
                // Core costs
                laborCost,
                laborTax: 0,  // Not used in new logic
                workCompCost,
                transportCost,
                materialsCost,
                equipmentCost,
                
                // Operational costs breakdown
                operationalCosts,
                regularSuppliesCost,
                additionalEquipmentCost,
                uniformSafetyCost,
                communicationsCost,
                overheadCost,
                
                // SC and SP totals
                subtotal: scTotal,  // SC total
                totalPrice: spTotal,  // SP total
                
                // External costs
                generalLiabilityCost,
                franchiseTax,
                
                // Profit calculations
                grandTotal: spTotal,
                netProfit: grossProfit,
                commissionAmount: commissionAmount,
                costPercentage: 100 - grossMarginPercentage,
                profitPercentage: grossMarginPercentage,
                
                // Company cost
                totalCompanyCost,
                
                // Not used in new logic but kept for UI compatibility
                hoodCleaningCost: 0,
                residualPercentageAmount: 0,
                markup: 0,
                markupPercentage: 0,
                holidaySurcharge: 0,
                initialFeeAmount: 0,
                roundingAdjustment: 0,
                salesCommission: 0,
                finalCompanyProfit: grossProfit,
                extraBenefit: 0,
                splitCommissions: [],
                isOptimizationActive: false,
                isTargetAchieved: false
            };

            // Update UI based on calculations
            updateUIForSubcontractor(false, scTotal, 0, 0);

            // Show/hide rows based on conditions
            // These elements will be in future tabs - commented out to avoid issues
            // setDisplay('holidayRow', false);
            // setDisplay('hoodCleaningRow', false);
            // setDisplay('roundingRow', false);
            // setDisplay('initialFeeRow', false);
            // setDisplay('residualPercentageRow', false);
            // setDisplay('workCompRow', true);
            // setDisplay('generalLiabilityRow', true);
            // setDisplay('grandTotalRow', true);
            // setDisplay('salesCommissionRow', false);
            // setDisplay('splitCommissionRows', false);
            
            // Show franchise tax row (add if doesn't exist)
            const franchiseTaxRow = $('franchiseTaxRow');
            if (franchiseTaxRow) {
                setDisplay('franchiseTaxRow', true);
                setContent('franchiseTaxCost', formatCurrency(franchiseTax));
            }

            // Show/hide optimization indicators
            // setDisplay('optimizationBadge', false);
            // setDisplay('targetAchievedBadge', false);

            // Update operational costs display (these elements will be in Configuration/Breakdown tabs)
            // Commented out to avoid console errors until tabs are implemented
            // setContent('operationalCostsValue', formatCurrency(operationalCosts));
            // setContent('regularSuppliesValue', formatCurrency(regularSuppliesCost));
            // setContent('additionalEquipmentValue', formatCurrency(additionalEquipmentCost));
            // setContent('uniformSafetyValue', formatCurrency(uniformSafetyCost));
            // setContent('communicationsValue', formatCurrency(communicationsCost));
            // setContent('overheadValue', formatCurrency(overheadCost));

            // Subcontractor UI updates - elements will be in future tabs
            // setDisplay('subcontractorRow', false);
            // setDisplay('extraBenefitRow', false);

            // Operational costs details display - elements will be in future tabs
            // const operationalCostsRow = $('operationalCostsRow');
            // setDisplay('operationalCostsDetails', operationalCostsRow && operationalCostsRow.classList.contains('expanded'));
            // setDisplay('regularSuppliesRow', true, 'flex');
            // setDisplay('additionalEquipmentRow', true, 'flex');
            // setDisplay('uniformSafetyRow', true, 'flex');

            // Cost percentage display (these elements will be in Breakdown tab)
            const costPercentage = 100 - grossMarginPercentage;
            // Commented out to avoid console errors until tabs are implemented
            // setContent('totalCostPercentage', `${costPercentage}%`);
            // setContent('totalProfitPercentage', `${grossMarginPercentage}%`);
            const costPercentageFill = $('costPercentageFill');
            if (costPercentageFill) {
                costPercentageFill.style.width = `${costPercentage}%`;
                costPercentageFill.setAttribute('aria-valuenow', costPercentage);
            }
            // setContent('percentageTextOverlay', `${costPercentage}%`);

            // Debug log
            console.log('Calculated values:', {
                scTotal,
                spTotal,
                laborCost,
                operationalCosts,
                transportCost,
                materialsCost,
                grossProfit,
                grossMarginPercentage
            });
            
            // Update total and grand total
            setContent('totalPrice', formatCurrency(spTotal));
            setContent('grandTotal', formatCurrency(spTotal)); // For vent hood, grand total is same as total price
            setContent('generalLiabilityCost', formatCurrency(generalLiabilityCost));
            setContent('franchiseTaxCost', formatCurrency(franchiseTax));
            setContent('workCompCost', formatCurrency(workCompCost));
            // Elements that will be in future tabs - commented out to avoid errors
            // setContent('roundingAdjustment', formatCurrency(0));
            
            // Update cost display - only update elements that exist in current HTML
            setContent('laborCost', formatCurrency(laborCost));
            setContent('operationalCosts', formatCurrency(operationalCosts));
            setContent('transportCost', formatCurrency(transportCost));
            setContent('materialsCost', formatCurrency(materialsCost));
            setContent('totalSC', formatCurrency(scTotal));
            
            // Elements for future tabs - commented out
            // setContent('hoodCleaningCost', formatCurrency(0));
            // setContent('subtotal', formatCurrency(scTotal));
            // setContent('markup', formatCurrency(0));
            // setContent('markupPercentage', '0');
            // setContent('profitMarkupPercentage', '0');
            // setContent('holidaySurcharge', formatCurrency(0));
            
            setContent('netProfit', formatCurrency(grossProfit));
            
            // Update commission display
            if (state.includeCommission) {
                setContent('commissionAmount', formatCurrency(commissionAmount));
                setContent('commissionPercentDisplay', `(${state.commissionPercentage}%)`);
            }
            
            setContent('profitMargin', `${grossMarginPercentage}%`);
            
            // Elements for future tabs - commented out
            // setContent('salesCommission', formatCurrency(0));
            // setContent('finalCompanyProfit', formatCurrency(grossProfit));
            // setContent('profitMarkup', formatCurrency(0));
            
            // Add animation to final profit when it updates
            const profitElement = $('finalCompanyProfit');
            if (profitElement) {
                profitElement.classList.remove('updated');
                void profitElement.offsetWidth; // Force reflow
                profitElement.classList.add('updated');
            }

            // Set color of cost percentage bar based on value
            if (costPercentageFill) {
                if (costPercentage > 75) {
                    costPercentageFill.style.backgroundColor = '#e74c3c';
                } else if (costPercentage > 65) {
                    costPercentageFill.style.backgroundColor = '#f39c12';
                } else {
                    costPercentageFill.style.backgroundColor = '#27ae60';
                }
            }

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
    const container = $('salesPersonsContainer');
    if (container) {
        const extraRows = container.querySelectorAll('.sales-person-row:not(:first-child)');
        extraRows.forEach(row => row.remove());
    }
    
    // Show modal
    modal.style.display = 'flex';
    setTimeout(() => {
        modal.classList.add('visible');
        // Use the correct ID for client info modal
        const companyNameInput = $('companyName');
        if (companyNameInput) companyNameInput.focus();
    }, 10);
}

/**
 * Add sales person row
 */
function addSalesPersonRow() {
    const container = $('salesPersonsContainer');
    if (!container) {
        console.error('salesPersonsContainer not found');
        return;
    }
    
    const newRow = document.createElement('div');
    newRow.className = 'sales-person-row flex gap-2';
    newRow.innerHTML = `
        <input type="text" class="sales-person-input flex-1 px-3 py-2 bg-ios-gray-1 rounded-xl border-0 focus:outline-none focus:ring-2 focus:ring-brand-blue" placeholder="Sales person name">
        <button type="button" class="btn-danger remove-sales-person">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    container.appendChild(newRow);
    
    // Add remove event listener
    const removeBtn = newRow.querySelector('.remove-sales-person');
    removeBtn.addEventListener('click', function() {
        newRow.remove();
        updateRemoveSalesPersonButtons();
    });
    
    updateRemoveSalesPersonButtons();
}

/**
 * Update remove buttons visibility for sales persons
 */
function updateRemoveSalesPersonButtons() {
    const container = $('salesPersonsContainer');
    if (!container) return;
    
    const rows = container.querySelectorAll('.sales-person-row');
    rows.forEach((row, index) => {
        const removeBtn = row.querySelector('.remove-sales-person');
        if (removeBtn) {
            // Only show remove button if there's more than one row
            removeBtn.style.display = rows.length > 1 ? 'block' : 'none';
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
    
    // Pre-fill client information from last PDF
    const clientInfo = state.ui.lastClientInfo;
    if (clientInfo) {
        if ($('workOrderBusinessName')) $('workOrderBusinessName').value = clientInfo.companyName || '';
        if ($('workOrderContactName')) $('workOrderContactName').value = clientInfo.contactName || '';
        if ($('workOrderEmail')) $('workOrderEmail').value = clientInfo.contactEmail || '';
        if ($('workOrderPhone')) $('workOrderPhone').value = clientInfo.contactPhone || '';
        if ($('workOrderAddress')) $('workOrderAddress').value = clientInfo.serviceLocation || '';
    }
    
    // Update service details with current values
    const numberOfHoods = state.numberOfHoods || 1;
    const pricePerHood = state.sellingPrice || 650;
    const total = numberOfHoods * pricePerHood;
    
    if ($('workOrderHoodCount')) $('workOrderHoodCount').textContent = numberOfHoods;
    if ($('workOrderPricePerHood')) $('workOrderPricePerHood').textContent = formatCurrency(pricePerHood);
    if ($('workOrderTotal')) $('workOrderTotal').textContent = formatCurrency(total);
    
    // Show modal
    modal.style.display = 'flex';
    setTimeout(() => {
        modal.classList.add('visible');
        // Focus on first input
        const firstInput = modal.querySelector('input:not([readonly]):not([disabled])');
        if (firstInput) firstInput.focus();
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
            doc.text('Professional Vent Hood Cleaning Quote', 40, 60);

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
                doc.save(`vent-hood-cleaning-quote-${quoteNumber}.pdf`);
                
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
            // Convert canvas to blob and download directly
            canvas.toBlob(function(blob) {
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                const quoteNumber = 'PFS-' + new Date().getFullYear() + '-' + Math.floor(Math.random() * 10000).toString().padStart(4, '0');
                link.download = `vent-hood-quote-screenshot-${quoteNumber}.png`;
                link.href = url;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
                
                showNotification("Screenshot saved successfully!", "success");
            }, 'image/png');
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
    console.log('initApp called');
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
    
    // Perform initial calculation
    calculateAll();
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
/**
 * Test Work Order generation with sample data
 */
async function testWorkOrder() {
    showNotification('Generating test work order...', 'info');
    
    // Set test client info
    state.ui.lastClientInfo = {
        companyName: 'Test Restaurant LLC',
        contactName: 'John Smith',
        contactPosition: 'General Manager',
        contactPhone: '(713) 555-1234',
        contactEmail: 'john.smith@testrestaurant.com',
        serviceLocation: '1234 Main Street, Houston, TX 77001',
        salesTeam: ['Maria Garcia', 'Robert Johnson']
    };
    
    // Mark that quote PDF has been generated (for test purposes)
    state.ui.quotePDFGenerated = true;
    
    // Calculate test values
    const numberOfHoods = state.numberOfHoods || 4;
    const pricePerHood = state.sellingPrice || 650;
    const total = numberOfHoods * pricePerHood;
    
    // Create test work order data
    const testDate = new Date();
    testDate.setDate(testDate.getDate() + 7); // Schedule for next week
    
    const testWorkOrderData = {
        services: [{
            title: 'Vent Hood Cleaning',
            description: `${numberOfHoods} hood${numberOfHoods > 1 ? 's' : ''} at ${formatCurrency(pricePerHood)} per hood. Total: ${formatCurrency(total)}`
        }],
        businessName: 'Test Restaurant LLC',
        contactName: 'John Smith',
        email: 'john.smith@testrestaurant.com',
        phone: '(713) 555-1234',
        address: '1234 Main Street, Houston, TX 77001',
        serviceDate: testDate.toISOString().split('T')[0],
        serviceTime: '09:00',
        notes: 'This is a test work order. Please ensure all hoods are accessible and kitchen is cleared before service.',
        paymentTerms: 'Net 30',
        workOrderNumber: generateWorkOrderNumber()
    };
    
    // Generate the work order PDF
    await generateWorkOrderPDF(testWorkOrderData);
}

async function generateTestWorkOrder() {
    // This function is deprecated - use testWorkOrder() instead
    await testWorkOrder();
}

/**
 * Generate Work Order PDF
 */
/**
 * Generate Work Order PDF using HTML template
 */
const serviceGap = 6; // Espaciado compacto entre servicios

function generateWorkOrderHTML(workOrderData, clientInfo, grandTotal) {
    // For vent hood, parse the service details to show quantity and price
    const numberOfHoods = state.numberOfHoods || 1;
    const pricePerHood = state.sellingPrice || 650;
    const totalAmount = numberOfHoods * pricePerHood;
    
    const services = `
        <tr class="bg-gray-50">
            <td class="px-4 py-3 align-top">
                <h4 class="font-bold text-sm text-black mb-1">Vent Hood Cleaning Service</h4>
                <div class="text-xs text-gray-600 pl-4">
                    <p class="mb-1">Professional cleaning of commercial kitchen vent hood system</p>
                    <p class="font-medium">Quantity: ${numberOfHoods} hood${numberOfHoods > 1 ? 's' : ''} × ${formatCurrency(pricePerHood)} = ${formatCurrency(totalAmount)}</p>
                </div>
            </td>
            <td class="px-4 py-3 text-right align-middle font-bold">${formatCurrency(totalAmount)}</td>
        </tr>
    `;

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
                    <img src="../Logo Prime - Facility White No Background.png" alt="Prime Facility Services" class="h-full w-auto" style="filter: brightness(0) invert(1);">
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
                                <span class="text-black font-semibold">${workOrderData.paymentTerms}</span>
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
        
        // Try to load the logo
        const logoImg = tempContainer.querySelector('img');
        if (logoImg) {
            // Create a new image to test if it loads
            const testImg = new Image();
            testImg.crossOrigin = 'anonymous';
            
            await new Promise((resolve) => {
                testImg.onload = () => {
                    // Logo loaded successfully
                    logoImg.crossOrigin = 'anonymous';
                    resolve();
                };
                testImg.onerror = () => {
                    // Logo failed to load, replace with text
                    const textDiv = document.createElement('div');
                    textDiv.className = 'text-2xl font-bold text-white';
                    textDiv.style.letterSpacing = '0.5px';
                    textDiv.textContent = 'PRIME FACILITY SERVICES GROUP';
                    logoImg.parentElement.replaceChild(textDiv, logoImg);
                    resolve();
                };
                testImg.src = logoImg.src;
            });
        }
        
        // Esperar a que Tailwind procese las clases
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Get the work order container
        const workOrderContainer = tempContainer.querySelector('.work-order-container');
        
        // Generate PDF from HTML
        showNotification("Converting to PDF...", "info");
        
        const canvas = await window.html2canvas(workOrderContainer, {
            scale: 2, // Higher quality
            logging: false,
            backgroundColor: '#ffffff',
            windowWidth: 900,
            windowHeight: 1169,
            scrollX: 0,
            scrollY: 0,
            useCORS: true,
            allowTaint: false
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

