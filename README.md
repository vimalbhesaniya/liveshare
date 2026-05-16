# LiveShare - Real-time Code Sharing Platform

Share code instantly with developers worldwide. Perfect for interviews, collaboration, debugging & learning together.

## ✨ Features

- **Instant Code Sharing** - No sign-up required. Create a session and share in seconds
- **Custom URLs** - Choose your own unique URL like `liveshare.dev/your-code`
- **Password Protection** - Secure your code with optional password protection
- **Syntax Highlighting** - Beautiful highlighting for 50+ programming languages
- **Dark/Light Theme** - Toggle between themes for comfortable viewing
- **Real-time Collaboration** - Share your unique link with anyone to collaborate

## 🚀 How It Works

1. **Open Editor** - Click "New Session" to open the code editor
2. **Set Your URL** - Choose a unique code for your shareable link
3. **Paste Code** - Write or paste your code with syntax highlighting
4. **Share** - Share your unique link with anyone

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS, shadcn/ui
- **Backend**: Node.js, Express, Socket.io, MongoDB
- **Icons**: Lucide React

## 📦 Installation

```bash
# Clone the repository
git clone https://github.com/your-username/liveshare.git

# Navigate to project directory
cd liveshare

# Install dependencies
npm install
cd server && npm install && cd ..

# Start MongoDB locally (or use MongoDB Atlas)
# mongod

# Copy env files
cp .env.example .env
cp server/.env.example server/.env

# Start frontend + backend
npm run dev
```

## 🔧 Scripts

- `npm run dev` - Start frontend and backend together
- `npm run dev:client` - Start Vite dev server only
- `npm run dev:server` - Start Socket.io + API server only
- `npm run build` - Build frontend for production
- `npm run build:server` - Build backend TypeScript
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## 🌐 Environment Variables

**Frontend → Backend** (root `.env`):

```env
VITE_BACKEND_URL=
VITE_API_URL=
VITE_SOCKET_URL=
```

Leave empty in development — Vite proxies `/api` and `/socket.io` to the backend on port 3001.

**Production on Vercel (`www.liveshare.dev`, etc.)**

Your `vercel.json` must proxy `/api/*` to API Gateway **before** the SPA fallback. Otherwise every request (including `PATCH /api/snippets/...`) is rewritten to `index.html`, and saves break.

1. In `vercel.json`, set the `destination` of the first rewrite to your **HTTP API** URL from `serverless deploy` (same host you use for `VITE_BACKEND_URL` if calling the API directly).
2. Set Lambda env (and redeploy) with both apex and `www` if you use both:

```env
CLIENT_ORIGIN=https://liveshare.dev,https://www.liveshare.dev
```

3. Realtime WebSockets are not proxied by that rule. Set at **build** time:

```env
VITE_WS_URL=wss://YOUR_WS_API.execute-api.REGION.amazonaws.com/dev
```

**Alternative:** omit the Vercel API rewrite and set `VITE_BACKEND_URL` / `VITE_WS_URL` at build time so the browser calls AWS directly (CORS must allow your site).

**Backend** (`server/.env`):

```env
PORT=3001
MONGODB_URI=mongodb://localhost:27017/liveshare
CLIENT_ORIGIN=http://localhost:8080
```

## 📝 License

MIT License - feel free to use this project for personal or commercial purposes.

## 🤝 Contributing

Contributions are welcome! Feel free to open issues or submit pull requests.

---

Made with ❤️ for developers
