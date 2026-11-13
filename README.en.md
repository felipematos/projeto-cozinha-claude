# Kitchen & Dining Area Project — Covered Area

🇧🇷 [Português](README.md) · 🇺🇸 English

Architectural project to turn the **covered area** at the back of the house into a **semi-open kitchen + dining area**, in a rustic style with reclaimed wood.

## 👉 [Open the project online](https://felipematos.github.io/projeto-cozinha-claude/)

https://felipematos.github.io/projeto-cozinha-claude/

## What it is

A web app (no build step, three.js via CDN) available in **Portuguese and English** (language selector at the top), with:

- **Interactive floor plan**: drag, rotate and resize furniture, with live dimensions, snapping, collision checks, undo/redo and a measuring tool.
- **Detailed 3D view**: orbit, walk mode, procedural textures, ambient occlusion and measuring in 3D.
- **Export**: floor plan PDF at 1:50 scale, PNG of the 3D views, and a cabinet-making PDF (numbered plan, one sheet per cabinet, cut list and granilite countertops).

The layout is saved in the browser (`localStorage`) and can be exported/imported as JSON.

> The language selector translates the interface, the floor plan and the PDFs (floor plan and cabinet-making plans).

## Run locally

It needs an HTTP server (textures do not load over `file://`):

```bash
python3 -m http.server 8765 --directory app
```

Then open http://localhost:8765.

## Structure

| Folder | Contents |
|---|---|
| `app/` | Web application (published on GitHub Pages) |
| `projeto/` | Floor plan PDF, sketch and furniture dimensions |
| `móveis/`, `ambiente/` | Photos of the existing furniture and of the current space |
| `referencias/` | Reference images (cabinets, plates, etc.) |
| `layouts-salos/` | Saved layouts |
| `docs/` | The project's initial prompt |

Dimensions, requirements and code architecture are documented in [`CLAUDE.md`](CLAUDE.md) (in Portuguese). The prompt that started the project is in [`docs/prompt-inicial.md`](docs/prompt-inicial.md) (in Portuguese).

## Publishing

Every push to the `main` branch publishes the `app/` folder to GitHub Pages through the workflow [`.github/workflows/pages.yml`](.github/workflows/pages.yml).
