// Embeddings service for Context Cloud
class EmbeddingsService {
  constructor() {
    this.apiKey = CONFIG.OPENAI_API_KEY;
    this.model = CONFIG.EMBEDDINGS_MODEL;
    this.requestQueue = [];
    this.isProcessing = false;
    this.lastRequestTime = 0;
    this.minRequestInterval = CONFIG.MIN_REQUEST_INTERVAL; // Use config value
  }

  async generateEmbedding(text) {
    // Add to queue and process
    return new Promise((resolve, reject) => {
      this.requestQueue.push({ text, resolve, reject });
      this.processQueue();
    });
  }

  async processQueue() {
    if (this.isProcessing || this.requestQueue.length === 0) {
      return;
    }

    this.isProcessing = true;

    while (this.requestQueue.length > 0) {
      const { text, resolve, reject } = this.requestQueue.shift();
      
      try {
        // Rate limiting: wait if we made a request too recently
        const now = Date.now();
        const timeSinceLastRequest = now - this.lastRequestTime;
        if (timeSinceLastRequest < this.minRequestInterval) {
          await new Promise(resolve => setTimeout(resolve, this.minRequestInterval - timeSinceLastRequest));
        }

        const embedding = await this.makeOpenAIRequest(text);
        this.lastRequestTime = Date.now();
        resolve(embedding);
      } catch (error) {
        console.error('Failed to generate embedding:', error);
        reject(error);
      }
    }

    this.isProcessing = false;
  }

  async makeOpenAIRequest(text, retries = 3) {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const response = await fetch('https://api.openai.com/v1/embeddings', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            input: text,
            model: this.model
          })
        });

        if (response.status === 429) {
          // Rate limited - wait and retry
          const retryAfter = response.headers.get('Retry-After') || 60;
          console.log(`Rate limited. Waiting ${retryAfter} seconds before retry ${attempt}/${retries}`);
          await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
          continue;
        }

        if (!response.ok) {
          throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        return data.data[0].embedding;
      } catch (error) {
        if (attempt === retries) {
          throw error;
        }
        console.log(`Attempt ${attempt} failed, retrying...`);
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt)); // Exponential backoff
      }
    }
  }

  // Calculate cosine similarity between two embedding vectors
  calculateSimilarity(embedding1, embedding2) {
    if (!embedding1 || !embedding2 || embedding1.length !== embedding2.length) {
      return 0;
    }

    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;

    for (let i = 0; i < embedding1.length; i++) {
      dotProduct += embedding1[i] * embedding2[i];
      norm1 += embedding1[i] * embedding1[i];
      norm2 += embedding2[i] * embedding2[i];
    }

    norm1 = Math.sqrt(norm1);
    norm2 = Math.sqrt(norm2);

    if (norm1 === 0 || norm2 === 0) {
      return 0;
    }

    return dotProduct / (norm1 * norm2);
  }

  // Find the most similar snippets to the given context
  async findSimilarSnippets(context, snippets, maxResults = CONFIG.MAX_CHOICES_TO_SHOW) {
    if (!context || !snippets || snippets.length === 0) {
      return [];
    }

    try {
      // Generate embedding for the context
      const contextEmbedding = await this.generateEmbedding(context);
      
      // Calculate similarity scores for all snippets
      const snippetsWithScores = snippets.map(snippet => {
        const similarity = this.calculateSimilarity(contextEmbedding, snippet.embedding);
        return {
          ...snippet,
          similarity
        };
      });

      // Sort by similarity score (descending) and filter by threshold
      const filteredSnippets = snippetsWithScores
        .filter(snippet => snippet.similarity >= CONFIG.SIMILARITY_THRESHOLD)
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, maxResults);

      // If no snippets meet the threshold, return recent snippets as fallback
      if (filteredSnippets.length === 0) {
        console.log('No snippets meet similarity threshold, using recent snippets as fallback');
        return snippets
          .sort((a, b) => b.timestamp - a.timestamp)
          .slice(0, maxResults)
          .map(snippet => ({ ...snippet, similarity: 0 }));
      }

      return filteredSnippets;
    } catch (error) {
      console.error('Error finding similar snippets:', error);
      // Fallback to recent snippets
      return snippets
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, maxResults)
        .map(snippet => ({ ...snippet, similarity: 0 }));
    }
  }

  // Generate embeddings for multiple texts in batches
  async generateEmbeddingsBatch(texts) {
    const embeddings = [];
    const batchSize = CONFIG.EMBEDDINGS_BATCH_SIZE;

    for (let i = 0; i < texts.length; i += batchSize) {
      const batch = texts.slice(i, i + batchSize);
      const batchEmbeddings = await Promise.all(
        batch.map(text => this.generateEmbedding(text))
      );
      embeddings.push(...batchEmbeddings);
    }

    return embeddings;
  }
}

// Create global instance
const embeddingsService = new EmbeddingsService();
self.embeddingsService = embeddingsService; 