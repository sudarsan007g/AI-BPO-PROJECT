# Frontend — deploy to GitHub Pages (free)

1. Create a new **public** repository on GitHub, e.g. `ai-bpo-frontend`.
2. Upload these 3 files to the repo root: `index.html`, `style.css`, `script.js`.
3. Open `script.js` and change the first line:
   ```js
   const BACKEND_URL = "https://YOUR-SPACE-NAME.hf.space";
   ```
   to your real Hugging Face Space URL (see `../backend/README.md`).
4. In the repo: **Settings → Pages → Build and deployment → Source: Deploy from a branch → Branch: main / (root) → Save**.
5. Wait 1-2 minutes, then open the URL GitHub gives you
   (looks like `https://yourusername.github.io/ai-bpo-frontend/`).
6. Open it in **Google Chrome** (Web Speech API works best there) and click the call button.
