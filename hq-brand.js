// HQ Network brand layer for POC Radio HQ.
// Runs after build.js writes dist/: swaps every page's <header>/<footer> for the
// shared HQ masthead + footer, converts star ratings to signal bars, strips emoji,
// stamps hands-on reviews, flags spec-based ones, and adds the author card.
// Zero dependencies. Edit NETWORK / SOCIAL / AUTHOR here to change it sitewide.

const NETWORK = [
  { name: 'HQ Shortwave Radio', url: 'https://hqshortwaveradio.com' },
  { name: 'POC Radio HQ', url: 'https://pocradiohq.com', self: true },
  { name: 'CB Radio HQ', url: 'https://cbradiohq.com' },
  { name: 'GMRS HQ', url: 'https://gmrshq.com' }
];
const SOCIAL = [
  { name: 'YouTube', url: 'https://www.youtube.com/@Hqshortwaveradio' },
  { name: 'TikTok', url: 'https://www.tiktok.com/@hqshortwaveradio' },
  { name: 'Facebook', url: 'https://www.facebook.com/Hqshortwaveradio' }
];
const AUTHOR = { name: 'Michael Smith', call: 'KM7FMJ', where: 'Arizona' };
const FONTS = '<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=IBM+Plex+Mono:wght@400;500;600;700&family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&display=swap">';

function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }

function sigBars(score, opts = {}) {
  const s = Math.max(0, Math.min(5, Number(score) || 0));
  const full = Math.floor(s + 1e-9);
  const half = s - full >= 0.25 && s - full < 0.75;
  const fullAdj = s - full >= 0.75 ? full + 1 : full;
  let bars = '';
  for (let i = 1; i <= 5; i++) bars += `<i class="${i <= fullAdj ? 'f' : (half && i === full + 1 ? 'h' : '')}"></i>`;
  const num = opts.noNum ? '' : `<span class="sig-num">${s.toFixed(1)}<small>/5</small></span>`;
  return `<span class="sig" role="img" aria-label="Rated ${s.toFixed(1)} out of 5"><span class="sig-bars">${bars}</span>${num}</span>`;
}

function netBar(prefix) {
  return `<div class="hq-net"><div class="hq-net-in"><span class="hq-net-lbl"><i></i>HQ Radio Network</span>${NETWORK.map(n =>
    n.self ? `<a class="on" href="${prefix}index.html" aria-current="true">${n.name}</a>` : `<a href="${n.url}" target="_blank" rel="noopener">${n.name}</a>`
  ).join('')}</div></div>`;
}

function ticker(prefix, bench) {
  const t = bench.tested;
  const items = [];
  if (t[0]) items.push(`Latest on the bench: <a href="${prefix}${t[0].path}">${esc(t[0].name)}</a> · ${t[0].score.toFixed(1)}/5${t[0].ptt ? ' · PTT ' + esc(t[0].ptt) : ''}`);
  items.push(`${t.length} PoC radios hands-on tested`);
  t.slice(1).forEach(r => items.push(`<a href="${prefix}${r.path}">${esc(r.name)}</a> · ${r.score.toFixed(1)}/5`));
  items.push(`Tested in ${AUTHOR.where} by ${AUTHOR.name}, ${AUTHOR.call}`);
  items.push(`<a href="${prefix}how-we-test.html">How we test</a>`);
  const run = items.map(i => `<span>${i}</span>`).join('');
  return `<div class="hq-ticker" aria-label="Latest from the bench"><div class="hq-tk-lbl"><i></i>On the bench</div><div class="hq-tk-scroll"><div class="hq-tk-track">${run}${run.replace(/<span>/g, '<span aria-hidden="true">')}</div></div></div>`;
}

