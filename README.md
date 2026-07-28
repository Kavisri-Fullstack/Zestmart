# 🎵 SoundWave — Full-Stack Music Streaming App

A Spotify-inspired music streaming platform built end-to-end with the MERN stack, featuring real licensed audio, dynamic playlists, and a polished, fully responsive dark UI.

**🔗 Live App:** [soundwave-drab-alpha.vercel.app](https://soundwave-drab-alpha.vercel.app)

---

## ✨ Features

- 🔐 **Authentication** — JWT-based signup/login, auto-generated avatar per user
- 🎧 **Real Music Catalogue** — hundreds of tracks pulled live from the [Jamendo](https://www.jamendo.com) API (Creative Commons licensed, real artists, real audio)
- 🖼️ **Dynamic Artwork** — per-song and per-artist images sourced from the Pexels API
- ❤️ **Favorites & Recently Played** — persisted per user
- 🎼 **Playlists** — create, edit, delete, and add songs directly from any song card
- 👥 **Follow Artists** — build a personalized artist feed
- 🔍 **Search & Mood Discovery** — search by song/artist/album, or browse by mood (Happy, Calm, Workout, etc.)
- 🤖 **AI Assistant** — mood-based song recommendations
- 📱 **Fully Responsive** — custom mobile layout for the player, sidebar, and navigation
- 🎨 **Custom Dark UI** — red-accented theme, custom scrollbars, smooth animations

## 🛠️ Tech Stack

**Frontend:** React (Vite), Tailwind CSS, React Router, Axios
**Backend:** Node.js, Express, MongoDB (Mongoose), JWT Auth
**External APIs:** Jamendo (music), Pexels (images), DiceBear (avatars)
**Deployment:** Vercel (frontend) + Render (backend) + MongoDB Atlas (database)

## 🚀 Getting Started Locally

### Backend
```bash
cd backend
npm install
# Add your own MongoDB URI, JWT secret, and API keys to a .env file
npm run seed   # populates the database with real Jamendo tracks
npm run dev
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

## 📄 License

This project is for portfolio/educational purposes. Music is streamed via the Jamendo API under Creative Commons licensing.
