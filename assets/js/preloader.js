// Page Preloader Script
(function() {
    // Add loading class to body
    document.body.classList.add('loading');
    
    // Create preloader HTML with SVG logo
    const preloaderHTML = `
        <div id="page-preloader" class="page-preloader">
            <div class="preloader-content">
                <div class="preloader-logo-container">
                    <svg class="preloader-logo-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 670.9 313.1">
                        <defs>
                            <linearGradient id="logo-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" style="stop-color:#ffffff;stop-opacity:1" />
                                <stop offset="100%" style="stop-color:#C70532;stop-opacity:1" />
                            </linearGradient>
                        </defs>
                        <g class="logo-path-group">
                            <path class="logo-path" d="M497,44.3l10.4,2.8c7.7,2.1,13.7,8.1,15.8,15.8l2.8,10.4,2.8-10.4c2.1-7.7,8.1-13.7,15.8-15.8l10.4-2.8-10.4-2.8c-7.7-2.1-13.7-8.1-15.8-15.8l-2.8-10.4-2.8,10.4c-2.1,7.7-8.1,13.7-15.8,15.8l-10.4,2.8Z"/>
                            <path class="logo-path" d="M550.2,59l-1.3-4.4-1.1,4.4c-.8,3.3-3.3,5.9-6.6,6.9l-4.4,1.3,4.4,1.1c3.3.8,5.9,3.3,6.9,6.6l1.3,4.4,1.1-4.4c.8-3.3,3.3-5.9,6.6-6.9l4.4-1.3-4.4-1.1c-3.3-.8-5.9-3.3-6.9-6.6Z"/>
                            <path class="logo-path" d="M502,32.2l.7,2.5.6-2.6c.5-1.9,1.9-3.4,3.8-4l2.5-.7-2.6-.6c-1.9-.5-3.4-1.9-4-3.8l-.7-2.5-.6,2.6c-.5,1.9-1.9,3.4-3.8,4l-2.5.7,2.6.6c1.9.5,3.4,1.9,4,3.8Z"/>
                            <path class="logo-path" d="M23.9,155.4v74.9c0,1.1.9,2.1,2.1,2.1h39.3c1.1,0,2.1-.9,2.1-2.1v-48.9c0-1.1.9-2.1,2.1-2.1h2.8c-18.5-7.8-34.7-16.1-48.3-23.9Z"/>
                            <path class="logo-path" d="M149.6,119.6c0-18.2-7.2-34.7-19.7-45.3-9.1-7.7-20.9-12.5-51.3-12.5H26c-1.1,0-2.1.9-2.1,2.1v75.4c39.2,12.2,75.8,19.6,110,23.4,9.5-9.6,15.7-26.5,15.7-43ZM98.3,137.6c-5.5,2.5-12.1,2.5-16.1,2.5h-12.8c-1.1,0-2.1-.9-2.1-2.1v-34.8c0-1.1.9-2.1,2.1-2.1h11.2c4.6,0,11.5,0,17.2,2.5,6.8,3,10.1,8.4,10.1,16.8s-1.7,13.6-9.7,17.2Z"/>
                            <path class="logo-path" d="M272.2,157.6c7.2-9.9,11.7-24.2,11.7-38.2s-7.2-34.7-19.7-45.3c-9.1-7.7-20.9-12.5-51.3-12.5h-52.6c-1.1,0-2.1.9-2.1,2.1v101.1c42.1,2.6,80.1-.5,114-7.2ZM201.6,102.9c0-1.1.9-2.1,2.1-2.1h11.2c4.6,0,11.5,0,17.2,2.5,6.8,3,10.1,8.4,10.1,16.8s-1.7,13.6-9.7,17.2c-5.5,2.5-12.1,2.5-16.1,2.5h-12.8c-1.1,0-2.1-.9-2.1-2.1v-34.8Z"/>
                            <path class="logo-path" d="M201.6,230v-18c-15.1-1.4-29.6-3.5-43.4-6.3v24.3c0,1.1.9,2.1,2.1,2.1h39.3c1.1,0,2.1-.9,2.1-2.1Z"/>
                            <path class="logo-path" d="M281.2,229.7l-7.6-17.3c-16,1.3-31.6,1.6-46.6,1.2l7.8,17.8c.3.7,1.1,1.2,1.9,1.2h42.7c1.5,0,2.5-1.5,1.9-2.9Z"/>
                            <path class="logo-path" d="M338.4,64.3c0-1.2-1-2.1-2.1-2.1h-39.1c-1.2,0-2.1,1-2.1,2.1v88.1c15.4-4,29.9-8.7,43.4-13.9v-74.3Z"/>
                            <path class="logo-path" d="M297.1,232.7h39.1c1.2,0,2.1-1,2.1-2.1v-28.5c-14.8,3.5-29.3,6.2-43.4,8.1v20.4c0,1.2,1,2.1,2.1,2.1Z"/>
                            <path class="logo-path" d="M415.1,63.1c-.3-.9-1.1-1.5-2-1.5h-43.7c-1,0-1.9.8-2,1.8l-8.5,66.7c25.8-11.6,47.5-24.8,65.3-37.6l-9.1-29.4Z"/>
                            <path class="logo-path" d="M489.6,144l8,86.4c.1,1.1,1,1.9,2.1,1.9h37.8c1.2,0,2.2-1.1,2-2.3l-14.9-116.3c-39,28.1-77,49.1-113.6,64.5l16.9,52.7c.3.9,1.1,1.4,2,1.4h25.9c.9,0,1.7-.6,2-1.4l28-87.3c.7-2.1,3.8-1.8,4,.4Z"/>
                            <path class="logo-path" d="M348.1,232.3h37.8c1.1,0,2-.8,2.1-1.9l4.1-44.8c-14.3,5.3-28.3,9.8-42.1,13.4l-4,30.9c-.2,1.2.8,2.3,2,2.3Z"/>
                            <path class="logo-path" d="M645.8,193.5h-53c-1.2,0-2.1-1-2.1-2.1v-23.6c0-1.2.9-2.1,2.1-2.1h38.5c1.2,0,2.2-1,2.2-2.2v-34.9c0-1.2-.9-2.1-2.1-2.1h-38.5c-1.2,0-2.1-1-2.1-2.1v-20.8c0-1.2,1-2.1,2.1-2.1h52.9c1.3,0,2.3-1.1,2.2-2.4l-3.4-34.9c-.1-1.1-1-1.9-2.1-1.9h-54.1c-.4.3-.8.7-1.1,1-13.4,12-26.7,23.1-39.9,33.5v133.7c0,1.3,1.1,2.4,2.4,2.4h92.8c1.1,0,2-.8,2.1-1.9l3.5-35c.1-1.2-.9-2.3-2.1-2.3Z"/>
                        </g>
                        <g class="facility-text">
                            <polygon class="text-path" points="40.4 290.5 47.1 290.5 47.1 274.4 66.4 274.4 66.4 268.1 47.1 268.1 47.1 257.2 68.9 257.2 68.9 250.9 40.4 250.9 40.4 290.5"/>
                            <path class="text-path" d="M84.1,260.2c-2.4,0-4.4.2-6.1.7-1.7.5-3.3,1.1-4.9,1.8l1.8,5.5c1.3-.6,2.6-1,3.9-1.4,1.3-.3,2.7-.5,4.4-.5s4.1.5,5.3,1.6c1.2,1.1,1.8,2.7,1.8,4.8v.7c-1.1-.4-2.3-.7-3.5-.9-1.2-.2-2.7-.3-4.5-.3s-3.2.2-4.7.6c-1.4.4-2.7,1-3.7,1.8s-1.9,1.8-2.4,3c-.6,1.2-.9,2.6-.9,4.2h0c0,1.6.3,3,.8,4.1.6,1.2,1.3,2.1,2.2,2.9.9.8,2,1.4,3.3,1.8,1.2.4,2.6.6,3.9.6,2.2,0,4.1-.4,5.6-1.2,1.5-.8,2.8-1.8,3.8-3.1v3.7h6.6v-17.7c0-4-1-7.1-3.1-9.3-2.1-2.2-5.3-3.3-9.6-3.3ZM90.4,279.7c0,.9-.2,1.8-.6,2.6-.4.8-.9,1.4-1.6,2-.7.5-1.5,1-2.4,1.3-.9.3-1.9.5-3,.5-1.6,0-2.9-.4-4-1.1-1.1-.8-1.6-1.8-1.6-3.3h0c0-1.7.6-2.8,1.8-3.7,1.2-.8,2.8-1.2,4.9-1.2s2.5.1,3.6.3c1.1.2,2.1.5,3,.8v1.9Z"/>
                            <!-- Continue with rest of facility text paths... -->
                        </g>
                    </svg>
                </div>
                <div class="preloader-progress">
                    <div class="progress-bar">
                        <div class="progress-fill"></div>
                    </div>
                    <div class="loading-percentage">0%</div>
                </div>
                <div class="preloader-text">
                    <span class="loading-text-main">Loading Excellence</span>
                    <span class="loading-text-dots">...</span>
                </div>
            </div>
        </div>
    `;
    
    // Insert preloader at the beginning of body
    document.body.insertAdjacentHTML('afterbegin', preloaderHTML);
    
    // Animate progress bar
    let progress = 0;
    const progressInterval = setInterval(function() {
        progress += Math.random() * 15;
        if (progress > 90) progress = 90;
        
        const progressFill = document.querySelector('.progress-fill');
        const percentage = document.querySelector('.loading-percentage');
        
        if (progressFill) {
            progressFill.style.width = progress + '%';
        }
        if (percentage) {
            percentage.textContent = Math.floor(progress) + '%';
        }
    }, 100);
    
    // Hide preloader after page loads
    window.addEventListener('load', function() {
        clearInterval(progressInterval);
        
        // Complete the progress bar
        const progressFill = document.querySelector('.progress-fill');
        const percentage = document.querySelector('.loading-percentage');
        if (progressFill) progressFill.style.width = '100%';
        if (percentage) percentage.textContent = '100%';
        
        setTimeout(function() {
            const preloader = document.getElementById('page-preloader');
            if (preloader) {
                preloader.classList.add('fade-out');
                document.body.classList.remove('loading');
                
                // Remove preloader from DOM after animation
                setTimeout(function() {
                    preloader.style.display = 'none';
                }, 500);
            }
        }, 500);
    });
})();