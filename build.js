const fs = require('fs');
const path = require('path');

const SITE = 'https://pocradiohq.com';
const reviews = JSON.parse(fs.readFileSync(path.join(__dirname, 'data/reviews.json'), 'utf8'));
const posts = JSON.parse(fs.readFileSync(path.join(__dirname, 'data/posts.json'), 'utf8'))
  .slice().sort((a, b) => new Date(b.date) - new Date(a.date));

const distDir = path.join(__dirname, 'dist');
const reviewsDir = path.join(distDir, 'reviews');
fs.mkdirSync(reviewsDir, { recursive: true });

// ---- shared styles: HQ Network design system lives in data/hq-shared.css ----
const sharedCSS = fs.readFileSync(path.join(__dirname, 'data/hq-shared.css'), 'utf8');
const bench = JSON.parse(fs.readFileSync(path.join(__dirname, 'data/bench.json'), 'utf8'));
const { brandify, homeBlocks } = require('./hq-brand');

const LOGO_SVG = '<svg class="logo-mark" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21V10"/><path d="M8.5 8a5 5 0 0 1 7 0"/><path d="M5.5 5a9 9 0 0 1 13 0"/><circle cx="12" cy="21" r="1.4" fill="currentColor" stroke="none"/></svg>';

const AFF_TAG = 'pocradio-20';
function amazonLink(r) {
  if (r.notOnAmazon) return null;
  if (r.amazonAsin) return `https://www.amazon.com/dp/${r.amazonAsin}?tag=${AFF_TAG}`;
  return `https://www.amazon.com/s?k=${encodeURIComponent(r.name + ' POC radio')}&tag=${AFF_TAG}`;
}

function starString(rating) {
  const full = Math.round(rating);
  return '★★★★★☆☆☆☆☆'.slice(5 - full, 10 - full);
}

function reviewPage(r, allReviews) {
  const priceText = r.notOnAmazon ? 'Contact for pricing' : (r.priceLow ? `$${r.priceLow}–$${r.priceHigh}` : 'Contact for pricing');
  const buyLink = amazonLink(r);
  const related = allReviews.filter(x => x.slug !== r.slug).slice(0, 3);
  const productSchema = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": r.name,
    "image": `${SITE}/og-image.png`,
    "description": r.summary,
    "brand": { "@type": "Brand", "name": r.name.split(' ')[0] },
  };
  if (buyLink && r.priceLow) {
    productSchema.offers = {
      "@type": "AggregateOffer",
      "priceCurrency": "USD",
      "lowPrice": r.priceLow,
      "highPrice": r.priceHigh
    };
  }
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home", "item": SITE + "/" },
      { "@type": "ListItem", "position": 2, "name": "Buying Guide", "item": SITE + "/#guide" },
      { "@type": "ListItem", "position": 3, "name": r.name + " Review", "item": `${SITE}/reviews/${r.slug}.html` }
    ]
  };

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${r.name} Review (2026): ${r.badge} POC Radio? | POC Radio HQ</title>
<meta name="description" content="${r.name} review — specs, pros/cons, pricing, and verdict. ${r.summary.slice(0, 130)}">
<link rel="canonical" href="${SITE}/reviews/${r.slug}.html">
<meta property="og:title" content="${r.name} Review | POC Radio HQ">
<meta property="og:description" content="${r.summary}">
<meta property="og:url" content="${SITE}/reviews/${r.slug}.html">
<meta property="og:type" content="article">
<link rel="stylesheet" href="../styles.css">
<script type="application/ld+json">${JSON.stringify(productSchema)}</script>
<script type="application/ld+json">${JSON.stringify(breadcrumbSchema)}</script>
<!-- Google tag (gtag.js) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-QHPFB16VF4"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-QHPFB16VF4');
</script>
</head>
<body>
<header>
  <div class="nav">
    <a href="../index.html" class="logo">${LOGO_SVG} POC Radio HQ</a>
    <a href="../index.html#guide" class="btn" style="padding:8px 16px;font-size:.85rem;">Full Buying Guide</a>
  </div>
