# Sprout — Frontend

React frontend for Sprout, a daily habit tracker for kids and guardians.

## Tech Stack

- **React + Vite** — Frontend framework
- **Tailwind CSS** — Styling
- **React Router DOM** — Routing
- **Axios** — API calls
- **Vercel** — Deployment

## Project Structure

sprout-frontend/
├── src/
│ ├── api/
│ │ └── axios.js
│ ├── context/
│ │ └── AuthContext.jsx
│ ├── pages/
│ │ ├── ProfileSelector.jsx
│ │ ├── SignupPage.jsx
│ │ ├── GuardianDashboard.jsx
│ │ ├── ChildScorecard.jsx
│ │ ├── TaskManager.jsx
│ │ └── RewardsPage.jsx
│ ├── components/
│ │ ├── ProfileCard.jsx
│ │ ├── PinModal.jsx
│ │ ├── TaskItem.jsx
│ │ ├── RewardCard.jsx
│ │ ├── CelebrationScreen.jsx
│ │ └── EmptyStateCard.jsx
│ ├── App.jsx
│ └── main.jsx
├── .env.production
└── index.html

## Local Setup

**1. Clone the repo**

```bash
git clone https://github.com/mkjabed/sprout-frontend
cd sprout-frontend
```

**2. Install dependencies**

```bash
npm install
```

**3. Create `.env` file**
VITE_API_URL=http://127.0.0.1:8000

**4. Run the dev server**

```bash
npm run dev
```

**5. Open in browser**
http://localhost:5173

## Pages

| Route           | Page               | Access        |
| --------------- | ------------------ | ------------- |
| /               | Profile Selector   | Public        |
| /signup         | Signup             | Public        |
| /dashboard      | Guardian Dashboard | Guardian only |
| /tasks          | Task Manager       | Guardian only |
| /rewards        | Rewards Page       | Guardian only |
| /child/:childId | Child Scorecard    | Public        |

## Color Palette

| Name          | Hex     |
| ------------- | ------- |
| Primary green | #2D6A4F |
| Light green   | #52B788 |
| Pale green    | #D8F3DC |
| Dark text     | #1B1B1B |
| Neutral gray  | #F4F4F4 |

## Running Backend + Frontend Together

Two terminals open at the same time:

**Terminal 1 — Backend:**

```bash
cd sprout-backend
source venv/Scripts/activate
uvicorn main:app --reload
```

**Terminal 2 — Frontend:**

```bash
cd sprout-frontend
npm run dev
```

## Deployment

Deployed on Vercel.
Auto-deploys on push to `main` branch.

Set this environment variable in Vercel dashboard:
VITE_API_URL=https://your-railway-url.up.railway.app

## Live Demo

[sprout-tau.vercel.app](https://sprout-tau.vercel.app)
