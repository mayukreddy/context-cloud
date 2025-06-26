// Dexie.js should be included in your build or loaded as a dependency
// This is a minimal storage module for encrypted snippets

// Initialize Dexie DB
const db = new Dexie('ContextCloudDB');
self.db = db;
db.version(2).stores({
  snippets: '++id, timestamp, sourceUrl',
});

// Encryption utilities
const ENCRYPTION_KEY_NAME = 'contextcloud-key';

async function getKey() {
  let key = await self.crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(ENCRYPTION_KEY_NAME.padEnd(32, '0')),
    'AES-GCM',
    false,
    ['encrypt', 'decrypt']
  );
  return key;
}

async function encryptData(data) {
  const key = await getKey();
  const iv = self.crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(JSON.stringify(data));
  const ciphertext = await self.crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encoded
  );
  return { iv: Array.from(iv), ciphertext: Array.from(new Uint8Array(ciphertext)) };
}

async function decryptData({ iv, ciphertext }) {
  const key = await getKey();
  const decrypted = await self.crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: new Uint8Array(iv) },
    key,
    new Uint8Array(ciphertext)
  );
  return JSON.parse(new TextDecoder().decode(decrypted));
}

// Snippet CRUD
async function addSnippet(snippet) {
  // Generate embedding before saving
  try {
    if (!snippet.embedding && self.embeddingsService && CONFIG.OPENAI_API_KEY) {
      snippet.embedding = await self.embeddingsService.generateEmbedding(snippet.text);
    }
    if (!snippet.embedding) throw new Error('Embedding generation failed');
    const encrypted = await encryptData(snippet);
    const result = await db.snippets.add({ ...encrypted, timestamp: snippet.timestamp, sourceUrl: snippet.sourceUrl });
    return result;
  } catch (err) {
    console.error('[ContextCloud] Failed to add snippet with embedding:', err);
    throw err;
  }
}

async function getAllSnippets() {
  const all = await db.snippets.toArray();
  return Promise.all(all.map(async (row) => {
    const data = await decryptData({ iv: row.iv, ciphertext: row.ciphertext });
    return { ...data, id: row.id, timestamp: row.timestamp, sourceUrl: row.sourceUrl, embedding: data.embedding };
  }));
}

async function getRecentSnippets(limit = 20) {
  const all = await db.snippets.orderBy('timestamp').reverse().limit(limit).toArray();
  return Promise.all(all.map(async (row) => {
    const data = await decryptData({ iv: row.iv, ciphertext: row.ciphertext });
    return { ...data, id: row.id, timestamp: row.timestamp, sourceUrl: row.sourceUrl, embedding: data.embedding };
  }));
}

async function deleteSnippet(id) {
  return db.snippets.delete(id);
}

// Attach functions to self for service worker/global scope
self.addSnippet = addSnippet;
self.getAllSnippets = getAllSnippets;
self.getRecentSnippets = getRecentSnippets;
self.deleteSnippet = deleteSnippet; 