</header>
<div class="wrap">
  <div class="breadcrumb"><a href="../index.html">Home</a> / <a href="../index.html#guide">Buying Guide</a> / ${r.name}</div>

  <div class="review-hero">
    <span class="badge badge-spec">${r.badge}</span>
    <h1>${r.name} Review</h1>
    <div class="cat">${r.category}</div>
    <p>${r.summary}</p>
    <div class="specs-grid">${r.specs.map(s => `<span>${s}</span>`).join('')}</div>
    <div class="price-box">
      <div><div style="font-size:.78rem;color:var(--sub);text-transform:uppercase;">Price</div><div class="price">${priceText}</div></div>
      ${buyLink ? `<a href="${buyLink}" class="btn" rel="sponsored nofollow">Check Current Price</a>` : `<a href="#" class="btn" style="background:var(--bg2);border:1px solid var(--line);">Request a Quote</a>`}
    </div>
  </div>

  <section class="block">
    <h2>Who it's best for</h2>
    <p>${r.bestFor}</p>
  </section>

  <section class="block">
    <h2>Pros &amp; Cons</h2>
    <div class="pros-cons">
      <div class="pros"><h3>Pros</h3><ul>${r.pros.map(p => `<li>${p}</li>`).join('')}</ul></div>
      <div class="cons"><h3>Cons</h3><ul>${r.cons.map(c => `<li>${c}</li>`).join('')}</ul></div>
    </div>
  </section>

  <section class="block">
    <h2>Verdict</h2>
    <div class="verdict-box"><p style="margin:0;">${r.verdict}</p></div>
  </section>

  <section class="block">
    <h2>Compare with other POC radios</h2>
    <div class="related">
      ${related.map(x => `<a href="./${x.slug}.html">${x.name}</a>`).join('')}
      <a href="../index.html#compare">POC vs GMRS vs Ham vs CB →</a>
    </div>
  </section>
</div>
<footer>© 2026 POC Radio HQ. As an Amazon Associate we earn from qualifying purchases. <a href="../index.html">Back to home</a></footer>
</body>
</html>`;
}

// write styles.css
fs.writeFileSync(path.join(distDir, 'styles.css'), sharedCSS.trim());

// ── Blog ──
function formatDate(d) {
  return new Date(d + 'T00:00:00').toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

function blogIndexPage(allPosts) {
  const itemListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "itemListElement": allPosts.map((p, i) => ({
      "@type": "ListItem",
      "position": i + 1,
      "url": `${SITE}/blog/${p.slug}.html`
    }))
  };
  const cards = allPosts.map(p => `
      <a class="post-card" href="./${p.slug}.html">
        <div class="post-date">${formatDate(p.date)}</div>
        <h2>${p.title}</h2>
        <p>${p.excerpt}</p>
        <div class="post-tags">${p.tags.map(t => `<span>${t}</span>`).join('')}</div>
      </a>`).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Blog — POC Radio Buying Advice &amp; Guides | POC Radio HQ</title>
<meta name="description" content="Buying advice, cost breakdowns, and setup guides for Push-to-Talk over Cellular radios — from the team that hands-on tests them.">
<link rel="canonical" href="${SITE}/blog/">
<meta property="og:title" content="Blog | POC Radio HQ">
<meta property="og:description" content="Buying advice, cost breakdowns, and setup guides for Push-to-Talk over Cellular radios.">
<meta property="og:url" content="${SITE}/blog/">
<link rel="stylesheet" href="../styles.css">
<script type="application/ld+json">${JSON.stringify(itemListSchema)}</script>
<style>
  .post-grid{display:grid;gap:18px;margin-top:20px;}
  .post-card{display:block;background:var(--card);border:1px solid var(--line);border-radius:14px;padding:24px;}
  .post-card:hover{border-color:var(--accent2);text-decoration:none;}
  .post-date{font-size:.76rem;color:var(--sub);text-transform:uppercase;letter-spacing:.03em;margin-bottom:8px;}
  .post-card h2{font-size:1.15rem;margin-bottom:8px;color:var(--text);}
  .post-card p{color:var(--sub);font-size:.9rem;}
  .post-tags{display:flex;gap:8px;margin-top:14px;flex-wrap:wrap;}
  .post-tags span{background:var(--bg2);border:1px solid var(--line);padding:3px 10px;border-radius:999px;font-size:.72rem;color:var(--sub);}
</style>
<!-- Google tag (gtag.js) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-QHPFB16VF4"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-QHPFB16VF4');
</script>
</head>
<body>
<header>
  <div class="nav">
    <a href="../index.html" class="logo">${LOGO_SVG} POC Radio HQ</a>
    <a href="../index.html#guide" class="btn" style="padding:8px 16px;font-size:.85rem;">Full Buying Guide</a>
  </div>
</header>
<div class="wrap" style="max-width:860px;">
  <div class="breadcrumb"><a href="../index.html">Home</a> / Blog</div>
  <div class="review-hero">
    <span class="badge">Blog</span>
    <h1>📰 POC radio buying advice &amp; guides</h1>
    <p style="max-width:65ch;">Cost breakdowns, buyer mistakes, and head-to-head comparisons — written from hands-on testing, not spec sheets.</p>
  </div>
  <div class="post-grid">${cards}
  </div>
</div>
<footer>© 2026 POC Radio HQ. As an Amazon Associate we earn from qualifying purchases. <a href="../index.html">Back to home</a></footer>
</body>
</html>`;
}

