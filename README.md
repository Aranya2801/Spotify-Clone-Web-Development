<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&color=1DB954&height=200&section=header&text=Spotify%20Clone&fontSize=70&fontColor=ffffff&fontAlignY=38&desc=Advanced%20Web%20Music%20Player&descAlignY=60&descAlign=62" width="100%"/>

<br/>

<img src="https://img.shields.io/badge/Version-2.0.0-1DB954?style=for-the-badge&logo=spotify&logoColor=white" />
<img src="https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white" />
<img src="https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white" />
<img src="https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black" />
<img src="https://img.shields.io/badge/Web_Audio_API-FF6B6B?style=for-the-badge&logo=audiomack&logoColor=white" />

<br/><br/>

<img src="https://readme-typing-svg.demolab.com?font=Syne&size=22&pause=1000&color=1DB954&center=true&vCenter=true&width=600&lines=🎵+Advanced+Spotify+Clone+Web+App;🎧+Real-time+Audio+Visualizer;🎼+10+Acoustic+Cover+Tracks;⌨️+Full+Keyboard+Shortcuts;💾+Persistent+Like+%26+History+System" />

</div>

---

## 🎵 About The Project

A **production-grade Spotify Clone** built with vanilla HTML, CSS, and JavaScript. This is no ordinary music player — it features a **real-time audio frequency visualizer**, a **fully animated dark UI**, **persistent storage**, **keyboard shortcuts**, and a modular, scalable codebase ready for daily use.

The project showcases 10 original acoustic cover tracks by **Ishaan Kaushik**, delivered through an interface pixel-perfect to Spotify's design language.

---

## ✨ Features

<table>
<tr>
<td width="50%">

### 🎛️ Player Engine
- ▶️ Full play / pause / next / previous controls
- 🔀 Shuffle mode with smart skip logic
- 🔁 Repeat modes: Off → All → One
- 🎚️ Real-time draggable progress bar
- 🔊 Volume control with mute toggle
- ⏱️ Live current time + total duration display

</td>
<td width="50%">

### 🎨 Visual Design
- 🌌 Dynamic hero banner with animated vinyl disc
- 📊 Real-time audio frequency bar visualizer (Web Audio API)
- ✨ Animated floating particle system in hero section
- 🃏 Song cards with hover play overlays
- 💚 Active song EQ animation indicator
- 🎨 Per-song dynamic colour themes

</td>
</tr>
<tr>
<td width="50%">

### 🗂️ Library & Playlists
- ❤️ Like / Unlike songs (persisted via `localStorage`)
- 🕐 Recently played history (auto-tracked)
- 📚 Sort by: Default / Title / Duration
- 🔍 Real-time fuzzy search (title, artist, genre, mood)
- 🎵 Playlist panel: Covers / Liked Songs / Recently Played
- 📋 Live Queue panel with current track highlight

</td>
<td width="50%">

### ⌨️ Keyboard Shortcuts
| Key | Action |
|-----|--------|
| `Space` | Play / Pause |
| `→` / `←` | Seek ±5 seconds |
| `Shift+→` / `←` | Next / Prev song |
| `↑` / `↓` | Volume ±5% |
| `S` | Toggle Shuffle |
| `R` | Cycle Repeat |
| `M` | Toggle Mute |
| `L` | Like/Unlike current |
| `1-0` | Jump to track 1–10 |

</td>
</tr>
</table>

---

## 🎬 Demo Preview

<div align="center">

