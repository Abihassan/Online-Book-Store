"""
Shared rate limiter instance (slowapi).

Imported by main.py (to register the exception handler + middleware) and
by individual router files (to apply @limiter.limit(...) to specific
endpoints). A single shared instance avoids each file creating its own
separate Limiter, which would track limits independently and defeat the
purpose.

Addresses a finding from the security audit: previously there was NO
rate limiting anywhere in this API, meaning /api/auth/login could be
brute-forced with unlimited attempts and /chat/ could be hit by a script
with no limit (relevant since /chat/ now runs a local LLM via Ollama —
unlimited requests would still peg CPU/GPU even with no per-message
dollar cost the way there was when this used a hosted OpenAI API).
"""
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)