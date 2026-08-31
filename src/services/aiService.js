/**
 * Local AI & NLP Engine for DocMind AI
 * Implements extractive summarization, keyword extraction, reading time estimation,
 * TF-IDF vectorization, and cosine similarity matching without external APIs.
 */

// Common English Stopwords
const STOPWORDS = new Set([
  'a', 'about', 'above', 'after', 'again', 'against', 'all', 'am', 'an', 'and', 'any', 'are', 'aren\'t', 'as', 'at',
  'be', 'because', 'been', 'before', 'being', 'below', 'between', 'both', 'but', 'by', 'can', 'cannot', 'could',
  'couldn\'t', 'did', 'didn\'t', 'do', 'does', 'doesn\'t', 'doing', 'don\'t', 'down', 'during', 'each', 'few', 'for',
  'from', 'further', 'had', 'hadn\'t', 'has', 'hasn\'t', 'have', 'haven\'t', 'having', 'he', 'he\'d', 'he\'ll', 'he\'s',
  'her', 'here', 'here\'s', 'hers', 'herself', 'him', 'himself', 'his', 'how', 'how\'s', 'i', 'i\'d', 'i\'ll', 'i\'m',
  'i\'ve', 'if', 'in', 'into', 'is', 'isn\'t', 'it', 'it\'s', 'its', 'itself', 'let\'s', 'me', 'more', 'most', 'mustn\'t',
  'my', 'myself', 'no', 'nor', 'not', 'of', 'off', 'on', 'once', 'only', 'or', 'other', 'ought', 'our', 'ours',
  'ourselves', 'out', 'over', 'own', 'same', 'shan\'t', 'she', 'she\'d', 'she\'ll', 'she\'s', 'should', 'shouldn\'t',
  'so', 'some', 'such', 'than', 'that', 'that\'s', 'the', 'their', 'theirs', 'them', 'themselves', 'then', 'there',
  'there\'s', 'these', 'they', 'they\'d', 'they\'ll', 'they\'re', 'they\'ve', 'this', 'those', 'through', 'to', 'too',
  'under', 'until', 'up', 'very', 'was', 'wasn\'t', 'we', 'we\'d', 'we\'ll', 'we\'re', 'we\'ve', 'were', 'weren\'t',
  'what', 'what\'s', 'when', 'when\'s', 'where', 'where\'s', 'which', 'while', 'who', 'who\'s', 'whom', 'why',
  'why\'s', 'with', 'won\'t', 'would', 'wouldn\'t', 'you', 'you\'d', 'you\'ll', 'you\'re', 'you\'ve', 'your', 'yours',
  'yourself', 'yourselves', 'also', 'will', 'can', 'may', 'must', 'shall', 'using', 'used', 'use', 'new'
]);

/**
 * Tokenize text into normalized words
 */
function tokenize(text) {
  if (!text) return [];
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 2 && !STOPWORDS.has(word) && !/^\d+$/.test(word));
}

/**
 * Split text into sentences
 */
function splitSentences(text) {
  if (!text) return [];
  return text
    .split(/(?<=[.!?])\s+/)
    .map(s => s.trim())
    .filter(s => s.length > 15);
}

/**
 * Calculate term frequencies (TF)
 */
function getWordFrequencies(text) {
  const words = tokenize(text);
  const freq = {};
  words.forEach(w => {
    freq[w] = (freq[w] || 0) + 1;
  });
  return freq;
}

/**
 * Extractive Document Summarizer using TextRank / Sentence Weight Scoring
 * @param {string} text Full document text
 * @param {number} maxSentences Maximum sentences in summary (default: 3)
 */
