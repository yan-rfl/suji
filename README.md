# Suji (速记) - Personal HSK 1–5 Learning App

<p align="center">
  <img src="public/icon.svg" alt="Suji Logo" width="120" height="120" />
</p>

<p align="center">
  <strong>Master Mandarin HSK 1–5 vocabulary with SuperMemo SM-2 spaced repetition, device-adaptive writing, and native Web Speech audio.</strong>
</p>

---

## 🌟 Highlights

- **Static Zero-Cost HSK Datasets:** Comprehensive HSK 1–5 vocabulary stored locally as static JSON files in `/public/data/`, keeping database costs and reads at zero.
- **Spaced Repetition (SM-2):** SuperMemo 2 algorithm calculates optimal repetition intervals based on your recall accuracy (`Again`, `Hard`, `Good`, `Easy`).
- **Device-Adaptive Quiz Engine:**
  - 🖥️ **Desktop:** Meaning → Hanzi using native keyboard Chinese IME (`compositionstart` / `compositionend` supported).
  - 📱 **Mobile:** Meaning → Hanzi using interactive `HanziWriter` canvas for stroke-by-stroke drawing with instant feedback.
  - 📖 **Hanzi → Meaning:** Multiple-choice active recall with pinyin and definition verification.
  - 📝 **Contextual Sentence Quiz:** Real-life example sentences with cloze fill-in-the-blank practice.
  - 🎧 **Audio Quiz:** Native Web Speech API (`window.speechSynthesis`) for listening comprehension without visual hints.
- **Interactive Dictionary:** Filter by HSK Level (1–5) and mastery status (*New*, *Learning*, *Mastered*), fast multi-attribute search (Hanzi, Pinyin with/without tone marks, English), audio buttons, and full stroke order animated modal.
- **Progressive Web App (PWA):** Offline service worker cache (`sw.js`) and web app manifest (`manifest.json`) for native install on iOS, Android, macOS, and Windows.
- **Firebase Auth & Firestore Sync:** Optional seamless cross-device synchronization with an instant offline/local Guest mode fallback.

---

## 🛠️ Tech Stack

- **Framework:** Next.js 15 (App Router, TypeScript)
- **Styling:** Tailwind CSS v4
- **Hanzi Stroke Animation:** `hanzi-writer`
- **Audio:** Web Speech API (`zh-CN` Mandarin synthesis)
- **Authentication & Database:** Firebase Auth + Cloud Firestore (with LocalStorage cache)
- **Celebration Effects:** `canvas-confetti`
- **Deployment:** Vercel (Free Tier optimized)

---

## 🚀 Getting Started

### 1. Clone & Install Dependencies

```bash
git clone https://github.com/your-username/suji.git
cd suji
npm install
```

### 2. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

> **Note:** The app works immediately out of the box in **Local Guest Mode**. All your flashcard reviews, streaks, and SM-2 intervals will be saved in your browser's local storage.

---

## ☁️ Optional: Firebase Cloud Sync Setup

To sync your study streak and flashcard progress across devices (e.g. studying on desktop and continuing on your mobile phone):

1. Go to [Firebase Console](https://console.firebase.google.com/) and create a new project.
2. In **Authentication**, enable **Google** and **Email/Password** sign-in methods.
3. In **Firestore Database**, create a database in production mode with standard security rules:
   ```javascript
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /users/{userId}/{document=**} {
         allow read, write: if request.auth != null && request.auth.uid == userId;
       }
     }
   }
   ```
4. Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```
5. Fill in your Firebase configuration keys in `.env.local`:
   ```env
   NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-app.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-app
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-app.appspot.com
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
   NEXT_PUBLIC_FIREBASE_APP_ID=...
   ```

---

## 📦 Zero-Cost Deployment to Vercel

1. Push your repository to GitHub.
2. Import the repository in [Vercel](https://vercel.com).
3. If using Firebase, add your `NEXT_PUBLIC_FIREBASE_*` environment variables in the Vercel project settings.
4. Click **Deploy**. Vercel will build and host your PWA for free!

---

## 📂 Project Architecture

```text
├── public/
│   ├── data/
│   │   ├── hsk1.json        # Static HSK 1 vocabulary (104 words + example sentences)
│   │   ├── hsk2.json        # Static HSK 2 vocabulary (52 words + example sentences)
│   │   ├── hsk3.json        # Static HSK 3 vocabulary (35 words + example sentences)
│   │   ├── hsk4.json        # Static HSK 4 vocabulary (25 words + example sentences)
│   │   └── hsk5.json        # Static HSK 5 vocabulary (25 words + example sentences)
│   ├── icon.svg             # App seal icon
│   ├── manifest.json        # PWA manifest
│   └── sw.js                # Offline service worker cache
├── src/
│   ├── app/
│   │   ├── layout.tsx       # Root layout with PWA headers and providers
│   │   ├── page.tsx         # Dashboard, streak tracker & quick quiz launcher
│   │   ├── dictionary/      # Menu 1: Dictionary & Word Lists
│   │   ├── quiz/            # Menu 2: Dynamic Flashcards & Quiz Engine
│   │   └── login/           # Authentication & Firestore sync
│   ├── components/
│   │   ├── AudioButton.tsx      # Web Speech API Mandarin pronunciation helper
│   │   ├── DesktopInput.tsx     # IME-safe Chinese keyboard input
│   │   ├── HanziCanvas.tsx      # Interactive HanziWriter stroke drawing & practice
│   │   ├── Navbar.tsx           # Responsive desktop & mobile bottom navigation
│   │   ├── PWAInstaller.tsx     # One-click PWA home screen installation
│   │   ├── QuizCard.tsx         # 5-in-1 device-adaptive quiz renderer
│   │   └── WordDetailModal.tsx  # Character stroke animation & memory stats modal
│   ├── context/
│   │   ├── AuthContext.tsx      # Firebase auth + Local Guest provider
│   │   └── ProgressContext.tsx  # Spaced repetition engine + Firestore/local sync
│   ├── lib/
│   │   ├── firebase.ts      # Firebase initialization with offline fallback
│   │   ├── hskData.ts       # HSK loader and multi-attribute search
│   │   ├── srs.ts           # SuperMemo SM-2 algorithm calculations
│   │   └── tts.ts           # Web Speech API wrapper
│   └── types/
│       ├── hsk.ts           # HSK word interfaces & quiz modes
│       └── user.ts          # SRS item & user statistics interfaces
└── scripts/
    └── generate_hsk_data.py # Script for generating HSK 1-5 curated data
```

---

## 🧠 Spaced Repetition (SM-2) Implementation

Suji implements the core SM-2 algorithm:

$$\text{EF}' = \text{EF} + \left(0.1 - (5 - q) \times (0.08 + (5 - q) \times 0.02)\right)$$

Where:
- $q \in [0, 5]$ is the user's recall grade:
  - `0`: Complete failure / blackout (`Again`)
  - `2`: Recalled with struggle (`Hard`)
  - `4`: Recalled after hesitation (`Good`)
  - `5`: Perfect and prompt recall (`Easy`)
- Ease Factor is constrained to $\text{EF} \ge 1.30$.
- Successful recall schedules exponentially increasing intervals ($1 \text{ day} \to 6 \text{ days} \to I \times \text{EF}$).
- Failed recall resets repetition count and reschedules immediate review.
