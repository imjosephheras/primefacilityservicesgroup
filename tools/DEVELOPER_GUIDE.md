# Developer Guide - Janitorial Cleaning Calculator Suite

## Quick Start

### Prerequisites
- Modern web browser (Chrome, Firefox, Safari, Edge)
- Basic knowledge of HTML, CSS, and JavaScript
- Text editor or IDE (VS Code recommended)
- Local web server (optional, but recommended)

### Running Locally
1. Clone the repository:
   ```bash
   git clone https://github.com/[username]/Janitorial-Cleaning-Calculator.git
   cd Janitorial-Cleaning-Calculator
   ```

2. Start a local server:
   ```bash
   # Using Python
   python -m http.server 8000
   
   # Using Node.js
   npx http-server -p 8000
   
   # Using VS Code Live Server extension
   # Right-click on index.html > "Open with Live Server"
   ```

3. Open browser and navigate to:
   ```
   http://localhost:8000
   ```

4. Default password: `Prime2024`

## Project Structure

### File Organization
```
/
├── index.html              # Entry point with authentication
├── shared/                 # Shared modules (imported by all calculators)
│   ├── utils.js           # Utility functions
│   ├── darkMode.js        # Dark mode management
│   └── notification.js    # Toast notifications
├── kitchen/               # Kitchen Calculator
│   ├── index.html        # Kitchen calculator page
│   ├── app.js           # Business logic (3,767 lines)
│   └── styles.css       # Custom styles
├── vent-hood/            # Vent Hood Calculator
│   ├── index.html       # Vent hood calculator page
│   ├── app.js          # Business logic (3,684 lines)
│   └── styles.css      # Custom styles
├── timesheet/           # Timesheet Calculator
│   ├── index.html      # Timesheet calculator page
│   ├── app.js         # Business logic (976 lines)
│   └── styles.css     # Custom styles
└── test-*.html         # Test files for development
```

## Development Workflow

### Making Changes

#### 1. Modifying Calculations
Each calculator has its calculation logic in the `calculateAll()` function:

```javascript
// Example: Modifying labor cost calculation in kitchen/app.js
function calculateAll() {
    // Find the labor cost calculation section
    const baseLaborCost = workers * hours * days * hourlyRate;
    
    // Add your modifications
    const overtimeMultiplier = 1.5;
    const overtimeHours = Math.max(0, hours - 8);
    const regularHours = Math.min(hours, 8);
    const adjustedLaborCost = workers * days * (
        regularHours * hourlyRate + 
        overtimeHours * hourlyRate * overtimeMultiplier
    );
}
```

#### 2. Adding New Input Fields
1. Add HTML input element:
   ```html
   <div class="input-group">
       <label for="newField">New Field</label>
       <input type="number" id="newField" value="0" min="0">
   </div>
   ```

2. Add to state object:
   ```javascript
   const state = {
       // ... existing state
       newField: 0
   };
   ```

3. Add event listener:
   ```javascript
   $('newField').addEventListener('input', handleNumericInput);
   ```

4. Update calculation logic:
   ```javascript
   function calculateAll() {
       const newFieldValue = state.newField;
       // Use in calculations
   }
   ```

#### 3. Styling Updates
Use Tailwind classes in HTML or add custom CSS:

```html
<!-- Tailwind approach -->
<div class="bg-brand-blue text-white p-4 rounded-lg shadow-md">
    Content
</div>

<!-- Custom CSS in styles.css -->
.custom-style {
    background: linear-gradient(135deg, #03143A 0%, #C70532 100%);
    /* iOS-style blur */
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
}
```

### Common Tasks

#### Adding a New Calculator
1. Create new directory:
   ```bash
   mkdir new-calculator
   cd new-calculator
   ```

2. Create required files:
   ```bash
   touch index.html app.js styles.css
   ```

3. Copy boilerplate from existing calculator and modify:
   - Update navigation links
   - Modify state structure
   - Implement calculation logic
   - Add to main index.html

#### Updating Shared Modules
When modifying shared modules, test in all calculators:

```javascript
// In shared/utils.js
const utils = {
    // Add new utility function
    calculateTax(amount, rate) {
        return amount * (rate / 100);
    },
    
    // Existing functions...
};
```

#### Adding PDF Templates
Modify the PDF generation functions:

