// Netlify runs this automatically after every successful deploy (event-triggered function).
// It tells Bing, Yandex and other IndexNow engines that every URL in the sitemap may have changed.
// The key file /ef0d807a12c8ea050c55b8508eb7ecc2.txt proves we own the site. Zero dependencies.
const HOST = 'pocradiohq.com';
const KEY = 'ef0d807a12c8ea050c55b8508eb7ecc2';

exports.handler = async () => {
  try {
    const xml = await (await fetch(`https://${HOST}/sitemap.xml`)).text();
    const urlList = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1]);
    const res = await fetch('https://api.indexnow.org/indexnow', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify({ host: HOST, key: KEY, keyLocation: `https://${HOST}/${KEY}.txt`, urlList })
    });
    console.log(`IndexNow: ${res.status} for ${urlList.length} URLs`);
  } catch (e) {
    console.log('IndexNow ping failed:', e.message);
  }
  return { statusCode: 200, body: 'ok' };
};
