function getSelectedText() {
    const selection = window.getSelection().toString();
    return selection || document.body.innerText;
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'getText') {
        const text = getSelectedText();
        sendResponse({ text });
    }
});
