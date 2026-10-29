# ⚡ NovaBeat — Hyper-Dimensional Music, Lyrics & Playlist Importer

> **One Codebase for Android, iOS & Web**  
> Powered by **Expo (React Native + react-native-web)** with **Dynamic YouTube Playback, Synchronized Karaoke Lyrics, Spotify Playlist Importer & Offline Downloads** — **Zero API Keys Required!**

---

## 🌟 Unique Features in NovaBeat

### 1. 🚀 Cool Identity & Prism Glassmorphic Design: **NovaBeat**
- **Brand**: **NovaBeat** (*"Hyper-Dimensional Sound & Synced Lyrics"*).
- **Aesthetic**: Custom Prism Glassmorphism with deep void dark tones (`#06070A`, `#0B0E14`), translucent glass cards, and neon prismatic gradients (Electric Cyan `#00D2FF`, Cyber Emerald `#00F59B`, and Neon Violet `#8B5CF6`).

### 2. ⏳ 3-Second Animated Holographic Splash Screen
- Features a **rotating holographic equalizer vinyl disc** with glowing neon grooves.
- Smooth **3.0-second** (3000ms) progress bar with dynamic percentage counter (0% to 100%).

### 3. 🔗 Spotify Playlist Importer (Paste Any Link)
- **Paste Any Spotify Link**: On the Home screen or in your Vault, paste any public Spotify playlist link (e.g. `https://open.spotify.com/playlist/...`).
- NovaBeat automatically extracts the playlist name, cover, and tracks, matches them with streamable YouTube videos, and saves the complete playlist into your Vault ready to play!

### 4. 🎤 Guaranteed Synchronized Karaoke Lyrics
- **Multi-candidate search engine** paired with the open-source **LRCLIB API**:
  - Automatically cleans YouTube clutter tags from titles to find pure song names.
  - **Auto-Sync Engine**: Even if a provider only has plain lyrics, NovaBeat automatically generates rhythmic synchronized timestamps distributed proportionally across the track duration!
  - **Interactive Karaoke**: Active lines highlight in luminous cyan, auto-scroll to center, and tapping any line jumps playback directly to that timestamp.

### 5. 📥 Offline Downloads
- Every track card and the player features a **Download** icon (`cloud-download-outline`).
- Your Vault (Library) has a dedicated **"Downloaded"** tab to view and play all your saved offline tracks anytime.

### 6. 🎚️ 100% Reliable Background Audio & Seek Bar
- No floating preview popups or visual clutter.
- The seek bar advances second by second with smooth scrubbing and instant tap-to-seek.

---

## ⚡ Commands to Run

```bash
# Start Dev Server
npx expo start

# Run Web Directly
npx expo start --web

# Build Android APK
npx eas build -p android --profile preview
```
