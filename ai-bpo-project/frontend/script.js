// ======================================================
// 1. SET THIS TO YOUR BACKEND URL (Hugging Face Space)
//    Example: "https://yourname-ai-bpo-backend.hf.space"
// ======================================================
const BACKEND_URL = "https://YOUR-SPACE-NAME.hf.space";

const callBtn = document.getElementById("callBtn");
const callWrap = document.querySelector(".call-button-wrap");
const statusTitle = document.getElementById("statusTitle");
const statusSub = document.getElementById("statusSub");
const transcriptEl = document.getElementById("transcript");
const downloadBtn = document.getElementById("downloadBtn");

let inCall = false;
let history = [];       // full conversation, sent to backend each turn
let recognition = null;
let isSpeaking = false;  // true while the agent's audio is playing

const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;

function setStatus(title, sub) {
  statusTitle.textContent = title;
  statusSub.textContent = sub;
}

function addBubble(role, text) {
  const div = document.createElement("div");
  div.className = "bubble " + (role === "user" ? "user" : "agent");
  div.textContent = text;
  transcriptEl.appendChild(div);
  transcriptEl.scrollTop = transcriptEl.scrollHeight;
}

function playBase64Audio(b64) {
  return new Promise((resolve) => {
    const audio = new Audio("data:audio/mp3;base64," + b64);
    isSpeaking = true;
    audio.onended = () => { isSpeaking = false; resolve(); };
    audio.onerror = () => { isSpeaking = false; resolve(); };
    audio.play();
  });
}

async function sendToBackend(userText) {
  setStatus("Thinking...", "Priya is preparing a reply");
  try {
    const res = await fetch(BACKEND_URL + "/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: userText, history: history }),
    });
    if (!res.ok) throw new Error("Backend error " + res.status);
    const data = await res.json();
    history = data.history;
    addBubble("agent", data.reply);
    setStatus("Speaking...", "Listening will resume automatically");
    await playBase64Audio(data.audio_base64);
    if (inCall) {
      setStatus("Listening...", "Speak now");
      recognition.start();
    }
  } catch (err) {
    console.error(err);
    setStatus("Connection problem", "Check BACKEND_URL in script.js and that the backend is awake");
  }
}

function setupRecognition() {
  recognition = new SpeechRecognitionAPI();
  recognition.continuous = false;      // we restart it manually after each reply
  recognition.interimResults = false;
  recognition.lang = "en-US";

  recognition.onresult = (event) => {
    const text = event.results[event.results.length - 1][0].transcript.trim();
    if (!text) return;
    addBubble("user", text);
    recognition.stop();
    sendToBackend(text);
  };

  recognition.onerror = (event) => {
    console.warn("Speech recognition error:", event.error);
    if (event.error === "no-speech" && inCall && !isSpeaking) {
      // nothing heard, just keep listening
      try { recognition.start(); } catch (e) {}
    }
  };

  recognition.onend = () => {
    // If the call is still active and the agent isn't talking, keep listening
    if (inCall && !isSpeaking) {
      try { recognition.start(); } catch (e) {}
    }
  };
}

async function startCall() {
  if (!SpeechRecognitionAPI) {
    alert("Speech recognition isn't supported in this browser. Please use Google Chrome or Microsoft Edge on desktop.");
    return;
  }
  inCall = true;
  history = [];
  transcriptEl.innerHTML = "";
  downloadBtn.style.display = "none";
  callWrap.classList.remove("idle");
  callWrap.classList.add("active");
  callBtn.classList.add("active");
  setupRecognition();

  setStatus("Connecting...", "Say hello when ready");
  const greeting = "Hi there, thanks for calling! This is Priya, your AI assistant. How can I help you today?";
  addBubble("agent", greeting);
  history.push({ role: "assistant", content: greeting });

  try {
    const res = await fetch(BACKEND_URL + "/speak", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: greeting }),
    });
    const data = await res.json();
    setStatus("Speaking...", "");
    await playBase64Audio(data.audio_base64);
  } catch (e) {
    console.warn("Greeting audio failed, continuing with text only.", e);
  }

  if (inCall) {
    setStatus("Listening...", "Speak now");
    recognition.start();
  }
}

async function endCall() {
  inCall = false;
  callWrap.classList.remove("active");
  callWrap.classList.add("idle");
  callBtn.classList.remove("active");
  if (recognition) {
    recognition.onend = null; // stop auto-restart
    recognition.stop();
  }
  setStatus("Saving call...", "Summarising your conversation");

  try {
    const res = await fetch(BACKEND_URL + "/save-call", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ history: history }),
    });
    const data = await res.json();
    setStatus("Tap to call", "Last call summary: " + (data.summary || "saved"));
    downloadBtn.style.display = "inline-block";
  } catch (e) {
    console.error(e);
    setStatus("Tap to call", "Call ended (couldn't save log)");
  }
}

callBtn.addEventListener("click", () => {
  if (!inCall) startCall();
  else endCall();
});

downloadBtn.addEventListener("click", () => {
  window.open(BACKEND_URL + "/download-log", "_blank");
});

// initial state
callWrap.classList.add("idle");
