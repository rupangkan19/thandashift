# ThandaShift: heat-safe shift planner (prototype)

Global Sustainability Challenge 2026-27 · Adaptation & Resilience (Heat) · Team **Git Happens**, IIT Guwahati

ThandaShift turns hourly weather forecasts into **heat-stress levels for each working hour**. From those levels it builds:
- a **suggested shift plan** for site supervisors and delivery fleets: heavy work in cooler hours, rest at peak heat. The supervisor edits and approves it, and the approved plan is saved as a heat-safety log
- a short **WhatsApp-style alert** for each worker: safe hours, break rhythm, and the emergency number

## Try it
**Live demo: https://rupangkan19.github.io/thandashift/**

Open `index.html` through any static server (or GitHub Pages):
```bash
python -m http.server 8000
```
Then visit http://localhost:8000. The default view replays **23 Sep 2024 in Guwahati**, the city's hottest day of 2024. The air peaked at 38 °C, but the heat index ("feels like") peaked at 52 °C. Switch to "Live forecast" to see today's plan for any listed city.

## How it works
| File | What it does |
|---|---|
| `risk.js` | Heat index (US NWS Rothfusz formula) → Green/Yellow/Orange/Red level → draft work-rest guidance → shift planner → worker alert text |
| `index.html` | The web app. It fetches hourly temperature and humidity from the Open-Meteo API (forecast or historical archive) |
| `test.js` | Unit tests for the engine (`node test.js`) |
| `analysis/analyze_guwahati_2024.js` | Season analysis of Guwahati Apr–Sep 2024 hourly data. Outputs are in `analysis/output/` |

Levels use NWS heat-index bands (°C): Green < 32, Yellow 32–41, Orange 41–54, Red ≥ 54. The work-rest guidance is a **draft** and will be reviewed with occupational-health experts before any real use.

## Key finding from the 2024 Guwahati data (working hours 6am–7pm, Apr–Sep)
- 250 of 2,379 working hours (10.5%) were at **Orange** heat-stress level or above
- **98%** of those dangerous hours had an air temperature **below 37 °C**. Temperature-only warnings would miss them, because humidity drives the danger
- 50 days had at least one Orange hour. July was the worst month, with 80 Orange hours
- 12pm–2pm was the riskiest window: 22% of those hours were Orange or worse

Data: Open-Meteo historical weather archive (ERA5-based reanalysis, CC BY 4.0). Reanalysis is smoother than station data, so real street-level peaks are likely higher.

## Not in this prototype (planned)
The real WhatsApp Business API and voice (IVR) sending, multilingual message templates, worker symptom check-ins, and multi-site accounts.

*Prototype for demonstration only. Not medical advice.*
