# School Result Ledger — GPA Engine

- **Team ID:** LSH26-T015
- **Problem ID:** P08 — School Result Processing and GPA Engine
- **Repository:** `lsh26-t015-p08`
- **Live URL:** PLACEHOLDER: `https://<your-username>.github.io/lsh26-t015-p08/`

A deterministic grading engine plus an office-facing UI: load a result
set, get every student's GPA and letter grade, see the exact rule that
produced every grade point, and get the three verification lists before
results go out.

---

## Setup and run

No build step, no dependencies, no server required.

1. Clone or download this repository.
2. Open `index.html` directly in a browser (double-click it, or
   `file:///path/to/index.html`).
3. That's it — the fixture data is embedded in `data.js`, so the app is
   fully self-contained.

To run it from a local static server instead (optional, e.g. for
consistent relative-path behavior):

```bash
python3 -m http.server 8000
# then open http://localhost:8000/index.html
```

To run the automated smoke test (optional, requires Node):

```bash
npm install
python3 -m http.server 8791 &      # serve the folder in the background
node smoke_test.js                  # headless-browser check
```

---

## Proof that each requirement is met

The brief's four numbered requirements, plus the clarifications (R-10
through R-13, R-29), mapped to what's on screen and in code.

### 1. Dataset: 60+ students, two classes, hard edges

The organizer-supplied fixture (`data.js`, all 25 published cases) is
embedded directly — nothing is synthesized. The default case (`PUB-01`)
alone has 80 students across **Class 9** and **Class 10**, all with six
compulsory subjects and one optional subject. All four required hard-edge
students are present and verified in this data:

| Hard edge | Example |
|---|---|
| Failed subject, strong average | Student S004 — raw average 4.67, fails only Mathematics |
| Practical fail, passing theory | Student S010 — passes theory in Chemistry/Higher Maths, fails on practical marks |
| Optional subject below the help threshold | Student S002 — optional grade point 1.0 (≤ 2.0 contributes nothing) |
| Absent in one subject | Student S032 — AB in Biology |

`SCREENSHOT PLACEHOLDER`

### 2. Per-subject grade point, final GPA, letter grade

Implemented in `engine.js` (`evaluateSubject`, `evaluateStudent`,
`evaluateCase`) and shown per student in the "All Students" table (GPA,
Letter, Result columns).

`SCREENSHOT PLACEHOLDER`

### 3. Per-student trace, with the failing subject identifiable

Clicking any student row opens a trace drawer: every subject shows the
marks used, the grade point produced, and the sentence that justifies it
(citing the rule). A compulsory subject that caused a fail is circled in
red with a "← caused the fail" note — verified against a real case
(Lamia Islam, S002): a 3.0/2.0/1.0 start in Bangla/English/Maths, but
Physics and Biology both fail on the practical component, correctly
cancelling the whole result to GPA 0.00 / F, with the uncancelled average
(1.33) still shown for hand-verification.

`SCREENSHOT PLACEHOLDER`

### 4. Office checking list

