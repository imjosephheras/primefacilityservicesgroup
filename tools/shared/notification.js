class NotificationManager {
    constructor() {
        this.container = null;
        this.queue = [];
        this.isProcessing = false;
        this.createContainer();
    }
    
    createContainer() {
        const existingContainer = document.getElementById('notification-container');
        if (existingContainer) {
            this.container = existingContainer;
            return;
        }
        
        this.container = document.createElement('div');
        this.container.id = 'notification-container';
        this.container.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 10000;
            display: flex;
            flex-direction: column;
            gap: 10px;
            pointer-events: none;
            max-width: 400px;
            width: calc(100% - 40px);
        `;
        document.body.appendChild(this.container);
    }
    
    show(message, type = 'info', duration = 3000) {
        this.queue.push({ message, type, duration });
        this.processQueue();
    }
    
    async processQueue() {
        if (this.isProcessing || this.queue.length === 0) return;
        
        this.isProcessing = true;
        const { message, type, duration } = this.queue.shift();
        
        const notification = this.createNotification(message, type);
        this.container.appendChild(notification);
        
        requestAnimationFrame(() => {
            notification.style.transform = 'translateX(0)';
            notification.style.opacity = '1';
        });
        
        await new Promise(resolve => setTimeout(resolve, duration));
        
        notification.style.transform = 'translateX(400px)';
        notification.style.opacity = '0';
        
        await new Promise(resolve => setTimeout(resolve, 300));
        
        notification.remove();
        this.isProcessing = false;
        
        if (this.queue.length > 0) {
            this.processQueue();
        }
    }
    
    createNotification(message, type) {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        
        const icons = {
            success: 'fas fa-check-circle',
            error: 'fas fa-exclamation-circle',
            warning: 'fas fa-exclamation-triangle',
            info: 'fas fa-info-circle'
        };
        
        const colors = {
            success: '#10b981',
            error: '#ef4444',
            warning: '#f59e0b',
            info: '#3b82f6'
        };
        
        notification.style.cssText = `
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 16px 20px;
            background: white;
            border-radius: 12px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
            border-left: 4px solid ${colors[type]};
            transform: translateX(400px);
            opacity: 0;
            transition: all 0.3s ease;
            pointer-events: auto;
            cursor: pointer;
            min-height: 60px;
            font-family: -apple-system, BlinkMacSystemFont, sans-serif;
        `;
        
        const iconSpan = document.createElement('span');
        iconSpan.innerHTML = `<i class="${icons[type]}" style="color: ${colors[type]}; font-size: 20px;"></i>`;
        
        const messageSpan = document.createElement('span');
        messageSpan.textContent = message;
        messageSpan.style.cssText = `
            flex: 1;
            color: #1f2937;
            font-size: 15px;
            line-height: 1.4;
        `;
        
        notification.appendChild(iconSpan);
        notification.appendChild(messageSpan);
        
        notification.addEventListener('click', () => {
            notification.style.transform = 'translateX(400px)';
            notification.style.opacity = '0';
            setTimeout(() => notification.remove(), 300);
        });
        
        if (document.body.classList.contains('dark-mode')) {
            notification.style.background = '#2d3748';
            messageSpan.style.color = '#e2e8f0';
            notification.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.3)';
        }
        
        return notification;
    }
    
    success(message, duration) {
        this.show(message, 'success', duration);
    }
    
    error(message, duration) {
        this.show(message, 'error', duration);
    }
    
    warning(message, duration) {
        this.show(message, 'warning', duration);
    }
    
    info(message, duration) {
        this.show(message, 'info', duration);
    }
    
    clear() {
        this.queue = [];
        if (this.container) {
            this.container.innerHTML = '';
        }
    }
}

const notificationManager = new NotificationManager();

if (typeof module !== 'undefined' && module.exports) {
    module.exports = notificationManager;
}