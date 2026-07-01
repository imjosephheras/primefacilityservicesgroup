// Work Order Generator App
// Version 1.0.0

// Initialize variables
let serviceCount = 0;
let currentWorkOrderData = null;
let lastGeneratedOrderNumber = null;

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    // Don't set a default date - leave it empty
    // const today = new Date().toISOString().split('T')[0];
    // document.getElementById('workOrderDate').value = today;
    
    // Initialize event listeners
    initializeEventListeners();
    
    // Update preview
    updatePreview();
}

function initializeEventListeners() {
    // Service management
    document.getElementById('addServiceBtn').addEventListener('click', () => addService());
    document.getElementById('servicesContainer').addEventListener('click', handleServiceContainerClick);
    document.getElementById('servicesContainer').addEventListener('input', handleServiceInput);
    
    // Quick service buttons
    document.querySelectorAll('.quick-service-btn').forEach(btn => {
        btn.addEventListener('click', handleQuickService);
    });
    
    // Form inputs
    const formInputs = document.querySelectorAll('input, select, textarea');
    formInputs.forEach(input => {
        input.addEventListener('change', updatePreview);
        input.addEventListener('input', updatePreview);
        
        // Real-time validation for required fields
        if (input.hasAttribute('required')) {
            input.addEventListener('blur', () => {
                if (!input.value.trim()) {
                    input.classList.add('border-danger-red');
                } else {
                    input.classList.remove('border-danger-red');
                }
            });
            
            input.addEventListener('input', () => {
                if (input.value.trim() && input.classList.contains('border-danger-red')) {
                    input.classList.remove('border-danger-red');
                }
            });
        }
    });
    
    // Special formatting for price field
    const grandTotalInput = document.getElementById('grandTotal');
    if (grandTotalInput) {
        grandTotalInput.addEventListener('input', handlePriceInput);
        grandTotalInput.addEventListener('blur', handlePriceBlur);
    }
    
    // Phone number formatting
    const phoneInput = document.getElementById('contactPhone');
    if (phoneInput) {
        phoneInput.addEventListener('input', handlePhoneInput);
    }
    
    // Email validation
    const emailInput = document.getElementById('contactEmail');
    if (emailInput) {
        emailInput.addEventListener('blur', validateEmail);
    }
    
    // Action buttons
    document.getElementById('generateWorkOrderBtn').addEventListener('click', generateWorkOrder);
    document.getElementById('clearFormBtn').addEventListener('click', clearForm);
}

function handleQuickService(e) {
    e.preventDefault();
    const btn = e.currentTarget;
    const title = btn.dataset.title;
    const description = btn.dataset.description;
    
    if (title === 'Custom Service') {
        addService();
    } else {
        addService(title, description);
    }
}

