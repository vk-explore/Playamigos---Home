# 🎮 playamigos

> A collection of web apps for learning, productivity, games & fun — all in one place.

**[playamigos.in](https://playamigos.in)** is a hub that hosts and links to a growing set of web apps. The site is static, lightweight, and deployable to GitHub Pages with zero build steps.

---

## ✨ Features

- **Centered, hub-style layout** — logo-centric design, no traditional header/nav bar
- **Dark glassmorphism theme** — animated gradient orbs, frosted-glass cards, micro-animations
- **Data-driven app listing** — add a new app by editing `apps.json` + dropping a logo into `logos/`
- **Real-time search** — fuzzy multi-word search across app titles, descriptions & categories
- **Fully responsive** — mobile-first design that works on phones, tablets & desktops
- **No scrollbar** — viewport-fitted layout with hidden internal scroll
- **About page** — `/about.html` with project info and blog link
- **Configurable** — `site.json` holds blog URL, tagline, footer text — update without touching code
- **Zero dependencies** — vanilla HTML, CSS & JS — no frameworks, no build tools

---

## 🗂 Project Structure

```
Playamigos - Home/
├── index.html        ← Main hub page
├── about.html        ← About page
├── index.css         ← Design system & styles
├── app.js            ← Client-side logic (fetch, render, search)
├── apps.json         ← App listing data (edit this to add apps!)
├── site.json         ← Site-wide configuration (blog URL, tagline, etc.)
├── favicon.svg       ← SVG favicon
├── logos/            ← App logo images
│   └── forge.svg
└── README.md
```

---

## 🚀 Adding a New App

1. **Add a logo** — drop a `.svg` or `.png` into the `logos/` folder (recommended: 120×120px).

2. **Edit `apps.json`** — add a new entry:

   ```json
   {
     "id": "my-app",
     "title": "My App",
     "description": "A short description of what the app does.",
     "logo": "logos/my-app.svg",
     "url": "https://my-app.playamigos.in",
     "category": "learning"
   }
   ```

3. **Push to GitHub** — the site will auto-update on GitHub Pages.

### Available Categories

`learning` · `productivity` · `games` · `fun` · `experimental`

---

## 🛠 Local Development

No build step required. Serve the files with any static file server:

```bash
# Using Python
python3 -m http.server 8000

# Using Node
npx -y serve .

# Then open http://localhost:8000
```

> **Note:** Opening `index.html` directly via `file://` won't work because `fetch()` requires HTTP.

---

## 🌐 Deployment

This site is designed for **GitHub Pages**:

1. Go to your repo → **Settings** → **Pages**
2. Set source to **Deploy from a branch** → `main` / `root`
3. Your site will be live at `https://<username>.github.io/<repo>/`

For a custom domain (e.g., `playamigos.in`), add a `CNAME` file with your domain name.

---

## ⚙️ Configuration

Edit **`site.json`** to update site-wide settings:

| Key           | Description                        |
| ------------- | ---------------------------------- |
| `siteName`    | Brand name (displayed in footer)   |
| `tagline`     | Subtitle below the logo            |
| `blogUrl`     | URL for the Blog nav link          |
| `githubUrl`   | GitHub profile/org URL             |
| `footerText`  | Footer text                        |

---

## 🎨 Tech Stack

- **HTML5** — semantic markup
- **Vanilla CSS** — custom properties, glassmorphism, CSS Grid, animations
- **Vanilla JavaScript** — ES modules, Fetch API, DOM manipulation
- **Google Fonts** — [Baloo 2](https://fonts.google.com/specimen/Baloo+2) + [Inter](https://fonts.google.com/specimen/Inter)

---

## 📄 License

MIT © Playamigos