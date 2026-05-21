class DarkModeManager {
    constructor() {
        this.isDarkMode = this.loadPreference();
        this.callbacks = [];
        this.applyTheme();
    }
    
    loadPreference() {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const saved = localStorage.getItem('darkMode');
        return saved !== null ? JSON.parse(saved) : prefersDark;
    }
    
    savePreference() {
        localStorage.setItem('darkMode', JSON.stringify(this.isDarkMode));
    }
    
    applyTheme() {
        if (this.isDarkMode) {
            document.body.classList.add('dark-mode');
        } else {
            document.body.classList.remove('dark-mode');
        }
        this.updateMetaThemeColor();
    }
    
    updateMetaThemeColor() {
        const metaThemeColor = document.querySelector('meta[name="theme-color"]');
        if (metaThemeColor) {
            metaThemeColor.setAttribute('content', this.isDarkMode ? '#1a202c' : '#f7fafc');
        }
    }
    
    toggle() {
        this.isDarkMode = !this.isDarkMode;
        this.applyTheme();
        this.savePreference();
        this.notifyCallbacks();
        return this.isDarkMode;
    }
    
    setTheme(isDark) {
        if (this.isDarkMode !== isDark) {
            this.isDarkMode = isDark;
            this.applyTheme();
            this.savePreference();
            this.notifyCallbacks();
        }
    }
    
    onThemeChange(callback) {
        this.callbacks.push(callback);
        return () => {
            this.callbacks = this.callbacks.filter(cb => cb !== callback);
        };
    }
    
    notifyCallbacks() {
        this.callbacks.forEach(callback => {
            try {
                callback(this.isDarkMode);
            } catch (error) {
                console.error('Error in dark mode callback:', error);
            }
        });
    }
    
    createToggleButton(options = {}) {
        const {
            containerId = 'dark-mode-toggle',
            position = { top: '20px', right: '20px' },
            size = '44px',
            iconSize = '20px'
        } = options;
        
        let container = document.getElementById(containerId);
        if (!container) {
            container = document.createElement('button');
            container.id = containerId;
            container.setAttribute('aria-label', 'Toggle dark mode');
            container.style.cssText = `
                position: fixed;
                top: ${position.top};
                right: ${position.right};
                width: ${size};
                height: ${size};
                border-radius: 50%;
                background: rgba(0, 0, 0, 0.1);
                backdrop-filter: blur(10px);
                border: none;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 1000;
                transition: all 0.3s ease;
                -webkit-tap-highlight-color: transparent;
            `;
            
            const icon = document.createElement('i');
            icon.style.fontSize = iconSize;
            icon.style.transition = 'all 0.3s ease';
            container.appendChild(icon);
            
            container.addEventListener('click', () => {
                this.toggle();
                if ('vibrate' in navigator) {
                    navigator.vibrate(10);
                }
            });
            
            container.addEventListener('mouseenter', () => {
                container.style.transform = 'scale(1.1)';
            });
            
            container.addEventListener('mouseleave', () => {
                container.style.transform = 'scale(1)';
            });
            
            document.body.appendChild(container);
        }
        
        this.updateToggleButton(container);
        
        this.onThemeChange(() => {
            this.updateToggleButton(container);
        });
        
        return container;
    }
    
    updateToggleButton(button) {
        const icon = button.querySelector('i');
        if (icon) {
            icon.className = this.isDarkMode ? 'fas fa-sun' : 'fas fa-moon';
            icon.style.color = this.isDarkMode ? '#fbbf24' : '#1f2937';
        }
        
        if (this.isDarkMode) {
            button.style.background = 'rgba(255, 255, 255, 0.1)';
        } else {
            button.style.background = 'rgba(0, 0, 0, 0.1)';
        }
    }
    
    get currentTheme() {
        return this.isDarkMode ? 'dark' : 'light';
    }
    
    setupSystemThemeListener() {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        mediaQuery.addEventListener('change', (e) => {
            const savedPreference = localStorage.getItem('darkMode');
            if (savedPreference === null) {
                this.setTheme(e.matches);
            }
        });
    }
}

const darkModeManager = new DarkModeManager();

if (typeof module !== 'undefined' && module.exports) {
    module.exports = darkModeManager;
}