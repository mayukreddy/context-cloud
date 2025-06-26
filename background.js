importScripts('dexie.min.js', 'config.js', 'embeddings.js', 'storage.js');

console.log('Context Cloud background service worker running.');

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Background received message:', message);
  console.log('Message sender:', sender);
  
  if (message.type === 'ADD_SNIPPET') {
    console.log('Processing ADD_SNIPPET message');
    addSnippet(message.snippet)
      .then((result) => {
        console.log('Snippet stored successfully:', result);
        sendResponse({ success: true, id: result });
      })
      .catch((err) => {
        console.error('Failed to store snippet:', err);
        sendResponse({ success: false, error: String(err) });
      });
    return true;
  }
  
  if (message.type === 'GET_ALL_SNIPPETS') {
    console.log('Processing GET_ALL_SNIPPETS message');
    getAllSnippets().then(snippets => {
      console.log('Retrieved snippets:', snippets.length);
      sendResponse({ snippets });
    }).catch((err) => {
      console.error('Failed to get snippets:', err);
      sendResponse({ snippets: [], error: String(err) });
    });
    return true;
  }
  
  if (message.type === 'GET_SMART_SNIPPETS') {
    console.log('Processing GET_SMART_SNIPPETS message');
    const { context, maxResults = CONFIG.MAX_CHOICES_TO_SHOW } = message;
    (async () => {
      try {
        // Get all snippets with embeddings
        const snippets = await getAllSnippets();
        // Generate embedding for the context
        const contextEmbedding = await self.embeddingsService.generateEmbedding(context);
        console.log('[ContextCloud] Context embedding:', contextEmbedding);
        // Compute similarity
        const scored = snippets.map(snippet => {
          console.log('[ContextCloud] Snippet:', snippet.text.substring(0, 50), 'Embedding:', snippet.embedding);
          const similarity = self.embeddingsService.calculateSimilarity(contextEmbedding, snippet.embedding);
          console.log('[ContextCloud] Similarity:', similarity, 'for snippet:', snippet.text.substring(0, 50));
          return { ...snippet, similarity };
        });
        // Filter and sort
        const filtered = scored.filter(s => s.similarity >= CONFIG.SIMILARITY_THRESHOLD)
                               .sort((a, b) => b.similarity - a.similarity)
                               .slice(0, maxResults);
        if (filtered.length > 0) {
          sendResponse({ snippets: filtered });
        } else {
          // Fallback to recents
          const recents = (await getRecentSnippets(maxResults)).map(s => ({ ...s, similarity: 0 }));
          sendResponse({ snippets: recents });
        }
      } catch (err) {
        console.error('[ContextCloud] Failed to get smart snippets:', err);
        // Fallback to recents
        const recents = (await getRecentSnippets(maxResults)).map(s => ({ ...s, similarity: 0 }));
        sendResponse({ snippets: recents });
      }
    })();
    return true;
  }
  
  if (message.type === 'DELETE_SNIPPET') {
    console.log('Processing DELETE_SNIPPET message');
    deleteSnippet(message.id).then(() => {
      console.log('Snippet deleted successfully');
      sendResponse({ success: true });
    }).catch((err) => {
      console.error('Failed to delete snippet:', err);
      sendResponse({ success: false, error: String(err) });
    });
    return true;
  }
  
  if (message.type === 'DELETE_ALL_SNIPPETS') {
    console.log('Processing DELETE_ALL_SNIPPETS message');
    // Clear all snippets from storage
    self.db.snippets.clear().then(() => {
      console.log('All snippets cleared successfully');
      sendResponse({ success: true });
    }).catch((err) => {
      console.error('Failed to erase all snippets:', err);
      sendResponse({ success: false, error: String(err) });
    });
    return true;
  }
  
  console.log('Unknown message type:', message.type);
}); 