"""
LLM integration layer.

ONLY backend: a LOCAL model served by Ollama (http://localhost:11434).
Chat replies are generated entirely on your own machine — no data leaves
your computer, no API key, no per-message cost, no internet required
after the model is downloaded once via `ollama pull`.

There is intentionally NO OpenAI or HuggingFace fallback in this file —
if Ollama is unreachable, generate_reply() raises, and the caller
(chat.py) falls back to the rule-based responses in fallback.py instead
of silently reaching for a hosted API.

Setup (one-time):
    1. Install Ollama: https://ollama.com/download
    2. Pull a model:   ollama pull llama3.2
    3. Make sure the Ollama service is running (it starts automatically
       on most installs; otherwise run `ollama serve`).

To use a different/larger model, set OLLAMA_MODEL in backend/.env after
pulling it with `ollama pull <model-name>`.
"""
import os

OLLAMA_HOST  = os.getenv("OLLAMA_HOST", "http://localhost:11434")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "llama3.2")


def _call_ollama(prompt: str, system: str = "", max_tokens: int = 512) -> str:
    import requests

    messages = []
    if system:
        messages.append({"role": "system", "content": system})
    messages.append({"role": "user", "content": prompt})

    resp = requests.post(
        f"{OLLAMA_HOST}/api/chat",
        json={
            "model": OLLAMA_MODEL,
            "messages": messages,
            "stream": False,
            "options": {"temperature": 0.7, "num_predict": max_tokens},
        },
        timeout=60,  # local generation can be slower than a hosted API,
                     # especially on CPU-only machines — give it room
    )
    resp.raise_for_status()
    data = resp.json()
    return data.get("message", {}).get("content", "").strip()


def _ollama_is_reachable() -> bool:
    """Quick check whether the local Ollama server is up before trying to
    generate — avoids a slow timeout on every request when it's simply
    not running, so the caller can fall through to fallback.py faster."""
    import requests

    try:
        resp = requests.get(f"{OLLAMA_HOST}/api/tags", timeout=2)
        return resp.status_code == 200
    except Exception:
        return False


def generate_reply(
    prompt: str,
    system_prompt: str = "You are BookBot, a helpful assistant for an online bookstore called BookHaven.",
    max_tokens: int = 400,
) -> str:
    """
    Generate a reply using the local Ollama model. Raises RuntimeError if
    Ollama isn't reachable or the call fails — at which point the caller
    (chat.py) falls back to the rule-based responses in fallback.py.
    """
    if not _ollama_is_reachable():
        raise RuntimeError(
            f"Ollama is not reachable at {OLLAMA_HOST}. "
            "Install it from https://ollama.com, then run "
            "`ollama pull llama3.2` and make sure the service is running."
        )

    return _call_ollama(prompt, system=system_prompt, max_tokens=max_tokens)


def is_llm_available() -> bool:
    """Check whether the local Ollama backend is currently usable."""
    return _ollama_is_reachable()