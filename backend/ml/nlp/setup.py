"""
One-time NLP setup: download NLTK corpora and spaCy model.
Run once before using any NLP modules:
    python -m ml.nlp.setup
"""
import subprocess
import sys


def setup_nltk():
    import nltk
    corpora = ["punkt", "stopwords", "vader_lexicon", "averaged_perceptron_tagger", "wordnet"]
    for corpus in corpora:
        print(f"  Downloading NLTK corpus: {corpus}")
        nltk.download(corpus, quiet=True)
    print("  ✅ NLTK corpora ready")


def setup_spacy():
    try:
        import spacy
        spacy.load("en_core_web_sm")
        print("  ✅ spaCy model already installed")
    except OSError:
        print("  Downloading spaCy model: en_core_web_sm")
        subprocess.run(
            [sys.executable, "-m", "spacy", "download", "en_core_web_sm"],
            check=True,
        )
        print("  ✅ spaCy model ready")


if __name__ == "__main__":
    print("Setting up NLP dependencies…")
    setup_nltk()
    setup_spacy()
    print("All NLP setup complete.")