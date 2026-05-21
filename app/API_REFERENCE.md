# API Reference - Janitorial Cleaning Calculator Suite

## Table of Contents
1. [Shared Modules](#shared-modules)
2. [Kitchen Calculator API](#kitchen-calculator-api)
3. [Vent Hood Calculator API](#vent-hood-calculator-api)
4. [Timesheet Calculator API](#timesheet-calculator-api)
5. [Global Functions](#global-functions)
6. [Event System](#event-system)
7. [State Management](#state-management)
8. [PDF Generation](#pdf-generation)

## Shared Modules

### utils.js

#### Currency Formatting
```javascript
formatCurrency(amount: number): string
```
Formats a number as USD currency.
- **Parameters**: `amount` - The numeric value to format
- **Returns**: Formatted currency string (e.g., "$1,234.56")
- **Example**: 
  ```javascript
  utils.formatCurrency(1234.56) // Returns "$1,234.56"
  ```

#### Percentage Formatting
```javascript
formatPercentage(value: number): string
```
Formats a number as a percentage.
- **Parameters**: `value` - The numeric value to format
- **Returns**: Formatted percentage string
- **Example**: 
  ```javascript
  utils.formatPercentage(42.7) // Returns "42.7%"
  ```

#### DOM Helper
```javascript
$(id: string): HTMLElement | null
```
Shorthand for document.getElementById.
- **Parameters**: `id` - Element ID
- **Returns**: DOM element or null
- **Example**: 
  ```javascript
  utils.$('submitBtn') // Returns the element with id="submitBtn"
  ```

#### Debounce Function
```javascript
debounce(func: Function, wait: number): Function
```
Creates a debounced version of a function.
- **Parameters**: 
  - `func` - Function to debounce
  - `wait` - Delay in milliseconds
- **Returns**: Debounced function
- **Example**: 
  ```javascript
  const debouncedSave = utils.debounce(saveData, 300);
  ```

#### Display Toggle
```javascript
setDisplay(id: string, show: boolean, displayValue?: string): void
```
Shows or hides an element.
- **Parameters**: 
  - `id` - Element ID
  - `show` - Whether to show the element
  - `displayValue` - CSS display value when shown (default: 'block')
- **Example**: 
  ```javascript
  utils.setDisplay('errorMsg', true, 'flex')
  ```

#### Device Detection
```javascript
isMobile(): boolean
```
Detects if the user is on a mobile device.
- **Returns**: true if mobile device
- **Example**: 
  ```javascript
  if (utils.isMobile()) {
      // Mobile-specific code
  }
  ```

```javascript
isIOS(): boolean
```
Detects if the user is on an iOS device.
- **Returns**: true if iOS device

#### Time Formatting
```javascript
formatTime(minutes: number): string
```
Formats minutes into hours and minutes.
- **Parameters**: `minutes` - Total minutes
- **Returns**: Formatted time string
- **Example**: 
  ```javascript
  utils.formatTime(125) // Returns "2h 5m"
  ```

#### Number Formatting
```javascript
formatNumber(num: number, decimals?: number): string
```
Formats a number with thousand separators.
- **Parameters**: 
  - `num` - Number to format
  - `decimals` - Decimal places (default: 0)
- **Returns**: Formatted number string
- **Example**: 
  ```javascript
  utils.formatNumber(1234567.89, 2) // Returns "1,234,567.89"
  ```

#### Value Clamping
```javascript
clamp(value: number, min: number, max: number): number
```
Constrains a value between min and max.
- **Parameters**: 
  - `value` - Value to clamp
  - `min` - Minimum value
  - `max` - Maximum value
- **Returns**: Clamped value
- **Example**: 
  ```javascript
  utils.clamp(150, 0, 100) // Returns 100
  ```

#### Local Storage
```javascript
saveToLocalStorage(key: string, data: any): boolean
```
Saves data to localStorage.
- **Parameters**: 
  - `key` - Storage key
  - `data` - Data to save
- **Returns**: Success status

```javascript
loadFromLocalStorage(key: string, defaultValue?: any): any
```
Loads data from localStorage.
- **Parameters**: 
  - `key` - Storage key
  - `defaultValue` - Default if not found
- **Returns**: Stored data or default

```javascript
removeFromLocalStorage(key: string): boolean
```
Removes data from localStorage.
- **Parameters**: `key` - Storage key
- **Returns**: Success status

#### Validation
```javascript
validateNumber(value: any, min?: number, max?: number): number
```
Validates and constrains a numeric value.
- **Parameters**: 
  - `value` - Value to validate
  - `min` - Minimum value (default: 0)
  - `max` - Maximum value (default: Infinity)
- **Returns**: Valid number

#### ID Generation
```javascript
generateId(): string
```
Generates a unique identifier.
- **Returns**: Unique ID string
- **Example**: 
  ```javascript
  const id = utils.generateId() // Returns "lp3k4j2n_x4m"
  ```

#### Deep Clone
```javascript
deepClone(obj: Object): Object
```
Creates a deep copy of an object.
- **Parameters**: `obj` - Object to clone
- **Returns**: Cloned object

#### Smooth Scroll
```javascript
smoothScroll(element: HTMLElement): void
```
Smoothly scrolls an element into view.
- **Parameters**: `element` - Element to scroll to

#### Vibration
```javascript
vibrate(duration?: number): void
```
Triggers device vibration.
- **Parameters**: `duration` - Vibration duration in ms (default: 10)

#### Clipboard
```javascript
copyToClipboard(text: string): Promise<void>
```
Copies text to clipboard.
- **Parameters**: `text` - Text to copy
- **Returns**: Promise that resolves on success
- **Example**: 
  ```javascript
  utils.copyToClipboard('Hello World')
      .then(() => console.log('Copied!'))
      .catch(err => console.error('Failed to copy'));
  ```

### darkMode.js

#### DarkModeManager Class
```javascript
class DarkModeManager {
    isDarkMode: boolean
    callbacks: Function[]
}
```

#### Methods
```javascript
toggle(): boolean
```
Toggles dark mode on/off.
- **Returns**: New dark mode state

```javascript
setTheme(isDark: boolean): void
```
Sets specific theme.
- **Parameters**: `isDark` - Whether to enable dark mode

```javascript
onThemeChange(callback: Function): Function
```
Subscribes to theme changes.
- **Parameters**: `callback` - Function to call on theme change
- **Returns**: Unsubscribe function
- **Example**: 
  ```javascript
  const unsubscribe = darkModeManager.onThemeChange((isDark) => {
      console.log('Dark mode:', isDark);
  });
  ```

```javascript
createToggleButton(options?: Object): HTMLElement
```
Creates a dark mode toggle button.
- **Parameters**: `options` - Button configuration
  - `containerId` - Button container ID
  - `position` - Position object {top, right}
  - `size` - Button size
  - `iconSize` - Icon size
- **Returns**: Button element

```javascript
get currentTheme(): string
```
Gets current theme name.
- **Returns**: 'dark' or 'light'

### notification.js

#### NotificationManager Class
```javascript
class NotificationManager {
    container: HTMLElement
    queue: Array
    isProcessing: boolean
}
```

#### Methods
```javascript
show(message: string, type?: string, duration?: number): void
```
Shows a notification.
- **Parameters**: 
  - `message` - Notification text
  - `type` - Type: 'success', 'error', 'warning', 'info' (default: 'info')
  - `duration` - Display duration in ms (default: 3000)

```javascript
success(message: string, duration?: number): void
```
Shows success notification.

```javascript
error(message: string, duration?: number): void
```
Shows error notification.

```javascript
warning(message: string, duration?: number): void
```
Shows warning notification.

```javascript
info(message: string, duration?: number): void
```
Shows info notification.

```javascript
clear(): void
```
Clears all notifications.

## Kitchen Calculator API

### State Structure
```javascript
const state = {
    // Core Data
    useSubcontractor: boolean,
    subcontractorCost: number,
    workers: number,
    hours: number,
    days: number,
    materialsPerDay: number,
    equipmentPerDay: number,
    isHoliday: boolean,
    outsideHouston: boolean,
    includeInsurance: boolean,
    
    // Configuration
    config: {
        regularPayRate: number,
        supervisorPayRate: number,
        transportCostPerDay: number,
        outsideHoustonTransportCostPerDay: number,
        workCompRate: number,
        glRate: number,
        payrollTaxRate: number,
        targetCostPercentage: number
    },
    
    // Options
    options: {
        includeTransport: boolean,
        includeMaterials: boolean,
        includeEquipment: boolean,
        enableRounding: boolean,
        roundingMethod: string, // 'up' | 'down' | 'nearest'
        roundingValue: number,
        useCustomMarkup: boolean,
        customMarkupPercentage: number,
        commissionPercentage: number,
        enableCommissionSplit: boolean,
        commissionSplits: number[],
        regularSuppliesPercentage: number,
        additionalEquipmentPercentage: number,
        uniformSafetyPercentage: number,
        communicationsPercentage: number,
        overheadPercentage: number,
        enableInitialFee: boolean,
        initialFeeValue: number,
        enableResidualPercentage: boolean,
        residualPercentageValue: number,
        enableAutoCostOptimization: boolean
    },
    
    // UI State
    ui: {
        sectionStates: Object,
        operationalCostsExpanded: boolean,
        isDarkMode: boolean,
        isCalculating: boolean,
        hasUnsavedConfigChanges: boolean,
        highlightedElements: Set,
        valueHistory: Object,
        toastQueue: Array,
        quotePDFGenerated: boolean,
        lastClientInfo: Object
    },
    
    // Results
    results: {
        laborCost: number,
        laborTax: number,
        workCompCost: number,
        transportCost: number,
        materialsCost: number,
        equipmentCost: number,
        operationalCosts: number,
        subtotal: number,
        residualAmount: number,
        markup: number,
        markupPercentage: number,
        holidaySurcharge: number,
        totalPrice: number,
        generalLiabilityCost: number,
        franchiseTaxCost: number,
        initialFeeAmount: number,
        roundingAdjustment: number,
        grandTotal: number,
        netProfit: number,
        costPercentage: number,
        profitPercentage: number,
        salesCommission: number,
        finalCompanyProfit: number,
        splitCommissions: Array
    },
    
    // History
    history: {
        snapshots: Array,
        currentIndex: number,
        maxSnapshots: number
    }
}
```

### Core Functions

#### Calculation Functions
```javascript
calculateAll(): void
```
Main calculation function that updates all results.

```javascript
calculateMarkupPercentage(days: number): number
```
Calculates markup percentage based on job duration.
- **Parameters**: `days` - Number of days
- **Returns**: Markup percentage

```javascript
calculateRequiredMarkup(targetGrandTotal: number): number
```
Calculates markup needed for target total.
- **Parameters**: `targetGrandTotal` - Desired grand total
- **Returns**: Required markup amount

```javascript
applyManualGrandTotal(targetGrandTotal: number): void
```
Applies manual grand total adjustment.
- **Parameters**: `targetGrandTotal` - Target grand total

#### UI Functions
```javascript
showNotification(message: string, type?: string, duration?: number): void
```
Shows a toast notification.

```javascript
toggleSection(sectionId: string, button: HTMLElement): void
```
Toggles collapsible section visibility.

```javascript
showContent(contentId: string): void
```
Shows specific content tab.

```javascript
resetCalculator(): void
```
Resets calculator to default state.

```javascript
updateUIFromState(): void
```
Synchronizes UI with current state.

#### Work Order Functions
```javascript
addWorkOrderService(): void
```
Adds a new service to work order.

```javascript
removeWorkOrderService(serviceItem: HTMLElement): void
```
Removes a service from work order.

```javascript
updateWorkOrderPreview(): void
```
Updates work order preview display.

```javascript
generateWorkOrderPDF(): void
```
Generates work order PDF document.

#### PDF Functions
```javascript
showClientInfoModal(): void
```
Shows client information modal for PDF.

```javascript
generatePDF(clientInfo: Object): void
```
Generates quote PDF with client info.
- **Parameters**: `clientInfo` - Client details object
  - `businessName`: string
  - `contactName`: string
  - `email`: string
  - `phone`: string
  - `address`: string
  - `date`: string
  - `validUntil`: string
  - `notes`: string

## Vent Hood Calculator API

### State Differences
Additional/modified properties:
```javascript
{
    numberOfHoods: number,
    hoodFrequency: number, // 1=monthly, 3=quarterly, 12=annual
    sellingPrice: number,
    subcontractorCostPerHood: number,
    largeHoods: number,
    smallHoods: number,
    hoodCleaningFrequency: number,
    
    config: {
        // ... base config plus:
        largeHoodPrice: number,
        smallHoodPrice: number,
        largeHoodInternalCost: number,
        smallHoodInternalCost: number
    },
    
    results: {
        // ... base results plus:
        hoodCleaningCost: number
    }
}
```

### Hood-Specific Functions
```javascript
updateHoodCount(): void
```
Updates total hood count from large/small inputs.

```javascript
calculateHoodCosts(): Object
```
Calculates hood-specific cleaning costs.
- **Returns**: Object with cost breakdown

```javascript
applyFrequencyMultiplier(baseCost: number): number
```
Applies frequency-based cost adjustment.
- **Parameters**: `baseCost` - Base cleaning cost
- **Returns**: Adjusted cost

## Timesheet Calculator API

### State Structure
```javascript
const state = {
    positions: Array<{
        id: number,
        name: string,
        quantity: number,
        rate: number,
        hours: number[] // 7 elements for each day
    }>,
    nextId: number,
    config: {
        regularPayRate: number,
        supervisorPayRate: number,
        socialSecurityRate: number,
        medicareRate: number,
        futaRate: number,
        sutaRate: number,
        workCompRate: number,
        liabilityInsurance: number,
        uniformsCost: number,
        suppliesCost: number,
        adminRate: number,
        defaultMarkup: number,
        commissionRate: number
    },
    currentMarkup: number,
    charts: {
        hours: Chart,
        cost: Chart
    }
}
```

### Position Management
```javascript
addPosition(): void
```
Adds a new position row.

```javascript
deletePosition(positionId: number): void
```
Removes a position.
- **Parameters**: `positionId` - Position ID to delete

```javascript
createPositionRow(position: Object): HTMLElement
```
Creates a position table row.
- **Parameters**: `position` - Position object
- **Returns**: Table row element

### Calculation Functions
```javascript
updateRowTotal(row: HTMLElement): void
```
Updates total hours for a position row.

```javascript
updateTotals(): void
```
Updates all totals and triggers cost calculation.

```javascript
calculateCosts(): void
```
Calculates all employment costs.

```javascript
updateCharts(): void
```
Updates Chart.js visualizations.

### Export Functions
```javascript
exportToCSV(): void
```
Exports timesheet data to CSV file.

```javascript
exportToPDF(): void
```
Generates PDF report with charts.

```javascript
takeScreenshot(): void
```
Captures timesheet as image.

## Global Functions

### Event Handlers
```javascript
handleNumericInput(event: Event): void
```
Handles numeric input changes.

```javascript
handleCheckboxChange(event: Event): void
```
Handles checkbox state changes.

```javascript
handleKeyboardShortcuts(event: KeyboardEvent): void
```
Handles keyboard shortcuts.
- **Shortcuts**:
  - `Ctrl/Cmd + S`: Save configuration
  - `Ctrl/Cmd + R`: Reset calculator
  - `Ctrl/Cmd + P`: Generate PDF
  - `Ctrl/Cmd + Z`: Undo
  - `Ctrl/Cmd + Y`: Redo

### Validation
```javascript
validateInput(input: HTMLInputElement): boolean
```
Validates individual input.
- **Parameters**: `input` - Input element
- **Returns**: Validation status

```javascript
validateAllInputs(): boolean
```
Validates all form inputs.
- **Returns**: Overall validation status

### History Management
```javascript
saveSnapshot(): void
```
Saves current state snapshot for undo.

```javascript
undo(): void
```
Reverts to previous state.

```javascript
redo(): void
```
Advances to next state.

```javascript
applySnapshot(index: number): void
```
Applies specific history snapshot.

## Event System

### Custom Events
```javascript
// State change event
document.addEventListener('stateChanged', (event) => {
    console.log('State changed:', event.detail);
});

// Calculation complete event
document.addEventListener('calculationComplete', (event) => {
    console.log('Results:', event.detail.results);
});

// PDF generated event
document.addEventListener('pdfGenerated', (event) => {
    console.log('PDF created:', event.detail.filename);
});
```

### Event Dispatching
```javascript
// Dispatch custom event
function dispatchStateChange(changes) {
    const event = new CustomEvent('stateChanged', {
        detail: { changes, timestamp: Date.now() }
    });
    document.dispatchEvent(event);
}
```

## State Management

### State Persistence
```javascript
saveState(): void
```
Saves current state to localStorage.

```javascript
loadState(): void
```
Loads saved state from localStorage.

```javascript
exportState(): string
```
Exports state as JSON string.

```javascript
importState(jsonString: string): boolean
```
Imports state from JSON string.
- **Parameters**: `jsonString` - Serialized state
- **Returns**: Import success status

### State Synchronization
```javascript
syncState(partial: Object): void
```
Merges partial state update.
- **Parameters**: `partial` - Partial state object

```javascript
resetState(): void
```
Resets state to defaults.

## PDF Generation

### jsPDF Configuration
```javascript
const pdfConfig = {
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
    compress: true
}
```

### PDF Helper Functions
```javascript
addHeader(doc: jsPDF, title: string): void
```
Adds branded header to PDF.

```javascript
addFooter(doc: jsPDF, pageNumber: number): void
```
Adds footer with page number.

```javascript
addTable(doc: jsPDF, data: Array, columns: Array, startY: number): number
```
Adds data table to PDF.
- **Returns**: End Y position

```javascript
formatPDFCurrency(amount: number): string
```
Formats currency for PDF display.

### PDF Templates
```javascript
// Quote template structure
const quoteTemplate = {
    header: {
        logo: 'base64...',
        title: 'Professional Quote',
        company: 'Prime Facility Services Group'
    },
    sections: [
        'clientInfo',
        'serviceDetails',
        'costBreakdown',
        'terms',
        'signature'
    ],
    styles: {
        primaryColor: [3, 20, 58],
        secondaryColor: [199, 5, 50],
        fontSize: {
            title: 20,
            heading: 14,
            body: 10
        }
    }
}
```

---

*This API reference covers the public interfaces of the Janitorial Cleaning Calculator Suite. For implementation details, refer to the source code.*