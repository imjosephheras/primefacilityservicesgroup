// Professional Navbar Component
(function() {
    // Navbar HTML template
    const navbarHTML = `
    <!-- Professional Navigation -->
    <nav id="navbar" class="fixed w-full top-0 z-50 transition-all duration-500">
        <div class="container mx-auto px-4">
            <div class="flex justify-between items-center py-4">
                <!-- Logo -->
                <a href="/primefacilityservicesgroup/hospitality/" class="flex items-center space-x-3 group">
                    <img src="/primefacilityservicesgroup/assets/logos/hospitality-navbar.png" alt="Prime Facility Services Group" class="h-12 w-auto transition-transform duration-300 group-hover:scale-105">
                </a>
                
                <!-- Desktop Navigation -->
                <div class="hidden lg:flex items-center space-x-1">
                    <a href="/primefacilityservicesgroup/" class="nav-link text-white hover:text-[#C70532] font-medium" data-page="home">Home</a>
                    
                    <!-- Services Dropdown -->
                    <div class="dropdown relative">
                        <button class="nav-link text-white hover:text-[#C70532] font-medium flex items-center gap-1">
                            Services
                            <svg class="w-4 h-4 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                            </svg>
                        </button>
                        <div class="dropdown-menu absolute top-full left-0 mt-2 w-96 bg-white rounded-xl shadow-2xl overflow-hidden">
                            <!-- Main Services Section -->
                            <div>
                                <a href="/hospitality/" class="block px-6 py-4 text-[#03143A] hover:bg-[#F5F5F5] hover:text-[#C70532] transition-all group">
                                    <div class="font-semibold flex items-center gap-2">
                                        <svg class="w-5 h-5 text-[#C70532]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
                                        </svg>
                                        Professional Staffing
                                    </div>
                                    <p class="text-sm text-gray-600 mt-1">Elite hospitality & event professionals</p>
                                </a>
                                <a href="/cleaning/" class="block px-6 py-4 text-[#03143A] hover:bg-[#F5F5F5] hover:text-[#C70532] transition-all group">
                                    <div class="font-semibold flex items-center gap-2">
                                        <svg class="w-5 h-5 text-[#C70532]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
                                        </svg>
                                        Cleaning Services
                                    </div>
                                    <p class="text-sm text-gray-600 mt-1">Commercial & facility cleaning</p>
                                </a>
                                <a href="/valet/" class="block px-6 py-4 text-[#03143A] hover:bg-[#F5F5F5] hover:text-[#C70532] transition-all group">
                                    <div class="font-semibold flex items-center gap-2">
                                        <svg class="w-5 h-5 text-[#C70532]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"></path>
                                        </svg>
                                        Valet Parking
                                    </div>
                                    <p class="text-sm text-gray-600 mt-1">Professional parking solutions</p>
                                </a>
                            </div>

                            <!-- Hood System Section -->
                            <div class="border-t border-gray-200">
                                <div class="px-6 py-3 bg-gray-50 border-b border-gray-200">
                                    <p class="text-xs font-semibold text-gray-500 uppercase tracking-wider">Hood System Services</p>
                                </div>
                                <div class="space-y-0">
                                    <a href="/primefacilityservicesgroup/hood/system/diagnostics-reports/" class="block px-6 py-3 text-[#03143A] hover:bg-[#F5F5F5] hover:text-[#C70532] transition-all text-sm">Diagnostics & Reports</a>
                                    <a href="/primefacilityservicesgroup/hood/system/hood-cleaning/" class="block px-6 py-3 text-[#03143A] hover:bg-[#F5F5F5] hover:text-[#C70532] transition-all text-sm">Hood Cleaning</a>
                                    <a href="/primefacilityservicesgroup/hood/system/access-panels/" class="block px-6 py-3 text-[#03143A] hover:bg-[#F5F5F5] hover:text-[#C70532] transition-all text-sm">Access Panels</a>
                                    <a href="/primefacilityservicesgroup/hood/system/emergency-ansul-clean-up/" class="block px-6 py-3 text-[#03143A] hover:bg-[#F5F5F5] hover:text-[#C70532] transition-all text-sm">Emergency Ansul Clean-up</a>
                                    <a href="/primefacilityservicesgroup/hood/system/duct-cleaning/" class="block px-6 py-3 text-[#03143A] hover:bg-[#F5F5F5] hover:text-[#C70532] transition-all text-sm">Duct Cleaning</a>
                                    <a href="/primefacilityservicesgroup/hood/system/exhaust-system-diagram/" class="block px-6 py-3 text-[#03143A] hover:bg-[#F5F5F5] hover:text-[#C70532] transition-all text-sm">Exhaust System Diagram</a>
                                    <a href="/primefacilityservicesgroup/hood/system/variable-frequency-drive/" class="block px-6 py-3 text-[#03143A] hover:bg-[#F5F5F5] hover:text-[#C70532] transition-all text-sm">Variable Frequency Drive</a>
                                    <a href="/primefacilityservicesgroup/hood/system/products/" class="block px-6 py-3 text-[#03143A] hover:bg-[#F5F5F5] hover:text-[#C70532] transition-all text-sm font-semibold border-t border-gray-200">View All Products</a>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <a href="/about/" class="nav-link text-white hover:text-[#C70532] font-medium" data-page="about">About</a>
                    <!-- <a href="#" class="nav-link text-white hover:text-[#C70532] font-medium">Blog</a> -->
                </div>
                
                <!-- CTA Buttons -->
                <div class="hidden lg:flex items-center space-x-3">
                    <!-- Job Application Button - For Workers -->
                    <a href="https://form.jotform.com/PrimeFacilityServicesGroup/employment-documentation---prime-fa" target="_blank" class="flex items-center gap-2 px-4 py-2.5 bg-white/10 backdrop-blur-sm border border-white/20 text-white rounded-lg font-medium hover:bg-white/20 transition-all">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                        </svg>
                        <span>Trabaja con Nosotros</span>
                    </a>
                    
                    <!-- Client Contact Button -->
                    <a href="tel:+17133382553" class="text-white hover:text-[#C70532] transition-colors p-2">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path>
                        </svg>
                    </a>
                    <a href="/contact/" class="cta-button text-white hover:text-white">
                        Get Quote
                    </a>
                </div>
                
                <!-- Mobile Menu Button -->
                <button id="mobile-menu-btn" class="lg:hidden text-white p-2 hover:bg-white/10 rounded-lg transition-colors">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path>
                    </svg>
                </button>
            </div>
        </div>
    </nav>
    
    <!-- Professional Mobile Menu -->
    <div id="mobile-menu-overlay" class="mobile-menu-overlay fixed inset-0 z-50 lg:hidden">
        <div class="mobile-menu-content fixed right-0 top-0 h-full w-80 bg-white shadow-2xl">
            <div class="p-6 border-b border-gray-100">
                <div class="flex justify-between items-center">
                    <img src="/primefacilityservicesgroup/assets/logos/hospitality-navbar.png" alt="Prime Facility Services Group" class="h-10 w-auto" style="filter: brightness(0) saturate(100%);">
                    <button id="mobile-menu-close" class="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                        <svg class="w-6 h-6 text-[#03143A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                    </button>
                </div>
            </div>
            
            <div class="py-6">
                <div class="px-6 space-y-1">
                    <a href="/primefacilityservicesgroup/" class="block py-3 text-[#03143A] hover:text-[#C70532] font-medium transition-colors">Home</a>
                    
                    <!-- Mobile Services Section -->
                    <div class="py-3">
                        <p class="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Main Services</p>
                        <div class="space-y-1 ml-4">
                            <a href="/hospitality/" class="block py-2 text-[#03143A] hover:text-[#C70532] transition-colors">Professional Staffing</a>
                            <a href="/cleaning/" class="block py-2 text-[#03143A] hover:text-[#C70532] transition-colors">Cleaning Services</a>
                            <a href="/valet/" class="block py-2 text-[#03143A] hover:text-[#C70532] transition-colors">Valet Parking</a>
                        </div>
                    </div>

                    <!-- Mobile Hood System Section -->
                    <div class="py-3">
                        <p class="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Hood System Services</p>
                        <div class="space-y-1 ml-4">
                            <a href="/primefacilityservicesgroup/hood/system/diagnostics-reports/" class="block py-2 text-[#03143A] hover:text-[#C70532] transition-colors">Diagnostics & Reports</a>
                            <a href="/primefacilityservicesgroup/hood/system/hood-cleaning/" class="block py-2 text-[#03143A] hover:text-[#C70532] transition-colors">Hood Cleaning</a>
                            <a href="/primefacilityservicesgroup/hood/system/access-panels/" class="block py-2 text-[#03143A] hover:text-[#C70532] transition-colors">Access Panels</a>
                            <a href="/primefacilityservicesgroup/hood/system/emergency-ansul-clean-up/" class="block py-2 text-[#03143A] hover:text-[#C70532] transition-colors">Emergency Ansul Clean-up</a>
                            <a href="/primefacilityservicesgroup/hood/system/duct-cleaning/" class="block py-2 text-[#03143A] hover:text-[#C70532] transition-colors">Duct Cleaning</a>
                            <a href="/primefacilityservicesgroup/hood/system/exhaust-system-diagram/" class="block py-2 text-[#03143A] hover:text-[#C70532] transition-colors">Exhaust System Diagram</a>
                            <a href="/primefacilityservicesgroup/hood/system/variable-frequency-drive/" class="block py-2 text-[#03143A] hover:text-[#C70532] transition-colors">Variable Frequency Drive</a>
                            <a href="/primefacilityservicesgroup/hood/system/products/" class="block py-2 text-[#03143A] hover:text-[#C70532] transition-colors font-semibold text-sm mt-2 pt-2 border-t border-gray-200">Products</a>
                        </div>
                    </div>
                    
                    <a href="/about/" class="block py-3 text-[#03143A] hover:text-[#C70532] font-medium transition-colors">About</a>
                    <!-- <a href="#" class="block py-3 text-[#03143A] hover:text-[#C70532] font-medium transition-colors">Blog</a> -->
                </div>
                
                <div class="px-6 pt-6 mt-6 border-t border-gray-100">
                    <!-- Professional Action Buttons -->
                    <div class="space-y-3">
                        <!-- Job Application Button -->
                        <a href="https://form.jotform.com/PrimeFacilityServicesGroup/employment-documentation---prime-fa" target="_blank" class="block w-full text-center bg-[#03143A] hover:bg-[#03143A]/90 text-white rounded-lg font-medium py-3 transition-all">
                            <div class="flex items-center justify-center gap-2">
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                                </svg>
                                <span>Trabaja con Nosotros</span>
                            </div>
                        </a>
                        
                        <!-- Get Quote Button -->
                        <a href="/contact/" class="block w-full text-center cta-button text-white">
                            Request Service Quote
                        </a>
                        
                        <!-- Phone -->
                        <a href="tel:+17133382553" class="flex items-center justify-center gap-2 text-[#03143A] hover:text-[#C70532] font-medium transition-colors py-2">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path>
                            </svg>
                            (713) 338-2553
                        </a>
                    </div>
                </div>
            </div>
        </div>
    </div>
    `;

    // Insert navbar at the beginning of body
    document.body.insertAdjacentHTML('afterbegin', navbarHTML);

    // Initialize navbar functionality
    function initNavbar() {
        // Get current path and determine active page
        const currentPath = window.location.pathname;
        let activePage = 'home';
        
        // Determine which section we're in based on the path
        if (currentPath.includes('/about/')) {
            activePage = 'about';
        } else if (currentPath.includes('/hospitality/') || currentPath.includes('/staffing/') || currentPath.includes('/cleaning/') || currentPath.includes('/valet/') || currentPath.includes('/hood/system/')) {
            activePage = 'services';
        } else if (currentPath.includes('/contact/')) {
            activePage = 'contact';
        } else if (currentPath === '/' || currentPath.endsWith('/index.html') || currentPath === '/index.html') {
            activePage = 'home';
        }
        
        // Set active state for nav links
        document.querySelectorAll('.nav-link').forEach(link => {
            // Remove any existing active class
            link.classList.remove('active');
            
            // Check for home page
            if (activePage === 'home' && link.getAttribute('data-page') === 'home') {
                link.classList.add('active');
            }
            // Check for about page
            else if (activePage === 'about' && link.getAttribute('data-page') === 'about') {
                link.classList.add('active');
            }
            // Check for services dropdown
            else if (activePage === 'services' && link.textContent.trim() === 'Services') {
                link.classList.add('active');
            }
        });

        // Mobile menu functionality
        const mobileMenuBtn = document.getElementById('mobile-menu-btn');
        const mobileMenuOverlay = document.getElementById('mobile-menu-overlay');
        const mobileMenuClose = document.getElementById('mobile-menu-close');
        
        if (mobileMenuBtn && mobileMenuOverlay && mobileMenuClose) {
            mobileMenuBtn.addEventListener('click', () => {
                mobileMenuOverlay.classList.add('active');
                document.body.style.overflow = 'hidden';
            });
            
            mobileMenuClose.addEventListener('click', () => {
                mobileMenuOverlay.classList.remove('active');
                document.body.style.overflow = '';
            });
            
            // Close mobile menu when clicking overlay
            mobileMenuOverlay.addEventListener('click', (e) => {
                if (e.target === mobileMenuOverlay) {
                    mobileMenuOverlay.classList.remove('active');
                    document.body.style.overflow = '';
                }
            });
        }
        
        // Professional navbar scroll effect
        window.addEventListener('scroll', function() {
            const navbar = document.getElementById('navbar');
            if (navbar) {
                if (window.scrollY > 50) {
                    navbar.classList.add('navbar-scrolled');
                } else {
                    navbar.classList.remove('navbar-scrolled');
                }
            }
        });
        
        // Smooth scrolling for anchor links
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                e.preventDefault();
                const target = document.querySelector(this.getAttribute('href'));
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                    // Close mobile menu if open
                    if (mobileMenuOverlay) {
                        mobileMenuOverlay.classList.remove('active');
                        document.body.style.overflow = '';
                    }
                }
            });
        });
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initNavbar);
    } else {
        initNavbar();
    }
})();