function addService(title = '', description = '') {
    serviceCount++;
    const servicesContainer = document.getElementById('servicesContainer');
    const noServicesMessage = document.getElementById('noServicesMessage');
    
    // Hide the no services message
    if (noServicesMessage) {
        noServicesMessage.style.display = 'none';
    }
    
    const serviceHTML = `
        <div class="service-item bg-ios-gray-1 rounded-xl p-4" data-service-id="${serviceCount}">
            <div class="flex items-start justify-between gap-3">
                <div class="flex-1 space-y-3">
                    <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div class="sm:col-span-2">
                            <label class="block text-sm font-medium text-ios-gray-6 mb-1">Service Title <span class="text-danger-red">*</span></label>
                            <input type="text" required class="service-title w-full px-3 py-2 bg-white rounded-xl border-0 focus:outline-none focus:ring-2 focus:ring-brand-blue transition-colors duration-200" 
                                placeholder="e.g., Detail Cleaning" value="${title}">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-ios-gray-6 mb-1">Quantity <span class="text-danger-red">*</span></label>
                            <input type="number" required class="service-quantity w-full px-3 py-2 bg-white rounded-xl border-0 focus:outline-none focus:ring-2 focus:ring-brand-blue transition-colors duration-200" 
                                min="1" value="1" placeholder="1">
                        </div>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-ios-gray-6 mb-1">Service Description <span class="text-danger-red">*</span></label>
                        <textarea required class="service-description w-full px-3 py-2 bg-white rounded-xl border-0 focus:outline-none focus:ring-2 focus:ring-brand-blue transition-colors duration-200 resize-none" 
                            rows="3" placeholder="Describe the service scope...">${description}</textarea>
                    </div>
                </div>
                <button type="button" class="remove-service-btn p-2 text-danger-red hover:bg-danger-red hover:bg-opacity-10 rounded-lg transition-colors" aria-label="Remove service">
                    <i class="fas fa-trash-alt"></i>
                </button>
            </div>
        </div>
    `;
    
    servicesContainer.insertAdjacentHTML('beforeend', serviceHTML);
    updatePreview();
    
    // Add validation to new service inputs
    const newService = servicesContainer.lastElementChild;
    if (newService) {
        // Add validation for required fields in the new service
        const inputs = newService.querySelectorAll('input[required], textarea[required]');
        inputs.forEach(input => {
            input.addEventListener('blur', () => {
                if (!input.value.trim()) {
                    input.classList.add('border-danger-red');
                } else {
                    input.classList.remove('border-danger-red');
                }
            });
            
            input.addEventListener('input', () => {
                if (input.value.trim() && input.classList.contains('border-danger-red')) {
                    input.classList.remove('border-danger-red');
                }
            });
        });
        
        // Special validation for quantity
        const qtyInput = newService.querySelector('.service-quantity');
        if (qtyInput) {
            qtyInput.addEventListener('input', (e) => {
                const value = parseInt(e.target.value) || 0;
                if (value < 1) {
                    e.target.value = '';
                }
            });
        }
        
        // Scroll to the new service if it's below the fold
        newService.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
}

function handleServiceContainerClick(e) {
    if (e.target.closest('.remove-service-btn')) {
        const serviceItem = e.target.closest('.service-item');
        const servicesContainer = document.getElementById('servicesContainer');
        
        serviceItem.remove();
        
        // Check if there are any services left
        if (servicesContainer.children.length === 0) {
            document.getElementById('noServicesMessage').style.display = 'block';
        }
        
        updatePreview();
    }
}

function handleServiceInput(e) {
    if (e.target.classList.contains('service-title') ||
        e.target.classList.contains('service-description')) {
        updatePreview();
    }
}

function updatePreview() {
    // Update work order number (will be generated)
    const orderNumber = lastGeneratedOrderNumber || 'Will be generated';
    document.getElementById('woPreviewNumber').textContent = orderNumber;
    
    // Update company
    const companyName = document.getElementById('companyName').value || '-';
    document.getElementById('woPreviewCompany').textContent = companyName;
    
    // Update service location
    const serviceLocation = document.getElementById('serviceLocation').value || '-';
    document.getElementById('woPreviewLocation').textContent = serviceLocation;
    
    // Update primary service
    const firstService = document.querySelector('.service-title');
    const firstQuantity = document.querySelector('.service-quantity');
    const primaryService = firstService?.value || '-';
    const quantity = parseInt(firstQuantity?.value) || 1;
    const serviceText = quantity > 1 ? `${primaryService} (Qty: ${quantity})` : primaryService;
    document.getElementById('woPreviewService').textContent = serviceText;
    
    // Update total
    const total = document.getElementById('grandTotal').value || '0.00';
    document.getElementById('woPreviewTotal').textContent = formatCurrency(parseFloat(total) || 0);
    
    // Add validation indicators
    const grandTotalInput = document.getElementById('grandTotal');
    if (grandTotalInput) {
        const value = parseFloat(grandTotalInput.value) || 0;
        if (value > 0) {
            grandTotalInput.classList.remove('border-danger-red');
        }
    }
    
    // Company name validation indicator
    const companyInput = document.getElementById('companyName');
    if (companyInput && companyInput.value.trim()) {
        companyInput.classList.remove('border-danger-red');
    }
    
    // Update generation date preview
    const today = new Date().toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
    });
    const genDateElement = document.getElementById('woPreviewGenDate');
    if (genDateElement) {
        genDateElement.textContent = today;
    }
}