function postPage(p, allPosts) {
  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": p.title,
    "datePublished": p.date,
    "dateModified": p.date,
    "author": { "@type": "Organization", "name": "POC Radio HQ" },
    "publisher": { "@type": "Organization", "name": "POC Radio HQ" },
    "description": p.excerpt,
    "mainEntityOfPage": `${SITE}/blog/${p.slug}.html`
  };
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home", "item": SITE + "/" },
      { "@type": "ListItem", "position": 2, "name": "Blog", "item": SITE + "/blog/" },
      { "@type": "ListItem", "position": 3, "name": p.title, "item": `${SITE}/blog/${p.slug}.html` }
    ]
  };
  const related = allPosts.filter(x => x.slug !== p.slug).slice(0, 3);

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${p.title} | POC Radio HQ</title>
<meta name="description" content="${p.excerpt}">
<link rel="canonical" href="${SITE}/blog/${p.slug}.html">
<meta property="og:title" content="${p.title} | POC Radio HQ">
<meta property="og:description" content="${p.excerpt}">
<meta property="og:url" content="${SITE}/blog/${p.slug}.html">
<meta property="og:type" content="article">
<link rel="stylesheet" href="../styles.css">
<script type="application/ld+json">${JSON.stringify(articleSchema)}</script>
<script type="application/ld+json">${JSON.stringify(breadcrumbSchema)}</script>
<style>
  .post-body{margin-top:24px;}
  .post-body p{margin-bottom:16px;color:var(--sub);line-height:1.75;}
  .post-body h2{margin:28px 0 12px;color:var(--text);font-size:1.25rem;}
  .post-body ul{margin:0 0 16px 20px;color:var(--sub);}
  .post-body li{margin-bottom:8px;line-height:1.6;}
  .post-body a{color:var(--accent2);}
  .post-body strong{color:var(--text);}
</style>
<!-- Google tag (gtag.js) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-QHPFB16VF4"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-QHPFB16VF4');
</script>
</head>
<body>
<header>
  <div class="nav">
    <a href="../index.html" class="logo">${LOGO_SVG} POC Radio HQ</a>
    <a href="../index.html#guide" class="btn" style="padding:8px 16px;font-size:.85rem;">Full Buying Guide</a>
  </div>
</header>
<div class="wrap" style="max-width:760px;">
  <div class="breadcrumb"><a href="../index.html">Home</a> / <a href="./">Blog</a> / ${p.title}</div>
  <div class="review-hero">
    <span class="badge">${formatDate(p.date)}</span>
    <h1 style="font-size:1.8rem;">${p.title}</h1>
    <div class="post-tags" style="margin-top:10px;">${p.tags.map(t => `<span>${t}</span>`).join('')}</div>
  </div>
  <div class="post-body">${p.body}</div>

  <section class="block">
    <h2>More from the blog</h2>
    <div class="related">
      ${related.map(x => `<a href="./${x.slug}.html">${x.title}</a>`).join('')}
      <a href="./">All posts →</a>
    </div>
  </section>
