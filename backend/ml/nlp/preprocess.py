"""
Text preprocessing pipeline using spaCy.
Provides tokenisation, stopword removal, and lemmatisation.
"""
import re
from functools import lru_cache
from typing import List

_nlp = None


def _get_nlp():
    global _nlp
    if _nlp is None:
        import spacy
        try:
            _nlp = spacy.load("en_core_web_sm", disable=["ner", "parser"])
        except OSError:
            from ml.nlp.setup import setup_spacy
            setup_spacy()
            _nlp = spacy.load("en_core_web_sm", disable=["ner", "parser"])
    return _nlp


def clean_text(text: str) -> str:
    """Remove HTML tags, URLs, special chars, and normalise whitespace."""
    if not text:
        return ""
    text = re.sub(r"<[^>]+>", " ", text)          # HTML tags
    text = re.sub(r"http\S+|www\S+", " ", text)    # URLs
    text = re.sub(r"[^a-zA-Z0-9\s.,!?'-]", " ", text)
    text = re.sub(r"\s+", " ", text).strip()
    return text


def tokenise(text: str, remove_stopwords: bool = True, lemmatise: bool = True) -> List[str]:
    """
    Full preprocessing pipeline.
    Returns list of clean tokens.
    """
    nlp = _get_nlp()
    text = clean_text(text)
    doc = nlp(text.lower())
    tokens = []
    for token in doc:
        if token.is_space or token.is_punct:
            continue
        if remove_stopwords and token.is_stop:
            continue
        if len(token.text) < 2:
            continue
        word = token.lemma_ if lemmatise else token.text
        tokens.append(word)
    return tokens


def tokens_to_string(text: str, **kwargs) -> str:
    """Convenience: tokenise then rejoin as a string for TF-IDF pipelines."""
    return " ".join(tokenise(text, **kwargs))


def preprocess_series(texts, **kwargs):
    """Preprocess a list/Series of texts. Returns list of cleaned strings."""
    return [tokens_to_string(t, **kwargs) for t in texts]