const utils = {
    formatCurrency(amount) {
        return '$' + (amount || 0).toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,');
    },
    
    formatPercentage(value) {
        return (value || 0).toFixed(1) + '%';
    },
    
    $(id) {
        return document.getElementById(id);
    },
    
    debounce(func, wait) {
        let timeout;
        return function (...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), wait);
        };
    },
    
    setDisplay(id, show, displayValue = 'block') {
        const el = document.getElementById(id);
        if (el) {
            el.style.display = show ? displayValue : 'none';
        }
    },
    
    isMobile() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
               (window.matchMedia && window.matchMedia('(max-width: 768px)').matches);
    },
    
    isIOS() {
        return /iPhone|iPad|iPod/.test(navigator.userAgent) && !window.MSStream;
    },
    
    formatTime(minutes) {
        const hours = Math.floor(minutes / 60);
        const mins = Math.round(minutes % 60);
        return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
    },
    
    formatNumber(num, decimals = 0) {
        return num.toFixed(decimals).replace(/\d(?=(\d{3})+\.)/g, '$&,');
    },
    
    clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
    },
    
    saveToLocalStorage(key, data) {
        try {
            localStorage.setItem(key, JSON.stringify(data));
            return true;
        } catch (e) {
            console.error('Error saving to localStorage:', e);
            return false;
        }
    },
    
    loadFromLocalStorage(key, defaultValue = null) {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : defaultValue;
        } catch (e) {
            console.error('Error loading from localStorage:', e);
            return defaultValue;
        }
    },
    
    removeFromLocalStorage(key) {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (e) {
            console.error('Error removing from localStorage:', e);
            return false;
        }
    },
    
    validateNumber(value, min = 0, max = Infinity) {
        const num = parseFloat(value);
        if (isNaN(num)) return min;
        return utils.clamp(num, min, max);
    },
    
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    },
    
    deepClone(obj) {
        return JSON.parse(JSON.stringify(obj));
    },
    
    smoothScroll(element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    },
    
    vibrate(duration = 10) {
        if ('vibrate' in navigator) {
            navigator.vibrate(duration);
        }
    },
    
    copyToClipboard(text) {
        if (navigator.clipboard && window.isSecureContext) {
            return navigator.clipboard.writeText(text);
        } else {
            const textArea = document.createElement('textarea');
            textArea.value = text;
            textArea.style.position = 'fixed';
            textArea.style.left = '-999999px';
            textArea.style.top = '-999999px';
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            return new Promise((resolve, reject) => {
                document.execCommand('copy') ? resolve() : reject();
                textArea.remove();
            });
        }
    }
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = utils;
}