function masthead(prefix, bench, isHome) {
  const h = isHome ? '' : `${prefix}index.html`;
  const nav = [
    [`${h}#bench`, 'The Bench'],
    [`${h}#picks`, 'Reviews'],
    [`${h}#picker`, 'Radio Picker'],
    [`${h}#cost`, 'Cost'],
    [`${prefix}guides/poc-radio-setup-guide.html`, 'Setup Guide'],
    [`${prefix}blog/`, 'Blog'],
    [`${prefix}how-we-test.html`, 'How We Test']
  ];
  return `${netBar(prefix)}${ticker(prefix, bench)}
<header class="hq-mast"><div class="hq-mast-in">
  <a class="hq-brand" href="${prefix}index.html" aria-label="POC Radio HQ home"><span class="hq-sbars" aria-hidden="true"><i></i><i></i><i></i></span><span><span class="hq-bname">POC Radio<em>HQ</em></span><span class="hq-btag" style="display:block">Push-to-talk radios, tested by hand</span></span></a>
  <button class="hq-burger" type="button" aria-expanded="false" aria-controls="hq-nav" onclick="var n=document.getElementById('hq-nav');var o=n.classList.toggle('open');this.setAttribute('aria-expanded',o);this.textContent=o?'Close':'Menu';">Menu</button>
  <nav class="hq-nav" id="hq-nav" aria-label="Main">${nav.map(([u, l]) => `<a href="${u}">${l}</a>`).join('')}<a class="hq-cta" href="${h}#picker">Find my radio</a></nav>
</div></header>`;
}

function footer(prefix) {
  return `<footer class="hq-foot">
  <div class="hq-foot-in">
    <div>
      <a class="hq-brand" href="${prefix}index.html"><span class="hq-sbars" aria-hidden="true"><i></i><i></i><i></i></span><span class="hq-bname">POC Radio<em>HQ</em></span></a>
      <p>Independent Push-to-Talk over Cellular radio reviews. Hands-on tested radios are marked on every page; spec-based overviews are labelled as such and carry no score.</p>
      <p>Run by ${AUTHOR.name}, ${AUTHOR.call}. Part of the HQ Radio Network.</p>
    </div>
    <div><h4>Site</h4><ul>
      <li><a href="${prefix}index.html#bench">The Bench</a></li>
      <li><a href="${prefix}index.html#picks">Tested Reviews</a></li>
      <li><a href="${prefix}index.html#picker">Radio Picker</a></li>
      <li><a href="${prefix}index.html#cost">Cost Calculator</a></li>
      <li><a href="${prefix}guides/poc-radio-setup-guide.html">Setup Guide</a></li>
      <li><a href="${prefix}guides/best-poc-apps.html">Best PoC Apps</a></li>
      <li><a href="${prefix}blog/">Blog</a></li>
    </ul></div>
    <div><h4>HQ Radio Network</h4><ul>
      ${NETWORK.filter(n => !n.self).map(n => `<li><a href="${n.url}" target="_blank" rel="noopener">${n.name}</a></li>`).join('')}
      ${SOCIAL.map(s => `<li><a href="${s.url}" target="_blank" rel="noopener">${s.name}</a></li>`).join('')}
    </ul></div>
    <div><h4>About</h4><ul>
      <li><a href="${prefix}how-we-test.html">How We Test</a></li>
      <li><a href="${prefix}about.html">About</a></li>
      <li><a href="${prefix}index.html#contact">Contact / Review Units</a></li>
      <li><a href="${prefix}affiliate-disclosure.html">Affiliate Disclosure</a></li>
      <li><a href="${prefix}privacy-policy.html">Privacy</a></li>
      <li><a href="${prefix}terms.html">Terms</a></li>
    </ul></div>
  </div>
  <div class="hq-foot-bot"><span>© 2026 POC Radio HQ · HQ Radio Network</span><span>As an Amazon Associate we earn from qualifying purchases.</span></div>
</footer>`;
}

