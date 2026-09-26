// Public/private SEO contract. Run with: node --test tests/seo.test.cjs
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=f=>fs.readFileSync(path.join(root,f),'utf8');
const base='https://www.navigam.com';
const routes=JSON.parse(read('vercel.json'));
const deny=routes.headers.find(h=>h.source.includes('index\\.html$'));
const rule=new RegExp('^'+deny.source+'$');
const sitemap=[...read('sitemap.xml').matchAll(/<loc>(.*?)<\/loc>/g)].map(m=>m[1]);
const tags=(html,name)=>[...html.matchAll(new RegExp('<'+name+'\\b[^>]*>','g'))].map(m=>Object.fromEntries([...m[0].matchAll(/([\w:-]+)="([^"]*)"/g)].map(a=>[a[1],a[2]])));
test('public canonical URLs remain indexable; private routes default to noindex',()=>{
 assert.equal(sitemap.length,new Set(sitemap).size);
 for(const url of sitemap){
  assert.ok(url.startsWith(base+'/'));
  const pathname=new URL(url).pathname;
  assert.equal(rule.test(pathname),false,url);
  const file=pathname.endsWith('/')?pathname+'index.html':pathname;
  const html=read(file.slice(1));
  assert.equal((html.match(/<h1\b/g)||[]).length,1,url);
  assert.deepEqual(tags(html,'link').filter(t=>t.rel==='canonical').map(t=>t.href),[url]);
  assert.ok(!tags(html,'meta').some(t=>t.name==='robots'&&t.content.includes('noindex')),url);
  for(const match of html.matchAll(/<script\b[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g))JSON.parse(match[1]);
 }
 for(const p of ['/admin','/admin.html','/admin-v2.html','/app','/app/','/preview','/p/test','/order','/order/test','/trip/test','/trip-app.html','/trip-data.json','/events.json','/albania-sapir-2026/','/api/test','/future-client/123'])assert.ok(rule.test(p),p);
 assert.match(deny.headers.find(h=>h.key==='X-Robots-Tag').value,/noindex/);
 assert.match(deny.headers.find(h=>h.key==='X-Robots-Tag').value,/noarchive/);
 assert.doesNotMatch(read('robots.txt'),/^Disallow:\s*\/(?:app|p|preview|order|admin)/m);
 assert.match(read('robots.txt'),/Sitemap: https:\/\/www\.navigam\.com\/sitemap\.xml/);
});
test('four language homes have reciprocal hreflang and correct language direction',()=>{
 const expected={he:base+'/',en:base+'/en.html',ar:base+'/ar.html',ru:base+'/ru.html','x-default':base+'/'};
 for(const lang of ['he','en','ar','ru']){
  const html=read(lang==='he'?'index.html':lang+'.html');
  assert.deepEqual(Object.fromEntries(tags(html,'link').filter(t=>t.hreflang).map(t=>[t.hreflang,t.href])),expected);
  assert.deepEqual(tags(html,'html')[0],{lang,dir:['he','ar'].includes(lang)?'rtl':'ltr'});
  assert.match(html,/169/);assert.match(html,/25/);
  assert.ok(tags(html,'a').filter(t=>t.href?.startsWith('https://wa.me/')).every(t=>t.href.startsWith('https://wa.me/972557760288?')));
 }
});
test('marketing pages do not reintroduce paid Avia launch accompaniment',()=>{
 for(const f of ['pricing.html','avia.html','faq.html','how-it-works.html'])assert.doesNotMatch(read(f),/10\s*(?:<small>\s*)?₪/);
});
test('original security redirects and customer rewrites remain present',()=>{
 assert.ok(routes.redirects.some(r=>r.source==='/'&&r.destination==='/admin-login.html?code=:code'&&r.permanent===false));
 assert.ok(routes.rewrites.some(r=>r.source==='/p/:code'&&r.destination==='/preview/?code=:code'));
 assert.ok(routes.rewrites.some(r=>r.source==='/order/:code'&&r.destination==='/order/index.html'));
});
