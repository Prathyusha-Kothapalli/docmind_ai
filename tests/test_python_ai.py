"""
Python 3.10 Pytest Suite for DocMind AI NLP Engine
"""
import pytest
from python_services.ai_engine import generate_summary, extract_keywords, calculate_reading_time, cosine_similarity

def test_generate_summary():
    text = "DocMind AI is an enterprise document platform. It processes PDF and DOCX files. Local AI extracts summaries without third-party services."
    summary = generate_summary(text, max_sentences=1)
    assert isinstance(summary, str)
    assert len(summary) > 0

def test_extract_keywords():
    text = "Machine learning algorithms learn patterns from training data automatically."
    keywords = extract_keywords(text, top_n=3)
    assert isinstance(keywords, list)
    assert len(keywords) > 0
    assert "keyword" in keywords[0]

def test_calculate_reading_time():
    text = " ".join(["word"] * 450)
    minutes = calculate_reading_time(text)
    assert minutes == 3

def test_cosine_similarity():
    freq1 = {"ai": 3, "data": 2}
    freq2 = {"ai": 2, "data": 1}
    sim = cosine_similarity(freq1, freq2)
    assert sim > 0.9
