# School Result Ledger — GPA Engine

Solution for **LofiStack Hackathon 2026 — P08**

## Project information

- **Team:** `Candy Crush`
- **Team ID:** `LSH26-T015`
- **Problem:** `P08 — School Result Processing and GPA Engine`
- **Live application:** `https://<your-username>.github.io/lsh26-t015-p08/` (PLACEHOLDER — insert final Pages URL)
- **Demo video:** None

> Judges will evaluate only the exact commit SHA entered in the Final Submission Form.

## Solution summary

A deterministic grading engine plus an office-facing UI: load a result set, get every student's GPA and letter grade, see the exact rule that produced every grade point, and get the three verification lists (optional-subject, practical-fail, absent) before results go out.

## Requirements

| Requirement | Status | Where to verify |
|---|---|---|
| R1 — Dataset: 60+ students, two classes, hard edges | Complete | Default dataset `PUB-01` (80 students, Class 9 & 10); "All Students" table |
| R2 — Per-subject grade point, final GPA, letter grade | Complete | `engine.js` (`evaluateSubject`, `evaluateStudent`, `evaluateCase`); GPA/Letter/Result columns in "All Students" table |
| R3 — Per-student trace, failing subject identifiable | Complete | Click any student row to open the trace drawer; red-pen circle marks the subject that caused a fail |
| R4 — Office checking list | Complete | "Optional-Subject List", "Practical-Fail List", "Absent List" tabs next to "All Students" |
| R5 — Grading-rule clarifications (R-10–R-13, R-29) | Complete | `engine.js` — `GRADE_BANDS`, pass-mark constants, GPA formula, checking-list logic |

## How to test the application

1. Open the live application.
2. Use the **Dataset** dropdown to switch between the 25 published fixture cases (default: `PUB-01`).
3. Click any row in the "All Students" table to open the per-student trace drawer, or switch to the "Optional-Subject List", "Practical-Fail List", or "Absent List" tab to see the office checking lists.
4. Expected result: GPA, letter grade, and result (Pass/Fail) match the rule-by-rule trace shown in the drawer; students with a compulsory-subject failure show GPA 0.00/F with the uncancelled average still visible for hand-verification.

### Test or sample data

The organizer-supplied fixture (`P08_school_results_public.json`, all 25 published cases) is embedded directly in `data.js` and loaded automatically — no upload step is required to see the default dataset. To test with different data, use the **"Load your own JSON"** file input to load a JSON file matching the documented fixture schema. There is no mutable state to reset: since `data.js` is static, simply reloading the page restores the original fixture.

## Run locally

### Requirements

- Any modern web browser (no runtime required to use the app)
- Node.js (only required to run the optional smoke test)

### Setup

```bash
git clone <PUBLIC-REPOSITORY-URL>
cd lsh26-t015-p08
# No install needed to run the app — open index.html directly in a browser,
# or serve it locally:
python3 -m http.server 8000
# then open http://localhost:8000/index.html

# Optional: run the automated smoke test (requires Node)
npm install
python3 -m http.server 8791 &
node smoke_test.js
```

No environment variables or secrets are required — the app is fully static and self-contained.

## Problem-solving approach

We read the brief and clarifications first and treated the grading rules (R-10–R-13, R-29) as the specification to implement exactly, not to interpret loosely — the engine encodes each one as a small, separately readable function, and every subject's trace cites the rule that applies. We used the organizer-supplied fixture data as-is (verified byte-for-byte identical to the original file) rather than generating synthetic data, since it already contained every required hard-edge case. We validated against the full 25-case public dataset (1,765 students), not just the first case, and specifically hand-recomputed the four required hard-edge cases (high-average compulsory fail, practical fail with passing theory, absence, optional below the help threshold) against the engine's output before trusting the rest. Once the grading logic was correct and cross-checked, we built the UI around it — a mark-register look, a per-student trace, and the three checking lists — and verified the whole thing end-to-end with a headless-browser smoke test before submission.

## Technology used

