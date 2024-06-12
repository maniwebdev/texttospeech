chrome.runtime.onInstalled.addListener(() => {
    console.log('Text-to-Speech Extension installed');
    chrome.storage.sync.set({ enabled: true }, () => {
        console.log('Extension enabled state set to true.');
    });
});

function injectContentScript(tabId) {
    chrome.scripting.executeScript({
        target: { tabId: tabId },
        files: ['content.js']
    }).then(() => {
        console.log(`Injected content script into tab ${tabId}`);
    }).catch((error) => {
        console.error(`Failed to inject content script into tab ${tabId}:`, error);
    });
}

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && /^http/.test(tab.url)) {
        injectContentScript(tabId);
    }
});

chrome.tabs.onActivated.addListener((activeInfo) => {
    chrome.tabs.get(activeInfo.tabId, (tab) => {
        if (/^http/.test(tab.url)) {
            injectContentScript(activeInfo.tabId);
        }
    });
});
