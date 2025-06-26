// Copy this to config.js and add your OpenAI API key
const CONFIG = {
  OPENAI_API_KEY: '', // Add your OpenAI API key here
  EMBEDDINGS_MODEL: 'text-embedding-3-small',
  EMBEDDINGS_BATCH_SIZE: 5,
  SIMILARITY_THRESHOLD: 0.1,
  MAX_SNIPPETS_TO_CONSIDER: 20,
  SHOW_MULTIPLE_CHOICES: true,
  MAX_CHOICES_TO_SHOW: 3,
  MIN_REQUEST_INTERVAL: 2000
};

self.CONFIG = CONFIG; 