# ToonCraft Studio — GitHub Pages deployment package

## Deploy

1. Create a public GitHub repository and upload the contents of this folder **to the repository root**, including the `.github/workflows/deploy.yml` file.
2. In repository **Settings → Pages → Build and deployment**, choose **GitHub Actions**.
3. Push to `main` (or run the workflow manually from **Actions**).
4. After the deployment workflow succeeds, open the URL shown in **Settings → Pages**.

Typical project URL: `https://USERNAME.github.io/REPOSITORY/` (replace placeholders). It will not exist until you deploy.

## What this package actually does

This is the **existing ToonCraft beta** made ready for GitHub Pages; it is not a newly completed generative AI engine. It includes editable deterministic cartoon scenes, keyword-based Bangla story parsing, directional movement, simple cartoon rendering, project JSON save/load, browser autosave, audio import and browser-dependent WebM recording.

**Not implemented:** automatic rigging of uploaded images, generation of consistent new side/back character art, phoneme-accurate lip sync, AI-directed acting, or reliable MP4 export. Reference images are stored as references, not animated characters. Imported audio needs to be re-imported after reloading. WebM recording depends on browser codec support.

## Privacy and constraints

No backend or AI API is included. Project autosave uses localStorage in the browser. The site is served over HTTPS by GitHub Pages; it is not a private data store. GitHub Pages only hosts static files and cannot run server-side AI jobs. Browser support and performance vary by device.

## Local use

Open `index.html` from a static HTTP server, e.g. `python -m http.server 8771` and visit `http://127.0.0.1:8771/`.