```javascript
function generatePDF() {
    const doc = new jsPDF();
    
    // Add custom header
    doc.setFillColor(3, 20, 58); // Brand blue
    doc.rect(0, 0, 210, 40, 'F');
    
    // Add logo
    doc.addImage(logoDataURL, 'PNG', 10, 10, 40, 20);
    
    // Add custom content
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.text('Custom Quote', 105, 25, { align: 'center' });
    
    // Continue with quote details...
}
```

## Code Patterns & Best Practices

### State Management Pattern
```javascript
// Centralized state object
const state = {
    // Group related data
    core: {
        workers: 2,
        hours: 8,
        days: 1
    },
    config: {
        payRate: 16,
        taxRate: 17
    },
    ui: {
        isDarkMode: false,
        activeTab: 'quotation'
    },
    results: {
        total: 0,
        profit: 0
    }
};

// State update function
function updateState(path, value) {
    // path: 'core.workers'
    const keys = path.split('.');
    let current = state;
    
    for (let i = 0; i < keys.length - 1; i++) {
        current = current[keys[i]];
    }
    
    current[keys[keys.length - 1]] = value;
    saveSnapshot(); // For undo/redo
    calculateAll(); // Trigger recalculation
}
```

### Event Handler Pattern
```javascript
// Debounced input handler
const handleNumericInput = debounce(function(event) {
    const input = event.target;
    const value = parseFloat(input.value) || 0;
    const stateKey = input.dataset.stateKey || input.id;
    
    // Validate
    if (value < 0) {
        input.value = 0;
        return;
    }
    
    // Update state
    state[stateKey] = value;
    
    // Highlight change
    highlightElement(input.id);
    
    // Recalculate
    calculateAll();
}, 300);
```

### UI Update Pattern
```javascript
// Efficient DOM updates
function updateUI(results) {
    // Batch DOM updates
    const updates = [
        { id: 'totalPrice', value: formatCurrency(results.total) },
        { id: 'netProfit', value: formatCurrency(results.profit) },
        { id: 'profitPercentage', value: formatPercentage(results.profitPercent) }
    ];
    
    updates.forEach(({ id, value }) => {
        const element = $(id);
        if (element && element.textContent !== value) {
            element.textContent = value;
            highlightElement(id);
        }
    });
}
```

### Error Handling Pattern
```javascript
// Wrap risky operations
function safeCalculation(fn, fallback = 0) {
    try {
        const result = fn();
        if (isNaN(result) || !isFinite(result)) {
            console.warn('Invalid calculation result:', result);
            return fallback;
        }
        return result;
    } catch (error) {
        console.error('Calculation error:', error);
        showNotification('Calculation error occurred', 'error');
        return fallback;
    }
}

// Usage
const profit = safeCalculation(() => {
    return (revenue - costs) / revenue * 100;
}, 0);
```

## Testing & Debugging

### Browser DevTools

#### Console Debugging
```javascript
// Add debug logging
function calculateAll() {
    console.group('Calculation Debug');
    console.log('Input state:', { ...state });
    
    // Calculation steps
    const laborCost = calculateLabor();
    console.log('Labor cost:', laborCost);
    
    const totalCost = calculateTotalCost();
    console.log('Total cost:', totalCost);
    
    console.groupEnd();
}
```

#### Performance Profiling
```javascript
// Measure calculation performance
function calculateAll() {
    console.time('Calculation Time');
    
    // ... calculation logic
    
    console.timeEnd('Calculation Time');
}
```

### Unit Testing
Create test functions in test files:

```javascript
// In test-calculator-functions.html
function testCalculations() {
    const testCases = [
        {
            input: { workers: 2, hours: 8, days: 5, rate: 16 },
            expected: { labor: 1280, tax: 217.6 }
        },
        // More test cases...
    ];
    
    testCases.forEach((test, index) => {
        state.workers = test.input.workers;
        state.hours = test.input.hours;
        state.days = test.input.days;
        state.config.regularPayRate = test.input.rate;
        
        calculateAll();
        
        const passed = Math.abs(state.results.laborCost - test.expected.labor) < 0.01;
        console.log(`Test ${index + 1}: ${passed ? 'PASSED' : 'FAILED'}`);
    });
}
```

### Common Issues & Solutions

