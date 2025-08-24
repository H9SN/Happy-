// Global Variables
let accounts = [];
let filteredAccounts = [];

// Social Media Platforms (same as main app)
const socialMediaPlatforms = [
    'Facebook', 'Instagram', 'Twitter/X', 'YouTube', 'LinkedIn', 'Pinterest', 'Snapchat', 'TikTok',
    'WhatsApp', 'WeChat', 'Telegram', 'Messenger', 'QQ', 'Reddit', 'Tumblr', 'VKontakte',
    'Flickr', 'Discord', 'Twitch', 'SoundCloud', 'Spotify', 'GitHub', 'Steam', 'Amazon',
    'eBay', 'Kindle', 'Goodreads', 'Duolingo', 'PayPal', 'Cash App', 'Venmo', 'Zelle',
    'Payoneer', 'Skrill', 'Netflix', 'Hulu', 'Disney+', 'HBO Max', 'Apple Music', 'Google Play Music',
    'TED Talk', 'Coursera', 'Udemy', 'Lynda', 'edX', 'Khan Academy', 'WordPress', 'Blogger',
    'Medium', 'Squarespace', 'Wix', 'Shopify', 'Etsy', 'Amazon Seller Central', 'Google My Business',
    'Yelp', 'TripAdvisor', 'Booking.com', 'Airbnb', 'Uber', 'Lyft', 'Google Maps', 'Apple Maps',
    'Waze', 'Foursquare', 'Swarm', 'Tinder', 'Bumble', 'Hinge', 'Grindr', 'Skype', 'Zoom',
    'Google Meet', 'Microsoft Teams', 'Slack', 'Trello', 'Jira', 'Asana', 'Microsoft Office 365',
    'Google Workspace', 'Dropbox', 'Google Drive', 'Microsoft OneDrive', 'iCloud'
];

// Initialize the extension
document.addEventListener('DOMContentLoaded', function() {
    setupEventListeners();
    populatePlatformSelect();
    loadAccounts();
});

// Event Listeners Setup
function setupEventListeners() {
    // Search and filter
    document.getElementById('search-input').addEventListener('input', filterAccounts);
    document.getElementById('platform-filter').addEventListener('change', filterAccounts);
    
    // Buttons
    document.getElementById('add-account').addEventListener('click', openAddAccountPage);
    document.getElementById('open-manager').addEventListener('click', openFullManager);
    
    // Modal
    document.getElementById('close-modal').addEventListener('click', closeModal);
    document.getElementById('account-modal').addEventListener('click', function(e) {
        if (e.target === this) {
            closeModal();
        }
    });
}

// Populate Platform Select
function populatePlatformSelect() {
    const platformFilter = document.getElementById('platform-filter');
    
    socialMediaPlatforms.forEach(platform => {
        const option = document.createElement('option');
        option.value = platform;
        option.textContent = platform;
        platformFilter.appendChild(option);
    });
}

// Load Accounts from Chrome Storage
function loadAccounts() {
    chrome.storage.local.get(['accounts'], function(result) {
        accounts = result.accounts || [];
        filteredAccounts = [...accounts];
        updateStats();
        displayAccounts();
    });
}

// Update Statistics
function updateStats() {
    document.getElementById('total-accounts').textContent = accounts.length;
    document.getElementById('active-sessions').textContent = accounts.filter(acc => acc.status === 'active').length;
}

// Display Accounts
function displayAccounts() {
    const accountsList = document.getElementById('accounts-list');
    const emptyState = document.getElementById('empty-state');
    
    if (filteredAccounts.length === 0) {
        accountsList.innerHTML = '';
        emptyState.style.display = 'block';
        return;
    }
    
    emptyState.style.display = 'none';
    
    accountsList.innerHTML = filteredAccounts.map(account => `
        <div class="account-item" onclick="viewAccount('${account.id}')">
            <div class="account-actions">
                <button class="action-btn" onclick="event.stopPropagation(); copyUsername('${account.id}')">نسخ</button>
                <button class="action-btn" onclick="event.stopPropagation(); copyPassword('${account.id}')">كلمة مرور</button>
            </div>
            <div class="account-name">${account.name}</div>
            <div class="account-platform">${account.platform}</div>
            <div class="account-username">${account.username}</div>
        </div>
    `).join('');
}

