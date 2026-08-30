# School Result Ledger — GPA Engine (P08)

A single, deterministic grading engine plus an office-facing UI: load a
result set, get every student's GPA and letter grade, see the exact rule
that produced every grade point, and get the three verification lists
before results go out.

No build step. No server required. Open `index.html`.

## Files

| File | Purpose |
|---|---|
| `index.html` | Page shell — loads the three scripts below in order. |
| `engine.js` | The grading logic. Pure functions, no DOM. This is the part that matters for correctness. |
| `data.js` | All 25 published fixture cases, embedded as `window.FIXTURES` (so the app works from `file://` with no server/CORS issues). |
| `app.js` | Rendering + interaction: table, tabs, search, the per-student trace drawer. |
| `styles.css` | Visual design — a school mark-register: ruled paper, a red pen for the trace. |
| `smoke_test.js` | Headless Puppeteer check that the page renders, the stats match the engine's own output, and the trace opens (`npm install puppeteer` then `node smoke_test.js` against a local static server). |

## How the rules map to code (`engine.js`)

- **R-10** — mark → grade-point bands (80/70/60/50/40/33) and the letter-grade
  bands (A+/A/A-/B/C/D/F) → `GRADE_BANDS`, `gradeBand()`, `letterFromGPA()`.
- **R-11** — practical subjects: theory out of 75 (pass ≥25), practical out
  of 25 (pass ≥8); failing either part fails the whole subject (grade point
  0.0) regardless of the total → handled in `evaluateSubject()`.
- **R-12** — absence: `"AB"` in a **compulsory** subject → grade point 0.0 and
  the whole result is F; `"AB"` in the **optional** subject → contributes 0
  and the student lands on the Absent checking list, but does not by itself
  fail the student → also in `evaluateSubject()`.
- **R-13** — `GPA = (sum of 6 compulsory grade points + max(0, optional GP − 2)) / 6`,
  capped at 5.00, 2 decimal places → `evaluateStudent()`. Any compulsory
  failure forces GPA to 0.00 / letter F, but the **uncancelled** average
  (`rawGPA`) is computed and kept on the student object so the trace can
  still show it for hand-verification.
- **R-29** — the three checking lists, computed in `evaluateCase()`:
  - *Optional list*: optional subject's grade point ≤ 2.0 (an absent
    optional counts, since it contributes 0).
  - *Practical list*: practical mark below 8 in **any** subject, compulsory
    or optional (note: a practical fail in the *optional* subject alone
    does not fail the student — it still shows up here for the office to
    check, and the fixture data has real examples of exactly this).
  - *Absent list*: `"AB"` in any subject.
  - A student can appear on more than one list, and the UI shows this with
    `AB` / `PR` / `OPT` badges plus the reason column on each list tab.

## The trace (requirement 3)

Click any student row to open the "script" drawer. Every subject shows the
marks used, the grade point it produced, and the exact sentence that
justifies it, citing the rule. Any compulsory subject that caused a fail is
circled in red with a "← caused the fail" note, so a student with a high
raw average who still failed is diagnosable at a glance — the failing
subject is visually impossible to miss.

## The checking list (requirement 4)

The three tabs next to "All Students" are exactly the R-29 lists. Each row
carries a plain-language reason (e.g. "Practical below pass mark in
Chemistry, Higher Mathematics.") so a teacher can go verify by hand without
re-deriving anything.

## Using your own data

The **Load your own JSON** control accepts either a full fixture file
(`{ "cases": [...] }`) or a single case object
(`{ "case_id", "subjects", "compulsory", "students" }`) in the schema
described in the brief's `format_note`. It replaces the dataset dropdown
with whatever case IDs are in the file.

## Verifying correctness

`smoke_test.js` drives a real (headless) browser against the page and
checks that the on-screen stat strip matches what `engine.js` computes
independently, that a student's trace opens, and that the red-pen fail
annotation renders. It's not a substitute for real unit tests, but the
engine's small, pure-function design (`evaluateSubject` → `evaluateStudent`
→ `evaluateCase`) makes it straightforward to unit test directly — each
function takes plain data in and returns plain data out.
