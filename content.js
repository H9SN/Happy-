// Content script for Fsociety Social Media Manager Extension

// Detect social media platforms and auto-fill login forms
(function() {
    'use strict';
    
    // Platform detection patterns
    const platformPatterns = {
        'Facebook': ['facebook.com', 'fb.com'],
        'Instagram': ['instagram.com'],
        'Twitter/X': ['twitter.com', 'x.com'],
        'YouTube': ['youtube.com'],
        'LinkedIn': ['linkedin.com'],
        'Pinterest': ['pinterest.com'],
        'Snapchat': ['snapchat.com'],
        'TikTok': ['tiktok.com'],
        'WhatsApp': ['web.whatsapp.com'],
        'Telegram': ['web.telegram.org'],
        'Discord': ['discord.com'],
        'Reddit': ['reddit.com'],
        'Tumblr': ['tumblr.com'],
        'GitHub': ['github.com'],
        'Gmail': ['mail.google.com', 'gmail.com'],
        'Outlook': ['outlook.live.com', 'outlook.com']
    };
    
    // Common login form selectors
    const loginSelectors = {
        username: [
            'input[name="username"]',
            'input[name="email"]',
            'input[name="login"]',
            'input[type="email"]',
            'input[id*="username"]',
            'input[id*="email"]',
            'input[placeholder*="username"]',
            'input[placeholder*="email"]',
            'input[placeholder*="البريد"]',
            'input[placeholder*="المستخدم"]'
        ],
        password: [
            'input[name="password"]',
            'input[type="password"]',
            'input[id*="password"]',
            'input[placeholder*="password"]',
            'input[placeholder*="كلمة"]'
        ]
    };
    
    let currentPlatform = null;
    let accounts = [];
    
    // Initialize
    init();
    
    function init() {
        detectPlatform();
        loadAccounts();
        
        if (currentPlatform) {
            createFloatingButton();
            observeLoginForms();
        }
    }
    
    // Detect current platform
    function detectPlatform() {
        const hostname = window.location.hostname.toLowerCase();
        
        for (const [platform, domains] of Object.entries(platformPatterns)) {
            if (domains.some(domain => hostname.includes(domain))) {
                currentPlatform = platform;
                break;
            }
        }
    }
    
    // Load accounts from storage
    function loadAccounts() {
        chrome.runtime.sendMessage({ action: 'getAccounts' }, function(response) {
            if (response && response.accounts) {
                accounts = response.accounts.filter(acc => acc.platform === currentPlatform);
            }
        });
    }
    
    // Create floating button for account selection
    function createFloatingButton() {
        if (accounts.length === 0) return;
        
        const button = document.createElement('div');
        button.id = 'fsociety-floating-btn';
        button.innerHTML = `
            <div style="
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 10000;
                background: linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%);
                border: 2px solid #00ff00;
                border-radius: 50%;
                width: 60px;
                height: 60px;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                box-shadow: 0 0 20px rgba(0, 255, 0, 0.3);
                font-family: 'Roboto Mono', monospace;
                color: #00ff00;
                font-weight: bold;
                font-size: 12px;
                text-align: center;
                transition: all 0.3s ease;
            " onmouseover="this.style.transform='scale(1.1)'" onmouseout="this.style.transform='scale(1)'">
                FS<br><span style="font-size: 8px;">${accounts.length}</span>
            </div>
        `;
        
        button.addEventListener('click', showAccountSelector);
        document.body.appendChild(button);
    }
    
    // Show account selector modal
    function showAccountSelector() {
        const modal = document.createElement('div');
        modal.id = 'fsociety-account-modal';
        modal.innerHTML = `
            <div style="
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.8);
                z-index: 10001;
                display: flex;
                align-items: center;
                justify-content: center;
                font-family: 'Roboto Mono', monospace;
            ">
                <div style="
                    background: linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%);
                    border: 2px solid #00ff00;
                    border-radius: 10px;
                    padding: 20px;
                    max-width: 400px;
                    width: 90%;
                    max-height: 500px;
                    overflow-y: auto;
                    box-shadow: 0 0 30px rgba(0, 255, 0, 0.3);
                ">
                    <div style="
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        margin-bottom: 20px;
                        border-bottom: 1px solid #333;
                        padding-bottom: 10px;
                    ">
                        <h3 style="color: #00ff00; margin: 0;">اختر حساب ${currentPlatform}</h3>
                        <button onclick="document.getElementById('fsociety-account-modal').remove()" style="
                            background: none;
                            border: none;
                            color: #888;
                            font-size: 20px;
                            cursor: pointer;
                        ">&times;</button>
                    </div>
                    <div id="fsociety-accounts-list">
                        ${accounts.map(account => `
                            <div onclick="fillLoginForm('${account.id}')" style="
                                background: rgba(26, 26, 26, 0.8);
                                border: 1px solid #333;
                                padding: 15px;
                                margin-bottom: 10px;
                                cursor: pointer;
                                transition: all 0.3s ease;
                                border-radius: 5px;
                            " onmouseover="this.style.borderColor='#00ff00'" onmouseout="this.style.borderColor='#333'">
                                <div style="color: #00ff00; font-weight: bold; margin-bottom: 5px;">${account.name}</div>
                                <div style="color: #e0e0e0; font-size: 14px;">${account.username}</div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Close modal when clicking outside
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                modal.remove();
            }
        });
    }
    
    // Fill login form with selected account
    window.fillLoginForm = function(accountId) {
        const account = accounts.find(acc => acc.id === accountId);
        if (!account) return;
        
        // Find username/email field
        const usernameField = findElement(loginSelectors.username);
        if (usernameField) {
            usernameField.value = account.username;
            usernameField.dispatchEvent(new Event('input', { bubbles: true }));
            usernameField.dispatchEvent(new Event('change', { bubbles: true }));
        }
        
        // Find password field
        const passwordField = findElement(loginSelectors.password);
        if (passwordField) {
            let password = account.password;
            
            // Decrypt if encrypted
            try {
                if (password && password.match(/^[A-Za-z0-9+/]*={0,2}$/)) {
                    password = atob(password);
                }
            } catch (e) {
                // Use original password if decryption fails
            }
            
            passwordField.value = password;
            passwordField.dispatchEvent(new Event('input', { bubbles: true }));
            passwordField.dispatchEvent(new Event('change', { bubbles: true }));
        }
        
        // Close modal
        document.getElementById('fsociety-account-modal').remove();
        
        // Show success message
        showNotification(`تم ملء بيانات ${account.name}`);
    };
    
    // Find element using multiple selectors
    function findElement(selectors) {
        for (const selector of selectors) {
            const element = document.querySelector(selector);
            if (element) return element;
        }
        return null;
    }
    
    // Observe login forms for auto-detection
    function observeLoginForms() {
        const observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                if (mutation.type === 'childList') {
                    mutation.addedNodes.forEach(function(node) {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            checkForLoginForms(node);
                        }
                    });
                }
            });
        });
        
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
        
        // Initial check
        checkForLoginForms(document);
    }
    
    // Check for login forms
    function checkForLoginForms(element) {
        const usernameField = element.querySelector ? findElement(loginSelectors.username) : null;
        const passwordField = element.querySelector ? findElement(loginSelectors.password) : null;
        
        if (usernameField && passwordField && accounts.length > 0) {
            addAutoFillButton(usernameField);
        }
    }
    
    // Add auto-fill button next to username field
    function addAutoFillButton(usernameField) {
        // Check if button already exists
        if (usernameField.parentNode.querySelector('.fsociety-autofill-btn')) return;
        
        const button = document.createElement('button');
        button.className = 'fsociety-autofill-btn';
        button.innerHTML = 'FS';
        button.style.cssText = `
            position: absolute;
            right: 5px;
            top: 50%;
            transform: translateY(-50%);
            background: #00ff00;
            color: #000;
            border: none;
            border-radius: 3px;
            width: 25px;
            height: 25px;
            font-size: 10px;
            font-weight: bold;
            cursor: pointer;
            z-index: 1000;
            font-family: 'Roboto Mono', monospace;
        `;
        
        button.addEventListener('click', function(e) {
            e.preventDefault();
            showAccountSelector();
        });
        
        // Position relative to username field
        usernameField.parentNode.style.position = 'relative';
        usernameField.parentNode.appendChild(button);
    }
    
    // Show notification
    function showNotification(message) {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            left: 20px;
            background: rgba(26, 26, 26, 0.95);
            border: 1px solid #333;
            border-left: 4px solid #00ff00;
            color: #e0e0e0;
            padding: 15px 20px;
            z-index: 10002;
            font-family: 'Roboto Mono', monospace;
            font-size: 14px;
            border-radius: 5px;
            box-shadow: 0 0 20px rgba(0, 255, 0, 0.2);
            animation: slideIn 0.3s ease-out;
        `;
        
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
    
    // Add CSS animations
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from { transform: translateX(-100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
    `;
    document.head.appendChild(style);
    
})();

