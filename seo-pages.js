// SEO landing pages generated from data/bench.json + data/competitors.json.
// Prices live in those two files only, so these pages never drift from the rest of the site.
const fs = require('fs');
const path = require('path');

const money = n => '$' + (Math.round(n * 100) / 100).toLocaleString('en-US', { minimumFractionDigits: n % 1 ? 2 : 0, maximumFractionDigits: 2 });
const stars = s => '★'.repeat(Math.floor(s)) + (s % 1 >= 0.5 ? '½' : '') + '☆'.repeat(5 - Math.floor(s) - (s % 1 >= 0.5 ? 1 : 0));
const rating = s => `<span class="stars">${stars(s)}</span> <span class="rating-num">${s.toFixed(1)}/5</span>`;
const buyAttr = u => u.startsWith('mailto:') ? '' : ' rel="sponsored nofollow" target="_blank"';
// 3-year cost for n radios: hardware (smallest pack) + renewals for years 2 and 3, or 36 months of service
const threeYr = (c, n) => n * (c.hw + (c.upfrontExtra || 0)) + n * (c.renew || 0) * 2 + n * (c.monthly || 0) * 36;

const CSS = `<style>
  .vs{display:grid;grid-template-columns:repeat(auto-fit,minmax(195px,1fr));gap:16px;margin:20px 0 6px;}
  .vs-card{background:var(--card);border:1px solid var(--line);border-radius:10px;overflow:hidden;display:flex;flex-direction:column;}
  .vs-card img{width:100%;height:230px!important;max-height:230px;object-fit:cover;object-position:center 35%;display:block;}
  .vs-card>div{padding:16px;display:flex;flex-direction:column;flex:1;}
  .vs-card h3{font-size:1.2rem;margin:6px 0;}
  .vs-card h3 a{color:var(--text);}
  .vs-card p{font-size:.88rem;margin:8px 0 12px;flex:1;}
  .vs-card .btn{width:100%;text-align:center;}
  .win{font:600 .64rem/1 var(--mono);letter-spacing:.12em;text-transform:uppercase;color:var(--accent);}
  .tblx{overflow-x:auto;margin:14px 0;}
  .ct{width:100%;min-width:620px;font-size:.9rem;border:1px solid var(--line);border-radius:8px;background:var(--card);}
  .ct th{font:600 .62rem/1.2 var(--mono);letter-spacing:.12em;text-transform:uppercase;color:var(--m2);text-align:left;padding:12px 14px;background:var(--panel);border-bottom:1px solid var(--line2);}
  .ct td{padding:11px 14px;border-bottom:1px solid var(--line);color:var(--sub);vertical-align:top;}
  .ct td:first-child{font:600 .74rem/1.4 var(--mono);color:var(--text);letter-spacing:.03em;}
  .ct tr:last-child td{border-bottom:none;}
  .ct .w{color:var(--text);background:rgba(240,185,85,.06);}
  .ct .mono{font-family:var(--mono);color:var(--text);white-space:nowrap;}
  .updated{font:500 .72rem/1.4 var(--mono);letter-spacing:.06em;color:var(--m2);text-transform:uppercase;}
  .faq-item{padding:14px 0;border-bottom:1px solid var(--line);}
  .faq-item h3{font-size:1.05rem;margin-bottom:6px;}
  .faq-item p{margin:0;}
  .facts{display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:12px;}
  .facts div{background:var(--card);border:1px solid var(--line);border-radius:8px;padding:14px 16px;}
  .facts b{display:block;font:600 .64rem/1.2 var(--mono);letter-spacing:.12em;text-transform:uppercase;color:var(--m2);margin-bottom:6px;}
  .facts p{margin:0;font-size:.9rem;color:var(--text);}
  .rank{display:grid;grid-template-columns:44px 150px 1fr;gap:20px;padding:26px 0;border-bottom:1px solid var(--line);}
  .rank:last-child{border-bottom:none;}
  .rank-n{font:700 1.6rem/1 var(--mono);color:var(--accent);}
  .rank img{width:150px;height:200px;object-fit:cover;border-radius:8px;border:1px solid var(--line2);}
  .rank h3{font-size:1.35rem;margin:6px 0 8px;}
  .rank h3 a{color:var(--text);}
  .rank dl{display:grid;grid-template-columns:110px 1fr;gap:6px 12px;margin:14px 0;font-size:.9rem;}
  .rank dt{font:600 .64rem/1.6 var(--mono);letter-spacing:.1em;text-transform:uppercase;color:var(--m2);}
  .rank dd{margin:0;color:var(--sub);}
  .rank-cta{display:flex;gap:14px;align-items:center;flex-wrap:wrap;}
  .hub{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:14px;}
  .hub a{display:block;background:var(--card);border:1px solid var(--line);border-radius:10px;padding:18px;color:var(--sub);}
  .hub a:hover{border-color:var(--accent);}
  .hub em{display:block;font:600 .62rem/1 var(--mono);letter-spacing:.14em;text-transform:uppercase;color:var(--accent);font-style:normal;margin-bottom:8px;}
  .hub strong{display:block;font:700 1.08rem/1.3 var(--disp);color:var(--text);margin-bottom:6px;}
  .hub span{font-size:.88rem;}
  .note{font-size:.84rem;color:var(--m2);}
  @media(max-width:620px){.rank{grid-template-columns:1fr;}.rank img{width:120px;height:160px;}.rank dl{grid-template-columns:1fr;}}
</style>`;

