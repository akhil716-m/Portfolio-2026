# Colour + shader lab (stored, not part of the live site)

The live site has the chosen look baked in (dark, neutral white, project colours). This folder and the
`lab-*` pages keep the switcher so it can be brought back.

- Pages: `/lab-home`, `/lab-work-hypersense`, `/lab-work-reconciliation`, `/lab-work-skilling`, `/lab-resume` (noindex, not linked).
  They show a floating "Colour + shader preview" panel. Old `-fx` and `/home-v2` addresses redirect to the live pages.
- Scripts (`assets/shader-preview.js`, `case-preview.js`, `resume-preview.js`, `fx/fx-core.js`) drive the panels.
- Originals: `home-v1`, `work-*-v1`, `resume-v1`, `styles-v1.css`, and git tag `pre-home-v2`.
- `build_fx.py` rebuilds the lab pages from `lab-home-source.html` + the `*-v1` pages (run from the repo root).
- `build_prod.py <this folder>` bakes chosen settings into the live pages. NOTE: it regenerates `index.html`,
  `work-*.html`, `resume.html` and `styles.css`, so hand edits made to those since (sentence size, Revenue Recovery
  thumbnail and arrow) would need re-applying.