function authorCard(prefix) {
  return `<div class="wrap"><aside class="author-card" aria-label="About the reviewer">
  <div class="author-plate">${AUTHOR.call}<small>LICENSED</small></div>
  <div>
    <h3>Tested by ${AUTHOR.name}</h3>
    <div class="role">Licensed ham · ${AUTHOR.call} · ${AUTHOR.where} · HQ Radio Network</div>
    <p>I run POC Radio HQ and HQ Shortwave Radio. A radio only gets a score here after I've used it myself on a live cell network. Many review units are sent by manufacturers; every review still lists the cons.</p>
    <div class="author-links"><a href="${prefix}how-we-test.html">How I test</a><a href="${SOCIAL[0].url}" target="_blank" rel="noopener">Videos on YouTube</a><a href="https://hqshortwaveradio.com" target="_blank" rel="noopener">HQ Shortwave Radio</a></div>
  </div>
</aside></div>`;
}

const EMOJI_RE = /[\u{1F000}-\u{1FAFF}\u{2600}-\u{2604}\u{2607}-\u{2712}\u{2714}-\u{2716}\u{2718}-\u{27BF}\u{2B50}\u{2B55}\u{FE0F}\u{200D}]/gu;

function stripEmoji(html) {
  return html.split(/(<script[\s\S]*?<\/script>)/i).map((part, i) => {
    if (i % 2 === 1) return part;
    return part.replace(EMOJI_RE, '')
      .replace(/(<(h[1-6]|a|span|div|li|button|strong)\b[^>]*>)[ \t]+/g, '$1');
  }).join('');
}

function starsToBars(html) {
  return html.replace(/<(span|div) class="stars"[^>]*>\s*([★☆½]+)\s*<\/\1>(\s*<span class="rating-num">[^<]*<\/span>)?/g, (m, tag, stars, numSpan) => {
    let score = (stars.match(/★/g) || []).length + (stars.includes('½') ? 0.5 : 0);
    if (numSpan) { const n = parseFloat(numSpan.replace(/<[^>]+>/g, '')); if (!isNaN(n)) score = n; }
    return sigBars(score);
  });
}

