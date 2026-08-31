const { generateSummary, extractKeywords, calculateReadingTime, cosineSimilarity } = require('../src/services/aiService');

describe('Local AI & NLP Engine', () => {
  const sampleText = `
    DocMind AI is a local enterprise document management platform built with Node.js and Python.
    It provides intelligent full-text search, local extractive AI summarization, and keyword extraction.
    All document processing runs 100% locally on server hardware without requiring third-party cloud API keys or external services.
    Security features include role-based access control, JWT session authentication, and database encryption.
  `;

  it('should generate an extractive document summary', () => {
    const summary = generateSummary(sampleText, 2);
    expect(summary).toBeDefined();
    expect(typeof summary).toBe('string');
    expect(summary.length).toBeGreaterThan(20);
  });

  it('should extract top TF-IDF keywords', () => {
    const keywords = extractKeywords(sampleText, 5);
    expect(keywords).toBeDefined();
    expect(Array.isArray(keywords)).toBe(true);
    expect(keywords.length).toBeGreaterThan(0);
    expect(keywords[0].keyword).toBeDefined();
    expect(keywords[0].score).toBeDefined();
  });

  it('should estimate reading time in minutes', () => {
    const minutes = calculateReadingTime(sampleText);
    expect(minutes).toBeGreaterThanOrEqual(1);
  });

  it('should calculate cosine similarity between document vectors', () => {
    const vecA = { 'document': 3, 'management': 2, 'ai': 4 };
    const vecB = { 'document': 2, 'management': 2, 'python': 1 };
    const sim = cosineSimilarity(vecA, vecB);
    expect(sim).toBeGreaterThan(0);
    expect(sim).toBeLessThanOrEqual(1);
  });
});