- **Frontend:** Vanilla HTML, CSS, and JavaScript (no framework — `index.html`, `engine.js`, `app.js`, `styles.css` written from scratch)
- **Backend:** None — fully static, dependency-free client app
- **Database:** None — fixture data embedded in `data.js`
- **Deployment:** GitHub Pages
- **Other material tools:** Puppeteer (dev-only headless-browser smoke test)

See [`LICENSES.md`](LICENSES.md) for third-party materials.

## Team contributions

| Registered member | GitHub username | Major contribution | Evidence |
|---|---|---|---|
| Nahid Ibn Zaman | `nahidzaman1996271-sketch` | Repository structure, GitHub Pages deployment, and submission logistics | `EVENT.md`, repository settings, final submission commit |
| Farhan Ishraq Ifti | `252-35-648-ops` | The grading engine and report UI — prompted, reviewed, and iterated with Claude, and verified generated code against the brief's rules | `engine.js`, `app.js`, `data.js` |
| Tahmid Hossain Pranjol | `Tahmid-442` | QA — tested all four required hard-edge cases against the live app, cross-checked checking lists and trace output against the fixture data, and verified the requirement-by-requirement proof | `README.md` (proof table), `smoke_test.js` |
| Mahmuda Khanum | `252-35-537-del` | Documentation and evidence — wrote/reviewed `README.md`, `LICENSES.md`, and `evaluation-manifest.json`, and captured screenshots | `README.md`, `LICENSES.md`, `evaluation-manifest.json` |

Commit count alone does not represent contribution.

## AI usage

- **Claude** — used to draft and iterate on the grading engine (`engine.js`) and report UI (`app.js`/`data.js`) logic against the brief's rules and clarifications (R-10 through R-29). Output was verified by manually recomputing GPA and grade points by hand for representative students covering all four required hard-edge cases, and by cross-checking the on-screen checking lists directly against the fixture data.

## Major design decisions

- **Zero build step, zero server dependency.** Plain HTML/CSS/JS with `<script src>` tags, so the app runs from `file://` with a double-click — no npm install required to use it (only to run the optional smoke test).
- **Fixture data embedded, not fetched.** All 25 cases are inlined into `data.js` as a JS object literal rather than fetched via `fetch()`, avoiding CORS restrictions that block local-file fetches in some browsers.
- **Engine kept pure and separate from the UI.** `engine.js` has no DOM access — every function takes plain data in and returns plain data out, so grading logic can be reasoned about (and tested) independently of rendering.
- **Uncancelled average always computed, never hidden.** Per R-13, when a compulsory failure forces GPA to 0.00, the raw average is still calculated and shown in the trace so the office can verify the arithmetic by hand rather than just trusting the cancellation.
- **Standard SSC grade-band table.** The brief specified pass marks and the GPA formula but not the mark-to-grade-point table itself, so the standard Bangladesh SSC bands (A+ 80–100 = 5.00 down to F 0–32 = 0.00) were used, isolated to one constant (`GRADE_BANDS`) in `engine.js`.
- **Visual design.** A school mark-register theme (ruled paper, brass header, monospace numerals) with a hand-drawn red-pen circle marking the exact subject that caused a fail — a direct, literal answer to the brief's "the trace must show the subject that caused it."

## Known limitations

- Requires internet access on first load to fetch Google Fonts (Source Serif 4, IBM Plex Mono, Inter, Kalam) from `fonts.googleapis.com`; the app still functions with system fallback fonts if that's unreachable.
- No automated unit-test suite beyond a single headless-browser smoke test (`smoke_test.js`); correctness was verified by inspection and by cross-checking on-screen stats against the engine's own computed output across multiple fixture cases.
- `data.js` embeds all 25 fixture cases inline (~430 KB) rather than loading them on demand, to keep the app fully self-contained; this is larger than a lazily-fetched JSON file would be.
- The "Load your own JSON" file input accepts the documented fixture schema only; it does not validate or repair malformed input beyond a basic shape check.

## Repository records

- [`EVENT.md`](EVENT.md) — event start code and pre-event-material declaration
- [`evaluation-manifest.json`](evaluation-manifest.json) — structured judging evidence
- [`LICENSES.md`](LICENSES.md) — frameworks, libraries, templates and assets