function getServicesData() {
    const services = [];
    const serviceItems = document.querySelectorAll('.service-item');
    
    serviceItems.forEach(item => {
        const service = {
            title: item.querySelector('.service-title').value,
            description: item.querySelector('.service-description').value,
            quantity: parseInt(item.querySelector('.service-quantity').value) || 1
        };
        services.push(service);
    });
    
    return services;
}

function generateWorkOrderNumber() {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    
    return `WO-${year}${month}${day}-${random}`;
}

function validateForm() {
    let isValid = true;
    
    // Check company name
    const companyNameInput = document.getElementById('companyName');
    const companyName = companyNameInput.value.trim();
    if (!companyName) {
        companyNameInput.classList.add('border-danger-red');
        notificationManager.show('Company name is required', 'error');
        if (isValid) companyNameInput.focus();
        isValid = false;
    } else {
        companyNameInput.classList.remove('border-danger-red');
    }
    
    // Check services
    const services = getServicesData();
    if (services.length === 0) {
        notificationManager.show('At least one service is required', 'error');
        isValid = false;
    } else {
        // Check each service has title, description and valid quantity
        const serviceItems = document.querySelectorAll('.service-item');
        serviceItems.forEach((item, index) => {
            const titleInput = item.querySelector('.service-title');
            const descInput = item.querySelector('.service-description');
            const qtyInput = item.querySelector('.service-quantity');
            
            if (!titleInput.value.trim()) {
                titleInput.classList.add('border-danger-red');
                if (isValid) {
                    notificationManager.show(`Service ${index + 1} needs a title`, 'error');
                    titleInput.focus();
                }
                isValid = false;
            } else {
                titleInput.classList.remove('border-danger-red');
            }
            
            if (!descInput.value.trim()) {
                descInput.classList.add('border-danger-red');
                if (isValid && titleInput.value.trim()) {
                    notificationManager.show(`Service ${index + 1} needs a description`, 'error');
                    descInput.focus();
                }
                isValid = false;
            } else {
                descInput.classList.remove('border-danger-red');
            }
            
            const qty = parseInt(qtyInput.value) || 0;
            if (qty < 1) {
                qtyInput.classList.add('border-danger-red');
                if (isValid && titleInput.value.trim() && descInput.value.trim()) {
                    notificationManager.show(`Service ${index + 1} quantity must be at least 1`, 'error');
                    qtyInput.focus();
                }
                isValid = false;
            } else {
                qtyInput.classList.remove('border-danger-red');
            }
        });
    }
    
    // Work order date is now optional - no validation needed
    const dateInput = document.getElementById('workOrderDate');
    dateInput.classList.remove('border-danger-red');
    
    // Check service location
    const locationInput = document.getElementById('serviceLocation');
    const serviceLocation = locationInput.value.trim();
    if (!serviceLocation) {
        locationInput.classList.add('border-danger-red');
        notificationManager.show('Service location is required', 'error');
        if (isValid) locationInput.focus();
        isValid = false;
    } else {
        locationInput.classList.remove('border-danger-red');
    }
    
    // Check total amount
    const totalInput = document.getElementById('grandTotal');
    const grandTotal = totalInput.value;
    if (!grandTotal || parseFloat(grandTotal) <= 0) {
        totalInput.classList.add('border-danger-red');
        notificationManager.show('Total amount must be greater than $0', 'error');
        if (isValid) totalInput.focus();
        isValid = false;
    } else {
        totalInput.classList.remove('border-danger-red');
    }
    
    // Check payment terms
    const termsInput = document.getElementById('paymentTerms');
    const paymentTerms = termsInput.value;
    if (!paymentTerms) {
        termsInput.classList.add('border-danger-red');
        notificationManager.show('Payment terms are required', 'error');
        if (isValid) termsInput.focus();
        isValid = false;
    } else {
        termsInput.classList.remove('border-danger-red');
    }
    
    return isValid;
}