```
┌─────────────────────────────────────────────────────────────────┐
│  🟢 Aranya's Music                    [Search...]    [Upgrade]  │
├──────────────┬──────────────────────────────────────────────────┤
│              │  ╔══════════════════════════════════════════╗    │
│  🏠 Home     │  ║  🎵 NOW PLAYING                         ║    │
│  🔍 Search   │  ║  ┌─────────┐  I Took a Pill in Ibiza   ║    │
│  📚 Library  │  ║  │  🎵 💿  │  Ishaan Kaushik            ║    │
│              │  ║  │ spinning│  Acoustic Covers Collection ║    │
│  PLAYLISTS   │  ║  └─────────┘  [▶ Play] [♥] [···]       ║    │
│  🎵 Covers   │  ╚══════════════════════════════════════════╝    │
│  ❤️ Liked    │  ▁▂▃▄▅▆▇█▇▆▅▄▃▂▁  Audio Visualizer  ▁▂▃▄▅▆▇  │
│  🕐 Recent   │                                                  │
│              │  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐      │
│              │  │ 🎵  │ │ 🏡  │ │ ✨  │ │ 💙  │ │ 🌙  │      │
│   AK [Free] │  │Song1│ │Song2│ │Song3│ │Song4│ │Song5│      │
│              │  └─────┘ └─────┘ └─────┘ └─────┘ └─────┘      │
├──────────────┴──────────────────────────────────────────────────┤
│  💿 I Took a Pill…  |  ⏮ ⏭ ▶  |  ━━━━●━━━━  1:23/3:46  🔊  │
└─────────────────────────────────────────────────────────────────┘
```

</div>

---

## 📁 Project Structure

```
Spotify-Clone-Web-Development/
│
├── 📄 index.html           # Main app shell — sidebar, views, player bar
├── 📁 css/
│   └── 🎨 style.css        # Advanced CSS with variables, animations, grid
├── 📁 js/
│   └── ⚙️  app.js           # Full player engine, visualizer, localStorage
│
├── 🎵 1.mp3  →  10.mp3     # Ishaan Kaushik cover tracks
├── 🖼️  b01.png → b010.png   # Album art images
├── 🖼️  image.png, ...       # Additional media assets
├── ▶️  play-button.svg      # SVG icon assets
├── ⏸️  pause-button.svg
├── 🌄 banner1.svg           # Hero banner graphic
└── 📝 README.md             # You're reading it!
```

---

## 🚀 Getting Started

### Prerequisites
No build tools required — this is pure HTML/CSS/JS.

### Run Locally

```bash
# 1. Clone the repo
git clone https://github.com/Aranya2801/Spotify-Clone-Web-Development.git

# 2. Navigate into the folder
cd Spotify-Clone-Web-Development

# 3. Open in browser (Option A — simplest)
open index.html

# 3. OR use a local server (Option B — recommended for audio)
npx serve .
# Then visit http://localhost:3000
```

