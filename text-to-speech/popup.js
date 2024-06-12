document.addEventListener('DOMContentLoaded', () => {
    const speakButton = document.getElementById('speak-button');
    const stopButton = document.getElementById('stop-button');
    const status = document.getElementById('status');
    const rateSlider = document.getElementById('rate');
    const rateValue = document.getElementById('rate-value');

    let utterance;
    let currentUtteranceIndex = 0;
    let utterances = [];

    function readTextAloud() {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs.length === 0) {
                alert('No active tab found.');
                return;
            }

            const activeTab = tabs[0];
            if (!/^http/.test(activeTab.url)) {
                alert('Invalid tab URL. Please open a valid webpage.');
                return;
            }

            chrome.scripting.executeScript({
                target: { tabId: activeTab.id },
                files: ['content.js']
            }).then(() => {
                chrome.tabs.sendMessage(activeTab.id, { action: 'getText' }, (response) => {
                    if (chrome.runtime.lastError) {
                        console.error('Error:', chrome.runtime.lastError.message);
                        alert('Failed to communicate with the content script. Please try again.');
                        return;
                    }

                    if (response && response.text) {
                        utterances = splitTextIntoSentences(response.text);
                        currentUtteranceIndex = 0;
                        speakNextUtterance(activeTab.id);
                    } else {
                        alert('No text selected or found on the page.');
                    }
                });
            }).catch((error) => {
                console.error('Failed to inject content script:', error);
            });
        });
    }

    function speakNextUtterance(tabId) {
        if (currentUtteranceIndex < utterances.length) {
            const text = utterances[currentUtteranceIndex];
            utterance = new SpeechSynthesisUtterance(text);
            utterance.rate = parseFloat(rateSlider.value);

            utterance.onstart = () => {
                status.style.display = 'block';
                stopButton.style.display = 'inline';
                chrome.tabs.sendMessage(tabId, { action: 'highlightText', index: currentUtteranceIndex });
            };

            utterance.onend = () => {
                currentUtteranceIndex++;
                speakNextUtterance(tabId);
            };

            utterance.onerror = (event) => {
                if (event.error !== 'interrupted') {
                    status.style.display = 'none';
                    stopButton.style.display = 'none';
                    alert('An error occurred during speech synthesis: ' + event.error);
                }
            };

            speechSynthesis.speak(utterance);
        } else {
            status.style.display = 'none';
            stopButton.style.display = 'none';
            chrome.tabs.sendMessage(tabId, { action: 'clearHighlight' });
        }
    }

    speakButton.addEventListener('click', readTextAloud);
    rateSlider.addEventListener('input', () => {
        rateValue.textContent = rateSlider.value + 'x';
    });

    stopButton.onclick = () => {
        speechSynthesis.cancel();
        status.style.display = 'none';
        stopButton.style.display = 'none';
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs.length > 0) {
                chrome.tabs.sendMessage(tabs[0].id, { action: 'clearHighlight' });
            }
        });
    };
});

function splitTextIntoSentences(text) {
    return text.match(/[^.!?]+[.!?]+/g) || [text];
}
