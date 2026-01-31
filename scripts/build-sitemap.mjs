import fs from 'node:fs/promises';
import path from 'node:path';

const ROOT = process.cwd();
const SITE = 'https://stlpublicadjusting.com';

const STATIC_PATHS = [
  '/',
  '/contact.html',
  '/contact-form.html',
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
    .filter(p => p.toLowerCase() !== '/posts/readme.html' && p.toLowerCase() !== '/posts/index.html')
    .sort();
}

function xmlEscape(s){
  return s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;');
}

async function main(){
  const posts = await listPosts();
  const urls = [...new Set([...STATIC_PATHS, ...posts])];

  const now = new Date().toISOString();
  const urlset = urls.map(u => {
    const loc = `${SITE}${u}`;
    return `  <url>\n    <loc>${xmlEscape(loc)}</loc>\n    <lastmod>${now}</lastmod>\n  </url>`;
  }).join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urlset}\n</urlset>\n`;

  await fs.writeFile(path.join(ROOT, 'sitemap.xml'), xml, 'utf8');
  console.log(`Built sitemap.xml with ${urls.length} URLs (${posts.length} posts).`);
}

await main();
