'use strict';

const HOST_NAME = 'com.springit.filehub';
let nativePort = null;

function detectBrowser() {
  return navigator.userAgent.includes('Edg/') ? 'Microsoft Edge' : 'Google Chrome';
}

function getNativePort() {
  if (nativePort) return nativePort;
  nativePort = chrome.runtime.connectNative(HOST_NAME);
  nativePort.onMessage.addListener(response => {
    if (response && response.ok === false) console.warn('File Hub rejected download event:', response.error || 'unknown error');
  });
  nativePort.onDisconnect.addListener(() => {
    if (chrome.runtime.lastError) console.warn('File Hub Native Messaging is unavailable:', chrome.runtime.lastError.message);
    nativePort = null;
  });
  return nativePort;
}

chrome.downloads.onChanged.addListener(delta => {
  if (delta.state?.current !== 'complete') return;
  chrome.downloads.search({ id: delta.id }, items => {
    const item = items && items[0];
    if (!item || item.state !== 'complete' || !item.filename) return;
    try {
      getNativePort().postMessage({
        type: 'browser-download',
        browser: detectBrowser(),
        download: {
          id: item.id,
          filename: item.filename,
          state: item.state,
          startTime: item.startTime,
          endTime: item.endTime,
          totalBytes: item.totalBytes,
          mime: item.mime
        }
      });
    } catch (error) {
      nativePort = null;
      console.warn('Could not send download event to File Hub:', error);
    }
  });
});
