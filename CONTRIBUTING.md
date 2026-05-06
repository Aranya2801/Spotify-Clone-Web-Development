# 🤝 Contributing to Spotify Clone

Thank you for your interest in contributing! Here's how you can help make this project even better.

## 🚀 Quick Start

```bash
git clone https://github.com/Aranya2801/Spotify-Clone-Web-Development.git
cd Spotify-Clone-Web-Development
npx serve .   # Run at localhost:3000
```

## 🌿 Branch Naming

| Type | Pattern | Example |
|------|---------|---------|
| Feature | `feat/description` | `feat/lyrics-display` |
| Bug Fix | `fix/description` | `fix/volume-slider` |
| Refactor | `refactor/description` | `refactor/player-engine` |
| Docs | `docs/description` | `docs/keyboard-shortcuts` |

## 📋 Pull Request Checklist

Before submitting a PR, make sure:

- [ ] Code runs without errors in Chrome and Firefox
- [ ] No `console.error` in browser DevTools
- [ ] CSS uses existing variables (`--green`, `--bg-card`, etc.)
- [ ] New songs added to the `SONGS` array in `js/app.js`
- [ ] README updated if a new feature is added
- [ ] No external dependencies added without discussion

## 🐛 Reporting Bugs

Open an issue with:
1. **What happened** — describe the bug
2. **Expected behaviour** — what should have happened
3. **Steps to reproduce** — numbered list
4. **Browser + OS** — e.g. Chrome 124 / Windows 11
5. **Screenshot** — if applicable

## 💡 Feature Requests

Open an issue with the `enhancement` label and describe:
- What feature you want
- Why it would be useful
- Any implementation ideas you have

## 📐 Code Style

- Use `'use strict'` in JS files
- 2-space indentation
- CSS variables for all colours and spacing
- Comment complex logic with `// ── Section ──` headers
- Keep functions small and single-purpose

## 🎵 Adding New Tracks

To add new cover songs:

1. Place the `.mp3` file in the project root
2. Add cover art emoji or image
3. Add an entry to `SONGS[]` in `js/app.js`:

```js
{
  id: 11,
  title: "Song Title (Cover)",
  originalArtist: "Original Artist",
  artist: "Performer Name",
  duration: "3:30",
  durationSec: 210,
  src: "11.mp3",
  emoji: "🎸",
  colors: ["#1a2a3a", "#0d151f"],
  genre: "Acoustic",
  mood: "Chill"
}
```

## 📜 License

By contributing, you agree your code will be under the [MIT License](LICENSE).