// Filter Accounts
function filterAccounts() {
    const searchTerm = document.getElementById('search-input').value.toLowerCase();
    const platformFilter = document.getElementById('platform-filter').value;
    
    filteredAccounts = accounts.filter(account => {
        const matchesSearch = account.name.toLowerCase().includes(searchTerm) ||
                            account.username.toLowerCase().includes(searchTerm) ||
                            account.platform.toLowerCase().includes(searchTerm);
        
        const matchesPlatform = !platformFilter || account.platform === platformFilter;
        
        return matchesSearch && matchesPlatform;
    });
    
    displayAccounts();
}

// View Account Details
function viewAccount(accountId) {
    const account = accounts.find(acc => acc.id === accountId);
    if (!account) return;
    
    const modalBody = document.getElementById('modal-body');
    modalBody.innerHTML = `
        <div class="detail-item">
            <span class="detail-label">اسم الحساب:</span>
            <span class="detail-value">${account.name}</span>
            <button class="copy-btn" onclick="copyToClipboard('${account.name}')">نسخ</button>
        </div>
        <div class="detail-item">
            <span class="detail-label">المنصة:</span>
            <span class="detail-value">${account.platform}</span>
            <button class="copy-btn" onclick="copyToClipboard('${account.platform}')">نسخ</button>
        </div>
        <div class="detail-item">
            <span class="detail-label">اسم المستخدم:</span>
            <span class="detail-value">${account.username}</span>
            <button class="copy-btn" onclick="copyToClipboard('${account.username}')">نسخ</button>
        </div>
        <div class="detail-item">
            <span class="detail-label">كلمة المرور:</span>
            <span class="detail-value">••••••••</span>
            <button class="copy-btn" onclick="copyPassword('${account.id}')">نسخ</button>
        </div>
        <div class="detail-item">
            <span class="detail-label">البريد الإلكتروني:</span>
            <span class="detail-value">${account.email || 'غير محدد'}</span>
            <button class="copy-btn" onclick="copyToClipboard('${account.email}')">نسخ</button>
        </div>
        <div class="detail-item">
            <span class="detail-label">معرف الجلسة:</span>
            <span class="detail-value">${account.sessionId || 'غير محدد'}</span>
            <button class="copy-btn" onclick="copyToClipboard('${account.sessionId}')">نسخ</button>
        </div>
        <div class="detail-item">
            <span class="detail-label">رقم الهاتف:</span>
            <span class="detail-value">${account.phone || 'غير محدد'}</span>
            <button class="copy-btn" onclick="copyToClipboard('${account.phone}')">نسخ</button>
        </div>
        <div class="detail-item">
            <span class="detail-label">تاريخ الإنشاء:</span>
            <span class="detail-value">${new Date(account.creationDate).toLocaleDateString('ar-SA')}</span>
        </div>
    `;
    
    document.getElementById('modal-title').textContent = `تفاصيل الحساب: ${account.name}`;
    document.getElementById('account-modal').style.display = 'block';
}

// Copy Functions
function copyUsername(accountId) {
    const account = accounts.find(acc => acc.id === accountId);
    if (account) {
        copyToClipboard(account.username);
    }
}

function copyPassword(accountId) {
    const account = accounts.find(acc => acc.id === accountId);
    if (!account) return;
    
    let password = account.password;
    
    // Check if password is encrypted (basic check)
    try {
        // If it's base64 encoded, decode it
        if (password && password.length > 0 && password.match(/^[A-Za-z0-9+/]*={0,2}$/)) {
            password = atob(password);
        }
    } catch (e) {
        // If decoding fails, use original password
    }
    
    copyToClipboard(password);
}

function copyToClipboard(text) {
    if (!text) {
        showToast('لا يوجد نص للنسخ', 'error');
        return;
    }
    
    navigator.clipboard.writeText(text).then(() => {
        showToast('تم نسخ النص');
    }).catch(() => {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        showToast('تم نسخ النص');
    });
}

// Navigation Functions
function openAddAccountPage() {
    chrome.tabs.create({
        url: chrome.runtime.getURL('../index.html#add-account')
    });
}

function openFullManager() {
    chrome.tabs.create({
        url: chrome.runtime.getURL('../index.html')
    });
}

// Modal Functions
function closeModal() {
    document.getElementById('account-modal').style.display = 'none';
}

// Toast Notifications
function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    
    document.getElementById('toast-container').appendChild(toast);
    
    setTimeout(() => {
        toast.remove();
    }, 2000);
}

// Sync with main application
function syncWithMainApp() {
    // This function would sync data between the extension and main app
    // For now, we'll use Chrome storage as the single source of truth
    loadAccounts();
}

// Listen for storage changes
chrome.storage.onChanged.addListener(function(changes, namespace) {
    if (changes.accounts) {
        loadAccounts();
    }
});

// Periodically sync data
setInterval(syncWithMainApp, 5000);

