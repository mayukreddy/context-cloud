console.log('Context Cloud content script loaded.');

const DEDUPLICATION_WINDOW_MS = 15000; // 15 seconds
const recentSnippets = [];

// Helper to get selected text
function getSelectedText() {
  return window.getSelection().toString();
}

function getPageUrl() {
  return window.location.href;
}

function isDuplicate(text) {
  const now = Date.now();
  // Remove old entries
  for (let i = recentSnippets.length - 1; i >= 0; i--) {
    if (now - recentSnippets[i].time > DEDUPLICATION_WINDOW_MS) {
      recentSnippets.splice(i, 1);
    }
  }
  // Check for duplicate
  return recentSnippets.some(s => s.text === text);
}

function sendCapture(text) {
  console.log('sendCapture called with text:', text.substring(0, 50) + '...');
  const now = Date.now();
  if (isDuplicate(text)) {
    console.log('Duplicate detected, skipping');
    return;
  }
  recentSnippets.push({ text, time: now });

  try {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      chrome.storage.local.get(['enableCapture'], (result) => {
        if (chrome.runtime && chrome.runtime.lastError) {
          console.error('chrome.storage.local.get error:', String(chrome.runtime.lastError.message || chrome.runtime.lastError));
          return;
        }
        console.log('enableCapture setting:', result.enableCapture);
        if (result && result.enableCapture !== false) { // Default to true if not set
          console.log('Capture is enabled, sending snippet to background');
          try {
            if (chrome.runtime && chrome.runtime.sendMessage) {
              chrome.runtime.sendMessage({
                type: 'ADD_SNIPPET',
                snippet: {
                  text,
                  timestamp: now,
                  sourceUrl: getPageUrl()
                }
              }, (response) => {
                if (chrome.runtime && chrome.runtime.lastError) {
                  console.error('Failed to send message to background:', String(chrome.runtime.lastError.message || chrome.runtime.lastError));
                } else {
                  console.log('Snippet sent to background successfully:', response);
                }
              });
            } else {
              console.error('chrome.runtime.sendMessage is not available.');
            }
          } catch (e) {
            console.error('Failed to send message to background:', String(e && e.message ? e.message : e));
          }
        } else {
          console.log('Capture is disabled, not sending snippet');
        }
      });
    } else {
      console.error('chrome.storage.local is not available in this context.');
    }
  } catch (e) {
    console.error('Failed to send message to background:', String(e && e.message ? e.message : e));
  }
}

