import fs from 'node:fs/promises';
import path from 'node:path';

const ROOT = process.cwd();
const POSTS_DIR = path.join(ROOT, 'posts');
const DRAFTS_DIR = path.join(ROOT, 'drafts');

async function listDrafts(){
  let entries = [];
  try{ entries = await fs.readdir(DRAFTS_DIR, { withFileTypes: true }); }
  catch{ return []; }
  const files = entries
    .filter(e => e.isFile() && e.name.toLowerCase().endsWith('.md') && e.name !== 'README.md')
    .map(e => e.name)
    .sort();
  return files;
}

async function ensureDir(p){
  await fs.mkdir(p, { recursive: true });
}

async function main(){
  await ensureDir(POSTS_DIR);
  const drafts = await listDrafts();
  if(drafts.length === 0){
    console.log('No drafts to publish.');
    return;
  }

  const next = drafts[0];
  const from = path.join(DRAFTS_DIR, next);
  const to = path.join(POSTS_DIR, next);

  await fs.rename(from, to);
  console.log(`Published draft: ${next}`);
}

await main();
