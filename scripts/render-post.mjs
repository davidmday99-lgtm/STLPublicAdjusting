import fs from 'node:fs/promises';
import path from 'node:path';

const ROOT = process.cwd();
const POSTS_DIR = path.join(ROOT, 'posts');

function escapeHtml(s=''){
  return s
    .replaceAll('&','&amp;')
    .replaceAll('<','&lt;')
    .replaceAll('>','&gt;')
    .replaceAll('"','&quot;')
    .replaceAll("'",'&#39;');
}

function parseFrontMatter(md){
  if(!md.startsWith('---')) return { meta: {}, body: md };
  const end = md.indexOf('\n---', 3);
  if(end === -1) return { meta: {}, body: md };
  const fm = md.slice(3, end).trim();
  const body = md.slice(end + '\n---'.length).trimStart();
  const meta = {};
  for(const line of fm.split(/\r?\n/)){
    const m = line.match(/^([A-Za-z0-9_\-]+):\s*(.*)$/);
    if(!m) continue;
    let v = m[2].trim();
    if((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))){
      v = v.slice(1,-1);
    }
    meta[m[1]] = v;
  }
  return { meta, body };
}

function mdToHtml(md){
  // Very small markdown subset: headings, paragraphs, lists, links.
  const lines = md.split(/\r?\n/);
  const out = [];
  let inList = false;
  for(const raw of lines){
    const line = raw.trimEnd();
    if(line.trim() === ''){
      if(inList){ out.push('</ul>'); inList = false; }
      continue;
    }
    if(line.startsWith('# ')){
      if(inList){ out.push('</ul>'); inList = false; }
      out.push(`<h1>${escapeHtml(line.slice(2).trim())}</h1>`);
      continue;
    }
    if(line.startsWith('## ')){
      if(inList){ out.push('</ul>'); inList = false; }
      out.push(`<h2>${escapeHtml(line.slice(3).trim())}</h2>`);
      continue;
    }
    if(line.startsWith('### ')){
      if(inList){ out.push('</ul>'); inList = false; }
      out.push(`<h3>${escapeHtml(line.slice(4).trim())}</h3>`);
      continue;
    }
    const mList = line.match(/^[-*]\s+(.*)$/);
    if(mList){
      if(!inList){ out.push('<ul>'); inList = true; }
      out.push(`<li>${escapeHtml(mList[1])}</li>`);
      continue;
    }

    // naive link: [text](url)
    let html = escapeHtml(line);
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, t, u) => {
      const text = escapeHtml(t);
      const url = escapeHtml(u);
      const rel = url.startsWith('http') ? ' rel="noopener" target="_blank"' : '';
      return `<a href="${url}" style="text-decoration:underline;"${rel}>${text}</a>`;
    });
    out.push(`<p>${html}</p>`);
  }
  if(inList) out.push('</ul>');
  return out.join('\n');
}

async function renderOne(filePath){
  const md = await fs.readFile(filePath, 'utf8');
  const { meta, body } = parseFrontMatter(md);
  const title = meta.title || path.basename(filePath, '.md');
  const date = meta.date || '';
  const author = meta.author || '';
  const htmlBody = mdToHtml(body);

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>${escapeHtml(title)} | STL Public Adjusting</title>
  <meta name="description" content="${escapeHtml(title)}" />
  <style>
    :root{
      --bg:#071018;
      --text:#f3f6fb;
      --muted:#c2cbd8;
      --line:rgba(255,255,255,.10);
      --red:#C41E3A;
      --navy:#0C2340;
      --radius:18px;
      --max:900px;
      --pad:22px;
    }
    *{box-sizing:border-box}
    body{
      margin:0;
      font-family: system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif;
      color:var(--text);
      background:
        radial-gradient(1100px 700px at 15% 0%, rgba(196,30,58,.18) 0%, rgba(7,16,24,0) 55%),
        radial-gradient(900px 600px at 85% 10%, rgba(12,35,64,.35) 0%, rgba(7,16,24,0) 55%),
        linear-gradient(180deg, #061019 0%, var(--bg) 100%);
      line-height: 1.65;
    }
    a{color:inherit}
    .topbar{
      position:fixed; top:0; left:0; right:0; z-index:9999;
      backdrop-filter: blur(10px);
      background: rgba(7,16,24,.72);
      border-bottom:1px solid var(--line);
    }
    .wrap{max-width:var(--max); margin:0 auto; padding:0 18px}
    .nav{display:flex; align-items:center; justify-content:space-between; padding:14px 0; gap:12px;}
    .links{display:flex; gap:12px; flex-wrap:wrap;}
    .links a{color:var(--muted); text-decoration:none}
    .links a:hover{color:var(--text)}
    main{padding:26px 0 50px}
    .card{
      background: rgba(11,23,35,.82);
      border:1px solid rgba(255,255,255,.10);
      border-radius: var(--radius);
      box-shadow: 0 0 0 3px rgba(255,255,255,.25), 0 8px 28px rgba(0,0,0,.6);
      padding: var(--pad);
    }
    h1{line-height:1.15}
    h2{margin-top:22px}
    ul{margin:10px 0 10px 20px}
    .meta{color:var(--muted); font-size:13px; margin-top:4px}
    .divider{height:1px; background: rgba(255,255,255,.10); margin:18px 0}
  </style>
</head>
<body>
  <header class="topbar">
    <div class="wrap">
      <div class="nav">
        <div style="font-weight:900;">STL Public Adjusting</div>
        <nav class="links">
          <a href="/">Home</a>
          <a href="/blog.html">Blog</a>
          <a href="/contact-form.html#form">Get Help Now</a>
        </nav>
      </div>
    </div>
  </header>

  <main>
    <div class="wrap">
      <div class="card">
        ${htmlBody}
        <div class="divider"></div>
        ${author ? `<div class="meta">${escapeHtml(author)}</div>` : ''}
        ${date ? `<div class="meta">Published: ${escapeHtml(date)}</div>` : ''}
      </div>
    </div>
  </main>

  <script>
    (function(){
      const topbar = document.querySelector('.topbar');
      function applyPad(){
        if(!topbar) return;
        document.body.style.paddingTop = topbar.offsetHeight + 'px';
      }
      window.addEventListener('load', applyPad);
      window.addEventListener('resize', applyPad);
      applyPad();
    })();
  </script>
</body>
</html>`;
}

async function main(){
  const entries = await fs.readdir(POSTS_DIR, { withFileTypes: true });
  const mdFiles = entries
    .filter(e => e.isFile() && e.name.toLowerCase().endsWith('.md') && e.name.toLowerCase() !== 'readme.md')
    .map(e => e.name);
  for(const name of mdFiles){
    const src = path.join(POSTS_DIR, name);
    const out = path.join(POSTS_DIR, path.basename(name, '.md') + '.html');
    const html = await renderOne(src);
    await fs.writeFile(out, html, 'utf8');
    console.log('Rendered', out);
  }
}

await main();
