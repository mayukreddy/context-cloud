console.log('Context Cloud popup script running.');

let allSnippets = [];

// Render the popup UI including Enable Capture
async function renderPopup() {
  // Set enableCapture state with default to true
  chrome.storage.local.get(['enableCapture'], ({ enableCapture }) => {
    console.log('Current enableCapture setting:', enableCapture);
    // Default to true if not set
    if (enableCapture === undefined) {
      console.log('Setting enableCapture to true (default)');
      chrome.storage.local.set({ enableCapture: true });
      document.getElementById('enable-capture').checked = true;
    } else {
      document.getElementById('enable-capture').checked = !!enableCapture;
    }
  });
  renderSnippets();
}

document.getElementById('enable-capture').addEventListener('change', (e) => {
  console.log('Enable capture toggled to:', e.target.checked);
  chrome.storage.local.set({ enableCapture: e.target.checked });
});

document.getElementById('erase-memory').addEventListener('click', () => {
  if (confirm('Erase all snippets? This cannot be undone.')) {
    chrome.runtime.sendMessage({ type: 'DELETE_ALL_SNIPPETS' }, () => {
      renderSnippets();
    });
  }
});

document.getElementById('search-bar').addEventListener('input', (e) => {
  renderSnippets(e.target.value);
});

// Helper to request all snippets from background
function fetchSnippets() {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage({ type: 'GET_ALL_SNIPPETS' }, (response) => {
      resolve(response?.snippets || []);
    });
  });
}

// Helper to request snippet deletion
function deleteSnippet(id) {
  chrome.runtime.sendMessage({ type: 'DELETE_SNIPPET', id }, () => {
    renderSnippets();
  });
}

// Helper to copy snippet text
function copySnippet(text) {
  navigator.clipboard.writeText(text).then(() => {
    showToast('Snippet copied!');
  });
}

// Show toast notification
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

// Render snippets in the popup
async function renderSnippets(search = '') {
  const listDiv = document.getElementById('snippets-list');
  const emptyState = document.getElementById('empty-state');
  listDiv.innerHTML = '<p style="color:#b0b8c1;text-align:center;">Loading...</p>';
  allSnippets = await fetchSnippets();
  let snippets = allSnippets;
  if (search.trim()) {
    const q = search.trim().toLowerCase();
    snippets = allSnippets.filter(s => s.text.toLowerCase().includes(q) || (s.sourceUrl && s.sourceUrl.toLowerCase().includes(q)));
  }
  if (snippets.length === 0) {
    listDiv.innerHTML = '';
    emptyState.style.display = '';
    return;
  }
  emptyState.style.display = 'none';
  let html = '';
  for (const snip of snippets) {
    const url = snip.sourceUrl ? new URL(snip.sourceUrl) : null;
    html += `<div class="snippet-card">
      <div class="snippet-meta">
        <span class="snippet-source">${url ? url.hostname.replace('www.', '') : 'unknown'}</span>
        <span>${new Date(snip.timestamp).toLocaleString()}</span>
      </div>
      <div class="snippet-text" title="Click to expand/collapse">${snip.text.length > 180 ? snip.text.slice(0, 180) + '…' : snip.text}</div>
      <div class="snippet-actions">
        <button class="snippet-action-btn" title="Copy" data-copy="${snip.id}">📋</button>
        <button class="snippet-action-btn" title="Delete" data-delete="${snip.id}">🗑️</button>
      </div>
    </div>`;
  }
  listDiv.innerHTML = html;
  // Add delete/copy handlers
  listDiv.querySelectorAll('button[data-delete]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      deleteSnippet(Number(btn.getAttribute('data-delete')));
    });
  });
  listDiv.querySelectorAll('button[data-copy]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = Number(btn.getAttribute('data-copy'));
      const snip = allSnippets.find(s => s.id === id);
      if (snip) copySnippet(snip.text);
    });
  });
  // Expand/collapse snippet text
  listDiv.querySelectorAll('.snippet-text').forEach(div => {
    div.addEventListener('click', () => {
      if (div.style.maxHeight && div.style.maxHeight !== '4.5em') {
        div.style.maxHeight = '4.5em';
        div.style.overflow = 'hidden';
      } else {
        div.style.maxHeight = 'none';
        div.style.overflow = 'auto';
      }
    });
  });
}

document.addEventListener('DOMContentLoaded', renderPopup); 