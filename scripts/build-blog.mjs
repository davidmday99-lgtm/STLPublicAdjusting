import fs from 'node:fs/promises';
import path from 'node:path';

const ROOT = process.cwd();
const POSTS_DIR = path.join(ROOT, 'posts');
const DRAFTS_DIR = path.join(ROOT, 'drafts');
const BLOG_PATH = path.join(ROOT, 'blog.html');

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

async function listMarkdown(dir){
  let entries = [];
  try{ entries = await fs.readdir(dir, { withFileTypes: true }); }
  catch{ return []; }
  const files = entries
    .filter(e => e.isFile() && e.name.toLowerCase().endsWith('.md'))
    .map(e => path.join(dir, e.name));
  return files;
}

async function build(){
  const files = await listMarkdown(POSTS_DIR);
  const posts = [];
  for(const file of files){
    const md = await fs.readFile(file, 'utf8');
    const { meta } = parseFrontMatter(md);
    const slug = path.basename(file, '.md');
    const title = meta.title || slug;
    const date = meta.date || '';
    posts.push({ file, slug, title, date });
  }
  posts.sort((a,b) => (b.date || '').localeCompare(a.date || ''));

  const itemsHtml = posts.map(p => {
    const href = `./posts/${encodeURIComponent(p.slug)}.html`;
    const title = escapeHtml(p.title);
    const date = escapeHtml(p.date);
    return `
          <div class="post">
            <h3><a href="${href}" style="text-decoration:underline;">${title}</a></h3>
            ${date ? `<p class="fine">${date}</p>` : ''}
          </div>`;
  }).join('\n');

  const drafts = await listMarkdown(DRAFTS_DIR);
  const queuedCount = drafts.length;

  const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Blog | STL Public Adjusting</title>
  <meta name="description" content="Updates, tips, and guides from STL Public Adjusting." />

  <style>
    :root{
      --bg:#071018;
      --panel:#0b1723;
      --text:#f3f6fb;
      --muted:#c2cbd8;
      --line:rgba(255,255,255,.10);
      --red:#C41E3A;
      --navy:#0C2340;
      --radius:18px;
      --max:1120px;
      --pad:22px;
    }

    *{box-sizing:border-box}
    html,body{height:100%}
    body{
      margin:0;
      font-family: system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif;
      color:var(--text);
      background:
        radial-gradient(1100px 700px at 15% 0%, rgba(196,30,58,.18) 0%, rgba(7,16,24,0) 55%),
        radial-gradient(900px 600px at 85% 10%, rgba(12,35,64,.35) 0%, rgba(7,16,24,0) 55%),
        linear-gradient(180deg, #061019 0%, var(--bg) 100%);
    }

    a{color:inherit; text-decoration:none}
    .wrap{max-width:var(--max); margin:0 auto; padding:0 18px}

    .topbar{
      position:fixed; top:0; left:0; right:0; z-index:9999;
      backdrop-filter: blur(10px);
      background: rgba(7,16,24,.72);
      border-bottom:1px solid var(--line);
    }
    .nav{
      display:flex; align-items:center; justify-content:space-between;
      padding:18px 0;
      gap:14px;
    }

    .brand{display:flex; align-items:center; gap:14px; min-width:260px}
    .brand img{width:120px; height:120px; object-fit:contain}
    .brand .name{font-size:22px; font-weight:900; letter-spacing:.3px}
    .brand .tag{font-size:13px; color:var(--muted); margin-top:2px}

    .links{display:flex; gap:14px; flex-wrap:wrap; align-items:center; justify-content:flex-end}
    .links a{font-size:14px; color:var(--muted)}
    .links a:hover{color:var(--text)}

    .btn{
      display:inline-flex; align-items:center; justify-content:center;
      padding:10px 14px; border-radius:999px;
      border:1px solid rgba(255,255,255,.14);
      background: rgba(255,255,255,.04);
      gap:8px;
      font-weight:800;
      white-space:nowrap;
      transition:.15s transform, .15s filter, .15s background;
    }
    .btn.primary{
      background: linear-gradient(135deg, var(--red), #ff4d6d);
      border-color: rgba(0,0,0,0);
      color:#140208;
    }
    .btn:hover{transform: translateY(-1px); filter:brightness(1.05)}

    main{padding:38px 0 50px}

    .card{
      background: rgba(11,23,35,.82);
      border:1px solid rgba(255,255,255,.10);
      border-radius: var(--radius);
      box-shadow: 0 0 0 3px rgba(255,255,255,.25), 0 8px 28px rgba(0,0,0,.6);
      padding: var(--pad);
    }

    h1{margin:0 0 8px; font-size:34px; letter-spacing:-.5px}
    .sub{color:var(--muted); font-size:16px; line-height:1.55; margin:0 0 18px}

    .posts{display:grid; grid-template-columns:1fr; gap:14px; margin-top:18px}
    .post{
      border:1px solid rgba(255,255,255,.10);
      background: rgba(255,255,255,.03);
      border-radius: 16px;
      padding: 14px;
    }

    .fine{font-size:12px; color:#aeb9c9; line-height:1.45; margin:0}

    @media (max-width: 860px){
      .nav{flex-direction:column; align-items:flex-start; padding:14px 0;}
      .links{width:100%; justify-content:flex-start; flex-wrap:wrap; gap:12px;}
      .links a{padding:8px 10px; border-radius:999px; background: rgba(255,255,255,.03); border:1px solid rgba(255,255,255,.10);}
      .brand img{width:90px; height:90px;}
    }
  </style>
</head>

<body>
  <header class="topbar">
    <div class="wrap">
      <div class="nav">
        <a class="brand" href="/">
          <img src="logo.png" alt="STL Public Adjusting logo" onerror="this.style.display='none'" />
          <div>
            <div class="name">STL Public Adjusting</div>
            <div class="tag">Serving the St. Louis Metro • Missouri & Illinois</div>
          </div>
        </a>

        <nav class="links">
          <a href="/">Home</a>
          <a href="/contact.html">Contact</a>
          <a href="/contact-form.html#form" class="btn">Get Help Now</a>
        </nav>
      </div>
    </div>
  </header>

  <main>
    <div class="wrap">
      <div class="card">
        <h1>Blog</h1>
        <p class="sub">Tips, checklists, and claim guidance. (${queuedCount} queued drafts)</p>

        <div class="posts">
          ${itemsHtml || '<p class="fine">No posts published yet.</p>'}
        </div>
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
</html>
`;

  await fs.writeFile(BLOG_PATH, html, 'utf8');
  console.log(`Built blog.html with ${posts.length} posts. Draft queue: ${queuedCount}.`);
}

await build();
