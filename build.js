const fs = require('fs');
const path = require('path');

const SITE = 'https://pocradiohq.com';
const reviews = JSON.parse(fs.readFileSync(path.join(__dirname, 'data/reviews.json'), 'utf8'));
const posts = JSON.parse(fs.readFileSync(path.join(__dirname, 'data/posts.json'), 'utf8'))
  .slice().sort((a, b) => new Date(b.date) - new Date(a.date));

const distDir = path.join(__dirname, 'dist');
const reviewsDir = path.join(distDir, 'reviews');
fs.mkdirSync(reviewsDir, { recursive: true });

// ---- shared styles (extracted, reused across all pages) ----
const sharedCSS = `
:root{--bg:#14161a;--bg2:#1a1d22;--card:#1f2329;--card2:#262b32;--accent:#d64545;--accent2:#5b8fd9;--text:#eceff2;--sub:#98a1ad;--line:#2b3038;--good:#4dbf8a;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;}
*{box-sizing:border-box;margin:0;padding:0;}
html{scroll-behavior:smooth;}
body{background:var(--bg);color:var(--text);line-height:1.6;}
a{color:var(--accent2);text-decoration:none;}
a:hover{text-decoration:underline;}
.wrap{max-width:900px;margin:0 auto;padding:0 20px;}
header{position:sticky;top:0;z-index:50;background:rgba(20,22,26,.92);backdrop-filter:blur(8px);border-bottom:1px solid var(--line);}
.nav{display:flex;align-items:center;justify-content:space-between;padding:14px 20px;max-width:1120px;margin:0 auto;}
.logo{display:flex;align-items:center;gap:10px;font-weight:800;font-size:1.15rem;color:var(--text);}
.logo-mark{width:34px;height:34px;border-radius:8px;background:linear-gradient(135deg,var(--accent),var(--accent2));display:flex;align-items:center;justify-content:center;font-size:1.1rem;}
.breadcrumb{font-size:.82rem;color:var(--sub);padding:18px 0;}
.breadcrumb a{color:var(--sub);}
.review-hero{padding:20px 0 30px;border-bottom:1px solid var(--line);}
.badge{display:inline-block;background:linear-gradient(135deg,var(--accent),var(--accent2));color:#fff;font-weight:800;font-size:.72rem;padding:6px 12px;border-radius:8px;text-transform:uppercase;letter-spacing:.03em;margin-bottom:14px;}
h1{font-size:2.1rem;font-weight:800;margin-bottom:10px;}
.cat{color:var(--sub);font-size:.9rem;margin-bottom:16px;}
.rating-row{display:flex;align-items:center;gap:10px;margin-bottom:20px;}
.stars{color:var(--accent2);font-size:1.1rem;}
.rating-num{font-weight:700;}
.rating-count{color:var(--sub);font-size:.85rem;}
.price-box{background:var(--card);border:1px solid var(--line);border-radius:12px;padding:18px 22px;display:flex;justify-content:space-between;align-items:center;margin:20px 0;flex-wrap:wrap;gap:12px;}
.price-box .price{font-size:1.4rem;font-weight:800;}
.btn{display:inline-block;padding:12px 22px;border-radius:9px;font-weight:700;font-size:.9rem;background:var(--accent);color:#fff;}
.btn:hover{background:#e85e13;text-decoration:none;}
.specs-grid{display:flex;flex-wrap:wrap;gap:8px;margin:16px 0;}
.specs-grid span{background:var(--bg2);border:1px solid var(--line);padding:6px 12px;border-radius:6px;font-size:.82rem;color:var(--sub);}
section.block{padding:30px 0;border-bottom:1px solid var(--line);}
section.block:last-of-type{border-bottom:none;}
h2{font-size:1.35rem;margin-bottom:14px;}
p{color:var(--sub);margin-bottom:10px;}
.pros-cons{display:grid;grid-template-columns:1fr 1fr;gap:20px;}
.pros-cons h3{font-size:1rem;color:var(--text);margin-bottom:10px;}
.pros-cons ul{list-style:none;}
.pros-cons li{padding:6px 0 6px 22px;position:relative;font-size:.9rem;color:var(--sub);}
.pros li::before{content:"+";position:absolute;left:0;color:var(--good);font-weight:800;}
.cons li::before{content:"–";position:absolute;left:0;color:#ff6a6a;font-weight:800;}
.verdict-box{background:var(--card);border:1px solid var(--line);border-left:3px solid var(--accent);border-radius:10px;padding:20px;}
.related{display:flex;gap:14px;flex-wrap:wrap;margin-top:16px;}
.related a{background:var(--card);border:1px solid var(--line);padding:10px 16px;border-radius:8px;font-size:.85rem;}
footer{border-top:1px solid var(--line);padding:30px 0;color:var(--sub);font-size:.82rem;text-align:center;}
@media(max-width:640px){.pros-cons{grid-template-columns:1fr;}}
`;

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
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": r.rating,
      "reviewCount": r.reviewCount
    },
    "review": {
      "@type": "Review",
      "reviewRating": { "@type": "Rating", "ratingValue": r.rating, "bestRating": "5" },
      "author": { "@type": "Organization", "name": "POC Radio HQ" },
      "reviewBody": r.verdict
    }
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
</head>
<body>
<header>
  <div class="nav">
    <a href="../index.html" class="logo"><span class="logo-mark">📡</span> POC Radio HQ</a>
    <a href="../index.html#guide" class="btn" style="padding:8px 16px;font-size:.85rem;">Full Buying Guide</a>
  </div>
