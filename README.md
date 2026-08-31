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
- **Backend**: Next.js, Socket.io, MongoDB (see `../liveshare-backend`)
- **Icons**: Lucide React

## 📦 Installation

```bash
# Clone the repository
git clone https://github.com/your-username/liveshare.git

# Navigate to project directory
cd liveshare

# Install frontend dependencies
npm install

# Install backend dependencies (sibling folder)
cd ../liveshare-backend && npm install && cd ../liveshare

# Start MongoDB locally (or use MongoDB Atlas)
# mongod

# Copy env files
cp .env.example .env
cp ../liveshare-backend/.env.example ../liveshare-backend/.env.local

# Start frontend + backend
npm run dev
```

## 🔧 Scripts

- `npm run dev` - Start frontend (`:8080`) and backend (`:3000`) together
- `npm run dev:client` - Start Vite dev server only
- `npm run dev:server` - Start Next.js + Socket.io backend only
- `npm run build` - Build frontend for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## 🌐 Environment Variables

**Frontend** (root `.env`):

```env
VITE_BACKEND_URL=http://localhost:3000
```

One URL for both REST API and Socket.io. Leave empty in dev — Vite proxies `/api` and `/socket.io` to `http://localhost:3000`.

**Production on Vercel**

Set at **build** time so the browser calls your deployed backend directly:

```env
VITE_BACKEND_URL=https://your-backend.example.com
```

Backend env (`../liveshare-backend/.env.local`):

```env
MONGODB_URI=mongodb://localhost:27017/liveshare
CLIENT_ORIGIN=http://localhost:8080,https://liveshare.dev,https://www.liveshare.dev
PORT=3000
```

## 📝 License

MIT
