# Prometheus Chatbot API

Node.js + Express + MongoDB backend for a highly personalized chatbot. Uses a Python Model API for generating responses.

## Features
- JWT auth (register/login)
- User profile + demographics (rich fields, whitelist updates)
- Conversations with message history
- Python Model API integration (POST /chat with { message, user_id, metadata })
- Swagger docs at `/api/docs` (if `docs/openapi.json` present)
- Security: Helmet, input sanitization, rate limiting (chat), CORS

## Prerequisites
- Node.js 18+
- MongoDB (Atlas or local)
- Python Model API (local or hosted) compatible with `/chat` endpoint

## Setup
1. Install dependencies:
```bash
npm install
```
2. Copy env template and fill values:
```bash
cp .env.example .env
```
Edit `.env`:
- `MONGODB_URI`: your Mongo connection string
- `JWT_SECRET`: long random string
- `PYTHON_API_URL`: e.g., `https://santacl-prometheus.hf.space` (no trailing slash)

3. Run the server:
```bash
npm run dev
# or
npm start
```

## Environment Variables
See `.env.example` for full list. Required:
- `MONGODB_URI`
- `JWT_SECRET`
- `PYTHON_API_URL`

## Scripts
```bash
npm run dev             # Start with nodemon
npm start               # Start
npm test                # Run E2E tests (requires running server)
npm run cleanup:stats   # Show DB stats
npm run cleanup:test    # Delete test users + conversations
npm run cleanup:all     # Danger: delete ALL users + conversations
```

## API (high level)
Base path: `/api`

Auth
- POST `/auth/register` → { token, user }
- POST `/auth/login` → { token, user }
- GET  `/auth/me` (auth) → { user }

User/Profile
- GET  `/users/profile` (auth)
- PUT  `/users/profile` (auth)
- GET  `/users/demographics` (auth)
- POST `/users/demographics` (auth)
- PUT  `/users/demographics` (auth)

Chat
- POST `/chat` (auth) → create conversation { conversationId, createdAt }
- GET  `/chat` (auth) → list user conversations
- GET  `/chat/{conversationId}` (auth) → get conversation (supports `limit`, `before`)
- POST `/chat/{conversationId}/messages` (auth) → send message, returns { reply, conversationId, timestamp }

## Python Model Integration
Backend sends to `${PYTHON_API_URL}/chat`:
```json
{
  "message": "...",
  "user_id": "<userId>",
  "metadata": {
    "demographics": { /* ~10 essential fields, empty dropped */ },
    "previous_chats": [ { "role": "user|assistant", "message": "...", "timestamp": "ISO" } ]
  }
}
```

## CORS
CORS reflects request origin and allows credentials. Configure your frontend domain as needed.

## Swagger/OpenAPI
Open `docs/openapi.json`; server hosts UI at `/api/docs`.

## Troubleshooting
- "MONGODB_URI is not set" → set in env/hosting provider
- "PYTHON_API_URL is not set" → set to model API base
- Chat timeouts → ensure the model API is reachable and warm
- CORS errors → confirm frontend origin and headers

## License
MIT
