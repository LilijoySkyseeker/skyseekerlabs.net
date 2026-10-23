# AGENTS.md

The source of skyseekerlabs.net: a Zola site built and served with Nix.

## Commands

- Build: `nix build` (output in `result/`), or `nix develop -c zola build`.
- Preview: `nix develop -c zola serve`.
- Zola is 0.23, so templates are **Tera 2**: components instead of macros
  (`templates/components.html`), `a[0]` instead of `a.0`, tests take keyword
  arguments (`is starting_with(pat="...")`).

## Layout

- `content/`: one Markdown file per page. Writing in `writing/`, projects in
  `projects/`, Nimbus's daily weather in `weather/` (one file per day; the
  newest is "today").
- `data/`: the stickers (`stickers.json`) and the CV shared by the `/hire`
  pages (`cv.toml`). `static/data/quotes.json` is Xenia's quote jar.
- `templates/`: layout and components. `static/`: CSS, JS, fonts, art.
- The site must read and work without JavaScript; `static/js/site.js` is the
  fun layer on top (stickers, Xenia, Nimbus, vim keys, the terminal).

## Rules

- Copy voice: human, casual, witty. Plain sentences, no AI tics. No em
  dashes or stand-ins for them (en dash or spaced hyphen between clauses);
  ranges like 2023–2025 are fine. Ellipses are "...", never "…".
- Personal details: nothing beyond what the site already shows. Never add a
  phone number or a street address.
- Everything we make is CC0. Anything from someone else goes in ASSETS.md,
  with its source and terms, before it's committed.
- Every link points at its source where one exists.