// Create snippet selection UI
function createSnippetSelector(snippets, activeElement) {
  // Remove existing selector if any
  const existingSelector = document.getElementById('context-cloud-selector');
  if (existingSelector) {
    existingSelector.remove();
  }

  const selector = document.createElement('div');
  selector.id = 'context-cloud-selector';
  selector.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: white;
    border: 2px solid #007acc;
    border-radius: 8px;
    padding: 16px;
    max-width: 500px;
    max-height: 400px;
    overflow-y: auto;
    z-index: 10000;
    box-shadow: 0 4px 20px rgba(0,0,0,0.3);
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  `;

  const header = document.createElement('div');
  header.style.cssText = `
    font-weight: bold;
    margin-bottom: 12px;
    color: #007acc;
    font-size: 16px;
  `;
  header.textContent = `Select a snippet (${snippets.length} found)`;
  selector.appendChild(header);

  snippets.forEach((snippet, index) => {
    const snippetDiv = document.createElement('div');
    snippetDiv.style.cssText = `
      border: 1px solid #e0e0e0;
      border-radius: 4px;
      padding: 8px;
      margin-bottom: 8px;
      cursor: pointer;
      transition: background-color 0.2s;
    `;
    
    snippetDiv.onmouseover = () => {
      snippetDiv.style.backgroundColor = '#f5f5f5';
    };
    
    snippetDiv.onmouseout = () => {
      snippetDiv.style.backgroundColor = 'white';
    };

    const similarityText = snippet.similarity > 0 ? ` (${Math.round(snippet.similarity * 100)}% match)` : ' (recent snippet)';
    const sourceText = snippet.sourceUrl ? `\nFrom: ${new URL(snippet.sourceUrl).hostname}` : '';
    
    snippetDiv.innerHTML = `
      <div style="font-weight: 500; margin-bottom: 4px;">
        ${index + 1}. ${snippet.text.substring(0, 100)}${snippet.text.length > 100 ? '...' : ''}
        <span style="color: #666; font-size: 12px;">${similarityText}</span>
      </div>
      <div style="color: #999; font-size: 11px;">${sourceText}</div>
    `;

    snippetDiv.onclick = (e) => {
      e.preventDefault();
      e.stopPropagation();
      console.log('Snippet selected:', snippet.text.substring(0, 50) + '...');
      console.log('Active element:', activeElement);
      console.log('Active element type:', activeElement.tagName);
      console.log('Is content editable:', activeElement.isContentEditable);
      
      try {
        injectText(snippet.text, activeElement);
        console.log('Text injection completed');
      } catch (error) {
        console.error('Failed to inject text:', error);
      }
      
      selector.remove();
    };

    selector.appendChild(snippetDiv);
  });

  // Add cancel button
  const cancelDiv = document.createElement('div');
  cancelDiv.style.cssText = `
    text-align: center;
    margin-top: 12px;
    padding: 8px;
    border-top: 1px solid #e0e0e0;
    color: #666;
    cursor: pointer;
  `;
  cancelDiv.textContent = 'Cancel (Esc)';
  cancelDiv.onclick = () => selector.remove();
  selector.appendChild(cancelDiv);

  // Add escape key handler
  const escapeHandler = (e) => {
    if (e.key === 'Escape') {
      selector.remove();
      document.removeEventListener('keydown', escapeHandler);
    }
  };
  document.addEventListener('keydown', escapeHandler);

  document.body.appendChild(selector);
  return selector;
}

// Inject text into the active element
function injectText(text, activeElement) {
  try {
    console.log('[ContextCloud] Injecting text:', text.substring(0, 50) + '...');
    console.log('[ContextCloud] Target element:', activeElement);
    if (!activeElement) {
      alert('No active element to inject into!');
      return;
    }
    // Remove selector UI if present
    const selector = document.getElementById('context-cloud-selector');
    if (selector) selector.remove();
    // Focus the element before injection
    activeElement.focus();
    // Try to set selection to end if possible
    if (activeElement.setSelectionRange && typeof activeElement.value === 'string') {
      activeElement.setSelectionRange(activeElement.value.length, activeElement.value.length);
    }
    if (activeElement.isContentEditable) {
      console.log('[ContextCloud] Using contentEditable injection');
      const selection = window.getSelection();
      if (selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        range.deleteContents();
        range.insertNode(document.createTextNode(text));
        range.collapse(false);
        selection.removeAllRanges();
        selection.addRange(range);
      } else {
        document.execCommand('insertText', false, text);
      }
    } else if (typeof activeElement.value === 'string') {
      console.log('[ContextCloud] Using input/textarea injection');
      const start = activeElement.selectionStart || 0;
      const end = activeElement.selectionEnd || 0;
      const value = activeElement.value || '';
      const newValue = value.slice(0, start) + text + value.slice(end);
      activeElement.value = newValue;
      const newCursorPosition = start + text.length;
      activeElement.selectionStart = newCursorPosition;
      activeElement.selectionEnd = newCursorPosition;
    } else {
      alert('Cannot inject into this element type.');
      return;
    }
    // Trigger input/change events
    activeElement.dispatchEvent(new Event('input', { bubbles: true }));
    activeElement.dispatchEvent(new Event('change', { bubbles: true }));
    activeElement.focus();
    console.log('[ContextCloud] Text injection successful');
    showToast('Snippet inserted!');
  } catch (error) {
    console.error('[ContextCloud] Error during text injection:', error);
    alert('Failed to inject snippet: ' + error.message);
  }
}

function showToast(msg) {
  let toast = document.createElement('div');
  toast.textContent = msg;
  toast.style.position = 'fixed';
  toast.style.bottom = '24px';
  toast.style.left = '50%';
  toast.style.transform = 'translateX(-50%)';
  toast.style.background = '#4f8cff';
  toast.style.color = '#fff';
  toast.style.padding = '8px 18px';
  toast.style.borderRadius = '6px';
  toast.style.fontSize = '1em';
  toast.style.boxShadow = '0 2px 8px rgba(0,0,0,0.10)';
  toast.style.zIndex = 9999;
  toast.style.opacity = 0.98;
  document.body.appendChild(toast);
  setTimeout(() => { toast.remove(); }, 1600);
}

// Listen for copy events
['copy', 'mouseup'].forEach(evt => {
  document.addEventListener(evt, () => {
    const sel = getSelectedText();
    console.log('Event triggered:', evt, 'Selected text length:', sel ? sel.length : 0);
    if (sel && sel.trim().length > 0) {
      console.log('Valid selection found, calling sendCapture');
      sendCapture(sel);
    }
  });
});

console.log('Event listeners attached for copy and mouseup events');

// Listen for Ctrl+Shift+. hotkey in textboxes
window.addEventListener('keydown', async (event) => {
  if (event.ctrlKey && event.shiftKey && event.key === '.') {
    console.log('Hotkey pressed!');
    const active = document.activeElement;
    console.log('Active element:', active);
    
    if (active && (active.tagName === 'TEXTAREA' || (active.tagName === 'INPUT' && active.type === 'text') || active.isContentEditable)) {
      // Get context from the current textbox
      let context = '';
      if (active.isContentEditable) {
        context = active.textContent || active.innerText || '';
      } else {
        context = active.value || '';
      }
      
      // Get the last 200 characters as context (around the cursor)
      const cursorPosition = active.selectionStart || 0;
      const start = Math.max(0, cursorPosition - 100);
      const end = Math.min(context.length, cursorPosition + 100);
      context = context.substring(start, end);
      
      console.log('Context for smart search:', context);
      
      // Show loading indicator
      const loadingDiv = document.createElement('div');
      loadingDiv.id = 'context-cloud-loading';
      loadingDiv.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: white;
        border: 2px solid #007acc;
        border-radius: 8px;
        padding: 20px;
        z-index: 10000;
        box-shadow: 0 4px 20px rgba(0,0,0,0.3);
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        text-align: center;
      `;
      loadingDiv.innerHTML = `
        <div style="margin-bottom: 12px;">🤔</div>
        <div style="font-weight: 500; color: #007acc;">Finding relevant snippets...</div>
        <div style="font-size: 12px; color: #666; margin-top: 8px;">This may take a few seconds</div>
      `;
      document.body.appendChild(loadingDiv);
      
      try {
        if (chrome.runtime && chrome.runtime.sendMessage) {
          chrome.runtime.sendMessage({ 
            type: 'GET_SMART_SNIPPETS',
            context: context
          }, (response) => {
            // Remove loading indicator
            loadingDiv.remove();
            
            if (chrome.runtime && chrome.runtime.lastError) {
              console.error('Failed to get smart snippets:', String(chrome.runtime.lastError.message || chrome.runtime.lastError));
              return;
            }
            
            const snippets = response?.snippets || [];
            console.log('Smart snippets retrieved:', snippets);
            
            if (snippets.length === 0) {
              console.log('No snippets found');
              return;
            }
            
            if (snippets.length === 1) {
              // If only one snippet, inject it directly
              injectText(snippets[0].text, active);
            } else {
              // Show selection UI for multiple snippets
              createSnippetSelector(snippets, active);
            }
          });
        } else {
          console.error('chrome.runtime.sendMessage is not available.');
          loadingDiv.remove();
        }
      } catch (e) {
        console.error('Failed to get smart snippets:', String(e && e.message ? e.message : e));
        loadingDiv.remove();
      }
      event.preventDefault();
    } else {
      console.log('Hotkey pressed, but not in a supported field.');
    }
  }
}); 