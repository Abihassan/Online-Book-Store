/**
 * chatApi.ts
 * FastAPI chatbot + reading session websocket helpers.
 */

import { createClient, FASTAPI_URL } from './api';

// Dedicated client for the chat endpoint with a much longer timeout than
// the default 15s. The backend now generates replies with a local LLM
// (see backend/ml/chatbot/llm.py) rather than a hosted API — on CPU-only
// hardware this can legitimately take well over 15 seconds, especially on
// the first message after the model loads into memory. Using a separate
// client (rather than raising the shared client's timeout globally) keeps
// other FastAPI-backed calls (ML stats, analytics, etc.) failing fast if
// something is actually wrong with them.
const chatClient = createClient(FASTAPI_URL, 90_000);

// ── WebSocket URL ────────────────────────────────────────────────────────────

const FASTAPI_WS = (
  import.meta.env.VITE_FASTAPI_URL ||
  'http://localhost:8000'
)
  .replace('http://', 'ws://')
  .replace('https://', 'wss://');

// ── Chat Types ───────────────────────────────────────────────────────────────

export interface ChatHistoryItem {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatBook {
  id: string;
  title: string;
  author: string;
  price: number;
  coverImage: string;
}

export interface ChatResponse {
  reply: string;
  intent: string;
  books: ChatBook[];
}

// ── Send Chat Message ────────────────────────────────────────────────────────

export async function sendChatMessage(
  message: string,
  userId: string | null,
  history: ChatHistoryItem[] = []
): Promise<ChatResponse> {
  const { data } = await chatClient.post<ChatResponse>(
    '/chat/',
    {
      message,
      userId,
      history,
    }
  );

  return data;
}

// ── Reading Session WebSocket ────────────────────────────────────────────────

export class ReadingSessionWS {
  private ws: WebSocket | null = null;

  private userId: string | null = null;

  private bookId: string | null = null;

  // Connect to websocket
  connect(userId: string, bookId: string): void {
    this.disconnect();

    this.userId = userId;
    this.bookId = bookId;

    this.ws = new WebSocket(
      `${FASTAPI_WS}/ws/session`
    );

    this.ws.onopen = () => {
      this.ws?.send(
        JSON.stringify({
          type: 'connect',
          userId,
          bookId,
        })
      );
    };

    this.ws.onerror = error => {
      console.warn(
        '[ReadingSessionWS] WebSocket error:',
        error
      );
    };

    this.ws.onclose = () => {
      this.ws = null;
    };
  }

  // Send heartbeat
  sendHeartbeat(): void {
    if (
      !this.ws ||
      this.ws.readyState !== WebSocket.OPEN ||
      !this.userId ||
      !this.bookId
    ) {
      return;
    }

    this.ws.send(
      JSON.stringify({
        type: 'heartbeat',
        userId: this.userId,
        bookId: this.bookId,
      })
    );
  }

  // Disconnect websocket
  disconnect(): void {
    if (this.ws) {
      if (
        this.ws.readyState === WebSocket.OPEN
      ) {
        this.ws.send(
          JSON.stringify({
            type: 'disconnect',
          })
        );
      }

      this.ws.close();

      this.ws = null;
    }
  }
}