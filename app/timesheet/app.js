// Timesheet Calculator Application
/*
 * BUSINESS MODEL EXPLANATION:
 * 
 * This calculator implements a labor cost and pricing model for janitorial services.
 * 
 * KEY PRINCIPLE: The client price is FINAL - we never add costs on top of the quoted price.
 * 
 * PRICING FORMULA:
 * Client Price = Base Labor Cost × (1 + Markup%)
 * 
 * PROFIT MODEL:
 * 1. We pay employees their hourly rate (e.g., $16/hr)
 * 2. We charge clients a marked-up rate (e.g., $20/hr with 25% markup)
 * 3. The difference ($4/hr) is our GROSS PROFIT
 * 4. From this gross profit, we must pay ALL operating expenses:
 *    - Employer payroll taxes (~11%)
 *    - Workers' compensation insurance (2.5%)
 *    - General liability insurance ($7.33/$1k)
 *    - Franchise tax (0.75%)
 *    - Administrative overhead (5%)
 * 5. What remains is our NET PROFIT
 * 6. On the first month only, we pay 20% commission on net profit
 * 
 * IMPORTANT: All percentages are calculated on BASE LABOR, not client price.
 * This ensures our costs are predictable and margins are protected.
 */
(function () {
    'use strict';

    // ===== State Management =====
    let screenshotCanvas = null;
    
    const state = {
        positions: [{
            id: 1,
            name: 'Regular Worker',
            quantity: 1,
            rate: 16,
            hours: [0, 0, 0, 0, 0, 0, 0]
        },
        {
            id: 2,
            name: 'Supervisor',
            quantity: 1,
            rate: 18,
            hours: [0, 0, 0, 0, 0, 0, 0]
        }
        ],
        nextId: 3,
        isFirstMonth: false, // Track if this is the first month
        config: {
            regularPayRate: 16,
            supervisorPayRate: 18,
            // Texas-specific tax rates
            socialSecurityRate: 0.062,
            medicareRate: 0.0145,
            futaRate: 0.006,
            sutaRate: 0.027,
            workCompRate: 0.025,
            // Operating costs
            overheadRate: 0.05,             // 5% overhead only
            // Business settings
            defaultMarkup: 42,
            commissionRate: 0.20
        },
        currentMarkup: 42,
        monthlySupplies: 0,
        monthlyEquipment: 0,
        charts: {
            hours: null,
            cost: null
        }
    };

    // ===== Use Shared Modules =====
    const $ = utils.$;
    const formatCurrency = utils.formatCurrency;
    const formatPercentage = utils.formatPercentage;
    const debounce = utils.debounce;
    const showNotification = (message, type = 'info') => notificationManager.show(message, type);

    // ===== Position Management =====
    function createPositionRow(position) {
        const row = document.createElement('tr');
        row.dataset.positionId = position.id;

        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const hourInputs = position.hours.map((hours, i) =>
            `<td class="py-2 px-1"><input type="number" class="hours-input w-full px-2 py-2 bg-ios-gray-1 rounded-lg text-center border-0 focus:outline-none focus:ring-2 focus:ring-brand-blue transition-all duration-200" data-day="${i}" value="${hours || ''}" min="0" max="24" step="0.5" inputmode="decimal"></td>`
        ).join('');

        row.innerHTML = `
            <td class="py-2 px-2"><input type="text" class="position-input w-full px-3 py-2 bg-ios-gray-1 rounded-lg border-0 focus:outline-none focus:ring-2 focus:ring-brand-blue transition-all duration-200" value="${position.name}" placeholder="Position/Name"></td>
            <td class="py-2 px-2"><input type="number" class="quantity-input w-full px-2 py-2 bg-ios-gray-1 rounded-lg text-center border-0 focus:outline-none focus:ring-2 focus:ring-brand-blue transition-all duration-200" value="${position.quantity || 1}" min="1" max="99" step="1" inputmode="numeric"></td>
            <td class="py-2 px-2"><input type="number" class="rate-input w-full px-2 py-2 bg-ios-gray-1 rounded-lg text-center border-0 focus:outline-none focus:ring-2 focus:ring-brand-blue transition-all duration-200" value="${position.rate}" min="0" step="0.01" inputmode="decimal"></td>
            ${hourInputs}
            <td class="total-hours text-center py-2 px-2 font-semibold bg-light-blue text-brand-blue">0</td>
            <td class="py-2 px-1 flex gap-1">
                <button class="fill-weekdays-btn text-brand-blue p-2 rounded-lg hover:bg-blue-50 active:scale-95 transition-all duration-200" title="Fill weekdays with 8 hours">
                    <i class="fas fa-business-time"></i>
                </button>
                <button class="duplicate-btn text-success-green p-2 rounded-lg hover:bg-green-50 active:scale-95 transition-all duration-200" title="Duplicate position">
                    <i class="fas fa-copy"></i>
                </button>
                <button class="delete-btn text-danger-red p-2 rounded-lg hover:bg-red-50 active:scale-95 transition-all duration-200" title="Delete position">
                    <i class="fas fa-trash-alt"></i>
                </button>
            </td>
        `;

        return row;
    }

    function addPosition() {
        const newPosition = {
            id: state.nextId++,
            name: `Position ${state.positions.length + 1}`,
            quantity: 1,
            rate: state.config.regularPayRate,
            hours: [0, 0, 0, 0, 0, 0, 0]
        };

        state.positions.push(newPosition);
        const tbody = $('timesheetRows');
        const newRow = createPositionRow(newPosition);
        tbody.appendChild(newRow);
        newRow.classList.add('ios-slide');

        updateTotals();
        showNotification('Position added', 'success');
        
        // Focus on the first input of the new row
        setTimeout(() => {
            const firstInput = newRow.querySelector('.position-input');
            if (firstInput) firstInput.focus();
        }, 100);
    }

    function deletePosition(positionId) {
        if (state.positions.length <= 1) {
            showNotification('At least one position is required', 'warning');
            return;
        }

        // Confirm deletion
        if (!confirm('Are you sure you want to delete this position?')) {
            return;
        }

        state.positions = state.positions.filter(p => p.id !== positionId);
        const row = document.querySelector(`tr[data-position-id="${positionId}"]`);
        if (row) {
            row.classList.add('fade-out');
            setTimeout(() => {
                row.remove();
            }, 300);
        }

        updateTotals();
        showNotification('Position removed', 'info');
    }

    function fillWeekdaysWithEightHours(positionId) {
        const position = state.positions.find(p => p.id === positionId);
        if (!position) return;
        
        // Fill Monday (1) through Friday (5) with 8 hours
        // Sunday is 0, Saturday is 6
        for (let day = 1; day <= 5; day++) {
            position.hours[day] = 8;
        }
        
        // Update the UI
        const row = document.querySelector(`tr[data-position-id="${positionId}"]`);
        if (row) {
            for (let day = 1; day <= 5; day++) {
                const input = row.querySelector(`input[data-day="${day}"]`);
                if (input) {
                    input.value = 8;
                }
            }
            
            // Add a visual effect
            row.classList.add('ios-bounce');
            setTimeout(() => {
                row.classList.remove('ios-bounce');
            }, 600);
        }
        
        // Update totals
        updateRowTotal(row);
        updateTotals();
        
        showNotification('Weekdays filled with 8 hours', 'success');
    }

    function duplicatePosition(positionId) {
        const originalPosition = state.positions.find(p => p.id === positionId);
        if (!originalPosition) return;
        
        // Create a copy of the position
        const newPosition = {
            id: state.nextId++,
            name: originalPosition.name + ' (Copy)',
            quantity: originalPosition.quantity,
            rate: originalPosition.rate,
            hours: [...originalPosition.hours] // Create a new array copy
        };
        
        // Add to state
        state.positions.push(newPosition);
        
        // Add to UI
        const tbody = $('timesheetRows');
        const newRow = createPositionRow(newPosition);
        
        // Insert after the original row
        const originalRow = document.querySelector(`tr[data-position-id="${positionId}"]`);
        if (originalRow && originalRow.nextSibling) {
            tbody.insertBefore(newRow, originalRow.nextSibling);
        } else {
            tbody.appendChild(newRow);
        }
        
        // Add visual effect
        newRow.classList.add('ios-slide');
        
        // Update totals
        updateRowTotal(newRow);
        updateTotals();
        
        showNotification('Position duplicated', 'success');
        
        // Focus on the name input of the new row
        setTimeout(() => {
            const nameInput = newRow.querySelector('.position-input');
            if (nameInput) {
                nameInput.focus();
                nameInput.select();
            }
        }, 100);
    }

    // ===== Supplies & Equipment Helper =====
    function updateSuppliesEquipmentTotal() {
        const total = state.monthlySupplies + state.monthlyEquipment;
        const totalElement = $('totalSuppliesEquipment');
        if (totalElement) {
            totalElement.textContent = formatCurrency(total);
        }
    }

    // ===== Calculations =====
    function updateRowTotal(row) {
        const positionId = parseInt(row.dataset.positionId);
        const position = state.positions.find(p => p.id === positionId);
        if (!position) return;
        
        const inputs = row.querySelectorAll('.hours-input');
        let total = 0;

        inputs.forEach(input => {
            const hours = parseFloat(input.value) || 0;
            // Ensure hours are non-negative
            total += Math.max(0, hours);
        });
        
        const totalWithQuantity = total * (position.quantity || 1);
        row.querySelector('.total-hours').textContent = totalWithQuantity;
    }

    function updateTotals() {
        const dayTotals = [0, 0, 0, 0, 0, 0, 0];
        let grandTotal = 0;

        // Calculate totals
        state.positions.forEach(position => {
            position.hours.forEach((hours, day) => {
                const hoursWithQuantity = hours * (position.quantity || 1);
                dayTotals[day] += hoursWithQuantity;
                grandTotal += hoursWithQuantity;
            });
        });

        // Update day totals
        dayTotals.forEach((total, day) => {
            const cell = document.querySelector(`.day-total[data-day="${day}"]`);
            if (cell) cell.textContent = Math.round(total);
        });

        // Update grand total
        const grandTotalCell = document.querySelector('.grand-total');
        if (grandTotalCell) grandTotalCell.textContent = Math.round(grandTotal);

        // Calculate costs
        calculateCosts();
    }

    function calculateCosts() {
        /* ===== PRICING AND PROFIT CALCULATION LOGIC =====
         * 
         * FUNDAMENTAL PRINCIPLE:
         * Client Price = Base Labor × (1 + Markup%)
         * This is the FINAL price - nothing else is added to what the client pays
         * 
         * PROFIT FLOW:
         * 1. Base Labor Cost: What we pay employees ($16/hr)
         * 2. Apply Markup: 25% markup = $20/hr to client
         * 3. Gross Profit: The $4/hr difference (markup amount)
         * 4. Operating Expenses: All costs come OUT of the gross profit
         *    - Payroll taxes (~11%)
         *    - Insurance (Workers' Comp + GL)
         *    - Operating overhead (5%)
         *    - Franchise tax (0.75%)
         * 5. Net Profit: What's left after all expenses
         * 6. Commission: 20% of net profit (first month only)
         * 7. Final Net Profit: What the company keeps
         * 
         * EXAMPLE:
         * Base Labor: $16/hr
         * Markup 25%: Client pays $20/hr
         * Gross Profit: $4/hr
         * Less expenses: -$3.20/hr
         * Net Profit: $0.80/hr
         * Less commission (1st month): -$0.16/hr
         * Final Profit: $0.64/hr
         */
        
        // Calculate base labor cost (what we pay employees)
        let weeklyLaborCost = 0;
        state.positions.forEach(position => {
            const totalHours = position.hours.reduce((sum, h) => sum + h, 0);
            weeklyLaborCost += totalHours * position.rate * (position.quantity || 1);
        });
        const monthlyLaborCost = weeklyLaborCost * 4.33;

        // Apply markup to labor cost to get client price
        // This is the FINAL price we charge the client - nothing more
        const weeklyClientPrice = weeklyLaborCost * (1 + state.currentMarkup / 100);
        const monthlyClientPrice = monthlyLaborCost * (1 + state.currentMarkup / 100);

        // The markup amount is what we have to cover ALL additional costs
        // All expenses below come OUT of this markup, not added to client price
        
        // ===== CALCULATE ALL OPERATING EXPENSES =====
        // These are calculated on BASE LABOR COST, not client price
        
        // 1. Employer Payroll Taxes (required by law)
        const weeklySS = weeklyLaborCost * state.config.socialSecurityRate;        // 6.2%
        const weeklyMedicare = weeklyLaborCost * state.config.medicareRate;        // 1.45%
        const weeklyFUTA = weeklyLaborCost * state.config.futaRate;                // 0.6%
        const weeklySUTA = weeklyLaborCost * state.config.sutaRate;                // 2.7% (Texas)
        
        const monthlySS = monthlyLaborCost * state.config.socialSecurityRate;
        const monthlyMedicare = monthlyLaborCost * state.config.medicareRate;
        const monthlyFUTA = monthlyLaborCost * state.config.futaRate;
        const monthlySUTA = monthlyLaborCost * state.config.sutaRate;

        // Total payroll taxes (about 11% combined)
        const weeklyPayrollTaxes = weeklySS + weeklyMedicare + weeklyFUTA + weeklySUTA;
        const monthlyPayrollTaxes = monthlySS + monthlyMedicare + monthlyFUTA + monthlySUTA;

        // 2. Insurance & Benefits
        const weeklyWorkComp = weeklyLaborCost * state.config.workCompRate;        // 2.5% - workplace injury coverage
        const monthlyWorkComp = monthlyLaborCost * state.config.workCompRate;

        // 3. General liability insurance ($7.33 per $1,000 of LABOR cost)
        const weeklyLiability = (weeklyLaborCost / 1000) * 7.33;
        const monthlyLiability = (monthlyLaborCost / 1000) * 7.33;

        // 4. Operating Overhead
        const weeklyFranchiseTax = weeklyLaborCost * 0.0075;                      // 0.75% - Texas state business tax
        const monthlyFranchiseTax = monthlyLaborCost * 0.0075;

        const weeklyOverhead = weeklyLaborCost * state.config.overheadRate;       // 5% - admin, office, management
        const monthlyOverhead = monthlyLaborCost * state.config.overheadRate;

        // 5. Supplies and Equipment (monthly costs converted to weekly)
        const weeklySupplies = state.monthlySupplies / 4.33;
        const weeklyEquipment = state.monthlyEquipment / 4.33;
        const weeklySuppliesEquipment = weeklySupplies + weeklyEquipment;
        const monthlySuppliesEquipment = state.monthlySupplies + state.monthlyEquipment;

        // ===== CALCULATE TOTALS AND PROFITS =====
        
        // Total additional costs (everything except base labor)
        // This is what comes OUT of the markup to run the business
        const weeklyAdditionalCosts = weeklyPayrollTaxes + weeklyWorkComp + 
                                     weeklyLiability + weeklyFranchiseTax + weeklyOverhead + weeklySuppliesEquipment;
        const monthlyAdditionalCosts = monthlyPayrollTaxes + monthlyWorkComp + 
                                      monthlyLiability + monthlyFranchiseTax + monthlyOverhead + monthlySuppliesEquipment;
        
        // Total fully-loaded labor cost (what it REALLY costs to have an employee)
        const weeklyTotalCost = weeklyLaborCost + weeklyAdditionalCosts;
        const monthlyTotalCost = monthlyLaborCost + monthlyAdditionalCosts;
        
        // ===== PROFIT CALCULATIONS =====
        
        // Step 1: Calculate markup amount (this is also the Gross Profit)
        const weeklyMarkupAmount = weeklyClientPrice - weeklyLaborCost;
        const monthlyMarkupAmount = monthlyClientPrice - monthlyLaborCost;
        
        // Step 2: Gross Profit = Markup Amount (before any expenses are deducted)
        const weeklyGrossProfit = weeklyMarkupAmount;
        const monthlyGrossProfit = monthlyMarkupAmount;
        
        // Step 3: Net Profit = Gross Profit - All Operating Expenses
        // This is what's left after paying all the required costs
        const weeklyNetProfit = weeklyMarkupAmount - weeklyAdditionalCosts;
        const monthlyNetProfit = monthlyMarkupAmount - monthlyAdditionalCosts;
        
        // Step 4: Sales Commission (20% of NET profit - only on first month)
        const commission = state.isFirstMonth ? (monthlyNetProfit * state.config.commissionRate) : 0;
        
        // Step 5: Final Net Profit (what the company actually keeps)
        const finalProfit = monthlyNetProfit - commission;

        // Calculate daily profit
        let daysWithData = 0;
        for (let day = 0; day < 7; day++) {
            let dayHasHours = false;
            state.positions.forEach(position => {
                if (position.hours[day] > 0) dayHasHours = true;
            });
            if (dayHasHours) daysWithData++;
        }
        daysWithData = daysWithData || 1;
        const dailyProfit = weeklyNetProfit / daysWithData;

        // Update existing summary UI
        $('laborCost').textContent = formatCurrency(weeklyLaborCost);
        $('laborTax').textContent = formatCurrency(weeklyPayrollTaxes);
        $('workComp').textContent = formatCurrency(weeklyWorkComp);
        $('totalLabor').textContent = formatCurrency(weeklyTotalCost); // Show total cost including all expenses
        $('markupAmount').textContent = formatCurrency(weeklyMarkupAmount);
        $('weeklyRevenue').textContent = formatCurrency(weeklyClientPrice);
        $('monthlyRevenue').textContent = formatCurrency(monthlyClientPrice);
        $('dailyProfit').textContent = formatCurrency(dailyProfit);
        $('weeklyProfit').textContent = formatCurrency(weeklyNetProfit);
        $('monthlyProfit').textContent = formatCurrency(monthlyNetProfit);
        $('commission').textContent = formatCurrency(commission);
        $('finalProfit').textContent = formatCurrency(finalProfit);
        
        // Update client billing displays
        $('clientMonthlyBilling').textContent = formatCurrency(monthlyClientPrice);
        $('clientWeeklyBilling').textContent = formatCurrency(weeklyClientPrice);
        $('clientYearlyBilling').textContent = formatCurrency(monthlyClientPrice * 12);

        // Update detailed breakdown
        $('weeklyLabor').textContent = formatCurrency(weeklyLaborCost);
        $('monthlyLabor').textContent = formatCurrency(monthlyLaborCost);
        $('weeklySS').textContent = formatCurrency(weeklySS);
        $('monthlySS').textContent = formatCurrency(monthlySS);
        $('weeklyMedicare').textContent = formatCurrency(weeklyMedicare);
        $('monthlyMedicare').textContent = formatCurrency(monthlyMedicare);
        $('weeklyFUTA').textContent = formatCurrency(weeklyFUTA);
        $('monthlyFUTA').textContent = formatCurrency(monthlyFUTA);
        $('weeklySUTA').textContent = formatCurrency(weeklySUTA);
        $('monthlySUTA').textContent = formatCurrency(monthlySUTA);
        $('weeklyWorkComp').textContent = formatCurrency(weeklyWorkComp);
        $('monthlyWorkComp').textContent = formatCurrency(monthlyWorkComp);
        $('weeklyLiability').textContent = formatCurrency(weeklyLiability);
        $('monthlyLiability').textContent = formatCurrency(monthlyLiability);
        $('weeklyOverhead').textContent = formatCurrency(weeklyOverhead);
        $('monthlyOverhead').textContent = formatCurrency(monthlyOverhead);
        $('weeklyTotalCost').textContent = formatCurrency(weeklyTotalCost);
        $('monthlyTotalCost').textContent = formatCurrency(monthlyTotalCost);
        $('weeklyMarkup').textContent = formatCurrency(weeklyMarkupAmount);
        $('monthlyMarkup').textContent = formatCurrency(monthlyMarkupAmount);
        $('weeklyClientPrice').textContent = formatCurrency(weeklyClientPrice);
        $('monthlyClientPrice').textContent = formatCurrency(monthlyClientPrice);
        
        // Update franchise tax if elements exist
        if ($('weeklyFranchiseTax')) $('weeklyFranchiseTax').textContent = formatCurrency(weeklyFranchiseTax);
        if ($('monthlyFranchiseTax')) $('monthlyFranchiseTax').textContent = formatCurrency(monthlyFranchiseTax);
        
        // Update supplies and equipment
        if ($('weeklySuppliesEquipment')) $('weeklySuppliesEquipment').textContent = formatCurrency(weeklySuppliesEquipment);
        if ($('monthlySuppliesEquipment')) $('monthlySuppliesEquipment').textContent = formatCurrency(monthlySuppliesEquipment);
        
        // Update profit breakdown in detailed table
        $('weeklyGrossProfit').textContent = formatCurrency(weeklyGrossProfit);
        $('monthlyGrossProfit').textContent = formatCurrency(monthlyGrossProfit);
        
        // Show operating expenses
        if ($('weeklyExpenses')) $('weeklyExpenses').textContent = formatCurrency(weeklyAdditionalCosts).replace('$', '');
        if ($('monthlyExpenses')) $('monthlyExpenses').textContent = formatCurrency(monthlyAdditionalCosts).replace('$', '');
        
        // Show net profit before commission
        if ($('weeklyNetProfitBeforeComm')) $('weeklyNetProfitBeforeComm').textContent = formatCurrency(weeklyNetProfit);
        if ($('monthlyNetProfitBeforeComm')) $('monthlyNetProfitBeforeComm').textContent = formatCurrency(monthlyNetProfit);
        
        $('weeklyCommission').textContent = formatCurrency(commission / 4.33);
        $('monthlyCommission').textContent = formatCurrency(commission);
        $('weeklyNetProfit').textContent = formatCurrency(weeklyNetProfit - (commission / 4.33));
        $('monthlyNetProfit').textContent = formatCurrency(finalProfit);

        // Update markup display
        $('markupRateDisplay').textContent = state.currentMarkup + '%';
        
        // Update commission rate display in breakdown table
        const commissionRateDisplay = $('commissionRateDisplay');
        if (state.isFirstMonth) {
            commissionRateDisplay.textContent = '20% (First Month Only)';
            $('commissionRow').style.display = '';
        } else {
            commissionRateDisplay.textContent = 'Not Applicable';
            $('commissionRow').style.display = 'none';
        }

        // Update markup indicator
        const indicator = $('markupIndicator');
        const status = $('markupStatus');
        const message = $('markupMessage');
        const icon = indicator.querySelector('i');
        
        // Calculate actual profit margin percentage (based on NET profit)
        const actualProfitMargin = weeklyClientPrice > 0 ? (weeklyNetProfit / weeklyClientPrice) * 100 : 0;
        
        // Remove all possible classes first
        indicator.className = 'mt-6 p-4 rounded-xl flex items-center gap-3';
        icon.className = 'text-xl';
        
        if (actualProfitMargin < 5) {
            indicator.classList.add('bg-red-50', 'border', 'border-red-200');
            icon.classList.add('fas', 'fa-exclamation-triangle', 'text-danger-red');
            status.className = 'font-semibold text-red-800';
            message.className = 'text-sm text-red-600';
            status.textContent = 'Low Profit Margin - Risk!';
            message.textContent = `Your actual profit margin is only ${actualProfitMargin.toFixed(1)}%. Increase markup to cover all costs.`;
        } else if (actualProfitMargin < 15) {
            indicator.classList.add('bg-yellow-50', 'border', 'border-yellow-200');
            icon.classList.add('fas', 'fa-info-circle', 'text-warning-orange');
            status.className = 'font-semibold text-yellow-800';
            message.className = 'text-sm text-yellow-600';
            status.textContent = 'Acceptable Profit Margin';
            message.textContent = `Your actual profit margin is ${actualProfitMargin.toFixed(1)}%. Consider increasing markup for better profitability.`;
        } else {
            indicator.classList.add('bg-green-50', 'border', 'border-green-200');
            icon.classList.add('fas', 'fa-check-circle', 'text-success-green');
            status.className = 'font-semibold text-green-800';
            message.className = 'text-sm text-green-600';
            status.textContent = 'Good Profit Margin';
            message.textContent = `Your actual profit margin is ${actualProfitMargin.toFixed(1)}%. This provides good business stability.`;
        }

        // Update commission percent display
        $('commissionPercent').textContent = (state.config.commissionRate * 100).toFixed(0);
        
        // Update commission status display
        const commissionStatus = $('commissionStatus');
        if (state.isFirstMonth) {
            commissionStatus.textContent = 'First month deduction';
            commissionStatus.className = 'text-xs text-brand-red/70 mt-1';
        } else {
            commissionStatus.textContent = 'No commission (after first month)';
            commissionStatus.className = 'text-xs text-success-green mt-1';
        }
        
        // Update metrics
        const totalHours = state.positions.reduce((sum, p) => {
            const positionHours = p.hours.reduce((s, h) => s + h, 0);
            return sum + (positionHours * (p.quantity || 1));
        }, 0);
        
        const totalEmployees = state.positions.reduce((sum, p) => sum + (p.quantity || 1), 0);

        const revenuePerHour = totalHours > 0 ? weeklyClientPrice / totalHours : 0;
        const profitMargin = weeklyClientPrice > 0 ? (weeklyNetProfit / weeklyClientPrice) * 100 : 0;
        const avgHoursPerDay = daysWithData > 0 ? totalHours / daysWithData : 0;
        const profitPerHour = totalHours > 0 ? weeklyNetProfit / totalHours : 0;
        const profitPerEmployee = totalEmployees > 0 ? weeklyNetProfit / totalEmployees : 0;
        const costRatio = weeklyClientPrice > 0 ? (weeklyTotalCost / weeklyClientPrice) * 100 : 0;
        const monthlyROI = monthlyTotalCost > 0 ? ((monthlyNetProfit / monthlyTotalCost) * 100) : 0;
        const netDailyProfit = finalProfit / 30.44; // Average days per month

        // Update all displays
        $('revenuePerHour').textContent = formatCurrency(revenuePerHour);
        $('profitMargin').textContent = formatPercentage(profitMargin);
        $('avgHoursPerDay').textContent = Math.round(avgHoursPerDay);
        $('profitPerDay').textContent = formatCurrency(dailyProfit);
        
        // Update new KPIs
        $('profitMarginKPI').textContent = formatPercentage(profitMargin);
        $('profitPerHour').textContent = formatCurrency(profitPerHour);
        $('profitPerEmployee').textContent = formatCurrency(profitPerEmployee);
        $('costRatio').textContent = formatPercentage(costRatio);
        $('monthlyROI').textContent = formatPercentage(monthlyROI);
        $('netDailyProfit').textContent = formatCurrency(netDailyProfit);
        
        // Update profit margin bar
        const profitMarginBar = $('profitMarginBar');
        if (profitMarginBar) {
            profitMarginBar.style.width = Math.min(100, profitMargin) + '%';
            // Color coding based on margin
            if (profitMargin < 10) {
                profitMarginBar.classList.remove('bg-success-green', 'bg-warning-orange');
                profitMarginBar.classList.add('bg-danger-red');
            } else if (profitMargin < 20) {
                profitMarginBar.classList.remove('bg-success-green', 'bg-danger-red');
                profitMarginBar.classList.add('bg-warning-orange');
            } else {
                profitMarginBar.classList.remove('bg-danger-red', 'bg-warning-orange');
                profitMarginBar.classList.add('bg-success-green');
            }
        }
        
        // Calculate efficiency score
        let efficiencyScore = 0;
        let efficiencyMessage = '';
        
        // Factors for efficiency: profit margin, hours utilization, cost ratio
        const marginScore = Math.min(profitMargin / 30 * 40, 40); // Up to 40 points
        const utilizationScore = Math.min((totalHours / (totalEmployees * 40)) * 30, 30); // Up to 30 points
        const costScore = Math.max(0, 30 - (costRatio - 60)); // Up to 30 points
        
        efficiencyScore = Math.round(marginScore + utilizationScore + costScore);
        
        if (efficiencyScore >= 80) {
            efficiencyMessage = 'Excellent efficiency! Keep up the great work.';
            $('efficiencyScore').innerHTML = `<span class="text-success-green">${efficiencyScore}%</span>`;
        } else if (efficiencyScore >= 60) {
            efficiencyMessage = 'Good efficiency. Room for optimization.';
            $('efficiencyScore').innerHTML = `<span class="text-warning-orange">${efficiencyScore}%</span>`;
        } else {
            efficiencyMessage = 'Efficiency needs improvement. Review costs and utilization.';
            $('efficiencyScore').innerHTML = `<span class="text-danger-red">${efficiencyScore}%</span>`;
        }
        
        $('efficiencyMessage').textContent = efficiencyMessage;
        
        // Update hourly profit analysis
        updateHourlyProfitAnalysis();
    }
    
    // ===== Hourly Profit Analysis =====
    function updateHourlyProfitAnalysis() {
        const container = $('hourlyProfitAnalysis');
        if (!container) return;
        
        // Clear existing content
        container.innerHTML = '';
        
        // Calculate totals for all positions
        state.positions.forEach(position => {
            if (!position.rate || position.hours.every(h => h === 0)) return;
            
            const totalHours = position.hours.reduce((sum, h) => sum + h, 0) * (position.quantity || 1);
            if (totalHours === 0) return;
            
            // Calculate hourly rates
            const hourlyWorkerPay = position.rate;
            const hourlyClientCharge = position.rate * (1 + state.currentMarkup / 100);
            
            // Calculate additional costs per hour (approximately 20% of base pay)
            const hourlyAdditionalCosts = position.rate * (
                state.config.socialSecurityRate +
                state.config.medicareRate +
                state.config.futaRate +
                state.config.sutaRate +
                state.config.workCompRate +
                state.config.overheadRate +
                0.0075 + // franchise tax
                (7.33 / 1000) // liability insurance approximation
            );
            
            // Add proportional supplies and equipment costs per hour
            const totalWeeklyHours = state.positions.reduce((sum, p) => {
                const pHours = p.hours.reduce((s, h) => s + h, 0) * (p.quantity || 1);
                return sum + pHours;
            }, 0);
            const hourlySuppliesEquipment = totalWeeklyHours > 0 ? 
                (state.monthlySupplies + state.monthlyEquipment) / 4.33 / totalWeeklyHours : 0;
            
            const totalHourlyAdditionalCosts = hourlyAdditionalCosts + hourlySuppliesEquipment;
            
            const hourlyGrossProfit = hourlyClientCharge - hourlyWorkerPay;
            const hourlyNetProfit = hourlyGrossProfit - totalHourlyAdditionalCosts;
            
            // Apply commission if first month
            const hourlyCommission = state.isFirstMonth ? (hourlyNetProfit * state.config.commissionRate) : 0;
            const hourlyFinalProfit = hourlyNetProfit - hourlyCommission;
            
            // Create position card
            const positionCard = document.createElement('div');
            positionCard.className = 'bg-white/10 backdrop-blur-sm rounded-lg p-4';
            
            positionCard.innerHTML = `
                <h4 class="font-semibold text-white/90 mb-3">${position.name}</h4>
                <div class="grid grid-cols-2 gap-3 text-sm">
                    <div>
                        <div class="text-white/70">Worker Pay/Hour</div>
                        <div class="text-xl font-bold">${formatCurrency(hourlyWorkerPay)}</div>
                    </div>
                    <div>
                        <div class="text-white/70">Client Charge/Hour</div>
                        <div class="text-xl font-bold">${formatCurrency(hourlyClientCharge)}</div>
                    </div>
                    <div>
                        <div class="text-white/70">Operational Costs/Hour</div>
                        <div class="text-lg font-semibold text-red-300">-${formatCurrency(totalHourlyAdditionalCosts)}</div>
                    </div>
                    <div>
                        <div class="text-white/70">Net Profit/Hour</div>
                        <div class="text-lg font-semibold ${hourlyFinalProfit > 0 ? 'text-green-300' : 'text-red-300'}">
                            ${formatCurrency(hourlyFinalProfit)}
                        </div>
                    </div>
                </div>
                <div class="mt-3 pt-3 border-t border-white/20">
                    <div class="flex justify-between items-center text-sm">
                        <span class="text-white/70">Profit Margin</span>
                        <span class="font-bold">${((hourlyFinalProfit / hourlyClientCharge) * 100).toFixed(1)}%</span>
                    </div>
                    ${state.isFirstMonth ? `
                    <div class="flex justify-between items-center text-sm mt-1">
                        <span class="text-white/70">Commission (1st month)</span>
                        <span class="text-red-300">-${formatCurrency(hourlyCommission)}</span>
                    </div>
                    ` : ''}
                </div>
            `;
            
            container.appendChild(positionCard);
        });
        
        // Add summary if multiple positions
        if (state.positions.length > 1) {
            // Calculate weighted averages
            let totalHours = 0;
            let weightedWorkerPay = 0;
            let weightedClientCharge = 0;
            let weightedProfit = 0;
            
            state.positions.forEach(position => {
                const posHours = position.hours.reduce((sum, h) => sum + h, 0) * (position.quantity || 1);
                if (posHours > 0) {
                    totalHours += posHours;
                    weightedWorkerPay += position.rate * posHours;
                    const clientRate = position.rate * (1 + state.currentMarkup / 100);
                    weightedClientCharge += clientRate * posHours;
                    
                    const additionalCosts = position.rate * (
                        state.config.socialSecurityRate +
                        state.config.medicareRate +
                        state.config.futaRate +
                        state.config.sutaRate +
                        state.config.workCompRate +
                        state.config.overheadRate +
                        0.0075 +
                        (7.33 / 1000)
                    );
                    // Add proportional supplies and equipment costs
                    const suppliesEquipmentPerHour = totalHours > 0 ? 
                        (state.monthlySupplies + state.monthlyEquipment) / 4.33 / totalHours : 0;
                    const totalAdditionalCosts = additionalCosts + suppliesEquipmentPerHour;
                    
                    const netProfit = (clientRate - position.rate - totalAdditionalCosts);
                    const finalProfit = netProfit - (state.isFirstMonth ? netProfit * state.config.commissionRate : 0);
                    weightedProfit += finalProfit * posHours;
                }
            });
            
            if (totalHours > 0) {
                const avgWorkerPay = weightedWorkerPay / totalHours;
                const avgClientCharge = weightedClientCharge / totalHours;
                const avgProfit = weightedProfit / totalHours;
                
                const summaryCard = document.createElement('div');
                summaryCard.className = 'bg-white/20 backdrop-blur-sm rounded-lg p-4 mt-4 border-2 border-white/30';
                summaryCard.innerHTML = `
                    <h4 class="font-semibold text-white mb-3 flex items-center">
                        <i class="fas fa-calculator mr-2"></i>
                        Weighted Average (All Positions)
                    </h4>
                    <div class="grid grid-cols-3 gap-3 text-center">
                        <div>
                            <div class="text-white/80 text-sm">Avg Worker Pay</div>
                            <div class="text-2xl font-bold">${formatCurrency(avgWorkerPay)}</div>
                        </div>
                        <div>
                            <div class="text-white/80 text-sm">Avg Client Rate</div>
                            <div class="text-2xl font-bold">${formatCurrency(avgClientCharge)}</div>
                        </div>
                        <div>
                            <div class="text-white/80 text-sm">Avg Net Profit</div>
                            <div class="text-2xl font-bold ${avgProfit > 0 ? 'text-green-300' : 'text-red-300'}">
                                ${formatCurrency(avgProfit)}
                            </div>
                        </div>
                    </div>
                `;
                container.appendChild(summaryCard);
            }
        }
    }

    // ===== Charts =====
    async function updateCharts() {
        // Load Chart.js if needed
        if (typeof Chart === 'undefined') {
            try {
                await loadExportLibraries();
            } catch (error) {
                console.error('Failed to load Chart.js:', error);
                return;
            }
        }
        
        if (typeof Chart === 'undefined') return;

        // Destroy existing charts
        if (state.charts.hours) state.charts.hours.destroy();
        if (state.charts.cost) state.charts.cost.destroy();

        // Get data
        const dayTotals = [0, 0, 0, 0, 0, 0, 0];
        state.positions.forEach(position => {
            position.hours.forEach((hours, day) => {
                dayTotals[day] += hours * (position.quantity || 1);
            });
        });

        const hasData = dayTotals.some(h => h > 0);

        // Show/hide placeholders
        $('hoursPlaceholder').style.display = hasData ? 'none' : 'flex';
        $('hoursChart').style.display = hasData ? 'block' : 'none';
        $('costPlaceholder').style.display = hasData ? 'none' : 'flex';
        $('costChart').style.display = hasData ? 'block' : 'none';

        if (!hasData) return;

        // Hours chart
        state.charts.hours = new Chart($('hoursChart'), {
            type: 'bar',
            data: {
                labels: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
                datasets: [{
                    label: 'Hours',
                    data: dayTotals,
                    backgroundColor: 'rgba(3, 20, 58, 0.7)',
                    borderColor: '#03143A',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false
            }
        });

        // Cost breakdown chart
        const laborCost = parseFloat($('laborCost').textContent.replace(/[$,]/g, ''));
        const laborTax = parseFloat($('laborTax').textContent.replace(/[$,]/g, ''));
        const workComp = parseFloat($('workComp').textContent.replace(/[$,]/g, ''));
        const profit = parseFloat($('weeklyProfit').textContent.replace(/[$,]/g, '')); // This shows net profit

        state.charts.cost = new Chart($('costChart'), {
            type: 'pie',
            data: {
                labels: ['Labor', 'Taxes', 'Insurance', 'Profit'],
                datasets: [{
                    data: [laborCost, laborTax, workComp, profit],
                    backgroundColor: [
                        'rgba(3, 20, 58, 0.8)',
                        'rgba(199, 5, 50, 0.8)',
                        'rgba(41, 128, 185, 0.8)',
                        'rgba(39, 174, 96, 0.8)'
                    ]
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false
            }
        });
    }

    // ===== Event Handlers =====
    function initEventListeners() {
        // Tab navigation
        document.querySelectorAll('.nav-tab[data-tab]').forEach(tab => {
            tab.addEventListener('click', function () {
                const tabName = this.dataset.tab;

                // Update active tab
                document.querySelectorAll('.nav-tab[data-tab]').forEach(t => {
                    t.classList.remove('bg-ios-gray-6', 'text-white');
                    t.classList.add('bg-ios-gray-1', 'text-ios-gray-6');
                });
                this.classList.remove('bg-ios-gray-1', 'text-ios-gray-6');
                this.classList.add('bg-ios-gray-6', 'text-white');

                // Show content
                document.querySelectorAll('.tab-content').forEach(c => {
                    c.classList.add('hidden');
                    c.classList.remove('block');
                });
                const targetContent = document.querySelector(`[data-content="${tabName}"]`);
                targetContent.classList.remove('hidden');
                targetContent.classList.add('block');

                // Update charts if summary tab
                if (tabName === 'summary') {
                    setTimeout(async () => {
                        await updateCharts();
                    }, 100);
                }
            });
        });

        // Add position button
        $('addPositionBtn').addEventListener('click', addPosition);

        // Reset button
        $('resetBtn').addEventListener('click', () => {
            if (confirm('Are you sure you want to reset all timesheet data? This cannot be undone.')) {
                resetCalculator();
            }
        });

        // Dark mode toggle
        $('darkModeBtn').addEventListener('click', function () {
            const isDarkMode = darkModeManager.toggle();
            const icon = this.querySelector('i');
            icon.className = isDarkMode ? 'fas fa-sun' : 'fas fa-moon';
        });

        // Table event delegation
        const tbody = $('timesheetRows');
        tbody.addEventListener('input', debounce(function (e) {
            const target = e.target;
            const row = target.closest('tr');
            const positionId = parseInt(row.dataset.positionId);
            const position = state.positions.find(p => p.id === positionId);

            if (!position) return;

            if (target.classList.contains('position-input')) {
                position.name = target.value;
            } else if (target.classList.contains('quantity-input')) {
                const qty = parseInt(target.value) || 1;
                // Prevent negative quantities, minimum 1
                position.quantity = Math.max(1, qty);
                target.value = position.quantity; // Update display if value was clamped
                updateRowTotal(row);
                updateTotals();
                calculateCosts();
            } else if (target.classList.contains('rate-input')) {
                const rate = parseFloat(target.value) || 0;
                position.rate = Math.max(0, rate); // Prevent negative rates
                target.value = position.rate; // Update display
                updateTotals();
                calculateCosts();
            } else if (target.classList.contains('hours-input')) {
                const day = parseInt(target.dataset.day);
                const hours = parseFloat(target.value) || 0;
                // Prevent negative hours and limit to 24
                position.hours[day] = Math.max(0, Math.min(24, hours));
                target.value = position.hours[day]; // Update display if value was clamped
                updateRowTotal(row);
                updateTotals();
                calculateCosts();
            }
        }, 300));

        tbody.addEventListener('click', function (e) {
            if (e.target.closest('.delete-btn')) {
                const row = e.target.closest('tr');
                const positionId = parseInt(row.dataset.positionId);
                deletePosition(positionId);
            } else if (e.target.closest('.fill-weekdays-btn')) {
                const row = e.target.closest('tr');
                const positionId = parseInt(row.dataset.positionId);
                fillWeekdaysWithEightHours(positionId);
            } else if (e.target.closest('.duplicate-btn')) {
                const row = e.target.closest('tr');
                const positionId = parseInt(row.dataset.positionId);
                duplicatePosition(positionId);
            }
        });

        // Markup slider
        const markupSlider = $('markupSlider');
        const markupInput = $('markupInput');

        markupSlider.addEventListener('input', function () {
            state.currentMarkup = parseInt(this.value);
            markupInput.value = this.value;
            $('markupPercentage').textContent = this.value;
            calculateCosts();
        });

        markupInput.addEventListener('input', utils.debounce(function () {
            const value = parseInt(this.value);
            if (value >= 35 && value <= 120) {
                state.currentMarkup = value;
                markupSlider.value = value;
                $('markupPercentage').textContent = value;
                calculateCosts();
            }
        }, 300));

        // Supplies and Equipment inputs
        const monthlySuppliesInput = $('monthlySupplies');
        const monthlyEquipmentInput = $('monthlyEquipment');

        if (monthlySuppliesInput) {
            monthlySuppliesInput.addEventListener('input', utils.debounce(function () {
                const value = parseFloat(this.value) || 0;
                state.monthlySupplies = Math.max(0, value);
                updateSuppliesEquipmentTotal();
                calculateCosts();
            }, 300));
        }

        if (monthlyEquipmentInput) {
            monthlyEquipmentInput.addEventListener('input', utils.debounce(function () {
                const value = parseFloat(this.value) || 0;
                state.monthlyEquipment = Math.max(0, value);
                updateSuppliesEquipmentTotal();
                calculateCosts();
            }, 300));
        }

        // Configuration save
        $('saveConfigBtn').addEventListener('click', saveConfig);

        // First month toggle
        $('firstMonthToggle').addEventListener('change', function() {
            state.isFirstMonth = this.checked;
            calculateCosts();
            const message = state.isFirstMonth 
                ? 'First month commission activated (20% of net profit)' 
                : 'Commission deactivated (applies only to first month)';
            showNotification(message, 'info');
        });

        // PDF and Print
        $('downloadPdfBtn').addEventListener('click', async () => {
            await generatePDF();
        });
        $('printBtn').addEventListener('click', () => window.print());
        
        // Screenshot button
        $('screenshotBtn').addEventListener('click', async () => {
            const modal = document.getElementById('screenshotModal');
            const preview = document.getElementById('screenshotPreview');
            
            // Show loading state
            preview.innerHTML = '<div class="flex items-center justify-center p-8"><i class="fas fa-spinner fa-spin text-4xl text-brand-blue"></i></div>';
            modal.classList.remove('hidden');
            
            try {
                // Get the main content area to screenshot
                const element = document.querySelector('[data-content="timesheet"]');
                const canvas = await html2canvas(element, {
                    scale: 2,
                    backgroundColor: window.getComputedStyle(document.body).backgroundColor,
                    logging: false
                });
                
                screenshotCanvas = canvas;
                
                // Display canvas
                preview.innerHTML = '';
                canvas.style.width = '100%';
                canvas.style.height = 'auto';
                preview.appendChild(canvas);
            } catch (error) {
                preview.innerHTML = '<div class="text-center p-8"><p class="text-danger-red">Failed to generate screenshot</p></div>';
                console.error('Screenshot error:', error);
            }
        });
        
        // Save Breakdown button
        $('saveBreakdownBtn').addEventListener('click', async () => {
            try {
                showNotification('Generating breakdown image...', 'info');
                
                // Get the breakdown section by ID
                const breakdownSection = document.getElementById('detailedCostBreakdown');
                
                if (!breakdownSection) {
                    showNotification('Could not find breakdown section', 'error');
                    return;
                }
                
                const canvas = await html2canvas(breakdownSection, {
                    scale: 2,
                    backgroundColor: '#ffffff',
                    logging: false,
                    windowWidth: breakdownSection.offsetWidth,
                    windowHeight: breakdownSection.offsetHeight
                });
                
                // Create download link
                const link = document.createElement('a');
                const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
                link.download = `detailed-cost-breakdown-${timestamp}.png`;
                link.href = canvas.toDataURL();
                link.click();
                
                showNotification('Breakdown image saved!', 'success');
            } catch (error) {
                console.error('Breakdown screenshot error:', error);
                showNotification('Failed to save breakdown image', 'error');
            }
        });
    }

    // ===== Configuration =====
    function loadConfig() {
        $('regularPayRate').value = state.config.regularPayRate;
        $('supervisorPayRate').value = state.config.supervisorPayRate;
        $('sutaRate').value = state.config.sutaRate * 100;
        $('workCompRate').value = state.config.workCompRate * 100;
        // Operating costs
        $('overheadRate').value = state.config.overheadRate * 100;
        $('defaultMarkup').value = state.config.defaultMarkup;
        $('commissionRate').value = state.config.commissionRate * 100;

        // Update display values
        $('sutaRateDisplay').textContent = (state.config.sutaRate * 100).toFixed(1) + '%';
        $('workCompRateDisplay').textContent = (state.config.workCompRate * 100).toFixed(1) + '%';
        $('liabilityDisplay').textContent = '$7.33/$1k';
    }

    function saveConfig() {
        // Validate rates
        const regularRate = Math.max(1, parseFloat($('regularPayRate').value) || 16);
        const supervisorRate = Math.max(regularRate, parseFloat($('supervisorPayRate').value) || 18);
        
        state.config.regularPayRate = regularRate;
        state.config.supervisorPayRate = supervisorRate;
        state.config.sutaRate = parseFloat($('sutaRate').value) / 100 || 0.027;
        state.config.workCompRate = parseFloat($('workCompRate').value) / 100 || 0.025;
        // Operating costs
        state.config.overheadRate = parseFloat($('overheadRate').value) / 100 || 0.05;
        state.config.defaultMarkup = parseFloat($('defaultMarkup').value) || 42;
        state.config.commissionRate = parseFloat($('commissionRate').value) / 100 || 0.20;

        // Update current markup if needed
        state.currentMarkup = state.config.defaultMarkup;
        $('markupSlider').value = state.config.defaultMarkup;
        $('markupInput').value = state.config.defaultMarkup;
        $('markupPercentage').textContent = state.config.defaultMarkup;

        // Update display values
        $('sutaRateDisplay').textContent = (state.config.sutaRate * 100).toFixed(1) + '%';
        $('workCompRateDisplay').textContent = (state.config.workCompRate * 100).toFixed(1) + '%';
        $('liabilityDisplay').textContent = '$7.33/$1k';

        // Recalculate
        updateTotals();

        // Show success and switch to timesheet tab
        showNotification('Configuration saved successfully', 'success');
        document.querySelector('[data-tab="timesheet"]').click();
    }

    // ===== PDF Generation =====
    async function loadExportLibraries() {
        return new Promise((resolve, reject) => {
            // Check if jsPDF is already loaded (it's in window.jspdf)
            if (typeof window.jspdf !== 'undefined' || typeof window.jsPDF !== 'undefined') {
                resolve();
                return;
            }
            
            // jsPDF is already included in the HTML via CDN
            // Wait a bit for it to load
            let attempts = 0;
            const checkInterval = setInterval(() => {
                attempts++;
                if (typeof window.jspdf !== 'undefined' || typeof window.jsPDF !== 'undefined') {
                    clearInterval(checkInterval);
                    resolve();
                } else if (attempts > 20) {
                    clearInterval(checkInterval);
                    reject(new Error('Failed to load jsPDF library'));
                }
            }, 100);
        });
    }
    
    async function generatePDF() {
        try {
            showNotification('Generating PDF...', 'info');
            
            // Wait a moment for libraries to be ready
            await new Promise(resolve => setTimeout(resolve, 100));
            
            // Create new PDF document
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF('portrait', 'pt', 'a4');
            
            // Define colors to match brand
            const brandBlue = [3, 20, 58];
            const brandRed = [199, 5, 50];
            const gray = [128, 128, 128];
            
            // Add header with brand colors
            doc.setFillColor(...brandBlue);
            doc.rect(0, 0, doc.internal.pageSize.getWidth(), 80, 'F');
            
            // Add title
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(24);
            doc.setFont('helvetica', 'bold');
            doc.text('Prime Facility Services Group', 40, 35);
            
            doc.setFontSize(16);
            doc.setFont('helvetica', 'normal');
            doc.text('Weekly Timesheet & Labor Report', 40, 60);
            
            // Report info section
            doc.setFillColor(245, 245, 245);
            doc.rect(0, 80, doc.internal.pageSize.getWidth(), 50, 'F');
            
            const reportNumber = 'TS-' + new Date().getFullYear() + '-' + Math.floor(Math.random() * 10000).toString().padStart(4, '0');
            const currentDate = new Date();
            const weekStart = new Date(currentDate);
            weekStart.setDate(currentDate.getDate() - currentDate.getDay());
            const weekEnd = new Date(weekStart);
            weekEnd.setDate(weekStart.getDate() + 6);
            
            doc.setTextColor(80, 80, 80);
            doc.setFontSize(11);
            doc.text(`Report #: ${reportNumber}`, 40, 105);
            doc.text(`Generated: ${currentDate.toLocaleDateString()}`, 250, 105);
            doc.text(`Week: ${weekStart.toLocaleDateString()} - ${weekEnd.toLocaleDateString()}`, 400, 105);
            
            // Timesheet table
            doc.setTextColor(...brandBlue);
            doc.setFontSize(14);
            doc.setFont('helvetica', 'bold');
            doc.text('Weekly Hours Summary', 40, 155);
            
            // Prepare table data
            const headers = [['Position/Employee', 'Qty', 'Rate', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Total Hrs', 'Total $']];
            const tableData = [];
            
            let totalWeeklyCost = 0;
            state.positions.forEach(position => {
                const totalHours = position.hours.reduce((sum, h) => sum + h, 0) * (position.quantity || 1);
                const totalCost = totalHours * position.rate;
                totalWeeklyCost += totalCost;
                
                tableData.push([
                    position.name,
                    position.quantity || 1,
                    `$${position.rate.toFixed(2)}`,
                    ...position.hours.map(h => h || '-'),
                    totalHours.toFixed(1),
                    `$${totalCost.toFixed(2)}`
                ]);
            });
            
            // Add daily totals
            const dayTotals = [0, 0, 0, 0, 0, 0, 0];
            state.positions.forEach(position => {
                position.hours.forEach((hours, day) => {
                    dayTotals[day] += hours * (position.quantity || 1);
                });
            });
            const grandTotalHours = dayTotals.reduce((sum, h) => sum + h, 0);
            
            // Add totals row
            tableData.push([
                'TOTALS',
                '',
                '',
                ...dayTotals.map(h => h.toFixed(1)),
                grandTotalHours.toFixed(1),
                `$${totalWeeklyCost.toFixed(2)}`
            ]);
            
            // Create table
            doc.autoTable({
                head: headers,
                body: tableData.slice(0, -1),
                foot: [tableData[tableData.length - 1]],
                startY: 170,
                theme: 'grid',
                headStyles: {
                    fillColor: brandBlue,
                    fontSize: 10,
                    fontStyle: 'bold'
                },
                footStyles: {
                    fillColor: [245, 245, 245],
                    textColor: brandBlue,
                    fontSize: 10,
                    fontStyle: 'bold'
                },
                columnStyles: {
                    0: { cellWidth: 120, halign: 'left' },
                    1: { cellWidth: 30, halign: 'center' },
                    2: { cellWidth: 45, halign: 'center' },
                    3: { cellWidth: 35, halign: 'center' },
                    4: { cellWidth: 35, halign: 'center' },
                    5: { cellWidth: 35, halign: 'center' },
                    6: { cellWidth: 35, halign: 'center' },
                    7: { cellWidth: 35, halign: 'center' },
                    8: { cellWidth: 35, halign: 'center' },
                    9: { cellWidth: 35, halign: 'center' },
                    10: { cellWidth: 50, halign: 'center', fontStyle: 'bold' },
                    11: { cellWidth: 65, halign: 'center', fontStyle: 'bold' }
                },
                margin: { horizontal: 30 }
            });
            
            let yPosition = doc.autoTable.previous.finalY + 30;
            
            // Financial Summary Section
            doc.setFillColor(250, 250, 250);
            doc.rect(30, yPosition - 10, doc.internal.pageSize.getWidth() - 60, 180, 'F');
            
            doc.setTextColor(...brandBlue);
            doc.setFontSize(14);
            doc.setFont('helvetica', 'bold');
            doc.text('Financial Analysis', 40, yPosition + 10);
            
            // Create two-column layout for financial data
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            
            // Left column - Costs
            let leftY = yPosition + 35;
            doc.setTextColor(80, 80, 80);
            doc.text('LABOR COSTS', 50, leftY);
            leftY += 20;
            
            const laborCost = parseFloat($('laborCost').textContent.replace(/[$,]/g, ''));
            const laborTax = parseFloat($('laborTax').textContent.replace(/[$,]/g, ''));
            const workComp = parseFloat($('workComp').textContent.replace(/[$,]/g, ''));
            const totalLabor = parseFloat($('totalLabor').textContent.replace(/[$,]/g, ''));
            
            doc.text('Base Labor:', 60, leftY);
            doc.text($('laborCost').textContent, 200, leftY, { align: 'right' });
            leftY += 15;
            
            doc.text('Payroll Taxes (17%):', 60, leftY);
            doc.text($('laborTax').textContent, 200, leftY, { align: 'right' });
            leftY += 15;
            
            doc.text('Workers Comp:', 60, leftY);
            doc.text($('workComp').textContent, 200, leftY, { align: 'right' });
            leftY += 20;
            
            doc.setFont('helvetica', 'bold');
            doc.text('Total Cost:', 60, leftY);
            doc.text($('totalLabor').textContent, 200, leftY, { align: 'right' });
            
            // Right column - Revenue & Profit
            let rightY = yPosition + 35;
            doc.setFont('helvetica', 'normal');
            doc.text('REVENUE & PROFIT', 320, rightY);
            rightY += 20;
            
            doc.text(`Markup (${state.currentMarkup}%):`, 330, rightY);
            doc.text($('markupAmount').textContent, 480, rightY, { align: 'right' });
            rightY += 15;
            
            doc.text('Weekly Revenue:', 330, rightY);
            doc.text($('weeklyRevenue').textContent, 480, rightY, { align: 'right' });
            rightY += 15;
            
            doc.text('Monthly Revenue:', 330, rightY);
            doc.text($('monthlyRevenue').textContent, 480, rightY, { align: 'right' });
            rightY += 20;
            
            doc.setTextColor(...brandRed);
            const commissionLabel = state.isFirstMonth ? 'Commission (20% - First Month)' : 'Commission (No charge)';
            doc.text(commissionLabel, 330, rightY);
            doc.text($('commission').textContent, 480, rightY, { align: 'right' });
            rightY += 20;
            
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(...brandBlue);
            doc.text('Net Monthly Profit:', 330, rightY);
            doc.text($('finalProfit').textContent, 480, rightY, { align: 'right' });
            
            yPosition += 190;
            
            // Detailed Cost Breakdown (if space permits)
            if (yPosition + 250 < doc.internal.pageSize.getHeight() - 100) {
                doc.setTextColor(...brandBlue);
                doc.setFontSize(14);
                doc.setFont('helvetica', 'bold');
                doc.text('Detailed Cost Breakdown', 40, yPosition);
                
                const breakdownData = [
                    ['Cost Component', 'Weekly', 'Monthly'],
                    ['Direct Labor', $('weeklyLabor').textContent, $('monthlyLabor').textContent],
                    ['FICA - Social Security', $('weeklySS').textContent, $('monthlySS').textContent],
                    ['FICA - Medicare', $('weeklyMedicare').textContent, $('monthlyMedicare').textContent],
                    ['Federal Unemployment', $('weeklyFUTA').textContent, $('monthlyFUTA').textContent],
                    ['Texas Unemployment', $('weeklySUTA').textContent, $('monthlySUTA').textContent],
                    ['Workers Compensation', $('weeklyWorkComp').textContent, $('monthlyWorkComp').textContent],
                    ['General Liability', $('weeklyLiability').textContent, $('monthlyLiability').textContent],
                    ['Franchise Tax', $('weeklyFranchiseTax').textContent, $('monthlyFranchiseTax').textContent],
                    ['Administrative Overhead (5%)', $('weeklyOverhead').textContent, $('monthlyOverhead').textContent],
                    ['Supplies & Equipment', $('weeklySuppliesEquipment').textContent, $('monthlySuppliesEquipment').textContent]
                ];
                
                doc.autoTable({
                    head: [breakdownData[0]],
                    body: breakdownData.slice(1),
                    startY: yPosition + 15,
                    theme: 'striped',
                    headStyles: {
                        fillColor: brandBlue,
                        fontSize: 10
                    },
                    columnStyles: {
                        0: { cellWidth: 200 },
                        1: { cellWidth: 100, halign: 'right' },
                        2: { cellWidth: 100, halign: 'right' }
                    }
                });
            }
            
            // Add Hourly Profit Analysis section if space permits
            if (yPosition + 200 < doc.internal.pageSize.getHeight() - 100) {
                yPosition = doc.autoTable.previous.finalY + 30;
                
                // Section title
                doc.setFillColor(...brandRed);
                doc.rect(30, yPosition - 10, doc.internal.pageSize.getWidth() - 60, 30, 'F');
                doc.setTextColor(255, 255, 255);
                doc.setFontSize(14);
                doc.setFont('helvetica', 'bold');
                doc.text('Hourly Profit Analysis', doc.internal.pageSize.getWidth() / 2, yPosition + 10, { align: 'center' });
                
                yPosition += 35;
                
                // Prepare hourly analysis data
                const hourlyAnalysisData = [];
                state.positions.forEach(position => {
                    if (!position.rate || position.hours.every(h => h === 0)) return;
                    
                    const hourlyWorkerPay = position.rate;
                    const hourlyClientCharge = position.rate * (1 + state.currentMarkup / 100);
                    
                    // Calculate additional costs per hour
                    const hourlyAdditionalCosts = position.rate * (
                        state.config.socialSecurityRate +
                        state.config.medicareRate +
                        state.config.futaRate +
                        state.config.sutaRate +
                        state.config.workCompRate +
                        state.config.overheadRate +
                        0.0075 + // franchise tax
                        (7.33 / 1000) // liability insurance
                    );
                    
                    // Add proportional supplies and equipment costs per hour
                    const totalWeeklyHours = state.positions.reduce((sum, p) => {
                        const pHours = p.hours.reduce((s, h) => s + h, 0) * (p.quantity || 1);
                        return sum + pHours;
                    }, 0);
                    const hourlySuppliesEquipment = totalWeeklyHours > 0 ? 
                        (state.monthlySupplies + state.monthlyEquipment) / 4.33 / totalWeeklyHours : 0;
                    
                    const totalHourlyAdditionalCosts = hourlyAdditionalCosts + hourlySuppliesEquipment;
                    
                    const hourlyGrossProfit = hourlyClientCharge - hourlyWorkerPay;
                    const hourlyNetProfit = hourlyGrossProfit - totalHourlyAdditionalCosts;
                    const hourlyCommission = state.isFirstMonth ? (hourlyNetProfit * state.config.commissionRate) : 0;
                    const hourlyFinalProfit = hourlyNetProfit - hourlyCommission;
                    const profitMargin = ((hourlyFinalProfit / hourlyClientCharge) * 100).toFixed(1);
                    
                    hourlyAnalysisData.push([
                        position.name,
                        `$${hourlyWorkerPay.toFixed(2)}`,
                        `$${hourlyClientCharge.toFixed(2)}`,
                        `$${totalHourlyAdditionalCosts.toFixed(2)}`,
                        `$${hourlyFinalProfit.toFixed(2)}`,
                        `${profitMargin}%`
                    ]);
                });
                
                if (hourlyAnalysisData.length > 0) {
                    doc.autoTable({
                        head: [['Position', 'Pay/Hr', 'Bill/Hr', 'Costs/Hr', 'Net/Hr', 'Margin']],
                        body: hourlyAnalysisData,
                        startY: yPosition,
                        theme: 'striped',
                        headStyles: {
                            fillColor: brandBlue,
                            fontSize: 10,
                            fontStyle: 'bold'
                        },
                        bodyStyles: {
                            fontSize: 9
                        },
                        columnStyles: {
                            0: { cellWidth: 150 },
                            1: { cellWidth: 60, halign: 'right' },
                            2: { cellWidth: 60, halign: 'right' },
                            3: { cellWidth: 60, halign: 'right' },
                            4: { cellWidth: 60, halign: 'right', fontStyle: 'bold' },
                            5: { cellWidth: 50, halign: 'center', fontStyle: 'bold' }
                        }
                    });
                }
            }
            
            // Footer
            const pageHeight = doc.internal.pageSize.getHeight();
            doc.setDrawColor(200, 200, 200);
            doc.line(40, pageHeight - 60, doc.internal.pageSize.getWidth() - 40, pageHeight - 60);
            
            doc.setFontSize(9);
            doc.setTextColor(100, 100, 100);
            doc.text('Prime Facility Services Group | Phone: (877) 312-4924 | Email: marketing@primefacilityservicesgroup.com', 
                doc.internal.pageSize.getWidth() / 2, pageHeight - 40, { align: 'center' });
            doc.text('www.primefacilityservicesgroup.com', 
                doc.internal.pageSize.getWidth() / 2, pageHeight - 25, { align: 'center' });
            
            // Developer credit
            doc.setFontSize(7);
            doc.setTextColor(150, 150, 150);
            doc.text('Designed and developed by Christian Reyes', 
                doc.internal.pageSize.getWidth() / 2, pageHeight - 10, { align: 'center' });
            
            // Save PDF
            doc.save(`timesheet-report-${reportNumber}.pdf`);
            showNotification('PDF generated successfully', 'success');
            
        } catch (error) {
            console.error('PDF generation error:', error);
            showNotification('Error generating PDF. Please try again.', 'error');
        }
    }

    // ===== Reset =====
    function resetCalculator() {
        state.positions = [{
            id: 1,
            name: 'Regular Worker',
            quantity: 1,
            rate: state.config.regularPayRate,
            hours: [0, 0, 0, 0, 0, 0, 0]
        },
        {
            id: 2,
            name: 'Supervisor',
            quantity: 1,
            rate: state.config.supervisorPayRate,
            hours: [0, 0, 0, 0, 0, 0, 0]
        }];
        state.nextId = 3;
        state.currentMarkup = state.config.defaultMarkup;
        state.isFirstMonth = false;
        state.monthlySupplies = 0;
        state.monthlyEquipment = 0;

        // Reset UI
        const tbody = $('timesheetRows');
        tbody.innerHTML = '';
        state.positions.forEach(position => {
            tbody.appendChild(createPositionRow(position));
        });

        // Reset markup
        $('markupSlider').value = state.config.defaultMarkup;
        $('markupInput').value = state.config.defaultMarkup;
        $('markupPercentage').textContent = state.config.defaultMarkup;
        
        // Reset first month checkbox
        $('firstMonthToggle').checked = false;
        
        // Reset supplies and equipment inputs
        if ($('monthlySupplies')) $('monthlySupplies').value = 0;
        if ($('monthlyEquipment')) $('monthlyEquipment').value = 0;
        updateSuppliesEquipmentTotal();

        updateTotals();
        showNotification('Calculator reset', 'info');
    }

    // ===== Mobile Enhancements =====
    function initMobileEnhancements() {
        // Handle table scroll indicator
        const tableContainers = document.querySelectorAll('.table-container');
        tableContainers.forEach(container => {
            // Check initial scroll state
            const checkScroll = () => {
                const maxScroll = container.scrollWidth - container.clientWidth;
                const currentScroll = container.scrollLeft;
                
                if (currentScroll >= maxScroll - 5) {
                    container.classList.add('scrolled-to-end');
                } else {
                    container.classList.remove('scrolled-to-end');
                }
            };
            
            container.addEventListener('scroll', checkScroll);
            // Check on resize
            window.addEventListener('resize', checkScroll);
            // Initial check
            setTimeout(checkScroll, 100);
        });

        // Improve touch handling for inputs
        if ('ontouchstart' in window) {
            document.querySelectorAll('input[type="number"]').forEach(input => {
                input.addEventListener('touchstart', function() {
                    this.focus();
                });
            });
        }

        // Handle viewport height changes (keyboard on mobile)
        let viewportHeight = window.innerHeight;
        window.addEventListener('resize', () => {
            const currentHeight = window.innerHeight;
            if (Math.abs(currentHeight - viewportHeight) > 100) {
                document.documentElement.style.setProperty('--vh', `${currentHeight * 0.01}px`);
            }
            viewportHeight = currentHeight;
        });

        // Smooth scroll for navigation
        document.querySelectorAll('.nav-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                window.scrollTo({ top: 0, behavior: 'smooth' });
            });
        });
        
        // Header scroll effect
        const header = document.getElementById('headerWrapper');
        const headerContent = document.getElementById('headerContent');
        const headerTitle = document.getElementById('headerTitle');
        const headerSubtitle = document.getElementById('headerSubtitle');
        const headerAccent = document.getElementById('headerAccent');
        const headerLogo = document.getElementById('headerLogo');
        
        window.addEventListener('scroll', () => {
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            
            if (scrollTop > 50) {
                header.classList.add('scrolled');
                headerContent.classList.add('py-3');
                headerContent.classList.remove('py-6', 'sm:py-8');
                headerTitle.classList.add('text-xl');
                headerTitle.classList.remove('text-3xl', 'sm:text-4xl');
                headerSubtitle.classList.add('hidden');
                headerAccent.classList.add('hidden');
                if (headerLogo) headerLogo.classList.add('h-10');
                if (headerLogo) headerLogo.classList.remove('h-16');
            } else {
                header.classList.remove('scrolled');
                headerContent.classList.remove('py-3');
                headerContent.classList.add('py-6', 'sm:py-8');
                headerTitle.classList.remove('text-xl');
                headerTitle.classList.add('text-3xl', 'sm:text-4xl');
                headerSubtitle.classList.remove('hidden');
                headerAccent.classList.remove('hidden');
                if (headerLogo) headerLogo.classList.remove('h-10');
                if (headerLogo) headerLogo.classList.add('h-16');
            }
        });
    }

    // ===== Initialize =====
    function init() {
        // Load config
        loadConfig();

        // Create initial rows
        const tbody = $('timesheetRows');
        state.positions.forEach(position => {
            tbody.appendChild(createPositionRow(position));
        });

        // Initialize event listeners
        initEventListeners();

        // Initialize mobile enhancements
        initMobileEnhancements();
        
        // Initialize dark mode
        if ($('darkModeBtn')) {
            const icon = $('darkModeBtn').querySelector('i');
            if (icon) {
                icon.className = darkModeManager.isDarkMode ? 'fas fa-sun' : 'fas fa-moon';
            }
        }

        // Initial calculation
        updateTotals();

        // Set initial viewport height for mobile
        document.documentElement.style.setProperty('--vh', `${window.innerHeight * 0.01}px`);
    }

    // Define global functions for modal actions
    window.closeScreenshotModal = function() {
        document.getElementById('screenshotModal').classList.add('hidden');
    }

    window.downloadScreenshot = function() {
        if (!screenshotCanvas) return;
        
        try {
            const link = document.createElement('a');
            link.download = `timesheet-${new Date().toISOString().split('T')[0]}.png`;
            link.href = screenshotCanvas.toDataURL();
            link.click();
            showNotification('Screenshot downloaded successfully', 'success');
        } catch (error) {
            console.error('Download error:', error);
            showNotification('Failed to download screenshot', 'error');
        }
    }

    window.copyScreenshot = async function() {
        if (!screenshotCanvas) return;
        
        try {
            // Convert canvas to blob
            const blob = await new Promise(resolve => screenshotCanvas.toBlob(resolve));
            
            // Copy to clipboard
            await navigator.clipboard.write([
                new ClipboardItem({
                    'image/png': blob
                })
            ]);
            
            // Show success notification
            showNotification('Screenshot copied to clipboard!', 'success');
            
        } catch (error) {
            console.error('Copy error:', error);
            // Fallback for browsers that don't support clipboard API
            try {
                // Create a temporary link and trigger download instead
                downloadScreenshot();
                showNotification('Browser doesn\'t support clipboard. Downloaded instead.', 'warning');
            } catch (e) {
                showNotification('Error copying screenshot', 'error');
            }
        }
    }

    function downloadScreenshot() {
        if (!screenshotCanvas) return;
        
        // Create download link
        const link = document.createElement('a');
        const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
        link.download = `timesheet-calculator-${timestamp}.png`;
        link.href = screenshotCanvas.toDataURL();
        link.click();
        
        showNotification('Screenshot downloaded!', 'success');
    }
    
    // ===== Header Scroll Effect =====
    function setupHeaderScroll() {
        let lastScrollTop = 0;
        const headerWrapper = document.getElementById('headerWrapper');
        const headerContent = document.getElementById('headerContent');
        const headerTitle = document.getElementById('headerTitle');
        const headerSubtitle = document.getElementById('headerSubtitle');
        const headerAccent = document.getElementById('headerAccent');
        const headerLogo = document.getElementById('headerLogo');
        
        window.addEventListener('scroll', () => {
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            
            if (scrollTop > 50) {
                // Shrink header
                headerWrapper.classList.add('shadow-md');
                headerContent.classList.remove('p-6', 'sm:p-8');
                headerContent.classList.add('p-3', 'sm:p-4');
                headerTitle.classList.remove('text-3xl', 'sm:text-4xl', 'mb-2');
                headerTitle.classList.add('text-xl', 'sm:text-2xl');
                headerSubtitle.classList.add('hidden');
                headerAccent.classList.add('hidden');
                headerLogo.classList.add('h-10');
                headerLogo.classList.remove('h-16');
            } else {
                // Expand header
                headerWrapper.classList.remove('shadow-md');
                headerContent.classList.add('p-6', 'sm:p-8');
                headerContent.classList.remove('p-3', 'sm:p-4');
                headerTitle.classList.add('text-3xl', 'sm:text-4xl', 'mb-2');
                headerTitle.classList.remove('text-xl', 'sm:text-2xl');
                headerSubtitle.classList.remove('hidden');
                headerAccent.classList.remove('hidden');
                headerLogo.classList.remove('h-10');
                headerLogo.classList.add('h-16');
            }
            
            lastScrollTop = scrollTop;
        });
    }

    // Start the application
    init();
    setupHeaderScroll();
    
    // Initialize proposal generator if available
    if (typeof initProposalGenerator === 'function') {
        initProposalGenerator();
    }
})();