function generateSummary(text, maxSentences = 3) {
  if (!text || text.trim().length === 0) {
    return 'No content available for summarization.';
  }

  const sentences = splitSentences(text);
  if (sentences.length <= maxSentences) {
    return sentences.join(' ');
  }

  const wordFreq = getWordFrequencies(text);
  const maxFreq = Math.max(...Object.values(wordFreq), 1);

  // Normalize term frequencies
  for (const word in wordFreq) {
    wordFreq[word] = wordFreq[word] / maxFreq;
  }

  // Score sentences based on word frequencies and positional bias
  const sentenceScores = sentences.map((sentence, index) => {
    const words = tokenize(sentence);
    let score = 0;
    words.forEach(w => {
      score += wordFreq[w] || 0;
    });

    // Length normalization
    const lengthNorm = Math.pow(words.length, 0.7) || 1;
    score = score / lengthNorm;

    // Position boost (first 2 sentences often contain key points)
    if (index === 0) score *= 1.35;
    else if (index === 1) score *= 1.15;

    return { sentence, score, index };
  });

  // Sort by score descending and take top N
  const topSentences = sentenceScores
    .sort((a, b) => b.score - a.score)
    .slice(0, maxSentences)
    .sort((a, b) => a.index - b.index);

  return topSentences.map(item => item.sentence).join(' ');
}

/**
 * Extract Top Keywords with TF Scores
 * @param {string} text 
 * @param {number} topN 
 */
function extractKeywords(text, topN = 8) {
  if (!text) return [];

  const wordFreq = getWordFrequencies(text);
  const sortedWords = Object.entries(wordFreq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, topN);

  const maxCount = sortedWords[0] ? sortedWords[0][1] : 1;

  return sortedWords.map(([keyword, count]) => ({
    keyword,
    score: parseFloat((count / maxCount).toFixed(2))
  }));
}

/**
 * Estimate Reading Time in Minutes
 * Average reading speed: 200 words per minute
 */
function calculateReadingTime(text) {
  if (!text) return 1;
  const wordCount = text.trim().split(/\s+/).length;
  const minutes = Math.ceil(wordCount / 200);
  return Math.max(1, minutes);
}

/**
 * Cosine Similarity between two TF-IDF word frequency vectors
 */
function cosineSimilarity(freqA, freqB) {
  const allWords = new Set([...Object.keys(freqA), ...Object.keys(freqB)]);
  let dotProduct = 0;
  let magA = 0;
  let magB = 0;

  allWords.forEach(word => {
    const valA = freqA[word] || 0;
    const valB = freqB[word] || 0;
    dotProduct += valA * valB;
    magA += valA * valA;
    magB += valB * valB;
  });

  if (magA === 0 || magB === 0) return 0;
  return dotProduct / (Math.sqrt(magA) * Math.sqrt(magB));
}

/**
 * Find Similar Documents for a target document
 * @param {Object} targetDoc { id, content_text, title }
 * @param {Array} allDocs Array of documents
 * @param {number} limit Maximum matches to return
 */
function findSimilarDocuments(targetDoc, allDocs, limit = 3) {
  if (!targetDoc || !allDocs || allDocs.length === 0) return [];

  const targetFreq = getWordFrequencies((targetDoc.title + ' ' + (targetDoc.content_text || '')).toLowerCase());

  const similarities = allDocs
    .filter(doc => doc.id !== targetDoc.id)
    .map(doc => {
      const docFreq = getWordFrequencies((doc.title + ' ' + (doc.content_text || '')).toLowerCase());
      const similarity = cosineSimilarity(targetFreq, docFreq);
      return {
        id: doc.id,
        title: doc.title,
        original_name: doc.original_name,
        file_type: doc.file_type,
        workspace_id: doc.workspace_id,
        similarityScore: parseFloat((similarity * 100).toFixed(1))
      };
    })
    .filter(item => item.similarityScore > 5.0)
    .sort((a, b) => b.similarityScore - a.similarityScore)
    .slice(0, limit);

  return similarities;
}

module.exports = {
  generateSummary,
  extractKeywords,
  calculateReadingTime,
  cosineSimilarity,
  findSimilarDocuments,
  tokenize,
  getWordFrequencies
};
