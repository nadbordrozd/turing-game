# Turing Game

A client-side programming puzzle game where you assemble instructions for a
robot and help it escape a series of mazes.

## Run locally

Serve the repository root with any static HTTP server, for example:

```sh
python3 -m http.server 8000
```

Then open <http://localhost:8000>.

The site is deployed to GitHub Pages by `.github/workflows/pages.yaml`.

## Cache-busting (build version)

Browsers cache the game's files (GitHub Pages sends `max-age=600`), so a
returning player could mix old cached scripts or images with new ones. Every
front-end URL therefore carries `?v=<version>`:

- the `<script src>` and `<link href>` tags in `index.html`;
- every image, sprite-sheet JSON and sound Quintus loads (`script.js` wraps
  `Q.assetUrl`, which `lib/quintus.js` uses for all of them);
- sounds fetched by `js/audio.js`, the music `js/music.js` streams and images
  the scenes set from JavaScript, through `versionedUrl(url)`.

The version lives only in `index.html` (`window.TURING_VERSION` and the tags).
Set it with:

```sh
node tools/bump-version.mjs            # UTC date-time + short git hash
node tools/bump-version.mjs 2026-11-05 # or an explicit version
node tools/bump-version.mjs --check    # every tag matches TURING_VERSION?
```

Bump it in every commit that changes front-end files (any `.js`, `.css`,
image, sheet JSON or sound the game loads). The Pages workflow also runs
`node tools/bump-version.mjs` before uploading, so the deployed site gets a
fresh version on every deploy even if a bump was forgotten. New code that
builds an asset URL by hand must wrap it in `versionedUrl(...)`, or load it
through `Q.load`.