</div>
<footer>© 2026 POC Radio HQ. As an Amazon Associate we earn from qualifying purchases. <a href="../index.html">Back to home</a></footer>
</body>
</html>`;
}

const blogDir = path.join(distDir, 'blog');
fs.mkdirSync(blogDir, { recursive: true });
fs.writeFileSync(path.join(blogDir, 'index.html'), blogIndexPage(posts));
for (const p of posts) {
  fs.writeFileSync(path.join(blogDir, `${p.slug}.html`), postPage(p, posts));
}
console.log(`  → Blog: index + ${posts.length} posts`);

// write review pages
for (const r of reviews) {
  fs.writeFileSync(path.join(reviewsDir, `${r.slug}.html`), reviewPage(r, reviews));
}

// HT/DMR (ham radio) reviews — separate section, separate folder from PoC reviews.
// Same pattern: drop a standalone .html file in /ht-radios/ at repo root and it
// gets copied to dist/ht-radios/ and auto-added to the sitemap below.
// NOTE: compute this BEFORE the reviews/ override pass below, so we can guard
// against the recurring upload mistake of an HT file also landing in reviews/
// (caused 3-way duplicate-content on tidradio-td-h9 — fixed and guarded here).
const htRadiosSrcDir = path.join(__dirname, 'ht-radios');
const htRadiosDistDir = path.join(distDir, 'ht-radios');
let htRadioSlugs = [];
let htRadioFilenames = new Set();
if (fs.existsSync(htRadiosSrcDir)) {
  fs.mkdirSync(htRadiosDistDir, { recursive: true });
  const htFiles = fs.readdirSync(htRadiosSrcDir).filter(f => f.endsWith('.html'));
  htRadioFilenames = new Set(htFiles);
  htRadioSlugs = htFiles.map(f => {
    fs.copyFileSync(path.join(htRadiosSrcDir, f), path.join(htRadiosDistDir, f));
    console.log(`  → HT radio review: ${f}`);
    return f.replace(/\.html$/, '');
  });
}

// Override with standalone hands-on reviews if they exist in /reviews/
const standaloneDir = path.join(__dirname, 'reviews');
if (fs.existsSync(standaloneDir)) {
  fs.readdirSync(standaloneDir).forEach(f => {
    if (!f.endsWith('.html')) return;
    if (htRadioFilenames.has(f)) {
      console.warn(`  ⚠ SKIPPED reviews/${f}: also exists in ht-radios/ — this file belongs in ht-radios/ ONLY. Delete it from reviews/ in the repo to clear this warning.`);
      return;
    }
    fs.copyFileSync(path.join(standaloneDir, f), path.join(reviewsDir, f));
    console.log(`  → Standalone review override: ${f}`);
  });
}

// ── Use-case landing pages ──
const usecases = JSON.parse(fs.readFileSync(path.join(__dirname, 'data/usecases.json'), 'utf8'));
const usecaseDir = path.join(distDir, 'guides');
fs.mkdirSync(usecaseDir, { recursive: true });

function usecasePage(uc) {
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home", "item": SITE + "/" },
      { "@type": "ListItem", "position": 2, "name": uc.h1, "item": `${SITE}/guides/${uc.slug}.html` }
    ]
  };
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${uc.title} | POC Radio HQ</title>
<meta name="description" content="${uc.metaDesc}">
<link rel="canonical" href="${SITE}/guides/${uc.slug}.html">
<meta property="og:title" content="${uc.title}">
<meta property="og:description" content="${uc.metaDesc}">
<meta property="og:url" content="${SITE}/guides/${uc.slug}.html">
<link rel="stylesheet" href="../styles.css">
<script type="application/ld+json">${JSON.stringify(breadcrumbSchema)}</script>
<!-- Google tag (gtag.js) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-QHPFB16VF4"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-QHPFB16VF4');
</script>
</head>
<body>
<header>
  <div class="nav">
    <a href="../index.html" class="logo">${LOGO_SVG} POC Radio HQ</a>
    <a href="../index.html#guide" class="btn" style="padding:8px 16px;font-size:.85rem;">Full Buying Guide</a>
  </div>
</header>
<div class="wrap">
  <div class="breadcrumb"><a href="../index.html">Home</a> / ${uc.h1}</div>

  <div class="review-hero">
    <h1>${uc.h1}</h1>
    <p style="max-width:65ch;">${uc.intro}</p>
  </div>

  <section class="block">
    <h2>🏆 Top pick: <a href="../reviews/${uc.topPick}.html">${uc.topPickName}</a></h2>
    <p>${uc.topPickWhy}</p>
  </section>

  <section class="block">
    <h2>Runner-up: <a href="../reviews/${uc.runnerUp}.html">${uc.runnerUpName}</a></h2>
    <p>${uc.runnerUpWhy}</p>
  </section>

  <section class="block">
    <h2>Budget pick: <a href="../reviews/${uc.budgetPick}.html">${uc.budgetPickName}</a></h2>
    <p>${uc.budgetPickWhy}</p>
  </section>

  <section class="block">
    <h2>Compare all options</h2>
    <div class="related">
      <a href="../index.html#picker">🎯 Radio Picker Quiz</a>
      <a href="../index.html#cost">💰 Cost Calculator</a>
      <a href="../index.html#compare">📊 POC vs GMRS vs Ham vs CB</a>
      <a href="../index.html#quote">📋 Request a Fleet Quote</a>
    </div>
  </section>

  <section class="block" style="border-bottom:none;">
    <h2>Other use-case guides</h2>
    <div class="related">
      ${usecases.filter(u => u.slug !== uc.slug).map(u => `<a href="./${u.slug}.html">${u.h1.replace('Best POC radio for ','')}</a>`).join('')}
    </div>
  </section>
</div>
<footer>© 2026 POC Radio HQ. As an Amazon Associate we earn from qualifying purchases. <a href="../index.html">Back to home</a></footer>
</body>
</html>`;
}

