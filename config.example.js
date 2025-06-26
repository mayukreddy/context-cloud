// Example configuration file for Context Cloud
// Copy this file to config.js and add your OpenAI API key

// IMPORTANT: Never commit your actual API key to version control!
// This file shows the structure - your real config.js should be kept private

const CONFIG = {
  // Option 1: Direct API key (for development only)
  OPENAI_API_KEY: '', // Add your OpenAI API key here

  // Option 2: Use environment variable (more secure)
  // OPENAI_API_KEY: process.env.OPENAI_API_KEY || '',

  // Option 3: Load from secure storage (most secure)
  // OPENAI_API_KEY: await getSecureAPIKey(),

  EMBEDDINGS_MODEL: 'text-embedding-3-small',
  EMBEDDINGS_BATCH_SIZE: 5,
  SIMILARITY_THRESHOLD: 0.1,
  MAX_SNIPPETS_TO_CONSIDER: 20,
  SHOW_MULTIPLE_CHOICES: true,
  MAX_CHOICES_TO_SHOW: 3,
  MIN_REQUEST_INTERVAL: 2000
};

// Make config available globally
self.CONFIG = CONFIG; 