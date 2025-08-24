// Background script for Fsociety Social Media Manager Extension

// Installation handler
chrome.runtime.onInstalled.addListener(function(details) {
    if (details.reason === 'install') {
        // Set default settings
        chrome.storage.local.set({
            accounts: [],
            settings: {
                defaultPrefix: 'KMF',
                autoGeneratePasswords: false,
                encryptData: true
            }
        });
        
        // Open welcome page
        chrome.tabs.create({
            url: chrome.runtime.getURL('popup.html')
        });
    }
});

// Context menu setup
chrome.runtime.onInstalled.addListener(function() {
    chrome.contextMenus.create({
        id: 'fsociety-manager',
        title: 'Fsociety Social Media Manager',
        contexts: ['page']
    });
    
    chrome.contextMenus.create({
        id: 'add-account',
        parentId: 'fsociety-manager',
        title: 'إضافة حساب جديد',
        contexts: ['page']
    });
    
    chrome.contextMenus.create({
        id: 'view-accounts',
        parentId: 'fsociety-manager',
        title: 'عرض الحسابات',
        contexts: ['page']
    });
    
    chrome.contextMenus.create({
        id: 'open-manager',
        parentId: 'fsociety-manager',
        title: 'فتح المدير الكامل',
        contexts: ['page']
    });
});

// Context menu click handler
chrome.contextMenus.onClicked.addListener(function(info, tab) {
    switch (info.menuItemId) {
        case 'add-account':
            chrome.tabs.create({
                url: chrome.runtime.getURL('../index.html#add-account')
            });
            break;
        case 'view-accounts':
            chrome.action.openPopup();
            break;
        case 'open-manager':
            chrome.tabs.create({
                url: chrome.runtime.getURL('../index.html')
            });
            break;
    }
});

// Message handler for communication with content scripts and popup
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    switch (request.action) {
        case 'getAccounts':
            chrome.storage.local.get(['accounts'], function(result) {
                sendResponse({ accounts: result.accounts || [] });
            });
            return true; // Keep message channel open for async response
            
        case 'saveAccount':
            chrome.storage.local.get(['accounts'], function(result) {
                const accounts = result.accounts || [];
                accounts.push(request.account);
                chrome.storage.local.set({ accounts: accounts }, function() {
                    sendResponse({ success: true });
                });
            });
            return true;
            
        case 'updateAccount':
            chrome.storage.local.get(['accounts'], function(result) {
                const accounts = result.accounts || [];
                const index = accounts.findIndex(acc => acc.id === request.account.id);
                if (index !== -1) {
                    accounts[index] = request.account;
                    chrome.storage.local.set({ accounts: accounts }, function() {
                        sendResponse({ success: true });
                    });
                } else {
                    sendResponse({ success: false, error: 'Account not found' });
                }
            });
            return true;
            
        case 'deleteAccount':
            chrome.storage.local.get(['accounts'], function(result) {
                const accounts = result.accounts || [];
                const filteredAccounts = accounts.filter(acc => acc.id !== request.accountId);
                chrome.storage.local.set({ accounts: filteredAccounts }, function() {
                    sendResponse({ success: true });
                });
            });
            return true;
            
        case 'syncWithMainApp':
            // Sync data between extension and main application
            syncWithMainApp();
            sendResponse({ success: true });
            break;
    }
});

// Sync function
function syncWithMainApp() {
    // This function would handle syncing between the extension and main app
    // For now, Chrome storage serves as the single source of truth
    console.log('Syncing with main application...');
}

// Periodic sync
setInterval(syncWithMainApp, 30000); // Sync every 30 seconds

// Badge update
function updateBadge() {
    chrome.storage.local.get(['accounts'], function(result) {
        const accounts = result.accounts || [];
        const activeCount = accounts.filter(acc => acc.status === 'active').length;
        
        if (activeCount > 0) {
            chrome.action.setBadgeText({ text: activeCount.toString() });
            chrome.action.setBadgeBackgroundColor({ color: '#00ff00' });
        } else {
            chrome.action.setBadgeText({ text: '' });
        }
    });
}

// Update badge on storage changes
chrome.storage.onChanged.addListener(function(changes, namespace) {
    if (changes.accounts) {
        updateBadge();
    }
});

// Initial badge update
updateBadge();