#### Issue: Calculations not updating
```javascript
// Solution: Check event listeners
function debugEventListeners() {
    const inputs = document.querySelectorAll('input');
    inputs.forEach(input => {
        console.log(`${input.id}: ${input.hasAttribute('data-listener')}`);
    });
}
```

#### Issue: State not persisting
```javascript
// Solution: Verify localStorage
function debugStorage() {
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
        if (key.includes('calculator')) {
            console.log(key, JSON.parse(localStorage.getItem(key)));
        }
    });
}
```

## Optimization Tips

### Performance

#### 1. Debounce Expensive Operations
```javascript
// Good: Debounced calculation
const debouncedCalculate = debounce(calculateAll, 300);
input.addEventListener('input', debouncedCalculate);

// Bad: Direct calculation
input.addEventListener('input', calculateAll);
```

#### 2. Cache DOM References
```javascript
// Good: Cache references
const elements = {
    totalPrice: $('totalPrice'),
    netProfit: $('netProfit'),
    workers: $('workers')
};

// Bad: Query every time
function updateUI() {
    $('totalPrice').textContent = total;
    $('netProfit').textContent = profit;
}
```

#### 3. Use RequestAnimationFrame for Animations
```javascript
// Good: Smooth animations
function animateValue(element, from, to) {
    const duration = 500;
    const start = performance.now();
    
    function update(currentTime) {
        const elapsed = currentTime - start;
        const progress = Math.min(elapsed / duration, 1);
        const value = from + (to - from) * progress;
        
        element.textContent = formatCurrency(value);
        
        if (progress < 1) {
            requestAnimationFrame(update);
        }
    }
    
    requestAnimationFrame(update);
}
```

### Code Quality

#### 1. Use Constants
```javascript
// Good: Named constants
const TAX_RATES = {
    SOCIAL_SECURITY: 0.062,
    MEDICARE: 0.0145,
    FUTA: 0.006,
    SUTA: 0.027
};

// Bad: Magic numbers
const tax = amount * 0.062 + amount * 0.0145;
```

#### 2. Extract Complex Logic
```javascript
// Good: Extracted function
function calculatePayrollTaxes(basePay) {
    const socialSecurity = basePay * TAX_RATES.SOCIAL_SECURITY;
    const medicare = basePay * TAX_RATES.MEDICARE;
    const futa = basePay * TAX_RATES.FUTA;
    const suta = basePay * TAX_RATES.SUTA;
    
    return {
        socialSecurity,
        medicare,
        futa,
        suta,
        total: socialSecurity + medicare + futa + suta
    };
}

// Bad: Inline calculation
const taxes = basePay * 0.062 + basePay * 0.0145 + basePay * 0.006 + basePay * 0.027;
```

## Deployment

### GitHub Pages
1. Push to GitHub repository
2. Go to Settings > Pages
3. Select source branch (usually `main`)
4. Select root folder
5. Save and wait for deployment

### Custom Domain
1. Add CNAME file with domain:
   ```
   calculators.primefacility.com
   ```

2. Configure DNS:
   ```
   Type: CNAME
   Name: calculators
   Value: [username].github.io
   ```

### Environment Variables
For production deployment with enhanced security:

```javascript
// config.js (gitignored)
const CONFIG = {
    PASSWORD: process.env.CALCULATOR_PASSWORD || 'Prime2024',
    API_KEY: process.env.API_KEY,
    ANALYTICS_ID: process.env.ANALYTICS_ID
};

// In index.html
if (password === CONFIG.PASSWORD) {
    // Authenticate
}
```

## Contributing

### Code Style Guidelines
1. Use ES6+ features
2. Consistent indentation (4 spaces)
3. Meaningful variable names
4. Comment complex logic
5. Keep functions under 50 lines
6. Use early returns to reduce nesting

### Pull Request Process
1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open Pull Request with description

### Commit Message Format
```
type: subject

body (optional)

footer (optional)
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Formatting
- `refactor`: Code restructuring
- `test`: Adding tests
- `chore`: Maintenance

Example:
```
feat: add overtime calculation to kitchen calculator

- Implement overtime rate multiplier
- Add configuration option for overtime threshold
- Update PDF template with overtime details

Closes #123
```

---

*For questions or support, contact the development team.*