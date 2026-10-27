# Isometric drawing generators (v3)

Each script prints inline SVG in the Hairline-style isometric language used on the v3 pages
(faces `.f-t` top, `.f-l` / `.f-r` sides, `.f-acc` green or project-colour accent). Paste the
output into the page; the page's CSS styles and animates it.

Run from this folder (isokit.py and isoplinth.py reuse the helpers in isonow.py):

    cd tools/iso && python3 isonow.py

| Script | Draws | Used on |
|---|---|---|
| isonow.py | Currently objects (board, blocks, books, record) | home-v3 |
| isokit.py | Skills blocks, Tools toolbox | home-v3 |
| isoplinth.py | About portrait stand | home-v3 |
| isoflow.py, isoscale.py, isoconverge.py, isostats.py | HyperSense visuals | work-hypersense-v3 |
| recon1.py | One transaction, three records | work-reconciliation-v3 |
