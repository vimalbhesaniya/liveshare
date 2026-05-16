# Deploy LiveShare to AWS Serverless

## Prerequisites

1. [AWS CLI](https://aws.amazon.com/cli/) configured (`aws configure`)
2. [MongoDB Atlas](https://www.mongodb.com/atlas) connection string
3. Node.js 20+

## Deploy

**Run from `server/`** (not the nested `liveshare/` folder):

```bash
cd server
npm install
npm run deploy
```

Requires in root `../.env`:
- `CLIENT_ORIGIN` — e.g. `https://www.liveshare.dev,https://liveshare.dev`
- `MONGODB_URI` — optional on Lambda (snippets use **DynamoDB** automatically). For local dev only, use `mongodb://localhost:27017/liveshare`

Re-authenticate AWS if deploy fails:

```bash
aws login
# or: serverless login
```

Requires AWS CLI v2 with login session:
```bash
# If `aws` not found, install AWS CLI v2 first
serverless login   # or AWS console sign-in via Serverless
npm run deploy     # script exports credentials automatically
```

## After deploy

Copy the output URLs into root `.env`:

```env
VITE_BACKEND_URL=https://xxxxxxxx.execute-api.us-east-1.amazonaws.com
VITE_WS_URL=wss://xxxxxxxx.execute-api.us-east-1.amazonaws.com/dev
```

Rebuild frontend:

```bash
npm run build
```

## What gets deployed

| Resource | Purpose |
|----------|---------|
| Lambda `api` | REST: `/api/snippets`, `/health` |
| Lambda `wsConnect/Disconnect/Message` | Real-time collaboration |
| DynamoDB | WebSocket connection tracking |
| API Gateway HTTP | REST API |
| API Gateway WebSocket | Live editing |

## Local dev (unchanged)

```bash
npm run dev
```

Leave `VITE_WS_URL` empty — uses Socket.io on port 3001.

## Remove stack

```bash
cd server && npm run remove
```
