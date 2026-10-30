# MOffice Suite

A modern, offline office suite that runs entirely in your browser — no server, no account, no uploads.

## Apps

- **MWord** — rich-text documents: bold/italic/underline, headings, lists, quotes, code, tables, images, colours. Open `.txt` / `.md` / `.html`, export `.txt` / `.md` / `.html`, Print to PDF. Autosaves in your browser.
- **MSheets** — spreadsheets with real formulas: `=SUM(A1:A5)`, `=AVERAGE(...)`, `=MIN`, `=MAX`, `=COUNT`, plus arithmetic like `=A1+B2` and `=A1*2`. Open `.csv` / `.tsv` / `.json`, export the same. Includes a bar-chart from columns A/B and a sample budget.
- **MVideo** — video editor: upload MP4 / WebM / MOV, trim start/end, speed, volume, brightness / contrast / saturate / grayscale / sepia / blur filters, text overlay, and export the trimmed clip to `.webm` (recorded in-browser via canvas + MediaRecorder).
- **Stock music** — 5 royalty-free loops (Chill, Upbeat, Cinematic, Lo-fi, Electronic) generated live with Web Audio. No copyrighted files. You can also upload your own MP3 / WAV / OGG audio.

## Formats

| App | Open | Save |
|---|---|---|
| MWord | .txt, .md, .html | .txt, .md, .html, .pdf (Print) |
| MSheets | .csv, .tsv, .json | .csv, .tsv, .json |
| MVideo | .mp4, .webm, .mov, .mkv* | .webm |
| Audio | .mp3, .wav, .ogg, .m4a | — |

\* Video playback depends on your browser's codecs. Chrome/Edge play MP4 + WebM; Safari plays MP4 + MOV.

## Run it

Just open `index.html` in a browser, or serve the folder:

```bash
python3 -m http.server 8000
# then open http://localhost:8000
```

Or host it on GitHub Pages from this repo (Settings → Pages → Deploy from branch → main).

## Save a whole project

Top-right **Save Project** downloads one JSON file with your document, sheet and video settings. **Open Project** restores it. Video files themselves are not embedded in the JSON — re-upload the video after restoring.

## Honest limits

- This is a browser suite, not a clone of Microsoft Office: it does not read/write `.docx` or `.xlsx` natively. CSV opens directly in Excel / Google Sheets / LibreOffice, and HTML exports open in Word.
- Video export is WebM (what browsers can record). Convert WebM → MP4 with any free converter if you need MP4.
- The canvas demo clip is a preview animation only; export needs a real uploaded video.

## Cloud / login (Keel)

Open the Cloud / Login tab in the app. Base URL defaults to `https://api.keel.app/v1/moofice`. Paste your Keel API key in the app itself — it is stored only in your browser, never in this repo. GET /items lists projects, POST /items saves the current project, DELETE /items/{id} deletes one. As of 2026-10-30 the supplied endpoint returns HTTP 404, so the app shows that status and keeps working locally until the endpoint is live.
