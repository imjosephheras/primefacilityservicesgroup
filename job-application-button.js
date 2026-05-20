// Floating Job Application Button
(function() {
    // Create floating button HTML - Professional version
    const floatingButtonHTML = `
    <div id="floating-job-button" class="fixed bottom-8 right-8 z-40 hidden lg:block">
        <a href="https://form.jotform.com/PrimeFacilityServicesGroup/employment-documentation---prime-fa" target="_blank" class="group flex items-center bg-[#03143A] hover:bg-[#03143A]/90 text-white px-5 py-3 rounded-lg shadow-xl transition-all duration-300 hover:shadow-2xl">
            <!-- Icon -->
            <svg class="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
            </svg>
            
            <!-- Text -->
            <div>
                <div class="font-semibold">Estamos Contratando</div>
                <div class="text-xs opacity-80">Aplica aquí</div>
            </div>
        </a>
    </div>
    `;

    // Mobile version - professional and subtle
    const mobileFloatingButtonHTML = `
    <div id="mobile-floating-job-button" class="fixed bottom-20 right-4 z-40 lg:hidden">
        <a href="https://form.jotform.com/PrimeFacilityServicesGroup/employment-documentation---prime-fa" target="_blank" class="flex items-center bg-[#03143A] text-white px-4 py-2.5 rounded-lg shadow-lg transition-all duration-300">
            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
            </svg>
            <span class="font-medium text-sm">Trabaja con Nosotros</span>
        </a>
    </div>
    `;

    // Add subtle hover effect styles
    const styles = `
    <style>
        #floating-job-button:hover {
            transform: translateY(-2px);
        }
    </style>
    `;

    // Insert styles and buttons when DOM is ready
    function initFloatingButton() {
        // Add styles to head
        document.head.insertAdjacentHTML('beforeend', styles);
        
        // Add buttons to body
        document.body.insertAdjacentHTML('beforeend', floatingButtonHTML);
        document.body.insertAdjacentHTML('beforeend', mobileFloatingButtonHTML);
        
        // Optional: Add click tracking
        const buttons = document.querySelectorAll('#floating-job-button a, #mobile-floating-job-button a');
        buttons.forEach(button => {
            button.addEventListener('click', function(e) {
                // You can add analytics tracking here
                console.log('Job application button clicked');
            });
        });
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initFloatingButton);
    } else {
        initFloatingButton();
    }
})();