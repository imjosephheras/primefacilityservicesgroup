// Staffing Proposal Generator Module
(function() {
    'use strict';

    // Current step tracking
    let currentStep = 1;
    const totalSteps = 4;

    // Position categories with base rates
    const positionCategories = {
        'FOOD & BEVERAGE': [
            { name: 'Line Cook', baseRate: 17.18 },
            { name: 'Cook', baseRate: 16.00 },
            { name: 'Barista', baseRate: 15.00 },
            { name: 'Prep cook', baseRate: 15.00 },
            { name: 'Server', baseRate: 16.00 },
            { name: 'Bartender', baseRate: 16.00 },
            { name: 'Back Table Cook', baseRate: 16.00 },
            { name: 'Banquet Server', baseRate: 15.00 },
            { name: 'Food Runner', baseRate: 13.00 },
            { name: 'Busser', baseRate: 13.00 },
            { name: 'Dishwasher', baseRate: 13.00 },
            { name: 'Dining Room Attendant', baseRate: 15.00 },
            { name: 'Main Kitchen STW 1', baseRate: 13.00 },
            { name: 'Main Kitchen STW 2', baseRate: 14.00 },
            { name: 'Steward', baseRate: 13.00 },
            { name: 'Back Table Busser', baseRate: 13.00 }
        ],
        'HOUSEKEEPING': [
            { name: 'Housekeeping Supervisor', baseRate: 16.00 },
            { name: 'Project Houseman', baseRate: 15.00 },
            { name: 'Laundry Attendant', baseRate: 13.00 },
            { name: 'GRA (Guest Room Attendant) Inspector', baseRate: 13.00 },
            { name: 'Banquet Houseman', baseRate: 13.00 },
            { name: 'Houseman', baseRate: 13.00 },
            { name: 'Housekeeper', baseRate: 13.00 },
            { name: 'Runner Housekeeper', baseRate: 13.00 }
        ],
        'FRONT OFFICE': [
            { name: 'Host', baseRate: 15.00 },
            { name: 'Cashier', baseRate: 15.00 },
            { name: 'Lobby Attendant', baseRate: 13.00 },
            { name: 'Front Desk', baseRate: 16.00 },
            { name: 'Lead', baseRate: 16.00 },
            { name: 'Lobby Runner PM', baseRate: 14.00 },
            { name: 'Lobby Runner AM', baseRate: 13.00 }
        ],
        'ENGINEERING & MAINTENANCE': [
            { name: 'Engineering', baseRate: 15.00 },
            { name: 'Maintenance 1', baseRate: 16.00 },
            { name: 'Maintenance 2', baseRate: 18.00 },
            { name: 'Maintenance 3', baseRate: 20.00 },
            { name: 'Painter', baseRate: 20.00 }
        ],
        'POOL': [
            { name: 'Pool Attendant', baseRate: 13.00 }
        ],
        'GUEST SERVICES': [
            { name: 'Breakfast Attendant', baseRate: 14.00 },
            { name: 'Bellman', baseRate: 13.00 },
            { name: 'Valet Parking Overnight', baseRate: 14.00, tips: true },
            { name: 'Valet Parking', baseRate: 12.00, tips: true }
        ],
        'SECURITY': [
            { name: 'Security', baseRate: 17.00 }
        ]
    };

    // Initialize the proposal generator
    window.initProposalGenerator = function() {
        const proposalBtn = document.getElementById('proposalGeneratorBtn');
        if (proposalBtn) {
            proposalBtn.addEventListener('click', openProposalModal);
        }

        // Set up markup input listener
        const markupInput = document.getElementById('proposalMarkup');
        if (markupInput) {
            markupInput.addEventListener('input', updateAllBillRates);
        }

        // Set up date listeners
        const startDate = document.getElementById('startDate');
        const durationInput = document.getElementById('contractDuration');
        
        if (startDate) {
            startDate.valueAsDate = new Date();
            startDate.addEventListener('change', updateEndDate);
        }
        
        if (durationInput) {
            durationInput.addEventListener('input', updateEndDate);
        }

        updateEndDate();
    };

    function openProposalModal() {
        const modal = document.getElementById('proposalModal');
        if (modal) {
            modal.classList.remove('hidden');
            currentStep = 1;
            showStep(currentStep);
            generatePositionCategories();
        }
    }

    window.closeProposalModal = function() {
        const modal = document.getElementById('proposalModal');
        if (modal) {
            modal.classList.add('hidden');
        }
    };

    function updateEndDate() {
        const startDate = document.getElementById('startDate');
        const duration = document.getElementById('contractDuration');
        const endDate = document.getElementById('endDate');
        
        if (startDate && duration && endDate && startDate.value) {
            const start = new Date(startDate.value);
            const years = parseInt(duration.value) || 1;
            const end = new Date(start);
            end.setFullYear(end.getFullYear() + years);
            end.setDate(end.getDate() - 1); // End date is one day before anniversary
            
            endDate.valueAsDate = end;
        }
    }

    function generatePositionCategories() {
        const container = document.getElementById('positionCategories');
        if (!container) return;

        container.innerHTML = '';
        const markup = parseFloat(document.getElementById('proposalMarkup').value) || 0;

        Object.entries(positionCategories).forEach(([category, positions]) => {
            const categoryDiv = document.createElement('div');
            categoryDiv.className = 'mb-6';
            
            categoryDiv.innerHTML = `
                <h5 class="text-lg font-semibold text-brand-blue mb-3 flex items-center gap-2">
                    <input type="checkbox" class="category-checkbox w-5 h-5 text-brand-red rounded" data-category="${category}">
                    ${category}
                </h5>
                <div class="overflow-x-auto">
                    <table class="w-full">
                        <thead>
                            <tr class="border-b-2 border-ios-gray-3">
                                <th class="text-left py-2 px-3 text-sm font-medium text-ios-gray-6">Select</th>
                                <th class="text-left py-2 px-3 text-sm font-medium text-ios-gray-6">Position</th>
                                <th class="text-center py-2 px-3 text-sm font-medium text-ios-gray-6">Base Rate</th>
                                <th class="text-center py-2 px-3 text-sm font-medium text-ios-gray-6">Bill Rate</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${positions.map((pos, index) => {
                                const billRate = pos.baseRate * (1 + markup / 100);
                                return `
                                    <tr class="border-b border-ios-gray-2">
                                        <td class="py-2 px-3">
                                            <input type="checkbox" class="position-checkbox w-4 h-4" 
                                                data-category="${category}" 
                                                data-position="${pos.name}"
                                                data-index="${index}">
                                        </td>
                                        <td class="py-2 px-3">${pos.name}${pos.tips ? ' + Tips' : ''}</td>
                                        <td class="py-2 px-3 text-center">
                                            <div class="flex items-center justify-center gap-1">
                                                <span>$</span>
                                                <input type="number" 
                                                    class="base-rate-input w-20 px-2 py-1 text-center bg-ios-gray-1 rounded border-0 focus:outline-none focus:ring-2 focus:ring-brand-red"
                                                    value="${pos.baseRate.toFixed(2)}"
                                                    min="0"
                                                    step="0.01"
                                                    data-category="${category}"
                                                    data-index="${index}">
                                            </div>
                                        </td>
                                        <td class="py-2 px-3 text-center font-semibold text-brand-blue">
                                            <span class="bill-rate" data-category="${category}" data-index="${index}">
                                                $${billRate.toFixed(2)}${pos.tips ? ' + Tips' : ''}
                                            </span>
                                        </td>
                                    </tr>
                                `;
                            }).join('')}
                        </tbody>
                    </table>
                </div>
            `;
            
            container.appendChild(categoryDiv);
        });

        // Add event listeners
        document.querySelectorAll('.category-checkbox').forEach(checkbox => {
            checkbox.addEventListener('change', handleCategoryCheck);
        });

        document.querySelectorAll('.base-rate-input').forEach(input => {
            input.addEventListener('input', handleRateChange);
        });
    }

    function handleCategoryCheck(e) {
        const category = e.target.dataset.category;
        const isChecked = e.target.checked;
        
        document.querySelectorAll(`.position-checkbox[data-category="${category}"]`).forEach(checkbox => {
            checkbox.checked = isChecked;
        });
    }

    function handleRateChange(e) {
        const category = e.target.dataset.category;
        const index = e.target.dataset.index;
        const newRate = parseFloat(e.target.value) || 0;
        const markup = parseFloat(document.getElementById('proposalMarkup').value) || 0;
        
        // Update the position's base rate
        positionCategories[category][index].baseRate = newRate;
        
        // Update the bill rate display
        const billRate = newRate * (1 + markup / 100);
        const billRateElement = document.querySelector(`.bill-rate[data-category="${category}"][data-index="${index}"]`);
        if (billRateElement) {
            const position = positionCategories[category][index];
            billRateElement.textContent = `$${billRate.toFixed(2)}${position.tips ? ' + Tips' : ''}`;
        }
    }

    function updateAllBillRates() {
        const markup = parseFloat(document.getElementById('proposalMarkup').value) || 0;
        
        Object.entries(positionCategories).forEach(([category, positions]) => {
            positions.forEach((pos, index) => {
                const billRate = pos.baseRate * (1 + markup / 100);
                const billRateElement = document.querySelector(`.bill-rate[data-category="${category}"][data-index="${index}"]`);
                if (billRateElement) {
                    billRateElement.textContent = `$${billRate.toFixed(2)}${pos.tips ? ' + Tips' : ''}`;
                }
            });
        });
    }

    // Generate the proposal PDF
    window.generateProposal = async function() {
        try {
            // Validate inputs
            const clientName = document.getElementById('clientName').value.trim();
            const clientAddress = document.getElementById('clientAddress').value.trim();
            
            if (!clientName || !clientAddress) {
                alert('Please fill in all client information');
                return;
            }

            // Collect selected positions
            const selectedPositions = {};
            document.querySelectorAll('.position-checkbox:checked').forEach(checkbox => {
                const category = checkbox.dataset.category;
                const index = parseInt(checkbox.dataset.index);
                
                if (!selectedPositions[category]) {
                    selectedPositions[category] = [];
                }
                
                const position = positionCategories[category][index];
                const markup = parseFloat(document.getElementById('proposalMarkup').value) || 0;
                const billRate = position.baseRate * (1 + markup / 100);
                
                selectedPositions[category].push({
                    name: position.name,
                    billRate: billRate,
                    overtimeRate: billRate * 1.5,
                    tips: position.tips || false
                });
            });

            if (Object.keys(selectedPositions).length === 0) {
                alert('Please select at least one position');
                return;
            }

            // Show loading
            const generateBtn = document.querySelector('button[onclick="generateProposal()"]');
            generateBtn.disabled = true;
            generateBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generating...';

            // Generate PDF
            await generateProposalPDF(selectedPositions);

            // Reset button
            generateBtn.disabled = false;
            generateBtn.innerHTML = '<i class="fas fa-file-pdf"></i> Generate Proposal PDF';
            
            // Close modal
            closeProposalModal();
            
        } catch (error) {
            console.error('Error generating proposal:', error);
            alert('Error generating proposal. Please try again.');
        }
    };

    async function generateProposalPDF(selectedPositions) {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF('portrait', 'pt', 'letter');
        
        // Brand colors
        const brandRed = [199, 5, 50];  // #C70532
        const brandBlue = [3, 20, 58];  // #03143A
        const lightGray = [245, 245, 245];
        const darkGray = [100, 100, 100];
        
        // Get form data
        const clientName = document.getElementById('clientName').value.toUpperCase();
        const clientAddress = document.getElementById('clientAddress').value;
        const managementCompany = document.getElementById('managementCompany').value || 'N/A';
        const startDate = new Date(document.getElementById('startDate').value);
        const endDate = new Date(document.getElementById('endDate').value);
        const duration = document.getElementById('contractDuration').value;
        
        const employerLiability = document.getElementById('employerLiability').value;
        const generalLiability = document.getElementById('generalLiability').value;
        const autoLiability = document.getElementById('autoLiability').value;
        const umbrellaLiability = document.getElementById('umbrellaLiability').value;
        
        const currentDate = new Date();
        const months = ['January', 'February', 'March', 'April', 'May', 'June', 
                       'July', 'August', 'September', 'October', 'November', 'December'];
        
        // Page margins
        const leftMargin = 50;
        const rightMargin = 50;
        const topMargin = 50;
        const bottomMargin = 50;
        const pageWidth = 612 - leftMargin - rightMargin;
        const maxY = 792 - bottomMargin;
        
        // ===== COVER PAGE =====
        createCoverPage(doc, brandRed, brandBlue);
        
        // ===== AGREEMENT CONTENT =====
        doc.addPage();
        let yPos = topMargin;
        
        // Header function removed - no headers needed per user request
        
        // Remove header - start directly with title
        yPos = topMargin + 20; // Add some top padding
        
        // Title
        doc.setFillColor(...brandBlue);
        doc.rect(leftMargin, yPos, pageWidth, 35, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text('AGREEMENT FOR SUPPLYING TEMPORARY PERSONNEL', 306, yPos + 22, { align: 'center' });
        doc.setTextColor(0, 0, 0);
        yPos += 50;
        
        // Agreement content
        doc.setFontSize(11);
        doc.setFont('helvetica', 'normal');
        
        const agreementText = `AGREEMENT made as of this ${currentDate.getDate()} day of ${months[currentDate.getMonth()]}, ${currentDate.getFullYear()}, by ${clientName}, with its principal business located at ${clientAddress}, and PRIME FACILITY SERVICES GROUP INC., with its corporate office located at 8303 Westglen Dr, Houston, TX 77063. ${clientName} is managed by ${managementCompany}. The contract between CLIENT and PRIME shall remain in effect from ${formatDate(startDate)} to ${formatDate(endDate)}, encompassing a period of ${duration} years.`;
        
        const lines = doc.splitTextToSize(agreementText, pageWidth);
        doc.text(lines, leftMargin, yPos);
        yPos += lines.length * 14 + 15;
        
        // Additional paragraphs
        const introParas = [
            "PRIME agrees to supply temporary workers (\"Assigned Workers\") to supplement CLIENT's workforce as needed. Assigned Workers will work under CLIENT's direction, control, and supervision.",
            "PRIME will send only workers approved by CLIENT, either through an interview, résumé review, or another mutually agreed process. A confirming letter, similar to Exhibit A, will outline the agreed hourly rates for each worker."
        ];
        
        introParas.forEach(para => {
            const paraLines = doc.splitTextToSize(para, pageWidth);
            doc.text(paraLines, leftMargin, yPos);
            yPos += paraLines.length * 14 + 15;
        });
        
        // All agreement sections
        const allSections = [
            {
                title: "1. Statement of Work",
                content: "PRIME will be responsible for paying Assigned Workers, including withholding taxes, and covering workers' compensation insurance, unemployment insurance, and employer Social Security taxes."
            },
            {
                title: "2. Assignment of Workers",
                content: "PRIME is responsible for paying Assigned Workers directly, including withholding taxes, payroll taxes, and other employment-related expenses such as workers' compensation insurance and unemployment insurance. CLIENT is not responsible for these payments but will be billed by PRIME for the services provided by the Assigned Workers."
            },
            {
                title: "3. Payment of Workers",
                content: "PRIME is responsible for paying Assigned Workers directly, including withholding taxes, payroll taxes, and other employment-related expenses such as workers' compensation insurance and unemployment insurance. CLIENT is not responsible for these payments but will be billed by PRIME for the services provided by the Assigned Workers."
            },
            {
                title: "4. Supervision",
                content: "CLIENT will supervise and direct the work of Assigned Workers on-site. If CLIENT is dissatisfied with an Assigned Worker's performance within the first workday, CLIENT may request corrective action. PRIME will address the issue by providing a replacement worker or correcting the problem within 48 hours. If the issue persists, CLIENT may cancel the assignment without being billed for that worker. If the worker remains beyond the first day, the assignment is deemed satisfactory, and CLIENT is responsible for payment."
            },
            {
                title: "5. PRIME's Responsibilities",
                content: "PRIME will handle payroll, employee records, taxes, insurance, and other employment-related tasks for Assigned Workers."
            },
            {
                title: "6. Billing and Payment",
                content: "PRIME will bill CLIENT weekly for hours worked by Assigned Workers. Payment is due within 15 days of receiving the invoice. Late payments will incur a fee of 2% per month on the outstanding balance. CLIENT will also be responsible for reasonable costs, including attorney fees, for unpaid invoices sent to collections."
            },
            {
                title: "7. Disclaimer of Liability",
                content: "PRIME expressly disclaims liability for any claims, losses, or liabilities resulting from:\n• CLIENT's failure to adequately supervise or control Assigned Workers.\n• CLIENT's failure to provide a safe work environment or necessary training and equipment for hazardous conditions.\n• Changes to Assigned Workers' duties without PRIME's prior written approval.\n• Any claim related to CLIENT's business operations, including product or environmental liability.\n• Property damage or personal injury, including death, arising out of or resulting from acts or omissions of the Assigned Workers.\n• PRIME's liability will be limited to the scope outlined in the insurance coverages provided."
            },
            {
                title: "8. Non-Solicitation of Workers",
                content: "CLIENT agrees not to hire, solicit, or offer employment to any Assigned Worker provided by PRIME, under any circumstances, during the term of this Agreement or after its termination, unless the Assigned Worker has completed a minimum of 1 year and 1,028 hours of continuous service for PRIME. After the Assigned Worker has met this requirement, CLIENT may hire the worker directly, provided that CLIENT pays a placement fee equal to 35% of the worker's annual compensation at the time of hiring.\n\nIf CLIENT hires, solicits, or offers employment to an Assigned Worker prior to the completion of 1 year and 1,028 hours of continuous service for PRIME, CLIENT agrees to pay PRIME an amount equal to the worker's full annual compensation as liquidated damages.\n\nUnder no circumstances may CLIENT hire, solicit, or offer employment to any Assigned Worker provided by PRIME without PRIME's explicit written consent."
            },
            {
                title: "9. Minimum Shift Duration",
                content: "Each Assigned Worker shall be scheduled for a minimum of six (6) hours per shift. CLIENT agrees not to schedule any Assigned Worker for less than six (6) consecutive working hours unless previously authorized in writing by PRIME."
            },
            {
                title: "10. Guarantee",
                content: "PRIME will provide only qualified workers and guarantee their performance for the duration of their assignment. If any worker fails to meet CLIENT's expectations, PRIME will replace the worker within 48 hours."
            },
            {
                title: "11. Indemnification",
                content: "Each party agrees to indemnify, defend, and hold the other party harmless from and against all claims, costs, expenses, damages, and liabilities, including reasonable attorney's fees. The total liability for any claims arising from this Agreement shall not exceed the total amount paid under this Agreement."
            },
            {
                title: "12. Supervision and Safety",
                content: "CLIENT is responsible for ensuring that Assigned Workers are provided with a safe work environment, necessary safety equipment, and adequate on-site training regarding any hazards or specific safety protocols related to the job."
            },
            {
                title: "13. Remote Services and Site Visits",
                content: "Prime Facility Services of Texas will provide the necessary services outlined in this agreement through remote communication methods, such as email and video conferencing, when feasible. Regular on-site visits may be conducted to assess employee performance and obtain documents. However, site visits will be limited and performed only when essential unless both parties agree to it."
            },
            {
                title: "14. Insurance and Liability",
                content: `PRIME will maintain standard insurance coverages, including:\n\n• Workers' compensation: Statutory\n• Employer's liability: $${employerLiability}\n• General liability: $${generalLiability}\n• Automobile liability: $${autoLiability}\n• Umbrella liability: $${umbrellaLiability}\n\nThe total liability for any claims arising from this Agreement shall be limited to the total amount paid under this Agreement or 25% of the payments made by CLIENT if no insurance coverage applies.`
            },
            {
                title: "15. Termination and Renewal (Evergreen Clause)",
                content: "Either party may terminate this Agreement by providing thirty (30) days' written notice prior to the expiration of the current term. If neither party provides such notice, this Agreement will automatically renew for successive one-year terms under the same terms and conditions (\"Evergreen\"). Rates for each renewal period will be subject to renegotiation based on current market conditions."
            },
            {
                title: "16. Amendments and Waivers",
                content: "This Agreement may only be amended in writing and signed by both parties. Failure by either party to enforce any provision of this Agreement shall not be considered a waiver of that provision."
            },
            {
                title: "17. Entire Agreement",
                content: "This document constitutes the entire agreement between the parties."
            },
            {
                title: "18. Governing Law",
                content: "This Agreement shall be governed by and construed in accordance with the laws of the State of Texas. Any legal actions arising from this Agreement will be subject to the jurisdiction of the courts in the state of Texas."
            }
        ];
        
        // Add all sections with smart page breaks
        allSections.forEach((section, index) => {
            // Check if we need a new page
            const sectionHeight = 100; // Approximate height needed for a section
            if (yPos + sectionHeight > maxY) {
                doc.addPage();
                yPos = topMargin + 20; // Start with top padding, no header
            }
            
            // Section title with blue background
            doc.setFillColor(...lightGray);
            doc.rect(leftMargin, yPos - 5, pageWidth, 20, 'F');
            doc.setTextColor(...brandBlue);
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(12);
            doc.text(section.title, leftMargin + 5, yPos + 8);
            yPos += 25;
            
            // Section content
            doc.setTextColor(0, 0, 0);
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(11);
            const contentLines = doc.splitTextToSize(section.content, pageWidth - 20);
            
            // Check if content fits on current page
            const contentHeight = contentLines.length * 14;
            if (yPos + contentHeight > maxY) {
                doc.addPage();
                yPos = topMargin + 20; // Start with top padding, no header
            }
            
            doc.text(contentLines, leftMargin + 10, yPos);
            yPos += contentHeight + 20;
        });
        
        // Signature section
        if (yPos + 200 > maxY) {
            doc.addPage();
            yPos = topMargin + 20; // Start with top padding, no header
        }
        
        // Witness statement
        doc.setFont('helvetica', 'normal');
        const witnessText = "IN WITNESS WHEREOF, the parties hereto have made and executed this Agreement as of the day and year first above written.";
        const witnessLines = doc.splitTextToSize(witnessText, pageWidth);
        doc.text(witnessLines, leftMargin, yPos);
        yPos += witnessLines.length * 14 + 40;
        
        // Signature blocks with better styling
        const sigBlockLeft = leftMargin + 50;
        const sigBlockRight = 350;
        
        // Company names
        doc.setFont('helvetica', 'bold');
        doc.text(clientName, sigBlockLeft + 75, yPos, { align: 'center' });
        doc.text('Prime Facility Services of Texas', sigBlockRight + 75, yPos, { align: 'center' });
        yPos += 15;
        
        doc.setFont('helvetica', 'normal');
        doc.text(managementCompany, sigBlockLeft + 75, yPos, { align: 'center' });
        yPos += 50;
        
        // Signature fields
        const fieldLabels = ['Signature', 'Printed Name', 'Title', 'Date'];
        fieldLabels.forEach(label => {
            doc.setDrawColor(...darkGray);
            doc.line(sigBlockLeft, yPos, sigBlockLeft + 150, yPos);
            doc.line(sigBlockRight, yPos, sigBlockRight + 150, yPos);
            
            doc.setTextColor(...darkGray);
            doc.setFontSize(10);
            doc.text(label, sigBlockLeft + 75, yPos + 15, { align: 'center' });
            doc.text(label, sigBlockRight + 75, yPos + 15, { align: 'center' });
            yPos += 35;
        });
        
        // EXHIBIT A
        doc.addPage();
        yPos = topMargin + 20; // Start with top padding, no header
        
        // Title with red accent
        doc.setFillColor(...brandRed);
        doc.rect(leftMargin, yPos, pageWidth, 50, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(18);
        doc.setFont('helvetica', 'bold');
        doc.text('EXHIBIT A', 306, yPos + 20, { align: 'center' });
        doc.setFontSize(14);
        doc.text('CONFIRMING LETTER SAMPLE', 306, yPos + 38, { align: 'center' });
        yPos += 65;
        
        // Exhibit A content
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(11);
        doc.setFont('helvetica', 'normal');
        
        const exhibitAText = `Pursuant to the Agreement between ${clientName} and PRIME FACILITY SERVICES GROUP INC. dated as of ${formatDate(currentDate)}, this letter confirms your order for the assignment of the following persons to work at your premises located at ${clientAddress} on the following dates and at these rates:`;
        
        const exhibitALines = doc.splitTextToSize(exhibitAText, pageWidth);
        doc.text(exhibitALines, leftMargin, yPos);
        yPos += exhibitALines.length * 14 + 30;
        
        // Table for Exhibit A
        doc.autoTable({
            startY: yPos,
            head: [['Name', 'Position', 'Start Date', 'Straight Time\nHourly Billing Rate', 'Overtime\nHourly Billing Rate']],
            body: [
                ['', '', '', '', ''],
                ['', '', '', '', ''],
                ['', '', '', '', '']
            ],
            theme: 'grid',
            headStyles: {
                fillColor: brandBlue,
                fontSize: 10,
                cellPadding: 8
            },
            bodyStyles: {
                minCellHeight: 25
            },
            columnStyles: {
                0: { cellWidth: 120, halign: 'center' },
                1: { cellWidth: 100, halign: 'center' },
                2: { cellWidth: 80, halign: 'center' },
                3: { cellWidth: 100, halign: 'center' },
                4: { cellWidth: 100, halign: 'center' }
            },
            margin: { left: 56 }
        });
        
        // Note
        doc.setFontSize(10);
        doc.setFont('helvetica', 'italic');
        doc.setTextColor(...darkGray);
        const noteText = "Note: Overtime is defined as all hours worked in excess of 40 in any one week by an individual. Overtime may be defined differently under contractual provisions or applicable state law.";
        const noteLines = doc.splitTextToSize(noteText, pageWidth);
        doc.text(noteLines, leftMargin, doc.autoTable.previous.finalY + 20);
        
        // EXHIBIT B
        doc.addPage();
        yPos = topMargin + 20; // Start with top padding, no header
        
        // Title with red accent
        doc.setFillColor(...brandRed);
        doc.rect(leftMargin, yPos, pageWidth, 65, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(18);
        doc.setFont('helvetica', 'bold');
        doc.text('EXHIBIT B', 306, yPos + 20, { align: 'center' });
        doc.setFontSize(14);
        doc.text('TEMPORARY PERSONNEL FEES', 306, yPos + 38, { align: 'center' });
        doc.setFontSize(12);
        doc.text('RATES BEFORE TAXES', 306, yPos + 53, { align: 'center' });
        yPos += 80;
        
        // Create professional tables for each category
        doc.setTextColor(0, 0, 0);
        Object.entries(selectedPositions).forEach(([category, positions]) => {
            // Check if table fits on current page
            const tableHeight = 35 + (positions.length * 25);
            if (yPos + tableHeight > maxY) {
                doc.addPage();
                yPos = topMargin + 20; // Start with top padding, no header
            }
            
            // Category table with brand colors
            const tableData = positions.map(pos => [
                pos.name,
                `$${pos.billRate.toFixed(2)}${pos.tips ? ' + Tips' : ''}`
            ]);
            
            doc.autoTable({
                startY: yPos,
                head: [[category, 'Bill Rate']],
                body: tableData,
                theme: 'striped',
                headStyles: {
                    fillColor: brandBlue,
                    textColor: [255, 255, 255],
                    fontSize: 12,
                    fontStyle: 'bold',
                    cellPadding: 10
                },
                bodyStyles: {
                    fontSize: 11,
                    cellPadding: 8
                },
                alternateRowStyles: {
                    fillColor: [248, 248, 248]
                },
                columnStyles: {
                    0: { cellWidth: 350, halign: 'left' },
                    1: { cellWidth: 150, halign: 'center', fontStyle: 'bold' }
                }
            });
            
            yPos = doc.autoTable.previous.finalY + 25;
        });
        
        // Save the PDF
        const fileName = `Staffing_Proposal_${clientName.replace(/\s+/g, '_')}_${currentDate.toISOString().split('T')[0]}.pdf`;
        doc.save(fileName);
    }
    
    function createCoverPage(doc) {
        doc.setFillColor(255, 255, 255);
        doc.rect(0, 0, 612, 792, 'F');
        
        // Top quote
        doc.setFontSize(16);
        doc.setFont('times', 'italic');
        doc.setTextColor(100, 100, 100);
        doc.text('"The best services in the industry', 306, 100, { align: 'center' });
        doc.text('or nothing at all"', 306, 125, { align: 'center' });
        
        // Main title
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(28);
        doc.setFont('helvetica', 'bold');
        doc.text('AGREEMENT FOR SUPPLYING', 306, 220, { align: 'center' });
        doc.text('TEMPORARY PERSONNEL', 306, 255, { align: 'center' });
        
        // Logo area
        doc.setTextColor(199, 5, 50);
        doc.setFontSize(48);
        doc.setFont('helvetica', 'bold');
        doc.text('PRIME', 306, 380, { align: 'center' });
        
        // Add star symbol
        doc.setFontSize(36);
        doc.text('★', 306, 420, { align: 'center' });
        
        // Company name
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(20);
        doc.setFont('helvetica', 'normal');
        doc.text('Prime Hospitality Services Of Texas', 306, 480, { align: 'center' });
        
        // Bottom section with decorative line
        doc.setDrawColor(200, 200, 200);
        doc.setLineWidth(0.5);
        doc.line(100, 550, 512, 550);
        
        // Bottom quote
        doc.setFontSize(16);
        doc.setFont('times', 'italic');
        doc.setTextColor(100, 100, 100);
        doc.text('"The best services in the industry', 306, 600, { align: 'center' });
        doc.text('or nothing at all"', 306, 625, { align: 'center' });
        
        // Bottom title
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(20);
        doc.setFont('helvetica', 'bold');
        doc.text('AGREEMENT FOR SUPPLYING', 306, 700, { align: 'center' });
        doc.text('TEMPORARY PERSONNEL', 306, 730, { align: 'center' });
    }

    // Header and footer functions removed - not needed per user requirements

    function formatDate(date) {
        const months = ['January', 'February', 'March', 'April', 'May', 'June', 
                       'July', 'August', 'September', 'October', 'November', 'December'];
        return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
    }

    // Step navigation functions
    function showStep(step) {
        // Hide all steps
        document.querySelectorAll('.proposal-step').forEach(stepDiv => {
            stepDiv.classList.add('hidden');
        });
        
        // Show current step
        const currentStepDiv = document.getElementById(`proposalStep${step}`);
        if (currentStepDiv) {
            currentStepDiv.classList.remove('hidden');
        }
        
        // Update step indicators
        document.querySelectorAll('.step-indicator').forEach(indicator => {
            const indicatorStep = parseInt(indicator.dataset.step);
            const circle = indicator.querySelector('div');
            
            if (indicatorStep < step) {
                // Completed step
                circle.classList.remove('bg-ios-gray-3');
                circle.classList.add('bg-success-green');
            } else if (indicatorStep === step) {
                // Current step
                circle.classList.remove('bg-ios-gray-3', 'bg-success-green');
                circle.classList.add('bg-brand-red');
            } else {
                // Future step
                circle.classList.remove('bg-brand-red', 'bg-success-green');
                circle.classList.add('bg-ios-gray-3');
            }
        });
        
        // Update navigation buttons
        const prevBtn = document.getElementById('proposalPrevBtn');
        const nextBtn = document.getElementById('proposalNextBtn');
        const generateBtn = document.getElementById('proposalGenerateBtn');
        
        // Show/hide previous button
        if (prevBtn) {
            if (step === 1) {
                prevBtn.classList.add('hidden');
            } else {
                prevBtn.classList.remove('hidden');
            }
        }
        
        // Show/hide next vs generate button
        if (nextBtn && generateBtn) {
            if (step === totalSteps) {
                nextBtn.classList.add('hidden');
                generateBtn.classList.remove('hidden');
            } else {
                nextBtn.classList.remove('hidden');
                generateBtn.classList.add('hidden');
            }
        }
    }
    
    window.nextProposalStep = function() {
        if (currentStep < totalSteps) {
            // Validate current step before proceeding
            if (validateStep(currentStep)) {
                currentStep++;
                showStep(currentStep);
            }
        }
    };
    
    window.previousProposalStep = function() {
        if (currentStep > 1) {
            currentStep--;
            showStep(currentStep);
        }
    };
    
    function validateStep(step) {
        switch(step) {
            case 1:
                // Validate markup
                const markup = document.getElementById('proposalMarkup');
                if (!markup || markup.value === '' || parseFloat(markup.value) < 0) {
                    alert('Please enter a valid markup percentage');
                    return false;
                }
                return true;
                
            case 2:
                // Validate client info
                const clientName = document.getElementById('clientName');
                const clientAddress = document.getElementById('clientAddress');
                if (!clientName.value.trim() || !clientAddress.value.trim()) {
                    alert('Please fill in all required client information');
                    return false;
                }
                return true;
                
            case 3:
                // Insurance amounts are optional, so just return true
                return true;
                
            case 4:
                // Position selection is validated when generating
                return true;
                
            default:
                return true;
        }
    }

})();