# AI Voice BPO Agent — 5-Day Build Guide

A website with one call button. Click it, and an AI agent with a natural female
voice talks to you like a real support agent, listens to your replies, and saves
a summary of the call to an Excel file. Everything used here is free.

## How it works (the whole system in one paragraph)

Your **website** (hosted free on GitHub Pages) has a call button. When you click it,
your **browser itself** listens to your microphone and turns your speech into text
(free, built into Chrome). That text is sent to a small **Python backend**
(hosted free on Hugging Face Spaces). The backend asks **Groq** (a free, extremely
fast AI service) to think of a reply, turns that reply into natural speech using
**edge-tts** (a free tool that uses Microsoft's online voices), and sends the audio
back to your browser, which plays it out loud. When you end the call, the backend
asks Groq to summarise the conversation and appends one row to an **Excel file**
(`calls_log.xlsx`) that you can download any time.

```
Your Browser (mic + speaker)
     |  speech -> text (free, built-in)
     v
GitHub Pages website  ---->  Hugging Face backend (Flask)
     ^                              |        |
     | speech (mp3)                 |        |
     +------------------------------+        v
                                    Groq (reply text)   edge-tts (natural voice)
                                              |
                                              v
                                     calls_log.xlsx (Excel)
```

**Why this combination:**
| Piece | Tool | Why |
|---|---|---|
| Speech-to-text | Browser Web Speech API | Free, instant, zero setup, no delay |
| AI brain | Groq (`llama-3.1-8b-instant`) | Free tier, no credit card, one of the fastest APIs that exists (replies in under a second) |
| Voice | `edge-tts` | Free, no API key, genuinely natural-sounding female voices |
| Website hosting | GitHub Pages | Free, exactly what you asked for |
| Backend hosting | Hugging Face Spaces | Free, no credit card, easy for beginners |
| Call log | Excel via `openpyxl` | Simple flat file, no database needed |

I've already built the starter project for you (in the `frontend/` and `backend/`
folders next to this guide). Your job over 5 days is to get accounts, plug in one
API key, deploy the two folders, and test it. Follow the days in order.

---

## Day 0 (30–45 min): Install tools & create accounts

Do this once, carefully. Everything is free.

1. **Install VS Code**: go to https://code.visualstudio.com/ → Download → run the
   installer → keep clicking Next/Install with default options.
2. **Install Git**: go to https://git-scm.com/downloads → download for your OS →
   install with default options (this lets you upload files to GitHub).
3. **Install Python**: go to https://www.python.org/downloads/ → Download Python
   3.11 or newer → **during install, tick the box "Add Python to PATH"** → Install.
