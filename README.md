# ☀️ SolarGPT — AI-Powered Solar Energy Planning Platform

> **LLM.Solar** | Professional solar system design, ROI analysis, and AI advisory  
> Built for homeowners, solar engineers, installation companies, and investors.

[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![GitHub Pages](https://img.shields.io/badge/Deploy-GitHub%20Pages-blue)](https://pages.github.com/)
[![Netlify](https://img.shields.io/badge/Deploy-Netlify-teal)](https://netlify.com)
[![Languages](https://img.shields.io/badge/Languages-EN%20%7C%20AR%20%7C%20FR-orange)](/)

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Features](#features)
3. [Screenshots](#screenshots)
4. [Installation](#installation)
5. [GitHub Pages Deployment](#github-pages-deployment)
6. [Netlify Deployment](#netlify-deployment)
7. [Project Structure](#project-structure)
8. [Customization Guide](#customization-guide)
9. [API Integrations](#api-integrations)
10. [Target Users](#target-users)
11. [Pricing Plans](#pricing-plans)
12. [SEO & Performance](#seo--performance)
13. [Contact & Support](#contact--support)

---

## 🌟 Overview

**SolarGPT** is a complete, production-ready AI-powered solar energy platform built with vanilla JavaScript, HTML5, and CSS3. No frameworks required — just open `index.html` and it works.

The platform is designed to run **100% in the browser** (GitHub Pages, Netlify, or any static host) and uses the **Anthropic Claude API** for the AI Solar Advisor feature.

### Why SolarGPT?

- ✅ **No backend required** — pure static files
- ✅ **AI-powered** — Claude API integration for solar Q&A
- ✅ **Multilingual** — English, Arabic (RTL), French
- ✅ **Professional PDF reports** — downloadable HTML reports
- ✅ **PWA ready** — installable on mobile
- ✅ **Dark/Light mode** — system-aware theming
- ✅ **SEO optimized** — Schema.org, Open Graph, Twitter cards
- ✅ **Mobile-first** — fully responsive

---

## ✨ Features

### 1. 🔆 Solar Panel Calculator
- Required panel count estimation
- System size (kWp) calculation
- Inverter size recommendation
- Battery capacity (for hybrid/off-grid)
- Roof area requirement
- Daily & annual production estimates
- Location-based sun hours (120+ countries)
- Panel type comparison (Mono / Poly / Thin Film)
- Grid-tied / Hybrid / Off-Grid system support

### 2. 📊 Electricity Bill Analyzer
- Bill-to-kWh reverse calculation
- Solar savings estimation
- System size recommendation
- 20-year savings projection (with 3% rate escalation)
- Payback period & ROI calculation
- CO₂ avoided & tree equivalent
- Visual savings timeline

### 3. 🤖 AI Solar Advisor
- Powered by **Claude claude-sonnet-4-20250514** (Anthropic)
- Expert solar knowledge base
- Multi-turn conversation memory
- Suggested questions for quick access
- Markdown formatting support
- System sizing, financing, technology, installation Q&A

### 4. 💰 Cost Estimator & ROI
- Full equipment cost breakdown (panels, inverter, mounting, wiring, battery)
- Installation cost input
- Government incentive calculator
- 10-year and 25-year ROI analysis
- Visual bar chart cost breakdown
- Annual electricity rate escalation modeling

### 5. 📄 PDF Report Generator
- Professional HTML-based reports (downloadable)
- Client & project metadata
- Configurable sections (6 toggleable sections)
- In-page iframe preview
- Automatic save to dashboard history
- Print-ready styling

### 6. 🔧 Equipment Recommender
- Solar panel recommendations by type (Mono/Poly/Thin)
- Inverter recommendations by system type (Grid/Hybrid/Off-Grid)
- Battery storage recommendations (LFP chemistry)
- Mounting system recommendations
- Real brands: Jinko, LONGi, Canadian Solar, SMA, Fronius, Tesla, Pylontech

### 7. 📁 Dashboard
- Saved projects browser
- Calculations counter
- Reports history
- Quick action buttons
- Portfolio bar chart
- Project load & delete
- LocalStorage persistence

### 8. 🎓 Solar Knowledge Center
- **Guides**: 6 educational guides (Residential, kWp vs kWh, Batteries, Financing, Orientation, Net Metering)
- **FAQ**: 6 detailed answers to common solar questions
- **Glossary**: 12 essential solar terms defined

---

## 📸 Screenshots

```
┌─────────────────────────────────────────────┐
│  ☀️ SolarGPT    Calculator  AI  Pricing     │
├─────────────────────────────────────────────┤
│                                             │
│  Design Your Solar Future                   │
│  with Artificial Intelligence               │
│                                             │
│  [Start Free Calculation]  [Ask AI]         │
│                                             │
│  98%    50K+    120+                        │
│  Accuracy  Projects  Countries              │
│                        ┌──────────────────┐ │
│                        │ ☀️ SolarGPT Live │ │
│                        │ System: 8.4 kWp  │ │
│                        │ Panels:  ████ 21 │ │
│                        │ Savings: $127/mo │ │
│                        └──────────────────┘ │
└─────────────────────────────────────────────┘
```

---

## 🚀 Installation

### Prerequisites
- A web browser (Chrome, Firefox, Safari, Edge)
- A text editor (VS Code recommended)
- Git (for deployment)
- An [Anthropic API key](https://console.anthropic.com/) (for AI Advisor — optional)

### Local Development

```bash
# Clone your repository
git clone https://github.com/YOUR_USERNAME/llm-solar.git
cd llm-solar

# That's it! Open index.html in your browser
open index.html
# or
python -m http.server 8000
# then visit http://localhost:8000
```

> ⚠️ **Note:** The AI Advisor requires the Anthropic API. If you're running locally, the AI Advisor will show a connection error. All other features work offline.

### Setting Up the AI Advisor

The AI Advisor calls the Anthropic API directly from the browser via `app.js`. The API key is handled server-side by Claude.ai when deployed on this platform.

For your **own deployment**, you'll need to add your API key. Edit `app.js`, find the fetch call in `sendAdvisorMessage()`, and add your key:

```javascript
headers: {
  "Content-Type": "application/json",
  "x-api-key": "YOUR_API_KEY_HERE",         // Add this
  "anthropic-version": "2023-06-01",         // Add this
  "anthropic-dangerous-direct-browser-calls": "true"  // Add this
},
```

> ⚠️ **Security Warning:** Never expose your API key in a public GitHub repository. Use environment variables or a serverless function proxy for production deployments.

---

## 🌐 GitHub Pages Deployment

```bash
# 1. Initialize git repository
git init

# 2. Add all files
git add .

# 3. Initial commit
git commit -m "Launch LLM.Solar — SolarGPT Platform"

# 4. Rename branch to main
git branch -M main

# 5. Add your GitHub remote (replace YOUR_USERNAME)
git remote add origin https://github.com/YOUR_USERNAME/llm-solar.git

# 6. Push to GitHub
git push -u origin main
```

Then in GitHub:
1. Go to your repository → **Settings** → **Pages**
2. Source: **Deploy from a branch**
3. Branch: `main` / `/ (root)`
4. Click **Save**
5. Your site will be live at: `https://YOUR_USERNAME.github.io/llm-solar/`

> **Custom Domain:** To use `llm.solar`, add a `CNAME` file with `llm.solar` and configure your DNS:
> ```
> A     @    185.199.108.153
> A     @    185.199.109.153
> A     @    185.199.110.153
> A     @    185.199.111.153
> CNAME www  YOUR_USERNAME.github.io
> ```

---

## 🟦 Netlify Deployment

### Option A: Drag & Drop
1. Go to [app.netlify.com](https://app.netlify.com)
2. Drag your `llm-solar` folder onto the deploy area
3. Done! Get an instant URL like `random-name.netlify.app`

### Option B: Git Integration
```bash
# Same git setup as GitHub Pages above, then:
```
1. Go to [app.netlify.com](https://app.netlify.com) → **New site from Git**
2. Connect your GitHub account
3. Select `llm-solar` repository
4. Build command: *(leave empty)*
5. Publish directory: `.` (root)
6. Click **Deploy site**

### Netlify Custom Domain
1. Site settings → **Domain management** → **Add custom domain**
2. Enter `llm.solar`
3. Follow DNS instructions

### Netlify Environment Variables (for API key security)
1. Site settings → **Environment variables**
2. Add: `ANTHROPIC_API_KEY` = `sk-ant-...`
3. Create a `netlify/functions/advisor.js` serverless function to proxy API calls

---

## 📁 Project Structure

```
llm-solar/
├── index.html          # Main HTML — all sections & UI
├── style.css           # Complete styling (dark/light, RTL, responsive)
├── app.js              # Main controller — navigation, forms, AI advisor
├── solar-calculator.js # PV calculation engine
├── bill-analyzer.js    # Bill analysis & savings projection
├── reports.js          # PDF report generator
├── dashboard.js        # Project/client management
├── translations.js     # i18n — English, Arabic, French
├── manifest.json       # PWA manifest
├── sitemap.xml         # SEO sitemap
├── robots.txt          # Search engine directives
├── .gitignore          # Git ignore rules
└── README.md           # This file
```

### Module Responsibilities

| File | Responsibility |
|------|---------------|
| `translations.js` | All UI text in 3 languages, i18n class, DOM updater |
| `solar-calculator.js` | PV sizing math, equipment recommendations, results renderer |
| `bill-analyzer.js` | Bill analysis, savings projection, 20yr timeline |
| `reports.js` | HTML report template, download, preview, history |
| `dashboard.js` | LocalStorage CRUD, project management, charts |
| `app.js` | UI controller, navigation, AI advisor, cost estimator |
| `style.css` | All CSS — variables, components, dark mode, RTL, responsive |
| `index.html` | All HTML markup, sections, forms, knowledge center |

---

## 🎨 Customization Guide

### Change Brand Colors

Edit `style.css` `:root` variables:

```css
:root {
  --primary: #0f4c2a;        /* Dark green — change to your brand */
  --primary-light: #1a7a42;  /* Lighter green */
  --primary-pale: #dcfce7;   /* Very light green background */
  --accent: #f59e0b;         /* Amber/gold — solar accent */
  --accent-dark: #b45309;    /* Darker amber */
}
```

### Change Brand Name

In `index.html`:
```html
<!-- Change "SolarGPT" to your brand -->
Solar<span class="brand-accent">GPT</span>
```

In `translations.js`:
```javascript
en: { nav_brand: "YourBrand" }
```

### Add a New Language

In `translations.js`, add a new language object:
```javascript
const TRANSLATIONS = {
  en: { ... },
  ar: { ... },
  fr: { ... },
  es: {              // Add Spanish
    dir: "ltr",
    lang: "es",
    nav_brand: "SolarGPT",
    // ... all keys
  }
};
```

Then add a button in `index.html`:
```html
<button class="lang-btn" data-lang="es">ES</button>
```

### Modify Solar Calculations

In `solar-calculator.js`, adjust constants:
```javascript
const SYSTEM_LOSS_FACTOR = 0.80;  // 80% system efficiency
const BATTERY_DOD = 0.80;         // 80% depth of discharge
const BATTERY_DAYS = 1.5;         // Days of battery autonomy
```

Add new location sun hours:
```javascript
const SUN_HOURS = {
  "Your Country": 5.0,  // Add here
  // ...
};
```

### Add/Remove Report Sections

In `reports.js`, the `generateReportHTML()` function uses `sections` array to conditionally render each block. Add new sections by adding template literals with `sections.includes("your_section")`.

### Customize AI Advisor Persona

In `app.js`, edit the `systemPrompt` in `sendAdvisorMessage()`:
```javascript
const systemPrompt = `You are [Your Company Name] Solar Advisor...
Your expertise includes: [customize]
Tone: [professional/friendly/technical]`;
```

### Change Pricing Plans

In `index.html`, find the `#section-pricing` section and edit the pricing cards. Update plan names, prices, features, and button actions in `app.js` `setupPricing()`.

---

## 🔌 Future API Integrations

### 1. PVGIS API (EU Commission — Free)
Real solar irradiance data for any location:
```javascript
const url = `https://re.jrc.ec.europa.eu/api/v5_2/PVcalc?lat=${lat}&lon=${lon}&peakpower=${kWp}&loss=14&outputformat=json`;
const data = await fetch(url).then(r => r.json());
const annualKwh = data.outputs.totals.fixed.E_y;
```

### 2. Google Solar API
Rooftop solar potential from satellite imagery:
```javascript
const url = `https://solar.googleapis.com/v1/buildingInsights:findClosest?location.latitude=${lat}&location.longitude=${lon}&key=${API_KEY}`;
```

### 3. OpenWeatherMap (Sun Hours)
Real-time weather & irradiance data:
```javascript
const url = `https://api.openweathermap.org/data/3.0/onecall?lat=${lat}&lon=${lon}&appid=${KEY}`;
```

### 4. Stripe Payment Integration
For paid plans:
```html
<script src="https://js.stripe.com/v3/"></script>
```
```javascript
const stripe = Stripe('pk_live_...');
stripe.redirectToCheckout({ lineItems: [{price: 'price_pro', quantity: 1}], mode: 'subscription' });
```

### 5. Supabase (Backend Storage)
For user accounts and cloud project storage:
```javascript
import { createClient } from '@supabase/supabase-js';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
await supabase.from('projects').insert([projectData]);
```

### 6. Google Maps / Mapbox
For roof visualization and shading analysis:
```javascript
const map = new google.maps.Map(el, { center: {lat, lng}, zoom: 20, mapTypeId: 'satellite' });
```

### 7. PDF Generation (jsPDF)
For true PDF (not HTML) download:
```html
<script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
```

### 8. Email Reports (SendGrid)
Auto-email reports to clients via a serverless function:
```javascript
// netlify/functions/send-report.js
const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);
await sgMail.send({ to: clientEmail, from: 'salatrir@gmail.com', subject: 'Your Solar Report', html: reportHtml });
```

---

## 👥 Target Users

| User Type | Key Features Used |
|-----------|-----------------|
| 🏠 Homeowners | Calculator, Bill Analyzer, AI Advisor, Knowledge Center |
| ⚡ Solar Engineers | Full Calculator, Equipment Recommender, Report Generator |
| 🏢 Installation Companies | Dashboard, Client Management, Reports, All Calculators |
| 🏗️ Commercial Owners | Cost Estimator, ROI Analysis, Professional Reports |
| 💼 Investors | ROI Calculator, 25-Year Projections, Portfolio Dashboard |

---

## 💳 Pricing Plans

| Plan | Price | Best For |
|------|-------|----------|
| **Free** | $0/mo | Homeowners, quick estimates |
| **Professional** | $29/mo | Solar engineers, consultants |
| **Company** | $79/mo | Installation companies (5 users) |
| **Enterprise** | Custom | Large companies, custom needs |

Contact: **salatrir@gmail.com** for Enterprise pricing.

---

## 🔍 SEO & Performance

### Target Keywords
- Solar Calculator
- Solar Panel Calculator
- Solar ROI Calculator
- Solar Cost Estimator
- AI Solar Advisor
- Solar Energy Planning
- Photovoltaic System Design
- Free Solar Calculator
- Solar Savings Calculator

### SEO Features Implemented
- ✅ `<title>` and `<meta description>` optimized
- ✅ Open Graph tags (Facebook, LinkedIn)
- ✅ Twitter/X Card tags
- ✅ Schema.org `SoftwareApplication` markup
- ✅ Schema.org `Calculator` type
- ✅ `sitemap.xml` with hreflang for 3 languages
- ✅ `robots.txt` configured
- ✅ Canonical URL
- ✅ PWA manifest
- ✅ Semantic HTML5 (`<nav>`, `<main>`, `<section>`, `<footer>`, ARIA labels)

### Performance
- ✅ No JavaScript framework — vanilla JS only
- ✅ No build step required
- ✅ CSS custom properties for instant theming
- ✅ Font loaded via Google Fonts with display=swap
- ✅ localStorage for offline project persistence
- ✅ Lazy calculation — runs only on submit
- ✅ Single CSS file, minifiable
- ✅ No unnecessary dependencies

---

## 📞 Contact & Support

**Email:** [salatrir@gmail.com](mailto:salatrir@gmail.com)

For:
- 🐛 Bug reports
- 💡 Feature requests
- 🤝 Partnership inquiries
- 💼 Enterprise licensing
- 🔧 Custom development

---

## 📜 License

MIT License — free for personal and commercial use.

```
Copyright (c) 2025 SolarGPT — LLM.Solar
```

---

## 🙏 Acknowledgements

- [Anthropic Claude](https://anthropic.com) — AI Advisor engine
- [Google Fonts — Sora](https://fonts.google.com/specimen/Sora) — Typography
- [JetBrains Mono](https://www.jetbrains.com/lp/mono/) — Code font
- Solar irradiance data methodology: PVGIS / NASA SSE
- Equipment pricing data: industry averages (2024–2025)

---

*Built with ❤️ and ☀️ for a sustainable future — SolarGPT / LLM.Solar*
