# IGI Associate Readiness Profile — Deployment Guide

## What you have
- **IGI_Associate_Readiness_Profile.html** — The complete frontend app (self-contained, runs in any browser)
- **IGI_ARP_AppsScript.js** — Google Apps Script backend (logs all responses to Google Sheet)

---

## Step 1 — Set up the Google Sheet backend

1. Open **Google Drive** → New → Google Sheets → rename to **IGI ARP Responses**
2. Click **Extensions** → **Apps Script**
3. Delete any existing code in the editor
4. Paste the entire contents of `IGI_ARP_AppsScript.js`
5. Click **Save** (disk icon)
6. Click **Deploy** → **New Deployment**
   - Type: **Web App**
   - Execute as: **Me**
   - Who has access: **Anyone** (for public form) or **Anyone with Google account** (internal)
7. Click **Deploy** → **Authorize** (grant permissions)
8. **Copy the Web App URL** — it looks like: `https://script.google.com/macros/s/XXXX/exec`

---

## Step 2 — Connect the frontend to the Sheet

1. Open `IGI_Associate_Readiness_Profile.html` in any text editor (Notepad, VS Code, etc.)
2. Find this line near the top of the `<script>` section:
   ```
   const SHEET_URL = 'YOUR_APPS_SCRIPT_WEB_APP_URL_HERE';
   ```
3. Replace `YOUR_APPS_SCRIPT_WEB_APP_URL_HERE` with the URL you copied in Step 1
4. Save the file

---

## Step 3 — Deploy on Vercel (to add to existing RSP app)

### Option A — Standalone page at new URL
1. Create a new folder, put `IGI_Associate_Readiness_Profile.html` in it, rename to `index.html`
2. Go to **vercel.com** → Import → drag the folder
3. Deploy → you get a URL like `igi-arp.vercel.app`
4. Share this URL with all training participants

### Option B — Add to existing igi-rsp-assessment.vercel.app
1. In your existing Vercel project (GitHub repo), add `IGI_Associate_Readiness_Profile.html`
2. Add a route in your app or rename to `arp.html`
3. Access at: `igi-rsp-assessment.vercel.app/arp.html`
4. Or redirect the homepage to the new combined assessment

---

## Step 4 — Test before launch

1. Open the HTML file directly in Chrome (File → Open)
2. Complete all 4 screens: Details → C2S (24 questions) → RSP (10 questions) → Results
3. Verify the profile card shows correctly
4. Check your Google Sheet — you should see a new row with all 23 columns populated
5. Test at least 2–3 different profile combinations

---

## What the Google Sheet captures (23 columns)

| Column | Data |
|--------|------|
| Timestamp | ISO datetime of submission |
| Ref ID | e.g. IGI-2605-4237 |
| Name | Associate's full name |
| Mobile | Phone number |
| Jewelry Brand | Store/brand name |
| Store Branch | City/location |
| Designation | Job title |
| Experience | Years of experience |
| Country | Country selected |
| C2S Primary Style | Analytical / Amiable / Expressive / Driver |
| C2S Scores (JSON) | Raw quadrant scores |
| C2S Analytical | Score (0–24) |
| C2S Amiable | Score (0–24) |
| C2S Expressive | Score (0–24) |
| C2S Driver | Score (0–24) |
| RSP Primary Persona | Hunter / Farmer / Advisor / Connector |
| RSP Scores (JSON) | Raw persona scores |
| RSP Hunter | Score (0–10) |
| RSP Farmer | Score (0–10) |
| RSP Advisor | Score (0–10) |
| RSP Connector | Score (0–10) |
| Combined Profile | e.g. Expressive-Connector |
| Insight Title | e.g. The Floor Personality |

---

## The 16 Combined Profiles (full matrix)

| C2S \ RSP | Hunter | Farmer | Advisor | Connector |
|-----------|--------|--------|---------|-----------|
| **Analytical** | Precision Closer | Trusted Expert | Knowledge Authority | Thoughtful Welcomer |
| **Amiable** | Warm Pursuer | Relationship Keeper | Gentle Guide | Experience Creator |
| **Expressive** | High-Energy Closer | Enthusiastic Nurturer | Storytelling Expert | Floor Personality |
| **Driver** | Results Machine | Efficient Relationship Builder | Decisive Authority | Purposeful Host |

---

## Customization notes

- **Batch code field**: Can be added to the Details screen by adding an `<input>` for `batchCode` 
- **IGI Centre field**: Add dropdown for Mumbai / Delhi / Kolkata / Surat / Chennai etc.
- **Staff vs Public mode**: Currently public (no anti-cheat). For staff certification, add the same one-attempt + Ref ID lockout logic from the 4Cs quiz
- **Language tweak** (per Leslie's feedback): All 16 coaching insights use warm, conversational English — review with Leslie before launch and adjust any phrasing that feels too direct for your audience

---

## Share URL format for WhatsApp blast

```
Hi [Name],

Please complete your IGI Associate Readiness Profile before our session tomorrow.
It takes about 15 minutes and covers two quick assessments.

Link: [YOUR VERCEL URL]

This is NOT a test — it's a self-discovery tool to help you understand your 
natural strengths on the floor.

See you tomorrow!
Sunil / IGI School of Gemology
```
