# Deploy LiveShare to AWS Serverless

## Prerequisites

1. [AWS CLI](https://aws.amazon.com/cli/) configured (`aws configure`)
2. [MongoDB Atlas](https://www.mongodb.com/atlas) connection string
3. Node.js 20+

## Deploy

From project root (loads `.env` automatically):

```bash
# Install server dependencies
cd server && npm install && cd ..

# Deploy (requires MONGODB_URI in root .env)
npm run deploy
```

Or from `server/`:

```bash
export MONGODB_URI="mongodb+srv://user:pass@cluster.mongodb.net/liveshare"
export CLIENT_ORIGIN="https://your-frontend.com"
serverless deploy --stage dev
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
