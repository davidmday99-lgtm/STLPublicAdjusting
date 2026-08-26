import fs from 'node:fs/promises';
import path from 'node:path';

const ROOT = process.cwd();
const SITE = 'https://stlpublicadjusting.com';

const STATIC_PATHS = [
  '/',
  '/contact.html',
  '/blog.html',
];

async function listPosts(){
  const dir = path.join(ROOT, 'posts');
  let entries = [];
  try{ entries = await fs.readdir(dir, { withFileTypes: true }); }
  catch{ return []; }

  return entries
    .filter(e => e.isFile() && e.name.toLowerCase().endsWith('.html'))
    .map(e => `/posts/${e.name}`)
    .filter(p => ![
      '/posts/readme.html',
      '/posts/index.html',
      // This file is a non-HTML parser artifact and must stay out until compliance-approved content is restored.
      '/posts/2026-04-04-missouri-illinois-insurance-claim-time-limits.html',
    ].includes(p.toLowerCase()))
    .sort();
}

function xmlEscape(s){
  return s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;');
}

async function existingLastmods(){
  const entries = new Map();
  try{
    const xml = await fs.readFile(path.join(ROOT, 'sitemap.xml'), 'utf8');
    for(const match of xml.matchAll(/<url>\s*<loc>([^<]+)<\/loc>\s*<lastmod>([^<]+)<\/lastmod>/g)){
      entries.set(match[1], match[2].slice(0, 10));
    }
  } catch {}
  return entries;
}

async function main(){
  const posts = await listPosts();
  const urls = [...new Set([...STATIC_PATHS, ...posts])];
  const priorDates = await existingLastmods();

  const today = new Date().toISOString().slice(0, 10);
  const urlset = urls.map(u => {
    const loc = `${SITE}${u}`;
    const datedPost = u.match(/^\/posts\/(\d{4}-\d{2}-\d{2})-/);
    const lastmod = datedPost ? datedPost[1] : (priorDates.get(loc) || today);
    return `  <url>\n    <loc>${xmlEscape(loc)}</loc>\n    <lastmod>${lastmod}</lastmod>\n  </url>`;
  }).join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urlset}\n</urlset>\n`;

  await fs.writeFile(path.join(ROOT, 'sitemap.xml'), xml, 'utf8');
  console.log(`Built sitemap.xml with ${urls.length} URLs (${posts.length} posts).`);
}

await main();