async function generateWorkOrder() {
    if (!validateForm()) {
        return;
    }
    
    // Show loading state
    const generateBtn = document.getElementById('generateWorkOrderBtn');
    const originalText = generateBtn.innerHTML;
    generateBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generating...';
    generateBtn.disabled = true;
    
    try {
        // Generate work order number
        const workOrderNumber = generateWorkOrderNumber();
        lastGeneratedOrderNumber = workOrderNumber;
        
        // Collect all data
        currentWorkOrderData = {
            workOrderNumber: workOrderNumber,
            services: getServicesData(),
            paymentTerms: document.getElementById('paymentTerms').value,
            status: document.getElementById('workOrderStatus').value
        };
        
        const clientInfo = {
            companyName: document.getElementById('companyName').value,
            contactName: document.getElementById('contactName').value,
            contactEmail: document.getElementById('contactEmail').value,
            contactPhone: document.getElementById('contactPhone').value,
            companyAddress: document.getElementById('companyAddress').value,
            serviceLocation: document.getElementById('serviceLocation').value
        };
        
        const grandTotal = formatCurrency(parseFloat(document.getElementById('grandTotal').value) || 0);
        
        // Generate PDF using the same format as kitchen calculator
        await generateWorkOrderPDF(currentWorkOrderData, clientInfo, grandTotal);
        
        // Update preview with generated number
        updatePreview();
        
        notificationManager.show('Work order generated successfully!', 'success');
        
    } catch (error) {
        console.error('Error generating work order:', error);
        notificationManager.show('Error generating work order. Please try again.', 'error');
    } finally {
        // Restore button state
        generateBtn.innerHTML = originalText;
        generateBtn.disabled = false;
    }
}

async function generateWorkOrderPDF(workOrderData, clientInfo, grandTotal) {
    notificationManager.show("Generating professional work order...", "info");
    
    try {
        if (typeof window.jspdf === 'undefined' || !window.jspdf.jsPDF || typeof window.html2canvas === 'undefined') {
            throw new Error('Required libraries not loaded');
        }
        
        // Generate HTML content (same structure as kitchen calculator)
        const htmlContent = generateWorkOrderHTML(workOrderData, clientInfo, grandTotal);
        
        // Create a temporary container
        const tempContainer = document.createElement('div');
        tempContainer.style.position = 'absolute';
        tempContainer.style.left = '-9999px';
        tempContainer.style.top = '0';
        tempContainer.style.width = '900px';
        tempContainer.innerHTML = htmlContent;
        document.body.appendChild(tempContainer);
        
        // Wait for Tailwind to process
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
        notificationManager.show("Converting to PDF...", "info");
        
        const canvas = await window.html2canvas(workOrderContainer, {
            scale: 2,
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
        
        notificationManager.show("Work Order generated successfully!", "success");

    } catch (error) {
        console.error('Error generating Work Order:', error);
        notificationManager.show("Error generating Work Order. Please try again.", "error");
    }
}

function generateWorkOrderHTML(workOrderData, clientInfo, grandTotal) {
    const services = workOrderData.services.map((service, index) => `
        <tr class="${index % 2 === 0 ? 'bg-gray-50' : ''}">
            <td class="px-4 py-2 align-top">
                <div class="flex items-start justify-between">
                    <div class="flex-1">
                        <h4 class="font-bold text-sm text-black mb-1">${service.title}${service.quantity > 1 ? ` (Qty: ${service.quantity})` : ''}</h4>
                        ${service.description ? `<p class="text-xs text-gray-600 pl-4">${service.description}</p>` : ''}
                    </div>
                </div>
            </td>
            <td class="px-4 py-2 text-right align-middle"></td>
        </tr>
    `).join('');

    const currentDate = new Date().toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });
    
    // Get service date if provided
    const serviceDateInput = document.getElementById('workOrderDate').value;
    let serviceDateDisplay = 'To be scheduled';
    if (serviceDateInput) {
        const serviceDate = new Date(serviceDateInput);
        serviceDateDisplay = serviceDate.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });
    }

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
                            ${clientInfo.serviceLocation}
                        </div>
                    </div>
                    <div>
                        <label class="block text-[9px] font-semibold uppercase text-gray-600 mb-1.5 tracking-wider">Bill To</label>
                        <div class="text-sm text-black font-normal">
                            ${clientInfo.companyName}<br>
                            ${clientInfo.companyAddress ? `${clientInfo.companyAddress}<br>` : ''}
                            ${clientInfo.contactName ? `${clientInfo.contactName}<br>` : ''}
                            ${clientInfo.contactPhone ? `${clientInfo.contactPhone}` : ''}
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
                                <span class="text-black font-semibold">${formatPaymentTerms(workOrderData.paymentTerms)}</span>
                            </div>
                            <div>
                                <span class="text-[11px] text-gray-700 font-semibold">Generated:</span> 
                                <span class="text-black">${currentDate}</span>
                            </div>
                            <div class="mt-1">
                                <span class="text-[11px] text-gray-700 font-semibold">Service Date:</span> 
                                <span class="text-black">${serviceDateDisplay}</span>
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
                            <p class="text-[11px] text-gray-600 leading-relaxed">The client is responsible for ensuring the area is accessible and cleared of personal items. All heavy equipment must be turned off, unplugged, and cooled before service begins.</p>
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

