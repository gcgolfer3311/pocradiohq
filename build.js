const fs = require('fs');
const path = require('path');

const SITE = 'https://pocradiohq.com';
const reviews = JSON.parse(fs.readFileSync(path.join(__dirname, 'data/reviews.json'), 'utf8'));

const distDir = path.join(__dirname, 'dist');
const reviewsDir = path.join(distDir, 'reviews');
fs.mkdirSync(reviewsDir, { recursive: true });

// ---- shared styles (extracted, reused across all pages) ----
const sharedCSS = `
:root{--bg:#0b1220;--bg2:#101a2e;--card:#141f38;--card2:#182444;--accent:#ff6a1a;--accent2:#ffb020;--text:#e9edf5;--sub:#9aa7c2;--line:#22304f;--good:#3ddc97;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;}
*{box-sizing:border-box;margin:0;padding:0;}
html{scroll-behavior:smooth;}
body{background:var(--bg);color:var(--text);line-height:1.6;}
a{color:var(--accent2);text-decoration:none;}
a:hover{text-decoration:underline;}
.wrap{max-width:900px;margin:0 auto;padding:0 20px;}
header{position:sticky;top:0;z-index:50;background:rgba(11,18,32,.92);backdrop-filter:blur(8px);border-bottom:1px solid var(--line);}
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

function starString(rating) {
  const full = Math.round(rating);
  return '★★★★★☆☆☆☆☆'.slice(5 - full, 10 - full);
}

function reviewPage(r, allReviews) {
  const priceText = r.priceLow ? `$${r.priceLow}–$${r.priceHigh}` : 'Contact for pricing';
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
  if (r.priceLow) {
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
      <a href="#" class="btn" rel="sponsored nofollow">Check Current Price</a>
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

// write review pages
for (const r of reviews) {
  fs.writeFileSync(path.join(reviewsDir, `${r.slug}.html`), reviewPage(r, reviews));
}

// copy index.html + netlify.toml as-is into dist
fs.copyFileSync(path.join(__dirname, 'index.html'), path.join(distDir, 'index.html'));
if (fs.existsSync(path.join(__dirname, 'netlify.toml'))) {
  fs.copyFileSync(path.join(__dirname, 'netlify.toml'), path.join(distDir, 'netlify.toml'));
}

// sitemap.xml
const urls = [
  { loc: `${SITE}/`, priority: '1.0' },
  ...reviews.map(r => ({ loc: `${SITE}/reviews/${r.slug}.html`, priority: '0.8' }))
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

console.log(`Built ${reviews.length} review pages + index + sitemap + robots.txt into dist/`);