for (const uc of usecases) {
  fs.writeFileSync(path.join(usecaseDir, `${uc.slug}.html`), usecasePage(uc));
}

// Copy standalone guide pages into dist/guides/
const standaloneGuides = path.join(__dirname, 'data');
['hobbyist-guide.html', 'best-poc-apps.html', 'choyong-wt2-vs-tidradio-td-m2-pro.html', 'poc-radio-setup-guide.html'].forEach(f => {
  const src = path.join(standaloneGuides, f);
  const outName = f === 'hobbyist-guide.html' ? 'poc-radio-for-hobbyists.html' : f;
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, path.join(usecaseDir, outName));
    console.log(`  → Standalone guide: ${outName}`);
  }
});

// copy homepage + about.html + netlify.toml into dist
const homepageSrc = fs.existsSync(path.join(__dirname, 'data/homepage.html'))
  ? path.join(__dirname, 'data/homepage.html')
  : path.join(__dirname, 'index.html');
const hb = homeBlocks(bench);
let homeHtml = fs.readFileSync(homepageSrc, 'utf8')
  .replace('<!--HQ:ROWS-->', hb.rows)
  .replace('<!--HQ:PICKS-->', hb.picks)
  .replace('<!--HQ:RADAR-->', hb.radar)
  .replace('<!--HQ:LCD-->', hb.lcd)
  .replace('<!--HQ:ITEMLIST-->', hb.itemList)
  .replace('<!--HQ:COUNT-->', hb.count)
  .replace('/*HQ:COST*/[]', hb.costData)
  .replace('/*HQ:PICKER*/{}', hb.pickerData);
if (/<!--HQ:|\/\*HQ:/.test(homeHtml)) throw new Error('Homepage placeholder left unfilled');
fs.writeFileSync(path.join(distDir, 'index.html'), homeHtml);
for (const extra of ['how-we-test.html', '_redirects']) {
  if (fs.existsSync(path.join(__dirname, extra))) {
    fs.copyFileSync(path.join(__dirname, extra), path.join(distDir, extra));
    console.log(`  → Copied ${extra}`);
  }
}
fs.copyFileSync(path.join(__dirname, 'about.html'), path.join(distDir, 'about.html'));
for (const legalPage of ['privacy-policy.html', 'terms.html', 'affiliate-disclosure.html']) {
  const legalSrc = path.join(__dirname, legalPage);
  if (fs.existsSync(legalSrc)) {
    fs.copyFileSync(legalSrc, path.join(distDir, legalPage));
    console.log(`  → Legal page: ${legalPage}`);
  } else {
    console.warn(`  ⚠ Missing legal page: ${legalPage} (footer links to it but the file isn't in the repo root)`);
  }
}
if (fs.existsSync(path.join(__dirname, 'netlify.toml'))) {
  fs.copyFileSync(path.join(__dirname, 'netlify.toml'), path.join(distDir, 'netlify.toml'));
}

// copy images folder into dist/images/
const imagesrc = path.join(__dirname, 'images');
const imagedst = path.join(distDir, 'images');
if (fs.existsSync(imagesrc)) {
  fs.mkdirSync(imagedst, { recursive: true });
  fs.readdirSync(imagesrc).forEach(f => {
    if (!fs.statSync(path.join(imagesrc, f)).isFile()) return;
    fs.copyFileSync(path.join(imagesrc, f), path.join(imagedst, f));
    console.log(`  → Image: ${f}`);
  });
}