function clearForm() {
    if (!confirm('Are you sure you want to clear all form data?')) {
        return;
    }
    
    // Reset form
    document.getElementById('companyName').value = '';
    document.getElementById('contactName').value = '';
    document.getElementById('contactPhone').value = '';
    document.getElementById('contactEmail').value = '';
    document.getElementById('companyAddress').value = '';
    document.getElementById('serviceLocation').value = '';
    
    // Clear all services
    const servicesContainer = document.getElementById('servicesContainer');
    servicesContainer.innerHTML = '';
    
    // Show no services message
    document.getElementById('noServicesMessage').style.display = 'block';
    
    // Reset service count
    serviceCount = 0;
    
    // Reset other fields
    document.getElementById('workOrderDate').value = ''; // Leave date empty
    document.getElementById('grandTotal').value = '';
    document.getElementById('paymentTerms').value = '15'; // Default to Net 15 Days
    document.getElementById('workOrderStatus').value = 'Inactive';
    
    // Clear last generated order number
    lastGeneratedOrderNumber = null;
    
    // Update preview
    updatePreview();
    
    notificationManager.show('Form cleared successfully', 'info');
}

// Utility functions
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(amount);
}

// Export for global access if needed
window.formatCurrency = formatCurrency;

// Format payment terms for display
function formatPaymentTerms(terms) {
    switch(terms) {
        case 'COD':
            return 'Payment Upon Completion';
        case '50/50':
            return '50% Deposit / 50% Upon Completion';
        case '15':
            return 'Net 15 Days';
        case '30':
            return 'Net 30 Days';
        default:
            return `Net ${terms} Days`;
    }
}

// Format price input as user types
function handlePriceInput(e) {
    let value = e.target.value.replace(/[^0-9.]/g, '');
    
    // Ensure only one decimal point
    const parts = value.split('.');
    if (parts.length > 2) {
        value = parts[0] + '.' + parts.slice(1).join('');
    }
    
    // Limit decimal places to 2
    if (parts.length === 2 && parts[1].length > 2) {
        value = parts[0] + '.' + parts[1].substring(0, 2);
    }
    
    e.target.value = value;
    updatePreview();
}

// Format price on blur
function handlePriceBlur(e) {
    const value = parseFloat(e.target.value) || 0;
    e.target.value = value.toFixed(2);
    updatePreview();
}

// Format phone number as user types
function handlePhoneInput(e) {
    let value = e.target.value.replace(/\D/g, '');
    
    if (value.length > 0) {
        if (value.length <= 3) {
            value = `(${value}`;
        } else if (value.length <= 6) {
            value = `(${value.slice(0, 3)}) ${value.slice(3)}`;
        } else {
            value = `(${value.slice(0, 3)}) ${value.slice(3, 6)}-${value.slice(6, 10)}`;
        }
    }
    
    e.target.value = value;
}

// Validate email
function validateEmail(e) {
    const email = e.target.value;
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (email && !emailPattern.test(email)) {
        e.target.classList.add('border-danger-red');
        notificationManager.show('Please enter a valid email address', 'warning');
    } else {
        e.target.classList.remove('border-danger-red');
    }
}

// Format currency for display
function formatCurrencyDisplay(value) {
    const num = parseFloat(value) || 0;
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(num);
}