4. **Create a GitHub account** (if you don't have one): https://github.com/join
5. **Create a Hugging Face account**: https://huggingface.co/join (no card needed)
6. **Create a free Groq account and get an API key**:
   - Go to https://console.groq.com → sign up with Google/email (no card needed)
   - Click **API Keys** in the left menu → **Create API Key** → copy it somewhere
     safe (a Notepad file is fine for now). You'll paste this into Hugging Face
     later — never paste it into your website's code.
7. **Install the GitHub Copilot extension in VS Code**:
   - Open VS Code → click the Extensions icon (left sidebar, looks like 4 squares)
   - Search "GitHub Copilot" → Install → sign in with your GitHub account when asked
   - (Students get GitHub Copilot free with the GitHub Student Developer Pack:
     https://education.github.com/pack — worth applying for even if it takes a
     day to approve, but not required to finish this project.)
8. **Open this whole project folder in VS Code**: File → Open Folder → select the
   `ai-bpo-project` folder.

**Checkpoint:** You should now have VS Code open showing `frontend/` and `backend/`
folders, and a Groq API key saved somewhere.

---

## Day 1: Understand the files & test your Groq key

1. Open `backend/app.py` in VS Code and read it top to bottom. Don't worry about
   understanding every line yet — just notice the three main routes: `/chat`
   (talks to Groq + makes speech), `/save-call` (writes the Excel row), and
   `/download-log` (lets you download the Excel file).
2. Quickly test that your Groq key works, using VS Code's terminal
   (Terminal → New Terminal):
   ```bash
   pip install requests --user
   python -c "
   import requests
   r = requests.post('https://api.groq.com/openai/v1/chat/completions',
     headers={'Authorization': 'Bearer PASTE_YOUR_KEY_HERE'},
     json={'model': 'llama-3.1-8b-instant',
           'messages': [{'role':'user','content':'Say hello in one sentence.'}]})
   print(r.json())
   "
   ```
   Replace `PASTE_YOUR_KEY_HERE` with your real key. If you see a reply from the
   AI in the output, your key works — delete this test, you won't need it again
   (the real key goes into Hugging Face, not your code).

**Checkpoint:** Groq key confirmed working.

---

## Day 2: Run the backend on your own laptop first

Testing locally before deploying saves you hours of confusing errors later.

1. In the VS Code terminal:
   ```bash
   cd backend
   pip install -r requirements.txt
   ```
2. Set your Groq key temporarily for this terminal session:
   - Windows (PowerShell): `$env:GROQ_API_KEY="your_key_here"`
   - Mac/Linux: `export GROQ_API_KEY="your_key_here"`
3. Run the server:
   ```bash
   python app.py
   ```
   You should see it say it's running on port 7860.
4. Open your browser to `http://localhost:7860` — you should see
   `{"status": "AI BPO backend is running"}`.
5. Test the chat endpoint from a second terminal (or use a free tool like
   https://www.postman.com or just Python):
   ```bash
   python -c "
   import requests
   r = requests.post('http://localhost:7860/chat',
       json={'message':'Hi, I need help with my order','history':[]})
   print(r.json())
   "
   ```
   You should get back a reply and a long `audio_base64` string — that means the
   AI brain and the voice engine both worked.

**If something fails:** read the red error text in the terminal — it almost
always tells you exactly what's wrong (e.g. "GROQ_API_KEY is not set" means you
skipped step 2).

**Checkpoint:** Backend works on your own laptop.

---

## Day 3: Deploy the backend to Hugging Face Spaces (free hosting)

Follow `backend/README.md` exactly — it has the full click-by-click steps:
create a Space with the **Docker** SDK, upload the 4 backend files, add your
`GROQ_API_KEY` as a **secret** (Settings → Variables and secrets), wait for it to
build, and confirm the live URL works in your browser.

**Checkpoint:** Visiting `https://your-space-name.hf.space` in a browser shows
`{"status": "AI BPO backend is running"}`.

---

## Day 4: Build & test the frontend locally

1. Open `frontend/script.js` and change the very first line:
   ```js
   const BACKEND_URL = "https://your-space-name.hf.space";
   ```
   to your real Hugging Face URL from Day 3.
2. In VS Code, right-click `frontend/index.html` → if you have the "Live Server"
   extension installed, choose **Open with Live Server** (install that extension
   first from the Extensions tab if you don't have it — search "Live Server").
   This opens the page properly in your browser (double-clicking the HTML file
   directly can break microphone permissions).
3. **Use Google Chrome** for testing — the free speech recognition only works
   reliably in Chrome and Edge.
4. Click the call button. Allow microphone access when Chrome asks. Talk to it.
   You should hear a natural voice reply back.
5. Click the button again to end the call, then click "Download call log" to
   check the Excel file was created correctly.

**Checkpoint:** A full call works end-to-end on your own laptop.

---

## Day 5: Deploy the frontend to GitHub Pages & final testing

1. Follow `frontend/README.md`: create a public GitHub repo, upload the 3
   frontend files, turn on GitHub Pages in Settings, and open the live link.
2. Test the live site the same way you tested it locally (Day 4, steps 3-5).
3. Do 3-4 full test calls, on different topics, so your `calls_log.xlsx` has
   a few realistic rows — this is what you'll show your evaluator.
4. Download the Excel log one final time and keep a copy for your project report.
5. Prepare your demo: have the live GitHub Pages link open and ready, and know
   that the Hugging Face backend may take ~30-60 seconds to "wake up" if nobody
   has used it in a while — do one test call a few minutes before your actual
   demo so it's already awake.

**Checkpoint:** Live, working project, with a downloadable Excel call log — done.

---

## Using Copilot effectively for the last 5%

Copilot is great for small, specific tweaks. Good prompts to type as a comment
above the code you want changed, then let Copilot suggest, e.g. in `app.py`:
```python
# change the agent's voice to an Indian-English female voice and make replies more formal
```
or in `style.css`:
```css
/* make the call button bigger and change the accent color to purple */
```
Avoid asking Copilot to "build the whole project" in one go — it works best on
one small, described change at a time.

## Common problems & fixes

| Symptom | Likely cause | Fix |
|---|---|---|
| "Speech recognition isn't supported" alert | Using Firefox/Safari | Switch to Chrome or Edge |
| No sound comes back | `BACKEND_URL` still says `YOUR-SPACE-NAME` | Edit `script.js` with your real HF URL |
| Backend URL loads but `/chat` fails with 500 | `GROQ_API_KEY` secret missing/typo on HF Space | Recheck Settings → Variables and secrets |
| First call after a while feels slow to connect | Free HF Space was asleep | Normal — wait ~30-60s, or "warm it up" before demoing |
| Excel file resets | HF free disk isn't persistent across rebuilds | Download the log regularly; don't re-upload files mid-project |
| Mic permission blocked | Opened `index.html` by double-click instead of via a server/Live Server or https | Use Live Server locally, and GitHub Pages (https) when deployed |

## Ideas if you want to go further (optional, not required)
- Swap `en-US-AriaNeural` for `en-IN-NeerjaNeural` (Indian-accent female voice) or
  `ta-IN-PallaviNeural` (Tamil female voice) in `app.py` — edge-tts has 300+ voices.
- Add a "call category" dropdown (billing / technical / general) that changes
  the `SYSTEM_PROMPT` so the agent behaves differently per department.
- Add sentiment (happy/neutral/angry) as an extra Excel column, generated by
  asking Groq to classify the transcript.