// kind: 'home' | 'review' | 'ht' | 'page'
function brandify(html, { prefix, bench, kind }) {
  const isHome = kind === 'home';
  // fonts + theme color
  html = html.replace(/@import url\('https:\/\/fonts\.googleapis\.com[^']*'\);?/g, '');
  if (!html.includes('fonts.googleapis.com/css2?family=Syne')) html = html.replace('</head>', `${FONTS}\n</head>`);
  if (!html.includes('name="theme-color"')) html = html.replace('</head>', '<meta name="theme-color" content="#0a0b0e">\n</head>');
  // header + footer
  const mast = masthead(prefix, bench, isHome);
  if (/<header\b[\s\S]*?<\/header>/.test(html)) html = html.replace(/<header\b[\s\S]*?<\/header>/, mast);
  else html = html.replace(/<body([^>]*)>/, `<body$1>\n${mast}`);
  let foot = footer(prefix);
  const tested = /HANDS-ON TESTED|Hands-on tested/.test(html);
  if (kind === 'review' || kind === 'ht') {
    const heroEnd = /(<div class="review-hero">[\s\S]*?<h1[^>]*>[\s\S]*?<\/h1>)/;
    if (tested) {
      html = html.replace(heroEnd, `$1\n    <div class="bench-stamp"><b></b>Bench tested · ${AUTHOR.call} · ${AUTHOR.where}</div>`);
      foot = authorCard(prefix) + '\n' + foot;
    } else if (kind === 'review') {
      html = html.replace(heroEnd, `$1\n    <div class="spec-note"><strong>Spec-based overview · not yet bench tested</strong>This page is built from manufacturer specs and published information. We haven't tested this radio ourselves yet, so it carries no score. <a href="${prefix}how-we-test.html">How we test</a> · <a href="${prefix}index.html#bench">Radios we have tested</a></div>`);
    }
  }
  if (/<footer\b[\s\S]*?<\/footer>/.test(html)) html = html.replace(/<footer\b[\s\S]*?<\/footer>/, foot);
  else html = html.replace('</body>', `${foot}\n</body>`);
  html = starsToBars(html);
  html = stripEmoji(html);
  return html;
}

// ---------- homepage blocks from data/bench.json ----------
function homeBlocks(bench) {
  const t = bench.tested;
  const rows = t.map(r => `<tr>
  <td class="bt-radio"><a href="./${r.path}"><img src="./${r.img}" width="48" height="64" loading="lazy" alt="">${esc(r.name)}</a></td>
  <td data-l="Score">${sigBars(r.score)}</td>
  <td data-l="Best at">${esc(r.bestAt)}</td>
  <td data-l="Watch out">${esc(r.watchOut)}</td>
  <td data-l="PTT delay" class="mono">${r.ptt ? esc(r.ptt) : '<span class="dim">Not timed yet</span>'}</td>
  <td data-l="Price" class="mono">${esc(r.price)}</td>
</tr>`).join('\n');
  const picks = t.map(r => `<article class="pick">
  <a class="pick-img" href="./${r.path}"><img src="./${r.img}" width="480" height="640" loading="lazy" alt="${esc(r.name)} PoC radio"><span class="pick-stamp">Bench tested</span></a>
  <div class="pick-body">
    <div class="pick-badge">${esc(r.badge)}</div>
    <h3><a href="./${r.path}">${esc(r.name)}</a></h3>
    <div class="pick-cat">${esc(r.cat)}</div>
    ${sigBars(r.score)}
    <p>${esc(r.desc)}</p>
    <div class="pick-foot"><span class="price">${esc(r.price)}</span><a class="btn" href="${r.buy}" ${r.buy.startsWith('mailto:') ? '' : 'rel="sponsored nofollow" target="_blank"'}>${esc(r.buyLabel)}</a></div>
    <a class="pick-more" href="./${r.path}">Read the full review →</a>
  </div>
</article>`).join('\n');
  const radar = bench.radar.map(r => `<a class="radar-item" href="./${r.path}"><img src="./${r.img}" width="60" height="80" loading="lazy" alt=""><span><strong>${esc(r.name)}</strong><small>${esc(r.note)}</small></span></a>`).join('\n');
  const f = t[0];
  const lcd = `<div class="lcd-device">
  <img src="./${f.img}" width="480" height="640" alt="${esc(f.name)}, the latest radio on our bench">
  <div class="lcd">
    <div class="lcd-top"><span>Last on the bench</span><span class="lcd-live">● REC</span></div>
    <div class="lcd-model">${esc(f.name.toUpperCase())}</div>
    <div class="lcd-row"><span>SCORE</span>${sigBars(f.score)}</div>
    ${(f.lcd || []).map(([k, v]) => `<div class="lcd-row"><span>${esc(k)}</span><b>${esc(v)}</b></div>`).join('')}
    <a class="lcd-link" href="./${f.path}">Read the review →</a>
  </div>
</div>`;
  const itemList = JSON.stringify({
    "@context": "https://schema.org", "@type": "ItemList", "name": "Hands-on tested PoC radios",
    "itemListElement": t.map((r, i) => ({ "@type": "ListItem", "position": i + 1, "name": r.name, "url": `https://pocradiohq.com/${r.path}` }))
  });
  const costData = JSON.stringify(t.concat(bench.radar).filter(r => r.cost).map(r => ({ name: r.name, hw: r.cost.hw, renew: r.cost.renew, src: r.cost.src })));
  const pickerData = JSON.stringify(Object.fromEntries(t.map(r => [r.name, { link: './' + r.path, tested: true }]).concat(bench.radar.map(r => [r.name, { link: './' + r.path, tested: false }]))));
  return { rows, picks, radar, lcd, itemList, costData, pickerData, count: String(t.length) };
}

module.exports = { brandify, homeBlocks, sigBars };
