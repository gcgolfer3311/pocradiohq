// Final SEO/AEO pass over every built page in dist/ (runs after the brand layer).
// - fills missing Open Graph + Twitter/X card tags (default share image)
// - links every "Michael Smith" Person in JSON-LD to the author page
// - adds datePublished/dateModified (data/page-dates.json) to schema, plus a visible date on spec pages
// - adds VideoObject schema for review videos (data/videos.json)
// - adds an answer-first summary to bench-tested reviews
// Zero dependencies.
const fs = require('fs');
const path = require('path');

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const AUTHOR_URL = 'https://pocradiohq.com/michael-smith.html';
const fmt = d => new Date(d + 'T12:00:00Z').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' });

function boostPage(html, rel, { SITE, bench, dates, videos }) {
  const ld = o => `<script type="application/ld+json">${JSON.stringify(o)}</script>`;
  const add = [];
  const title = (html.match(/<title>([^<]*)<\/title>/) || [])[1] || 'POC Radio HQ';
  const desc = (html.match(/<meta name="description" content="([^"]*)"/) || [])[1] || '';
  const canon = (html.match(/<link rel="canonical" href="([^"]*)"/) || [])[1] || `${SITE}/${rel === 'index.html' ? '' : rel}`;

  // Open Graph + Twitter/X
  const meta = [];
  if (!/property="og:title"/.test(html)) meta.push(`<meta property="og:title" content="${title}">`);
  if (!/property="og:description"/.test(html) && desc) meta.push(`<meta property="og:description" content="${desc}">`);
  if (!/property="og:url"/.test(html)) meta.push(`<meta property="og:url" content="${canon}">`);
  if (!/property="og:type"/.test(html)) meta.push(`<meta property="og:type" content="${rel.startsWith('reviews/') || rel.startsWith('blog/') || rel.startsWith('guides/') ? 'article' : 'website'}">`);
  if (!/property="og:site_name"/.test(html)) meta.push('<meta property="og:site_name" content="POC Radio HQ">');
  let img = (html.match(/property="og:image" content="([^"]*)"/) || [])[1];
  if (!img) { img = `${SITE}/images/og-default.jpg`; meta.push(`<meta property="og:image" content="${img}">`); }
  if (!/name="twitter:card"/.test(html)) meta.push('<meta name="twitter:card" content="summary_large_image">', `<meta name="twitter:title" content="${title}">`, ...(desc ? [`<meta name="twitter:description" content="${desc}">`] : []), `<meta name="twitter:image" content="${img}">`);

  // Author entity: every Michael Smith Person links to the author page
  const linkAuthor = o => { if (Array.isArray(o)) o.forEach(linkAuthor); else if (o && typeof o === 'object') { if (o['@type'] === 'Person' && o.name === 'Michael Smith' && !o.url) o.url = AUTHOR_URL; Object.values(o).forEach(linkAuthor); } return o; };
  html = html.replace(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g, (m, body) => {
    if (!body.includes('Michael Smith')) return m;
    try { return ld(linkAuthor(JSON.parse(body))); } catch (e) { return m; }
  });

  // Dates
  const d = dates[rel];
  if (d) {
    // reviews: put datePublished on the Review inside Product schema
    html = html.replace(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g, (m, body) => {
      let o; try { o = JSON.parse(body); } catch (e) { return m; }
      if (o['@type'] === 'Product' && o.review && !o.review.datePublished) { o.review.datePublished = d.published; return ld(o); }
      if (o['@type'] === 'Article' && !o.dateModified) { o.datePublished = o.datePublished || d.published; o.dateModified = d.modified; return ld(o); }
      return m;
    });
    if (!/"dateModified"/.test(html)) add.push(ld({ "@context": "https://schema.org", "@type": "WebPage", "url": canon, "name": title, "datePublished": d.published, "dateModified": d.modified, "author": { "@type": "Person", "name": "Michael Smith", "url": AUTHOR_URL }, "publisher": { "@type": "Organization", "name": "POC Radio HQ", "url": SITE + "/" } }));
    // visible date on spec-based overviews
    html = html.replace(/(<div class="spec-note">[\s\S]*?<\/div>)/, m => `${m}\n    <p class="updated">Last updated ${fmt(d.modified)}</p>`);
  }

  // Video
  const v = videos[rel];
  if (v) {
    const o = { "@context": "https://schema.org", "@type": "VideoObject", "name": v.name, "description": v.description, "uploadDate": v.uploadDate, "duration": v.duration,
      "author": { "@type": "Person", "name": "Michael Smith", "url": AUTHOR_URL } };
    if (v.youtube) Object.assign(o, { "thumbnailUrl": [`https://i.ytimg.com/vi/${v.youtube}/hqdefault.jpg`], "embedUrl": `https://www.youtube.com/embed/${v.youtube}`, "contentUrl": `https://www.youtube.com/shorts/${v.youtube}` });
    else Object.assign(o, { "thumbnailUrl": [`${SITE}/${v.thumbnail}`], "contentUrl": `${SITE}/${v.file}` });
    add.push(ld(o));
  }

  // Answer-first summary on bench-tested reviews
  const e = bench.tested.find(r => r.path === rel);
  if (e && !html.includes('class="answer"')) {
    const run = /renew|per year|a year/i.test(e.desc) ? '' : e.cost ? (e.cost.renew === 0 ? 'with no renewal fee (lifetime data, per the seller)' : `then about $${e.cost.renew} a radio a year after year one`) : (e.renewNote ? `then ${e.renewNote.replace(/ \(optional\)$/, '')}` : '');
    const ans = `<p class="answer"><strong>Short answer:</strong> the ${esc(e.name)} scores ${e.score.toFixed(1)}/5 in our hands-on test. ${esc(e.desc)} Price: ${esc(e.price)}${run ? ', ' + esc(run) : ''}.</p>`;
    html = html.replace(/(<div class="bench-stamp">[\s\S]*?<\/div>)/, m => `${m}\n    ${ans}`);
  }

  const headAdd = meta.concat(add);
  if (headAdd.length) html = html.replace('</head>', () => headAdd.join('\n') + '\n</head>');
  return html;
}

function boostDist(distDir, ctx) {
  const dates = JSON.parse(fs.readFileSync(path.join(__dirname, 'data/page-dates.json'), 'utf8')).pages;
  const videos = JSON.parse(fs.readFileSync(path.join(__dirname, 'data/videos.json'), 'utf8'));
  for (const k of Object.keys(videos)) if (k.startsWith('_')) delete videos[k];
  let n = 0;
  (function walk(dir) {
    for (const f of fs.readdirSync(dir)) {
      const p = path.join(dir, f);
      if (fs.statSync(p).isDirectory()) walk(p);
      else if (f.endsWith('.html')) {
        const rel = path.relative(distDir, p).split(path.sep).join('/');
        fs.writeFileSync(p, boostPage(fs.readFileSync(p, 'utf8'), rel, { ...ctx, dates, videos }));
        n++;
      }
    }
  })(distDir);
  for (const rel of Object.keys(videos)) if (!fs.existsSync(path.join(distDir, rel))) throw new Error(`data/videos.json: ${rel} not built`);
  return n;
}

module.exports = { boostDist };
