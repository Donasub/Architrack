# Architrack
Architrack Building approval management for Nigerian architects. Architrack helps architects track, organise, and communicate building permit approvals across Nigerian states, replacing WhatsApp threads and paper checklists with a clean, centralised dashboard.
# Architrack

**Building approval management for Nigerian architects.**

Architrack helps architects track, organise, and communicate building permit approvals across Nigerian states — replacing WhatsApp threads and paper checklists with a clean, centralised dashboard.

---

## The Problem

Getting a building approved in Nigeria is slow, opaque, and fragmented. Requirements differ by state. There's no standard checklist. Architects manage 3–5 projects at once using WhatsApp and printed sheets. Clients call constantly asking "what's the update?" — because there's no other way to know.

Architrack fixes that.

---

## What It Does

Architrack is a **management and tracking tool** — not a government portal. Architects use it to prepare, organise, and track submissions. The actual submission still happens at the physical ministry. But everything before and after — the documents, the status, the client communication — lives in ApproTrack.

| Step | Where it happens |
|------|-----------------|
| Create project & generate checklist | ApproTrack |
| Prepare and check off required documents | ApproTrack |
| Submit drawings to ministry | Physical / government portal |
| Update approval status | ApproTrack |
| Client views progress | ApproTrack (read-only portal) |

---

## Features

### Project Dashboard
Create and manage all active approval projects in one place. Status tags, checklist progress bars, and recent activity — everything at a glance.

### State-Specific Checklist Generator
Select a state (Lagos, Abuja FCT, Benue, Rivers, Ogun, Kano) and get the exact document checklist required by that jurisdiction. Tick items off as you prepare them.

### Approval Status Tracker
Move projects through the pipeline manually:
`Draft → Submitted → Under Review → Approved / Rejected`

Each status change is logged with a timestamp in the activity timeline.

### Notifications & Reminders
Get alerted when documents are missing, when a status update is due, or when it's been too long since a ministry follow-up.

### Client View Portal
A read-only portal property owners can access to see their project's current status, timeline, and next steps — without needing to call their architect.

---

## Tech Stack

- **Frontend:** Vanilla HTML / CSS / JavaScript (single-file MVP)
- **No backend dependency** at MVP stage — state is managed in-memory
- **Fonts:** Syne (display) + DM Sans (body) via Google Fonts
- **Future:** Node.js / Express backend, PostgreSQL, REST API, government portal integrations via API

---

## Getting Started

This is a single-file HTML prototype. No build step required.

```bash
# Clone the repo
git clone https://github.com/yourusername/approtrack.git

# Open in browser
open approtrack.html
```

Or just open `approtrack.html` directly in any modern browser.

---

## Project Structure

```
approtrack/
├── approtrack.html        # Full MVP — UI, logic, and styles in one file
├── README.md
└── docs/
    └── mvp-document.html  # Product spec, user stories, roadmap
```

---

## State Coverage (MVP)

| State | Checklist Items |
|-------|----------------|
| Lagos | 8 documents |
| Abuja (FCT) | 7 documents |
| Benue | 9 documents |
| Rivers | 8 documents |
| Ogun | 7 documents |
| Kano | 7 documents |

More states will be added in subsequent releases based on user research.

---

## Roadmap

| Phase | Timeline | Focus |
|-------|----------|-------|
| MVP | Month 1–2 | Dashboard, Checklist, Status Tracker |
| Beta | Month 3 | 10–20 architects in Benue State |
| v1.1 | Month 4 | Notifications, Client Portal improvements |
| v1.2 | Month 5 | Expand to 10+ states |
| Launch | Month 6 | Public release + freemium pricing |

**Future:** Direct API integration with LASPPPA (Lagos), FCDA (Abuja), and other state ministry portals for real-time status syncing.

---

## Target Users

**Primary — Architects**
Managing multiple concurrent approval projects. Currently using WhatsApp + paper to track progress. Needs speed, clarity, and a way to look professional to clients.

**Secondary — Builders / Developers**
Need visibility into approval timelines to sequence site work without costly idle delays.

**Secondary — Property Owners / Clients**
Want to know what's happening with their project without making weekly calls to their architect.

---

## Business Model

| Tier | Price | Projects |
|------|-------|----------|
| Free | ₦0 | Up to 2 active projects |
| Pro | ₦15,000–₦18,000 / month | Unlimited + all features |

Launch strategy: start fully free to build trust and gather testimonials, then introduce Pro tier at Month 3 for users who've seen value.

---

## Contributing

This project is in active MVP development. If you're a Nigerian architect, developer, or product person who wants to help shape it — open an issue or reach out directly.

1. Fork the repo
2. Create a feature branch (`git checkout -b feature/your-feature`)
3. Commit your changes (`git commit -m 'Add your feature'`)
4. Push to the branch (`git push origin feature/your-feature`)
5. Open a Pull Request

---

## License

MIT License. See `LICENSE` for details.

---

*Built for the Nigerian built environment. Designed to reduce the 60+ day average approval timeline.*
