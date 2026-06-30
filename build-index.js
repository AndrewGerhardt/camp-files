const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const IGNORE = new Set([".git", "node_modules"]);
const PDFS = [];

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (IGNORE.has(entry.name)) continue;

    const full = path.join(dir, entry.name);
    const rel = path.relative(ROOT, full).replaceAll("\\", "/");

    if (entry.isDirectory()) {
      walk(full);
    } else if (entry.isFile() && entry.name.toLowerCase().endsWith(".pdf")) {
      PDFS.push(rel);
    }
  }
}

function titleize(filePath) {
  return path.basename(filePath, ".pdf")
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function groupName(filePath) {
  const folder = path.dirname(filePath);
  if (folder === ".") return "Documents";
  return folder
    .split("/")
    .map(part => part.replace(/[-_]+/g, " "))
    .join(" / ");
}

walk(ROOT);

PDFS.sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

const groups = {};
for (const pdf of PDFS) {
  const group = groupName(pdf);
  if (!groups[group]) groups[group] = [];
  groups[group].push(pdf);
}

const sections = Object.entries(groups).map(([group, files]) => `
  <section class="section">
    <h2>${escapeHtml(group)}</h2>
    <p>${files.length} PDF${files.length === 1 ? "" : "s"}</p>
    <div class="docList">
      ${files.map(file => `
        <a class="doc" href="${encodeURI(file)}">
          <div>
            <div class="docTitle">${escapeHtml(titleize(file))}</div>
            <div class="docMeta">${escapeHtml(file)}</div>
          </div>
          <span class="badge">PDF</span>
        </a>
      `).join("")}
    </div>
  </section>
`).join("");

const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Camp Geiger Documents</title>
  <style>
    :root {
      --bg: #f6f7f9;
      --card: #ffffff;
      --text: #1f2933;
      --muted: #687782;
      --border: #dde3ea;
      --accent: #7a4f26;
      --accent-soft: #efe7dc;
    }

    body {
      margin: 0;
      font-family: Arial, sans-serif;
      background: var(--bg);
      color: var(--text);
    }

    .wrap {
      max-width: 1050px;
      margin: 0 auto;
      padding: 24px;
    }

    header,
    .section {
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 14px;
      padding: 22px;
      margin-bottom: 16px;
    }

    .eyebrow {
      font-size: 13px;
      font-weight: bold;
      color: var(--accent);
      text-transform: uppercase;
      letter-spacing: .08em;
      margin-bottom: 8px;
    }

    h1 {
      margin: 0;
      font-size: 32px;
    }

    h2 {
      margin: 0 0 4px;
      font-size: 20px;
    }

    p {
      margin: 8px 0 0;
      color: var(--muted);
      line-height: 1.5;
    }

    .homeLink {
      display: inline-block;
      margin-top: 16px;
      color: var(--text);
      font-weight: bold;
      text-decoration: none;
    }

    .homeLink:hover {
      text-decoration: underline;
    }

    .grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(260px, 1fr));
      gap: 16px;
    }

    .docList {
      display: grid;
      gap: 10px;
      margin-top: 14px;
    }

    .doc {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 12px;
      padding: 12px;
      border: 1px solid var(--border);
      border-radius: 10px;
      background: #fff;
      text-decoration: none;
      color: var(--text);
    }

    .doc:hover {
      background: #f8fafc;
    }

    .docTitle {
      font-weight: bold;
    }

    .docMeta {
      color: var(--muted);
      font-size: 13px;
      margin-top: 3px;
      word-break: break-word;
    }

    .badge {
      background: var(--accent-soft);
      color: var(--accent);
      border-radius: 999px;
      padding: 5px 9px;
      font-size: 12px;
      font-weight: bold;
      white-space: nowrap;
    }

    footer {
      color: var(--muted);
      font-size: 13px;
      margin-top: 18px;
      text-align: center;
    }

    @media (max-width: 750px) {
      .wrap { padding: 14px; }
      h1 { font-size: 26px; }
      .grid { grid-template-columns: 1fr; }
      .doc { align-items: flex-start; }
    }
  </style>
</head>

<body>
  <div class="wrap">
    <header>
      <div class="eyebrow">Camp Geiger</div>
      <h1>Camp Documents</h1>
      <p>
        Find current forms, guides, maps, and planning resources for Camp Geiger.
        These files are provided as direct PDF links for easy viewing and downloading.
      </p>
      <a class="homeLink" href="https://www.campgeigerscouting.org/">← Back to CampGeigerScouting.org</a>
    </header>

    <div class="grid">
      ${sections || `<section class="section"><h2>No PDFs found</h2><p>Add PDF files to this repository and redeploy.</p></section>`}
    </div>

    <footer>
      Geiger Talk Now • Pony Express Council • Camp Geiger
    </footer>
  </div>
</body>
</html>`;

fs.writeFileSync(path.join(ROOT, "index.html"), html);

console.log(`Generated index.html with ${PDFS.length} PDF file(s).`);

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}