Three tabs next to "All Students" implement the R-29 lists exactly:
Optional-Subject List, Practical-Fail List, Absent List. Each row carries
a plain-language reason (e.g. "Practical below pass mark in Chemistry,
Higher Mathematics.") so a teacher can verify by hand without re-deriving
anything. A student can appear on more than one list, shown with `AB` /
`PR` / `OPT` badges. Verified edge case: a student who fails the practical
**only in their optional subject** (S077) correctly still shows PASS
(only compulsory failures cancel the result), while still appearing on
the Practical-Fail list, per R-29.

`SCREENSHOT PLACEHOLDER`

### Rule-by-rule mapping (R-10 – R-13, R-29)

| Rule | Where it's implemented |
|---|---|
| R-10 — mark → grade point bands, letter grade bands | `GRADE_BANDS`, `gradeBand()`, `letterFromGPA()` in `engine.js` |
| R-11 — theory/practical separate pass marks, either failing fails the subject | `evaluateSubject()` practical branch |
| R-12 — absence in compulsory vs. optional | `evaluateSubject()` absence branch |
| R-13 — GPA formula, 5.00 cap, compulsory-failure cancellation, uncancelled average kept visible | `evaluateStudent()` |
| R-29 — the three checking lists | `evaluateCase()` |

---

## Major decisions

- **Zero build step, zero server dependency.** Plain HTML/CSS/JS with
  `<script src>` tags, so the app runs from `file://` with a double-click
  — no npm install required to use it (only to run the optional smoke
  test).
- **Fixture data embedded, not fetched.** All 25 cases are inlined into
  `data.js` as a JS object literal rather than fetched via `fetch()`,
  avoiding CORS restrictions that block local-file fetches in some
  browsers.
- **Engine kept pure and separate from the UI.** `engine.js` has no DOM
  access — every function takes plain data in and returns plain data
  out, so grading logic can be reasoned about (and tested) independently
  of rendering.
- **Uncancelled average always computed, never hidden.** Per R-13, when a
  compulsory failure forces GPA to 0.00, the raw average is still
  calculated and shown in the trace so the office can verify the
  arithmetic by hand rather than just trusting the cancellation.
- **Visual design.** A school mark-register theme (ruled paper, brass
  header, monospace numerals) with a hand-drawn red-pen circle marking
  the exact subject that caused a fail — a direct, literal answer to the
  brief's "the trace must show the subject that caused it."

## Known limitations

- Requires internet access on first load to fetch Google Fonts (Source
  Serif 4, IBM Plex Mono, Inter, Kalam) from `fonts.googleapis.com`; the
  app still functions with system fallback fonts if that's unreachable.
- No automated unit-test suite beyond a single headless-browser smoke
  test (`smoke_test.js`); correctness was verified by inspection and by
  cross-checking on-screen stats against the engine's own computed
  output across multiple fixture cases.
- `data.js` embeds all 25 fixture cases inline (~430 KB) rather than
  loading them on demand, to keep the app fully self-contained; this is
  larger than a lazily-fetched JSON file would be.
- The "Load your own JSON" file input accepts the documented fixture
  schema only; it does not validate or repair malformed input beyond a
  basic shape check.

---

## Approach

We read the brief and clarifications first and treated the grading rules
(R-10–R-13, R-29) as the specification to implement exactly, not to
interpret loosely — the engine encodes each one as a small, separately
readable function, and every subject's trace cites the rule that applies.
We used the organizer-supplied fixture data as-is (verified byte-for-byte
identical to the original file) rather than generating synthetic data,
since it already contained every required hard-edge case. Once the
grading logic was correct and cross-checked, we built the UI around it —
a mark-register look, a per-student trace, and the three checking lists —
and verified the whole thing end-to-end with a headless-browser smoke
test before submission.

## Team contributions
| Registered name | GitHub username | What they mainly built | Where to see it |
|---|---|---|---|
| Nahid Ibn Zaman | nahidzaman1996271-sketch | Repository structure, GitHub Pages deployment, and submission logistics | `EVENT.md`, repository settings, final submission commit |
| Farhan Ishraq Ifti | 252-35-648-ops | The grading engine and report UI — prompted, reviewed, and iterated with Claude, and verified generated code against the brief's rules | `src/engine.py`, `src/process.py` |
| Tahmid Hossain Pranjol | Tahmid-442 | QA — tested all four required hard-edge cases against the live app, cross-checked checking lists and trace output against the fixture data, and verified the requirement-by-requirement proof | `README.md` §4 (proof table), `output/checking_list.csv` |
| Mahmuda Khanum | 252-35-537-del | Documentation and evidence — wrote/reviewed `README.md`, `LICENSES.md`, and `evaluation-manifest.json`, and captured screenshots | `README.md`, `LICENSES.md`, `evaluation-manifest.json` |