const GTAG = `<!-- Google tag (gtag.js) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-QHPFB16VF4"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-QHPFB16VF4');
</script>`;

function page({ SITE, BUILD_DATE, slug, title, desc, crumb, img, faq, extraSchema = [], body }) {
  const url = `${SITE}/guides/${slug}.html`;
  const schema = [
    { "@context": "https://schema.org", "@type": "Article", "headline": title, "dateModified": BUILD_DATE, "author": { "@type": "Person", "name": "Michael Smith" }, "publisher": { "@type": "Organization", "name": "POC Radio HQ" }, "mainEntityOfPage": url },
    { "@context": "https://schema.org", "@type": "BreadcrumbList", "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home", "item": SITE + "/" },
      { "@type": "ListItem", "position": 2, "name": "Compare", "item": `${SITE}/guides/poc-radio-comparisons.html` },
      { "@type": "ListItem", "position": 3, "name": crumb, "item": url }] },
    ...(faq && faq.length ? [{ "@context": "https://schema.org", "@type": "FAQPage", "mainEntity": faq.map(([q, a]) => ({ "@type": "Question", "name": q, "acceptedAnswer": { "@type": "Answer", "text": a.replace(/<[^>]+>/g, '') } })) }] : []),
    ...extraSchema
  ];
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${title}</title>
<meta name="description" content="${desc}">
<link rel="canonical" href="${url}">
<meta property="og:title" content="${title}">
<meta property="og:description" content="${desc}">
<meta property="og:url" content="${url}">
<meta property="og:type" content="article">
<meta property="og:image" content="${SITE}/${img}">
<link rel="stylesheet" href="../styles.css">
${schema.map(o => `<script type="application/ld+json">${JSON.stringify(o)}</script>`).join('\n')}
${CSS}
${GTAG}
</head>
<body>
<header></header>
<div class="wrap">
  <div class="breadcrumb"><a href="../index.html">Home</a> / <a href="./poc-radio-comparisons.html">Compare</a> / ${crumb}</div>
${body}
${faq && faq.length ? `  <section class="block">
    <h2>Questions</h2>
    ${faq.map(([q, a]) => `<div class="faq-item"><h3>${q}</h3><p>${a}</p></div>`).join('\n    ')}
  </section>` : ''}
  <section class="block" style="border-bottom:none;">
    <h2>Keep comparing</h2>
    <div class="related">
      <a href="./best-poc-radios.html">Best PoC radios of 2026</a>
      <a href="./poc-radio-comparisons.html">All comparisons</a>
      <a href="./poc-radio-subscription-costs.html">Subscription costs</a>
      <a href="../index.html#bench">The Bench</a>
      <a href="../deals.html">Current deals</a>
    </div>
    <p style="font-size:.82rem;margin-top:18px;">Some links are affiliate links. <a href="../affiliate-disclosure.html">Disclosure</a>.</p>
  </section>