</header>
<div class="wrap">
  <div class="breadcrumb"><a href="../index.html">Home</a> / <a href="../index.html#guide">Buying Guide</a> / ${r.name}</div>

  <div class="review-hero">
    <span class="badge">${r.badge}</span>
    <h1>${r.icon} ${r.name} Review</h1>
    <div class="cat">${r.category}</div>
    <div class="rating-row">
      <span class="stars">${starString(r.rating)}</span>
      <span class="rating-num">${r.rating}/5</span>
      <span class="rating-count">based on ${r.reviewCount} owner reports &amp; spec analysis</span>
    </div>
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
      ${related.map(x => `<a href="./${x.slug}.html">${x.icon} ${x.name}</a>`).join('')}
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
</head>
<body>
<header>
  <div class="nav">
    <a href="../index.html" class="logo"><span class="logo-mark">📡</span> POC Radio HQ</a>
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
</head>
<body>
<header>
  <div class="nav">
    <a href="../index.html" class="logo"><span class="logo-mark">📡</span> POC Radio HQ</a>
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

// Override with standalone hands-on reviews if they exist in /reviews/
const standaloneDir = path.join(__dirname, 'reviews');
if (fs.existsSync(standaloneDir)) {
  fs.readdirSync(standaloneDir).forEach(f => {
    if (f.endsWith('.html')) {
      fs.copyFileSync(path.join(standaloneDir, f), path.join(reviewsDir, f));
      console.log(`  → Standalone review override: ${f}`);
    }
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
</head>
<body>
<header>
  <div class="nav">
    <a href="../index.html" class="logo"><span class="logo-mark">📡</span> POC Radio HQ</a>
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
fs.copyFileSync(homepageSrc, path.join(distDir, 'index.html'));
fs.copyFileSync(path.join(__dirname, 'about.html'), path.join(distDir, 'about.html'));
if (fs.existsSync(path.join(__dirname, 'netlify.toml'))) {
  fs.copyFileSync(path.join(__dirname, 'netlify.toml'), path.join(distDir, 'netlify.toml'));
}

// copy images folder into dist/images/
const imagesrc = path.join(__dirname, 'images');
const imagedst = path.join(distDir, 'images');
if (fs.existsSync(imagesrc)) {
  fs.mkdirSync(imagedst, { recursive: true });
  fs.readdirSync(imagesrc).forEach(f => {
    fs.copyFileSync(path.join(imagesrc, f), path.join(imagedst, f));
    console.log(`  → Image: ${f}`);
  });
}

// sitemap.xml
const urls = [
  { loc: `${SITE}/`, priority: '1.0' },
  { loc: `${SITE}/about.html`, priority: '0.6' },
  ...reviews.map(r => ({ loc: `${SITE}/reviews/${r.slug}.html`, priority: '0.8' })),
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

console.log(`Built ${reviews.length} review pages + ${usecases.length} use-case guides + index + sitemap + robots.txt into dist/`);