// copy videos folder into dist/videos/ (for embedded review video files)
const videosrc = path.join(__dirname, 'videos');
const videodst = path.join(distDir, 'videos');
if (fs.existsSync(videosrc)) {
  fs.mkdirSync(videodst, { recursive: true });
  fs.readdirSync(videosrc).forEach(f => {
    fs.copyFileSync(path.join(videosrc, f), path.join(videodst, f));
    console.log(`  → Video: ${f}`);
  });
}

// sitemap.xml
// Auto-discover standalone review files that aren't in reviews.json (e.g. new
// hands-on reviews added directly to /reviews/) so they never silently miss
// the sitemap the way carrborg-x13-review.html did.
const knownSlugs = new Set(reviews.map(r => r.slug));
const extraReviewSlugs = fs.existsSync(standaloneDir)
  ? fs.readdirSync(standaloneDir)
      .filter(f => f.endsWith('.html') && !htRadioFilenames.has(f))
      .map(f => f.replace(/\.html$/, ''))
      .filter(slug => !knownSlugs.has(slug))
  : [];
if (extraReviewSlugs.length) {
  console.log(`  → Auto-added to sitemap (not in reviews.json): ${extraReviewSlugs.join(', ')}`);
}

const urls = [
  { loc: `${SITE}/`, priority: '1.0' },
  { loc: `${SITE}/about.html`, priority: '0.6' },
  { loc: `${SITE}/how-we-test.html`, priority: '0.7' },
  { loc: `${SITE}/privacy-policy.html`, priority: '0.3' },
  { loc: `${SITE}/terms.html`, priority: '0.3' },
  { loc: `${SITE}/affiliate-disclosure.html`, priority: '0.3' },
  ...reviews.map(r => ({ loc: `${SITE}/reviews/${r.slug}.html`, priority: '0.8' })),
  ...extraReviewSlugs.map(slug => ({ loc: `${SITE}/reviews/${slug}.html`, priority: '0.8' })),
  ...htRadioSlugs.map(slug => ({ loc: `${SITE}/ht-radios/${slug}.html`, priority: '0.8' })),
  ...usecases.map(u => ({ loc: `${SITE}/guides/${u.slug}.html`, priority: '0.7' })),
  { loc: `${SITE}/guides/poc-radio-for-hobbyists.html`, priority: '0.7' },
  { loc: `${SITE}/guides/best-poc-apps.html`, priority: '0.7' },
  { loc: `${SITE}/guides/choyong-wt2-vs-tidradio-td-m2-pro.html`, priority: '0.7' },
  { loc: `${SITE}/guides/poc-radio-setup-guide.html`, priority: '0.7' },
  { loc: `${SITE}/blog/`, priority: '0.7' },
  ...posts.map(p => ({ loc: `${SITE}/blog/${p.slug}.html`, priority: '0.6' }))
];
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(u => `  <url><loc>${u.loc}</loc><priority>${u.priority}</priority></url>`).join('\n')}
</urlset>`;
fs.writeFileSync(path.join(distDir, 'sitemap.xml'), sitemap);

// robots.txt
const robots = `User-agent: *
Allow: /

Sitemap: ${SITE}/sitemap.xml`;
fs.writeFileSync(path.join(distDir, 'robots.txt'), robots);

// ── HQ brand layer: shared masthead/footer, signal-bar ratings, stamps ──
function walkHtml(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(e => {
    const p = path.join(dir, e.name);
    return e.isDirectory() ? walkHtml(p) : (e.name.endsWith('.html') ? [p] : []);
  });
}
let branded = 0;
for (const file of walkHtml(distDir)) {
  const rel = path.relative(distDir, file).split(path.sep);
  const prefix = rel.length > 1 ? '../'.repeat(rel.length - 1) : './';
  const kind = rel.length === 1 && rel[0] === 'index.html' ? 'home' : rel[0] === 'reviews' ? 'review' : rel[0] === 'ht-radios' ? 'ht' : 'page';
  const out = brandify(fs.readFileSync(file, 'utf8'), { prefix, bench, kind });
  if (!out.includes('class="hq-mast"') || !out.includes('class="hq-foot"')) throw new Error(`Brand layer failed on ${rel.join('/')}`);
  fs.writeFileSync(file, out);
  branded++;
}
console.log(`  → HQ brand layer applied to ${branded} pages`);

console.log(`Built ${reviews.length} review pages + ${usecases.length} use-case guides + index + sitemap + robots.txt into dist/`);
