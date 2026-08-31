"""
DocMind AI - Python 3.10 Local NLP Engine
Provides standalone, pure-Python extractive summarization, keyword extraction,
reading time calculation, and document similarity analysis.
"""

import sys
import re
import math
import json
from collections import Counter

STOPWORDS = {
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
}

def tokenize(text: str) -> list[str]:
    """Tokenize text into lowercase words excluding stopwords and numbers."""
    if not text:
        return []
    words = re.findall(r'\b[a-zA-Z]{3,}\b', text.lower())
    return [w for w in words if w not in STOPWORDS]

def split_sentences(text: str) -> list[str]:
    """Split text into sentences."""
    if not text:
        return []
    sentences = re.split(r'(?<=[.!?])\s+', text.strip())
    return [s.strip() for s in sentences if len(s.strip()) > 15]

def generate_summary(text: str, max_sentences: int = 3) -> str:
    """Generate extractive document summary using word weighting."""
    if not text or not text.strip():
        return "No text content available."

    sentences = split_sentences(text)
    if len(sentences) <= max_sentences:
        return " ".join(sentences)

    words = tokenize(text)
    if not words:
        return " ".join(sentences[:max_sentences])

    word_freq = Counter(words)
    max_freq = max(word_freq.values())

    # Normalize frequencies
    norm_freq = {word: count / max_freq for word, count in word_freq.items()}

    scored_sentences = []
    for idx, sentence in enumerate(sentences):
        sent_words = tokenize(sentence)
        score = sum(norm_freq.get(w, 0) for w in sent_words)
        length_norm = (len(sent_words) ** 0.7) if sent_words else 1.0
        final_score = score / length_norm

        if idx == 0:
            final_score *= 1.35
        elif idx == 1:
            final_score *= 1.15

        scored_sentences.append((final_score, idx, sentence))

    scored_sentences.sort(key=lambda x: x[0], reverse=True)
    selected = sorted(scored_sentences[:max_sentences], key=lambda x: x[1])

    return " ".join(item[2] for item in selected)

def extract_keywords(text: str, top_n: int = 8) -> list[dict]:
    """Extract top TF keywords."""
    words = tokenize(text)
    if not words:
        return []

    counts = Counter(words).most_common(top_n)
    max_count = counts[0][1] if counts else 1

    return [
        {"keyword": word, "score": round(count / max_count, 2)}
        for word, count in counts
    ]

def calculate_reading_time(text: str) -> int:
    """Calculate reading time in minutes (200 WPM)."""
    if not text:
        return 1
    words = text.strip().split()
    minutes = math.ceil(len(words) / 200)
    return max(1, minutes)

def cosine_similarity(freq1: dict, freq2: dict) -> float:
    """Calculate cosine similarity between word frequency dicts."""
    all_keys = set(freq1.keys()).union(set(freq2.keys()))
    if not all_keys:
        return 0.0

    dot_product = sum(freq1.get(k, 0) * freq2.get(k, 0) for k in all_keys)
    mag1 = math.sqrt(sum(v ** 2 for v in freq1.values()))
    mag2 = math.sqrt(sum(v ** 2 for v in freq2.values()))

    if mag1 == 0 or mag2 == 0:
        return 0.0

    return dot_product / (mag1 * mag2)

if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "--json":
        try:
            input_data = json.load(sys.stdin)
            text = input_data.get("text", "")
            summary = generate_summary(text)
            keywords = extract_keywords(text)
            reading_time = calculate_reading_time(text)
            print(json.dumps({
                "summary": summary,
                "keywords": keywords,
                "reading_time": reading_time
            }))
        except Exception as e:
            print(json.dumps({"error": str(e)}))
    else:
        sample_text = "DocMind AI is an enterprise document management platform built with Node.js and Python. It provides document search, keyword extraction, and extractive summarization."
        print("Summary:", generate_summary(sample_text))
        print("Keywords:", extract_keywords(sample_text))
        print("Reading Time:", calculate_reading_time(sample_text))