> ⚠️ **Important:** Browsers block `file://` audio requests due to CORS. Use a local server (like `npx serve`, VS Code Live Server, or Python's `http.server`) for full audio playback.

---

## 🎵 Track List

| # | Title | Original Artist | Duration | Mood |
|---|-------|-----------------|----------|------|
| 1 | I Took a Pill in Ibiza (Cover) | Mike Posner | 3:46 | Chill |
| 2 | Ghar (Cover) | Jasleen Royal | 3:47 | Nostalgic |
| 3 | Kahi To Hogi Woh (Cover) | Bollywood | 3:40 | Romantic |
| 4 | Kasoor (Cover) | Prateek Kuhad | 2:43 | Melancholic |
| 5 | Tu Hai Kahan | Original | 2:59 | Longing |
| 6 | Baarishein (Cover) | Anuv Jain | 3:15 | Rainy |
| 7 | Waqt Ki Baatein (Cover) | Bollywood | 2:57 | Reflective |
| 8 | Lovely ft. Anika Vidyarthi (Cover) | Billie Eilish | 2:53 | Soft |
| 9 | Let Me Down Slowly (Cover) | Alec Benjamin | 2:55 | Gentle |
| 10 | Jee Le Zara (Cover) | Bollywood | 2:56 | Uplifting |

*Covered & performed by **Ishaan Kaushik***

---

## 🏗️ Technical Architecture

```
┌─────────────────────────────────────────────────────┐
│                   index.html                        │
│  ┌────────────┐  ┌──────────────────┐  ┌─────────┐ │
│  │  Sidebar   │  │   Main Content   │  │ Player  │ │
│  │  • Nav     │  │  • Hero Banner   │  │  Bar    │ │
│  │  • Playlist│  │  • Visualizer    │  │  (fixed)│ │
│  │  • User    │  │  • Song Grid     │  └─────────┘ │
│  └────────────┘  │  • 3 Views:      │              │
│                  │    Home/Search/  │              │
│                  │    Library       │              │
│                  └──────────────────┘              │
└─────────────────────────────────────────────────────┘
         ↓                    ↓
   css/style.css          js/app.js
   ┌──────────────┐    ┌──────────────────────────────┐
   │ CSS Grid     │    │ SONGS[] data array           │
   │ Variables    │    │ Audio Engine (HTMLAudioElement│
   │ Animations   │    │ Web Audio API (Visualizer)   │
   │ Responsive   │    │ State machine (play/shuffle) │
   │ Dark Theme   │    │ localStorage (likes/history) │
   └──────────────┘    │ Keyboard event listeners     │
                       └──────────────────────────────┘
```

---

## 🔧 Customisation Guide

### Add a New Song
Open `js/app.js` and add an entry to the `SONGS` array:

```js
{
  id: 11,
  title: "Your Song Title",
  originalArtist: "Original Singer",
  artist: "Your Name",
  duration: "3:30",
  durationSec: 210,
  src: "11.mp3",          // place 11.mp3 in root folder
  emoji: "🎸",
  colors: ["#1a2a3a", "#0d151f"],   // dark gradient colours
  genre: "Indie",
  mood: "Relaxed"
}
```

### Change the Colour Theme
Edit CSS variables in `css/style.css`:

```css
:root {
  --green:     #1DB954;   /* Spotify green accent */
  --bg-base:   #0a0a0a;   /* App background       */
  --bg-card:   #181818;   /* Card background       */
}
```

---

## 📱 Responsive Design

| Device | Layout |
|--------|--------|
| 💻 Desktop (>900px) | Full sidebar + 5-col song grid |
| 📟 Tablet (700–900px) | Narrow sidebar + 3-col grid |
| 📱 Mobile (<700px) | No sidebar, 2-col grid, simplified player |

---

## 🗺️ Roadmap

- [x] Core audio player with all controls
- [x] Audio frequency visualizer
- [x] Shuffle & repeat modes
- [x] Like system with localStorage
- [x] Search & filter
- [x] Queue panel
- [x] Keyboard shortcuts
- [ ] 🔜 PWA / offline support
- [ ] 🔜 Backend API integration (Node.js + Express)
- [ ] 🔜 User authentication
- [ ] 🔜 Custom playlist creation & management
- [ ] 🔜 Lyrics display (sync with timestamps)
- [ ] 🔜 Mini player mode
- [ ] 🔜 Dark/Light theme toggle

---

## 🛠️ Tech Stack

<div align="center">

| Layer | Technology |
|-------|-----------|
| Structure | HTML5 Semantic Elements |
| Styling | CSS3 Custom Properties, Grid, Flexbox, Animations |
| Behaviour | Vanilla JavaScript ES2022 |
| Audio | HTML5 Audio API + Web Audio API |
| Fonts | Google Fonts (Syne, DM Mono) |
| Persistence | localStorage |
| Icons | Inline SVG (Material Design) |

</div>

---

## 👤 Author

<div align="center">

<img src="https://github.com/Aranya2801.png" width="100" style="border-radius:50%" />

**Aranya**

[![GitHub](https://img.shields.io/badge/GitHub-Aranya2801-181717?style=for-the-badge&logo=github)](https://github.com/Aranya2801)

*Passionate web developer building beautiful, functional interfaces.*

</div>

---

## 📄 License

This project is open source under the [MIT License](LICENSE).

---

## 🙏 Acknowledgements

- **Ishaan Kaushik** — for the incredible cover songs that power this player
- **Spotify** — for the design inspiration
- **Google Fonts** — for the beautiful Syne & DM Mono typefaces
- **Material Design** — for the clean SVG icon system

---

<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&color=1DB954&height=100&section=footer" width="100%"/>

**⭐ Star this repo if you found it useful!**

*Made with ❤️ and 🎵 by Aranya*

</div>
