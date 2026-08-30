# Licenses and Third-Party Material

This project is a static, dependency-free web app. No frontend framework,
starter kit, or template was used — `index.html`, `engine.js`, `app.js`,
and `styles.css` were written from scratch for this submission.

## Fonts

Loaded at runtime via Google Fonts CDN (`index.html`), all under the SIL
Open Font License 1.1:

| Font | Used for | License |
|---|---|---|
| Source Serif 4 | Headings | SIL OFL 1.1 |
| IBM Plex Mono | Marks, grade points, data | SIL OFL 1.1 |
| Inter | UI labels, buttons | SIL OFL 1.1 |
| Kalam | Red-pen trace annotations | SIL OFL 1.1 |

No font files are vendored in the repository; they are fetched from
`fonts.googleapis.com` / `fonts.gstatic.com` at page load.

## Icons / assets

None used. The "circled fail" annotation on the trace screen is a hand-authored
inline SVG path (`app.js`, `PEN_CIRCLE_SVG`), not a third-party icon or asset.

## Data

`data.js` embeds the problem-set fixture data (`P08_school_results_public.json`)
supplied by the event organizers for this problem. This data was not
authored by the team and is used only as the input dataset the tool
operates on, per the participant pack.

## Development tooling (not shipped to users)

| Tool | Purpose | License |
|---|---|---|
| Puppeteer | Headless-browser smoke test (`smoke_test.js`), used only during development to verify the page renders correctly | Apache-2.0 |

Puppeteer is listed only as a `devDependency` in `package.json` and is not
loaded by `index.html` or required to run the app.

## Frameworks / libraries

None. No React, Vue, jQuery, Bootstrap, Tailwind, or similar library is
used anywhere in the shipped app.
