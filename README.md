# Portfolio versions

The live site is whatever is on `main`; the three versions below are kept so any of them can come back.

| Version | What it is | Where it lives |
|---|---|---|
| **v1** | The site as deployed before the redesign (`origin/main` at `003734d`, lime accent, original home) | git tag `v1-live`; browsable at `/home-v1`, `/work-hypersense-v1`, `/work-reconciliation-v1`, `/work-skilling-v1`, `/resume-v1`, `/contact-v1` (all noindex, styled by `styles-v1.css`) |
| **v1b** | Work in progress on this branch just before the home-v2 promotion (Variation B, glass cards, copy edits) | git tag `pre-home-v2` |
| **v2** | The current design: home-v2 as the home, dark + neutral white, project colour on case studies, polaroid section, Up-skill rail everywhere, page transitions | git tag `v2`; it is the live pages (`index.html`, `work-*.html`, `resume.html`, `styles.css`) |

## The colour + shader lab (the "preview theme" panel)
The theme, colour and shader switcher is stored, not deleted. Open it at `/lab-home`, `/lab-work-hypersense`,
`/lab-work-reconciliation`, `/lab-work-skilling` and `/lab-resume` (noindex, not linked from the site). The scripts
and rebuild notes are in `tools/colour-lab/`. The old `-fx`, `/home-v2` addresses redirect to the live pages.

## Rolling back
- Look at a version: `git checkout v1-live` (or `v2`), then serve the folder.
- Bring one back as the live site: `git checkout v1-live -- index.html styles.css work-hypersense.html work-reconciliation.html work-skilling.html resume.html contact.html` and commit.
- Nothing is pushed automatically: `git push origin v1-live v2` shares the tags.