</div>
<footer></footer>
</body>
</html>
`;
}

function card(r, label, text) {
  return `<div class="vs-card">
        <a href="../${r.path}"><img src="../${r.img}" width="480" height="640" loading="lazy" alt="${r.name} PoC radio"></a>
        <div>
          <span class="win">${label}</span>
          <h3><a href="../${r.path}">${r.name}</a></h3>
          ${rating(r.score)}
          <p>${text}</p>
          <a class="btn" href="${r.buy}"${buyAttr(r.buy)}>${r.buyLabel} · ${r.price}</a>
        </div>
      </div>`;
}

// ── "X alternatives" page for an untested brand ──
function alternativesPage(ctx, key, cfg) {
  const { bench, comp } = ctx;
  const c = comp[key];
  const by = Object.fromEntries(bench.tested.map(r => [r.slug, r]));
  const picks = cfg.picks.map(([slug, label, why]) => {
    if (!by[slug]) throw new Error(`alternatives ${key}: ${slug} is not bench tested`);
    return { r: by[slug], label, why };
  });
  const n = 4;
  const theirs = threeYr(c, n);
  const rows = picks.filter(p => p.r.cost).map(p => ({ r: p.r, y3: threeYr(p.r.cost, n) })).sort((a, b) => a.y3 - b.y3);
  const cheapest = rows[0];
  const body = `
  <div class="review-hero">
    <span class="badge">Alternatives · picks are bench tested</span>
    <h1>${cfg.h1}</h1>
    <p class="updated">Updated ${comp.checked} · By Michael Smith, KM7FMJ</p>
    <p style="max-width:65ch;margin-top:14px;">${cfg.intro}</p>
    <div class="verdict-box" style="margin-top:18px;"><p style="margin:0;"><strong>Short answer:</strong> ${cfg.short(cheapest, theirs, money)}</p></div>
  </div>

  <section class="block">
    <h2>${c.model} at a glance</h2>
    <p class="note">We haven't tested ${c.name} radios. Everything in this box comes from ${c.name}'s own product page, checked ${comp.checked}. <a href="${c.site}" target="_blank" rel="noopener">See ${c.name}'s listing</a>${c.amazon ? ` or <a href="${c.amazon}" rel="sponsored nofollow" target="_blank">check it on Amazon</a>` : ''}.</p>
    <div class="facts">${c.facts.map(([k, v]) => `<div><b>${k}</b><p>${v}</p></div>`).join('')}</div>
  </section>

  <section class="block">
    <h2>3-year cost for ${n} radios</h2>
    <p>Hardware at the smallest pack price plus each brand's published service cost for three years. ${c.monthly ? `${c.name} bills service monthly from day one, so its total includes 36 months.` : 'Year one of service is included with every radio here.'}</p>
    <div class="tblx"><table class="ct">
      <thead><tr><th>Radio</th><th>Hardware each</th><th>Service after purchase</th><th>3-year total, ${n} radios</th><th>Per radio / month</th></tr></thead>
      <tbody>
        <tr><td>${c.model}<br><span class="note">not tested</span></td><td class="mono">${money(c.hw + (c.upfrontExtra || 0))}</td><td>${c.renewText}</td><td class="mono">${money(theirs)}</td><td class="mono">${money(theirs / n / 36)}</td></tr>
        ${rows.map(x => `<tr><td><a href="../${x.r.path}">${x.r.name}</a></td><td class="mono">${money(x.r.cost.hw)}</td><td>${x.r.cost.renew ? `${money(x.r.cost.renew)} per radio per year after year 1` : 'No renewal (seller lists lifetime data)'}</td><td class="mono${x === cheapest ? ' w' : ''}">${money(x.y3)}</td><td class="mono">${money(x.y3 / n / 36)}</td></tr>`).join('\n        ')}
      </tbody>
    </table></div>
    <p class="note">Prices checked ${comp.checked}. ${cfg.costNote || ''}</p>
  </section>

  <section class="block">
    <h2>The alternatives we've tested</h2>
    <div class="vs">${picks.map(p => card(p.r, p.label, p.why)).join('')}</div>
  </section>

  <section class="block">
    <h2>When to stick with ${c.name}</h2>
    <ul>${c.stayIf.map(s => `<li>${s}</li>`).join('')}</ul>
    <p>${cfg.fair}</p>
  </section>
