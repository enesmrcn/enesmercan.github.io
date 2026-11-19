# enesmercan.com

Personal website of Enes Mercan, Spacecraft Electronics Design Engineer.
It is plain HTML, CSS and JavaScript, with no framework and no build step. It is hosted on GitHub Pages.

The page is one scroll story:

1. **Entrance (cover):** name, title, key numbers.
2. **Mission Briefing:** highlights in plain language: counters, what I design, concept to orbit, missions, awards.
3. **Linear Vertical Time Machine:** scroll from today back to 2018. A date dial rolls back month by month.
4. **Next Mission:** contact.

## Preview on your computer

Open a terminal in this folder and run:

```
python -m http.server 8000
```

Then open <http://localhost:8000>. Double-clicking `index.html` does **not** work, because browsers block the scripts when a page is opened from a file.

## Things to add before going live

| What | Where | Notes |
|---|---|---|
| Portrait photo | `assets/img/portrait.jpg` | Run `python tools/optimize_images.py my-photo.jpg`. The site makes it greyscale and fades it into black. A photo on a plain, dark background (or a cut-out PNG) works best. |
| CV | `assets/cv/Enes-Mercan-CV.pdf` | Every "Download CV" button links here. |
| New role | `index.html`, the entry with `id="t-now"` | Replace the three `[...]` placeholders, then delete the word `hidden` on that line so the entry shows. |
| Email | Your domain registrar | Set up forwarding from `contact@enesmercan.com` to your inbox. |

## Editing the time machine

Each event is one `<li class="tm-entry ...">` block inside `<ol class="tm__list">` in `index.html`, newest first.

- `data-date="YYYY-MM"` sets where the event sits in time. The dial and the month ticks are calculated from it.
- Keep the blocks in date order (newest at the top).
- Entry types (the second class) set the marker shape:
  - `tm-entry--role`
  - `tm-entry--launch`
  - `tm-entry--edu`
  - `tm-entry--award`
- Technical bullets go inside `<details class="tm-details">`. Visitors open them with "Engineer's details".

A few entries carry approximate months, marked with a comment in the HTML. Replace them when you know the real month:
- 2024 MSc
- 2023 graduation
- 2022 award
- Space Club

## Deploying (GitHub Pages)

1. Install **GitHub Desktop** and sign in.
2. **File → Add local repository** → choose this `enesmercan-site` folder. Create a repository here, **not** in the parent folder, so no private documents end up on GitHub.
3. Publish it as `enesmrcn.github.io`. Before the first push, check that the changed-files list contains only website files.
4. On GitHub, open the repository, then **Settings → Pages**:
   - Source: deploy from branch `main`, folder `/ (root)`
   - Custom domain: `enesmercan.com` (the `CNAME` file already sets this)
5. At your domain registrar, add these DNS records:
   - `A` records for `@`: `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`
   - `AAAA` records for `@`: `2606:50c0:8000::153`, `2606:50c0:8001::153`, `2606:50c0:8002::153`, `2606:50c0:8003::153`
   - `CNAME` record: `www` → `enesmrcn.github.io`
6. When the DNS check passes, tick **Enforce HTTPS**. Also verify the domain under your GitHub profile → Settings → Pages.

## Optional: visitor statistics

Create a free, cookie-less [GoatCounter](https://www.goatcounter.com/) account. Then un-comment the snippet in the `<head>` of `index.html` and put your code in it. The site already reports these milestones:
- `reached-briefing`
- `reached-time-machine`
- `reached-2018`
- `reached-contact`
- `cv-download`
- `email-click`

They show how far visitors scroll.

## Share image and icon

- `assets/img/og-image.png` is the preview card shown when the link is shared on LinkedIn or WhatsApp. It is a screenshot of `tools/og.html` at 1200×630.
- `assets/img/apple-touch-icon.png` is a screenshot of `tools/icon.html` at 180×180.

To update either one, edit the HTML file and take the screenshot again.

## Credits

The fonts are Space Grotesk, Inter and JetBrains Mono, all under the SIL Open Font License. They are self-hosted, and the licences are in `assets/fonts/`.
