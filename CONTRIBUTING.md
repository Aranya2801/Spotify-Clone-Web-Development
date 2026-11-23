# Contributing

Issues and PRs are welcome.

## Setup

```bash
git clone https://github.com/Aranya2801/Spotify-Clone-Web-Development.git
cd Spotify-Clone-Web-Development
python -m http.server 3000
npm test
```

There's no build step and there are no npm dependencies. Please keep it that way unless there's a good reason.

## Before opening a PR

- `npm test` passes
- no errors in the browser console (Chrome and Firefox)
- if you touched anything in `js/similarity.js`, run `npm run eval` and paste the table in the PR
- if you changed cached files, bump `VERSION` in `sw.js`

## Code style

- ES modules, 2-space indent, single quotes
- keep `queue.js`, `similarity.js`, `utils.js` and `tracks.js` free of DOM code so they stay testable in Node
- anything user-provided that goes into `innerHTML` must go through `esc()`