`;
  return page({ ...ctx, slug: cfg.slug, title: cfg.title, desc: cfg.desc, crumb: cfg.crumb, img: picks[0].r.img, faq: cfg.faq(cheapest, theirs, money), body,
    extraSchema: [{ "@context": "https://schema.org", "@type": "ItemList", "name": cfg.h1, "itemListElement": picks.map((p, i) => ({ "@type": "ListItem", "position": i + 1, "name": p.r.name, "url": `${ctx.SITE}/${p.r.path}` })) }] });
}

function buildSeoPages({ distDir, bench, SITE, BUILD_DATE }) {
  const comp = JSON.parse(fs.readFileSync(path.join(__dirname, 'data/competitors.json'), 'utf8'));
  const ctx = { bench, comp, SITE, BUILD_DATE };
  const by = Object.fromEntries(bench.tested.map(r => [r.slug, r]));
  const out = path.join(distDir, 'guides');
  fs.mkdirSync(out, { recursive: true });
  const pages = [];
  const write = (slug, html) => { fs.writeFileSync(path.join(out, slug + '.html'), html); pages.push(slug); };
  const y3 = (slug, n = 4) => money(threeYr(by[slug].cost, n));

  // 1. Rapid Radios alternatives
  const rr = comp['rapid-radios'];
  write('rapid-radios-alternatives', alternativesPage(ctx, 'rapid-radios', {
    slug: 'rapid-radios-alternatives',
    crumb: 'Rapid Radios alternatives',
    title: 'Rapid Radios Alternatives: Cheaper Nationwide Walkie Talkies (Tested)',
    desc: `Rapid Radios G1 costs ${rr.priceText.split(' (')[0]} and renews at $50 a radio. These hands-on tested nationwide PoC radios cost less to buy and to keep running.`,
    h1: 'Rapid Radios alternatives',
    intro: `Rapid Radios is one of the best-known names in nationwide walkie talkies, and the G1 sells for ${rr.priceText}. That's roughly three times what the cheapest radios on our bench cost, and renewal is $50 a radio a year. Below: what the G1 offers on paper, what four radios cost over three years, and the tested radios we'd look at first.`,
    short: (ch, theirs) => `four Rapid Radios G1s come to about ${money(theirs)} over three years at the 2-pack price. Four ${ch.r.name}s come to about ${money(threeYr(ch.r.cost, 4))}, and the Radtel P8, our best-sounding radio, about ${y3('radtel-p8')}. Unless you need what Rapid Radios uniquely offers (below), a tested alternative saves most of that money.`,
    costNote: 'Rapid Radios auto-pay lowers renewal to $40, which brings four G1s to about ' + money(4 * rr.hw + 4 * 40 * 2) + '. Buying the 4-pack ($699) instead of two 2-packs saves another $99.',
    picks: [
      ['radtel-p8', 'Best overall swap', 'Clear, loud audio and a solid zinc-alloy body, SIMs included for year one and about $10 a radio to renew. Expect a 1 to 2 second PTT delay.'],
      ['carrborg-x13', 'No renewal at all', 'The seller lists lifetime free data, so the purchase price is the whole cost. Brightest screen we tested; slower to key up and bigger in hand.'],
      ['tidradio-td-m2-pro', 'Works with no signal', 'A second PTT button talks on license-free FRS with no network, which the G1 can\'t do. $9.99 a year to renew; the Odmaster app is buggy.'],
      ['herda-hp1', 'Smallest and loudest for size', 'At 63 g it disappears on a neck strap, and the 2W speaker carries. Renewal is $25 a year, still half of Rapid Radios.']
    ],
    fair: 'Rapid Radios also lists a large 8800 mAh battery, which, if it holds up, would outlast the radios we\'ve tested. We can\'t confirm that until we test one.',
    faq: (ch, theirs) => [
      ['Is there a cheaper alternative to Rapid Radios?', `Yes. The radios on our bench cost about $61 to $95 a radio against about $200 for a Rapid Radios G1 at the 2-pack price. Over three years, four ${ch.r.name}s cost about ${money(threeYr(ch.r.cost, 4))} and four Radtel P8s about ${y3('radtel-p8')}, against about ${money(theirs)} for four G1s.`],
      ['How much does Rapid Radios cost per year after the first year?', `Rapid Radios lists renewal at $50 per radio per year, or $40 per radio per year with auto-pay. The first year of service is included.`],
      ['Is Rapid Radios on Amazon?', `Yes. As of ${comp.checked} the Rapid Radios G1 2-pack is listed on Amazon at $399, the same price as on Rapid Radios' own site.`],
      ['Have you tested Rapid Radios?', 'Not yet. Everything we say about Rapid Radios comes from its own product pages. Every alternative on this page was tested by hand.']
    ]
  }));

  // 2. PeakPTT alternatives
  const pk = comp.peakptt;
  write('peakptt-alternatives', alternativesPage(ctx, 'peakptt', {
    slug: 'peakptt-alternatives',
    crumb: 'PeakPTT alternatives',
    title: 'PeakPTT Alternatives: PoC Radios With No Monthly Fee (Tested)',
    desc: 'PeakPTT charges $24.95 a radio every month. These hands-on tested PoC radios include a year of service and renew for $0 to $25 a year. Real 3-year cost math inside.',
    h1: 'PeakPTT alternatives with no monthly fee',
    intro: `PeakPTT sells business push-to-talk: the PTT-84G is ${pk.priceText}. That monthly fee is the whole story. Over three years it costs far more than the radio itself. If you don't need PeakPTT's GPS portal and dispatch tools, the radios below do the talking part for a fraction of the price.`,
    short: (ch, theirs) => `four PeakPTT radios cost about ${money(theirs)} over three years once monthly service is counted. Four ${ch.r.name}s cost about ${money(threeYr(ch.r.cost, 4))}, and four Radtel P8s about ${y3('radtel-p8')}. Stay with PeakPTT only if you need live GPS tracking and a dispatch console.`,
    costNote: 'PeakPTT also offers leasing with $0 equipment up front and discounted airtime on 36-month terms, but doesn\'t publish those rates.',
    picks: [
      ['radtel-p8', 'Best overall swap', 'Loud, clear audio and a solid body, with year-one SIMs included and about $10 a radio a year after. No GPS on this version.'],
      ['carrborg-x13', 'No service fee ever', 'Lifetime free data from the seller: buy it once and that\'s it. Big, bright screen; slower to key up.'],
      ['wouxun-kg-wv9', 'Closest business feature set', 'Listed with GPS and SOS, and group or member calls run from the radio\'s own menu. Sold by quote through Wouxun, not retail.'],
      ['tidradio-td-m2-pro', 'Talks with no signal', 'FRS on a second PTT button keeps a crew talking in dead zones. $9.99 a year after year one.']
    ],
    fair: 'Most of the radios we\'ve tested have no fleet GPS map or dispatcher console. If your business runs on those, compare PeakPTT with the enterprise platforms in our spec overviews of the <a href="../reviews/hytera-pnc360s-review.html">Hytera PNC360S</a> and <a href="../reviews/motorola-wave-ptx-review.html">Motorola WAVE PTX</a>.',
    faq: (ch, theirs) => [
      ['How much does PeakPTT cost per month?', `PeakPTT lists unlimited nationwide push-to-talk at $24.95 per radio per month, month to month, plus a $19.95 activation fee per radio. The PTT-84G radio is $229.`],
      ['Are there PoC radios with no monthly fee?', `Yes. Most consumer PoC radios include the first year of service and then renew yearly: about $10 for the Radtel P8, $9.99 for the TIDRADIO TD-M2 Pro, $25 for the Herda HP1, and $0 for the CARRBORG X13, whose seller lists lifetime data.`],
      ['Is PeakPTT worth it?', `It can be if you need a GPS tracking portal, dispatch seats and one vendor handling everything. For talking alone, four PeakPTT radios cost about ${money(theirs)} over three years against about ${money(threeYr(ch.r.cost, 4))} for four ${ch.r.name}s.`],
      ['Have you tested PeakPTT?', 'No. PeakPTT figures come from its own product and pricing pages. Every alternative listed here was tested by hand.']
    ]
  }));

  // 3. Zello vs a PoC radio
  const z = comp.zello;
  const zWork = z.coreMonthly * 36 * 4;
  write('zello-vs-poc-radio', page({ ...ctx, slug: 'zello-vs-poc-radio', crumb: 'Zello vs PoC radio',
    title: 'Zello vs a PoC Radio: Phone App or Real Walkie Talkie?',
    desc: 'Zello turns a phone into a walkie talkie for free. A PoC radio costs money but has a real PTT button, a loud speaker and its own SIM. Who should use which, with 3-year costs.',
    img: by['radtel-p8'].img,
    faq: [
      ['Is Zello free?', `The personal Zello app is free. Zello's business plans, Zello Work, list at $${z.coreMonthly.toFixed(2)} per user per month for Core and $${z.plusMonthly.toFixed(2)} for Plus as of ${comp.checked}.`],
      ['Can a PoC radio run Zello?', 'Some can. Android-based PoC radios like the Inrico T320 can install apps such as Zello. Most budget PoC radios, including the ones on our bench, run their maker\'s own network and can\'t join Zello channels.'],
      ['Which is cheaper, Zello or a PoC radio?', `If everyone already has a smartphone, personal Zello costs nothing. For a business on Zello Work Core, four users cost about ${money(zWork)} over three years before phones. Four Radtel P8 radios cost about ${y3('radtel-p8')} including service.`],
      ['Do I need a license for Zello or a PoC radio?', 'No. Both run over cellular data or WiFi, so no FCC license is needed.']
    ],
    body: `
  <div class="review-hero">
    <span class="badge">Head to head · app vs radio</span>
    <h1>Zello vs a PoC radio</h1>
    <p class="updated">Updated ${comp.checked} · By Michael Smith, KM7FMJ</p>
    <p style="max-width:65ch;margin-top:14px;">Zello and a PoC radio do the same job: press a button, talk to your group anywhere there's signal. Zello does it on the phone you already own. A PoC radio does it on a dedicated walkie talkie with its own SIM. Which is right comes down to who's holding it.</p>
    <div class="verdict-box" style="margin-top:18px;"><p style="margin:0;"><strong>Short answer:</strong> use free Zello if everyone has a smartphone and only talks now and then. Buy PoC radios for kids, older relatives, crews in gloves, or anyone who needs a loud speaker and one button to press without unlocking a phone.</p></div>
  </div>

  <section class="block">
    <h2>Side by side</h2>
    <div class="tblx"><table class="ct">
      <thead><tr><th></th><th>Zello (phone app)</th><th>PoC radio (e.g. Radtel P8)</th></tr></thead>
      <tbody>
        <tr><td>Up-front cost</td><td class="w">$0 if you own a phone</td><td>${by['radtel-p8'].price} (Amazon, ${comp.checked})</td></tr>
        <tr><td>Ongoing cost</td><td>Personal: free. Zello Work Core: $${z.coreMonthly.toFixed(2)} per user per month</td><td class="w">Year one included, about $10 a radio a year after</td></tr>
        <tr><td>Talk button</td><td>On-screen, or a paired Bluetooth button</td><td class="w">Physical PTT, works through gloves</td></tr>
        <tr><td>Speaker</td><td>Phone speaker</td><td class="w">Dedicated radio speaker; the P8 was the loudest we tested</td></tr>
        <tr><td>Battery</td><td>Shared with everything else on the phone</td><td class="w">Its own battery; the phone stays free</td></tr>
        <tr><td>Who can use it</td><td>Anyone with a smartphone and an account</td><td class="w">Anyone who can press a button, kids included</td></tr>
        <tr><td>Channels</td><td class="w">Public and private channels, huge user base</td><td>Your own groups on the maker's network</td></tr>
        <tr><td>Extras</td><td class="w">Text, photos, location, message history</td><td>Voice first; extras vary by model</td></tr>
        <tr><td>3-yr cost, 4 users</td><td>Personal $0 · Work Core about ${money(zWork)}</td><td>About ${y3('radtel-p8')} for four P8s</td></tr>
      </tbody>
    </table></div>
    <p class="note">Zello prices from <a href="${z.site}" target="_blank" rel="noopener">Zello's pricing page</a>, checked ${comp.checked}.</p>
  </section>

  <section class="block">
    <h2>Pick Zello if</h2>
    <ul>
      <li>Everyone already carries a smartphone and keeps it charged.</li>
      <li>You talk occasionally, not all shift.</li>
      <li>You want public channels, ham-style nets, or to talk to people you haven't met.</li>
      <li>You want text, photos and message history alongside voice.</li>
    </ul>
  </section>

  <section class="block">
    <h2>Pick a PoC radio if</h2>
    <ul>
      <li>Kids or older relatives need to reach you without a smartphone.</li>
      <li>Your crew wears gloves, works in noise, or can't stop to unlock a phone.</li>
      <li>You want phones free for calls, maps and cameras, with a separate battery for talking.</li>
      <li>You're handing out radios you can afford to lose: four P8s cost less than one mid-range phone.</li>
    </ul>
  </section>

  <section class="block">
    <h2>Tested radios to start with</h2>
    <div class="vs">
      ${card(by['radtel-p8'], 'Loudest audio', 'The radio we\'d hand someone moving from Zello: louder and clearer than a phone speaker, ready out of the box.')}
      ${card(by['herda-hp1'], 'Best for kids and grandparents', 'Tiny, on a neck strap, one button to talk. Closed groups only, which suits a family.')}
      ${card(by['choyong-wt2'], 'Most like a gadget', 'PoC plus analog UHF, shortwave and internet radio in one. For the person who\'d miss their phone\'s extras.')}
    </div>
    <p>Hams and hobbyists who live on Zello nets: see <a href="./poc-radio-for-hobbyists.html">PoC for hams and radio hobbyists</a> and our <a href="./best-poc-apps.html">PoC app comparison</a>.</p>
  </section>
`}));

  // 4. Best PoC radios (ranked, bench driven)
  const ranked = [...bench.tested].sort((a, b) => b.score - a.score);
  const listSchema = { "@context": "https://schema.org", "@type": "ItemList", "name": "Best PoC radios of 2026", "itemListElement": ranked.map((r, i) => ({ "@type": "ListItem", "position": i + 1, "name": r.name, "url": `${SITE}/${r.path}` })) };
  write('best-poc-radios', page({ ...ctx, slug: 'best-poc-radios', crumb: 'Best PoC radios',
    title: `Best PoC Radios of 2026: ${ranked.length} Nationwide Walkie Talkies Tested`,
    desc: `The best push-to-talk over cellular radios of 2026, ranked from ${ranked.length} we've tested by hand: audio, build, PTT delay, renewal fees and real 3-year costs. No spec-sheet rankings.`,
    img: ranked[0].img, extraSchema: [listSchema],
    faq: [
      ['What is the best PoC radio in 2026?', `Of the ${ranked.length} we've tested by hand, the ${ranked[0].name} ranks first: ${ranked[0].bestAt.toLowerCase()}. The best pick still depends on what you need: smallest size, a no-signal backup, or no renewal fee.`],
      ['What is the cheapest PoC radio to own?', `Of the radios we've tested with published pricing, four CARRBORG X13s cost about ${y3('carrborg-x13')} over three years because the seller lists lifetime free data. Four Radtel P8s cost about ${y3('radtel-p8')}.`],
      ['Do PoC radios have a monthly fee?', 'Most consumer PoC radios don\'t. They include a year of service, then renew yearly: about $10 for the Radtel P8, $9.99 for the TIDRADIO TD-M2 Pro and $25 for the Herda HP1. Business platforms such as PeakPTT bill monthly.'],
      ['How do you rank PoC radios?', 'Only radios we\'ve used by hand on live cell networks get a score. We rate audio, build, screen, PTT delay, setup and cost. Radios we haven\'t tested are listed separately as spec overviews with no score.']
    ],
    body: `
  <div class="review-hero">
    <span class="badge">Ranked · bench tested only</span>
    <h1>Best PoC radios of 2026</h1>
    <p class="updated">Updated ${comp.checked} · Tested by Michael Smith, KM7FMJ</p>
    <p style="max-width:65ch;margin-top:14px;">Every radio on this list was used by hand on live cell networks before it got a score. That's ${ranked.length} radios so far. Most "best PoC radio" lists are spec-sheet roundups or a brand ranking its own radios. This one isn't. Prices were checked ${comp.checked}.</p>
  </div>

  <section class="block">
    <h2>Quick picks</h2>
    <div class="tblx"><table class="ct">
      <thead><tr><th>Best for</th><th>Radio</th><th>Score</th><th>Price</th></tr></thead>
      <tbody>${ranked.map(r => `<tr><td>${r.badge}</td><td><a href="../${r.path}">${r.name}</a></td><td>${rating(r.score)}</td><td class="mono">${r.price}</td></tr>`).join('')}</tbody>
    </table></div>
  </section>

  <section class="block">
    <h2>The ranking</h2>
    ${ranked.map((r, i) => `<div class="rank">
      <div class="rank-n">${String(i + 1).padStart(2, '0')}</div>
      <a href="../${r.path}"><img src="../${r.img}" width="150" height="200" loading="lazy" alt="${r.name} PoC radio"></a>
      <div>
        <span class="win">${r.badge}</span>
        <h3><a href="../${r.path}">${r.name}</a></h3>
        ${rating(r.score)}
        <p style="margin-top:12px;">${r.desc}</p>
        <dl><dt>Best at</dt><dd>${r.bestAt}</dd><dt>Watch out</dt><dd>${r.watchOut}</dd><dt>PTT delay</dt><dd>${r.ptt || 'Not timed yet'}</dd><dt>Price</dt><dd>${r.price}</dd></dl>
        <div class="rank-cta"><a class="btn" href="${r.buy}"${buyAttr(r.buy)}>${r.buyLabel}</a><a href="../${r.path}">Full review →</a></div>
      </div>
    </div>`).join('\n    ')}
  </section>

  <section class="block">
    <h2>Not tested yet</h2>
    <p>These are on our radar. Each has a spec overview with no score until we've used one: ${bench.radar.map(r => `<a href="../${r.path}">${r.name}</a>`).join(', ')}. Shopping a big-name brand? See <a href="./rapid-radios-alternatives.html">Rapid Radios alternatives</a> and <a href="./peakptt-alternatives.html">PeakPTT alternatives</a>.</p>
  </section>
`}));

  // 5. Comparison hub
  const hub = [
    ['Ranked', 'Best PoC radios of 2026', 'Every bench-tested radio, ranked.', './best-poc-radios.html'],
    ['Head to head', 'Radtel P8 vs TIDRADIO TD-M2 Pro', 'Better audio or a no-signal backup?', './radtel-p8-vs-tidradio-td-m2-pro.html'],
    ['Head to head', 'ChoYong WT2 vs TIDRADIO TD-M2 Pro', 'Two dual-mode radios, side by side.', './choyong-wt2-vs-tidradio-td-m2-pro.html'],
    ['Head to head', 'Zello vs a PoC radio', 'Phone app or real walkie talkie?', './zello-vs-poc-radio.html'],
    ['Alternatives', 'Rapid Radios alternatives', 'Tested radios for far less than the G1.', './rapid-radios-alternatives.html'],
    ['Alternatives', 'PeakPTT alternatives', 'Skip the $24.95 monthly fee.', './peakptt-alternatives.html'],
    ['Costs', 'PoC subscription costs', 'Renewal fees and 3-year team costs.', './poc-radio-subscription-costs.html'],
    ['Apps', 'Best PoC apps compared', 'Which app works with which radio.', './best-poc-apps.html']
  ];
  write('poc-radio-comparisons', page({ ...ctx, slug: 'poc-radio-comparisons', crumb: 'All comparisons',
    title: 'PoC Radio Comparisons: Head to Heads, Alternatives and Costs',
    desc: 'Every PoC radio comparison on POC Radio HQ in one place: bench-tested head to heads, alternatives to Rapid Radios and PeakPTT, Zello vs a radio, and 3-year costs.',
    img: by['radtel-p8'].img, faq: [],
    body: `
  <div class="review-hero">
    <span class="badge">Compare</span>
    <h1>PoC radio comparisons</h1>
    <p class="updated">Updated ${comp.checked}</p>
    <p style="max-width:65ch;margin-top:14px;">Head to heads between radios we've tested, honest alternatives to the big brands, and the cost math that decides most purchases.</p>
  </div>
  <section class="block">
    <div class="hub">${hub.map(([e, t, s, h]) => `<a href="${h}"><em>${e}</em><strong>${t}</strong><span>${s}</span></a>`).join('')}</div>
  </section>
  <section class="block">
    <h2>Compare any two tested radios</h2>
    <p>Every tested radio has a full review with a key-facts box. Start from <a href="../index.html#bench">the Bench table</a>, or let the <a href="../index.html#picker">Radio Picker</a> narrow it down.</p>
  </section>
`}));

  return pages;
}

module.exports = { buildSeoPages };
