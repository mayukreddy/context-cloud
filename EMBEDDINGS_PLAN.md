# Context Cloud: OpenAI Embedding Upgrade Plan

## Goal
Enable the extension to suggest the most contextually relevant snippets (not just recents) using OpenAI embeddings, while keeping everything local, private, fast, and world-class in UX.

---

## 1. When to Generate Embeddings
- **Always On Save:** When a new snippet is captured, generate and store its embedding immediately, before the snippet is considered "active" in the system.
- **No Migration:** There is no migration step. All snippets in the system will always have embeddings. If embedding fails (e.g., API quota), the snippet is not stored or is retried automatically in the background until successful.

## 2. Where to Store Embeddings
- Store the embedding vector alongside each snippet in IndexedDB (encrypted, just like the snippet text).

## 3. When to Use Embeddings
- **On Hotkey:** When the user presses the hotkey, generate an embedding for the current textbox context.
- **Similarity Search:** Compare the context embedding to all stored snippet embeddings using cosine similarity.
- **Threshold:** Only show snippets above a similarity threshold (e.g., 0.6). If none, fall back to recents.
- **Speed:** Embedding generation and search must be fast (sub-second typical). Show a loading indicator if needed, but optimize for instant results.

## 4. How to Call OpenAI
- Use the OpenAI `/v1/embeddings` endpoint with the configured model (e.g., `text-embedding-3-small`).
- Use the API key from `config.js`.
- Use batching and rate limiting as needed for performance and reliability.

## 5. Privacy & Security
- Never send the actual snippet text or context to any server except OpenAI for embedding.
- All embeddings and snippets remain encrypted and local.
- No analytics, tracking, or external calls beyond OpenAI embedding API.

## 6. UI/UX
- Show a fast, modern loading indicator when generating embeddings or searching.
- If OpenAI fails (quota, network), show a clear error and do not store the snippet. Optionally, queue for retry in the background.
- Always prioritize speed, clarity, and minimal user friction.

## 7. Error Handling
- Handle API errors gracefully (quota, network, etc.).
- If embedding fails, do not store the snippet or queue for retry. Never show a snippet without an embedding.
- Always inform the user if a snippet could not be saved due to embedding failure.

---

_Last updated: [assistant]_ 