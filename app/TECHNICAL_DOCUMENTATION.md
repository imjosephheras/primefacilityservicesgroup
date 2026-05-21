# Technical Documentation - Janitorial Cleaning Calculator Suite

## Table of Contents
1. [Project Overview](#project-overview)
2. [Architecture](#architecture)
3. [Components](#components)
4. [Shared Modules](#shared-modules)
5. [Kitchen Calculator](#kitchen-calculator)
6. [Vent Hood Calculator](#vent-hood-calculator)
7. [Timesheet Calculator](#timesheet-calculator)
8. [Security & Authentication](#security--authentication)
9. [Data Flow](#data-flow)
10. [API Integration](#api-integration)
11. [Testing](#testing)
12. [Deployment](#deployment)
13. [Performance Optimization](#performance-optimization)
14. [Browser Compatibility](#browser-compatibility)

## Project Overview

The Janitorial Cleaning Calculator Suite is a comprehensive web-based application designed for Prime Facility Services Group. It provides professional tools for calculating quotes, managing timesheets, and optimizing business operations in the commercial cleaning industry.

### Key Features
- **Multi-Calculator System**: Three specialized calculators for different business needs
- **Real-time Calculations**: Instant updates as users input data
- **PDF Generation**: Professional quote and work order generation
- **Responsive Design**: Optimized for desktop and mobile devices
- **Dark Mode Support**: System-wide theme switching
- **Secure Access**: Password-protected authentication system
- **Modular Architecture**: Shared components for consistency and maintainability

### Technology Stack
- **Frontend**: Vanilla JavaScript (ES6+)
- **Styling**: Tailwind CSS + Custom CSS
- **PDF Generation**: jsPDF with custom templates
- **Charts**: Chart.js for data visualization
- **Icons**: Font Awesome 6.4.0
- **Fonts**: Montserrat (Google Fonts)

## Architecture

### Directory Structure
```
Janitorial-Cleaning-Calculator/
├── index.html                  # Main entry point with authentication
├── shared/                     # Shared modules
│   ├── utils.js               # Utility functions
│   ├── darkMode.js            # Dark mode management
│   └── notification.js        # Notification system
├── kitchen/                    # Kitchen Calculator
│   ├── index.html
│   ├── app.js
│   └── styles.css
├── vent-hood/                  # Vent Hood Calculator
│   ├── index.html
│   ├── app.js
│   └── styles.css
├── timesheet/                  # Timesheet Calculator
│   ├── index.html
│   ├── app.js
│   └── styles.css
└── test-*.html                # Test files
```

### Design Patterns
1. **Module Pattern**: Each calculator is self-contained with its own state management
2. **Singleton Pattern**: Shared modules (darkMode, notification) use singleton instances
3. **Observer Pattern**: Event-driven updates for UI synchronization
4. **Factory Pattern**: Dynamic creation of UI components (rows, services)

## Components

### Core Components

#### 1. Authentication System (index.html)
- Password-based authentication
- 24-hour session storage
- Smooth transition animations
- Secure client-side validation

#### 2. Navigation System
- Consistent top navigation bar
- Active state indicators
- Responsive design with mobile optimization
- Quick access to all calculators

#### 3. State Management
Each calculator maintains its own state object:
```javascript
const state = {
    // Core calculation data
    // Configuration settings
    // UI state
    // Results cache
    // History for undo/redo
};
```

## Shared Modules

### utils.js
Core utility functions used across all calculators:

```javascript
// Currency formatting
formatCurrency(amount) // Returns formatted currency string

// Percentage formatting
formatPercentage(value) // Returns formatted percentage

// DOM helpers
$(id) // getElementById wrapper
setDisplay(id, show, displayValue) // Toggle element visibility

// Device detection
isMobile() // Detect mobile devices
isIOS() // Detect iOS devices

// Data management
saveToLocalStorage(key, data)
loadFromLocalStorage(key, defaultValue)
removeFromLocalStorage(key)

// Utility functions
debounce(func, wait) // Debounce function calls
formatTime(minutes) // Format time duration
generateId() // Generate unique IDs
deepClone(obj) // Deep clone objects
```

### darkMode.js
Manages application-wide dark mode:

```javascript
class DarkModeManager {
    toggle() // Toggle dark mode
    setTheme(isDark) // Set specific theme
    onThemeChange(callback) // Subscribe to theme changes
    createToggleButton(options) // Create UI toggle
}
```

Features:
- System preference detection
- LocalStorage persistence
- Smooth transitions
- Meta theme-color updates
- Callback system for component updates

### notification.js
Toast notification system:

```javascript
class NotificationManager {
    show(message, type, duration)
    success(message, duration)
    error(message, duration)
    warning(message, duration)
    info(message, duration)
}
```

Features:
- Queue management
- Auto-dismiss with custom duration
- Click to dismiss
- Smooth animations
- Dark mode support

## Kitchen Calculator

### Purpose
Calculate detailed quotes for commercial kitchen cleaning services with profit optimization.

### Key Features
1. **Flexible Input Options**
   - Labor configuration (workers, hours, days)
   - Material and equipment costs
   - Holiday and location surcharges
   - Subcontractor mode

2. **Advanced Pricing**
   - Dynamic markup calculation
   - Target profit optimization
   - Commission calculations
   - Rounding options

3. **Professional Output**
   - Detailed cost breakdown
   - PDF quote generation
   - Work order creation
   - Client information management

### State Structure
```javascript
{
    // Core Data
    useSubcontractor: boolean,
    workers: number,
    hours: number,
    days: number,
    materialsPerDay: number,
    equipmentPerDay: number,
    isHoliday: boolean,
    outsideHouston: boolean,
    
    // Configuration
    config: {
        regularPayRate: number,
        supervisorPayRate: number,
        transportCostPerDay: number,
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
        roundingMethod: string,
        useCustomMarkup: boolean,
        customMarkupPercentage: number,
        commissionPercentage: number
    },
    
    // Results
    results: {
        laborCost: number,
        subtotal: number,
        totalPrice: number,
        grandTotal: number,
        netProfit: number,
        profitPercentage: number
    }
}
```

### Calculation Flow
1. Calculate base labor cost
2. Add payroll taxes and insurance
3. Add operational costs (transport, materials, equipment)
4. Calculate markup based on days/custom percentage
5. Apply surcharges (holiday, location)
6. Apply rounding if enabled
7. Calculate commissions
8. Generate final totals

### PDF Generation
- Custom jsPDF implementation
- Professional layout with company branding
- Dynamic content based on calculation
- Client information integration
- Digital signature placeholder

## Vent Hood Calculator

### Purpose
Specialized calculator for commercial vent hood cleaning services.

### Key Differences from Kitchen Calculator
1. **Hood-specific pricing**
   - Large hood pricing ($650 default)
   - Small hood pricing ($550 default)
   - Per-hood subcontractor costs

2. **Frequency-based calculations**
   - Monthly, quarterly, annual options
   - Automatic price adjustments

3. **Simplified workflow**
   - Focus on hood count and type
   - Streamlined cost structure

### Unique Features
- Hood type differentiation
- Frequency multipliers
- Specialized work order templates
- Hood-specific cost tracking

## Timesheet Calculator

### Purpose
Track labor hours and calculate comprehensive employment costs.

### Key Features
1. **Dynamic Position Management**
   - Add/remove positions
   - Custom position names
   - Quantity multipliers
   - Individual pay rates

2. **Weekly Time Tracking**
   - 7-day grid input
   - Half-hour increments
   - Automatic totaling
   - Visual feedback

3. **Cost Analysis**
   - Texas-specific tax calculations
   - Workers' compensation
   - Liability insurance
   - Administrative overhead

4. **Data Visualization**
   - Chart.js integration
   - Hours distribution chart
   - Cost breakdown chart
   - Real-time updates

### Tax Calculations (Texas)
```javascript
// Employer taxes
socialSecurityRate: 6.2%
medicareRate: 1.45%
futaRate: 0.6%
sutaRate: 2.7%
workCompRate: 2.5%
```

### State Management
```javascript
{
    positions: [{
        id: number,
        name: string,
        quantity: number,
        rate: number,
        hours: number[] // 7 days
    }],
    config: {
        // Tax rates
        // Fixed costs
        // Business settings
    },
    charts: {
        hours: ChartInstance,
        cost: ChartInstance
    }
}
```

## Security & Authentication

### Authentication Flow
1. User enters password on index.html
2. Client-side validation against hardcoded password
3. Success: Store timestamp in localStorage
4. Redirect to calculator selection
5. 24-hour session duration
6. Automatic re-authentication check

### Security Considerations
- Client-side only (no backend)
- Password stored in JavaScript (visible in source)
- Suitable for basic access control
- Not suitable for sensitive data protection

### Recommendations for Enhanced Security
1. Implement server-side authentication
2. Use environment variables for credentials
3. Add rate limiting
4. Implement proper session management
5. Use HTTPS in production

## Data Flow

### Input Processing
1. User inputs trigger event listeners
2. Debounced calculation calls (300ms delay)
3. State updates
4. Calculation engine processes
5. Results update
6. UI synchronization

### State Persistence
- Configuration saved to localStorage
- Auto-save on changes
- Load saved state on initialization
- Manual reset option

### PDF Generation Flow
1. Collect calculation results
2. Show client info modal
3. Validate client data
4. Generate PDF with jsPDF
5. Inject dynamic content
6. Add formatting and styling
7. Auto-download PDF

## API Integration

### External Dependencies
1. **Google Fonts API**
   - Montserrat font family
   - Preconnect for performance

2. **Font Awesome CDN**
   - Icon library
   - Version 6.4.0

3. **Tailwind CSS CDN**
   - Utility-first CSS framework
   - Custom configuration

### Future API Considerations
- CRM integration for client data
- Cloud storage for quotes
- Email delivery service
- Analytics tracking
- Payment processing

## Testing

### Test Files
1. **test-shared-modules.html**
   - Tests all shared utilities
   - Notification system verification
   - Dark mode functionality
   - Integration testing

2. **test-calculator-functions.html**
   - Calculation accuracy
   - Edge case handling
   - Performance testing

3. **test-pdf-client-info.html**
   - PDF generation testing
   - Client info modal
   - Form validation

4. **test-work-order.html**
   - Work order functionality
   - Service management
   - Preview generation

### Testing Strategy
- Manual testing for UI/UX
- Console logging for debugging
- Browser DevTools for performance
- Cross-browser testing
- Mobile device testing

## Deployment

### Requirements
- Modern web browser (Chrome, Firefox, Safari, Edge)
- JavaScript enabled
- Internet connection (for CDN resources)
- No server-side requirements

### Deployment Steps
1. Clone repository
2. No build process required
3. Serve static files
4. Configure web server for SPA routing
5. Enable HTTPS
6. Set appropriate headers

### Hosting Options
- GitHub Pages
- Netlify
- Vercel
- AWS S3 + CloudFront
- Traditional web hosting

## Performance Optimization

### Current Optimizations
1. **Debounced Calculations**
   - 300ms delay prevents excessive recalculation
   - Smooth user experience

2. **Efficient DOM Updates**
   - Targeted element updates
   - Minimize reflows/repaints

3. **CDN Usage**
   - External libraries from CDN
   - Browser caching benefits

4. **Lazy Loading**
   - Charts loaded on-demand
   - PDF library loaded when needed

### Future Optimizations
1. **Code Splitting**
   - Separate calculator bundles
   - Dynamic imports

2. **Service Workers**
   - Offline functionality
   - Asset caching

3. **Image Optimization**
   - WebP format
   - Responsive images
   - Lazy loading

4. **Bundle Size Reduction**
   - Tree shaking
   - Minification
   - Compression

## Browser Compatibility

### Supported Browsers
- Chrome 90+ ✓
- Firefox 88+ ✓
- Safari 14+ ✓
- Edge 90+ ✓
- Mobile Safari (iOS 14+) ✓
- Chrome Mobile ✓

### JavaScript Features Used
- ES6+ syntax (arrow functions, template literals)
- Promises
- Array methods (map, filter, reduce)
- Object destructuring
- Optional chaining
- Nullish coalescing

### CSS Features
- CSS Grid
- Flexbox
- CSS Variables
- Transitions/Animations
- Media Queries
- Tailwind utilities

### Polyfills Needed
- None required for target browsers
- Consider for older browser support:
  - Promise polyfill
  - Array method polyfills
  - CSS variable ponyfill

---

## Maintenance Guidelines

### Code Style
- Use consistent ES6+ syntax
- Follow existing patterns
- Comment complex logic
- Use meaningful variable names
- Keep functions focused and small

### Adding New Features
1. Update state structure
2. Add event listeners
3. Implement calculation logic
4. Update UI components
5. Test thoroughly
6. Update documentation

### Debugging Tips
- Use browser DevTools
- Check console for errors
- Verify state updates
- Test calculations manually
- Use breakpoints for complex logic

### Version Control
- Semantic versioning
- Clear commit messages
- Feature branches
- Regular backups
- Change documentation

---

*Last Updated: January 2025*
*Version: 2.4.0*
*Author: Christian Reyes*