const express = require('express');
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');

puppeteer.use(StealthPlugin());

const app = express();

app.get('/screenshot', async (req, res) => {
  const { url } = req.query;
  if (!url) return res.status(400).json({ success: false, error: 'url manquante' });

  let browser;
  try {
    console.log(`[START] ${url}`);

    browser = await puppeteer.launch({
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--no-zygote',
        '--single-process',
        '--disable-extensions',
        '--window-size=1440,900'
      ],
      headless: true
    });

    const page = await browser.newPage();

    // Simule un vrai navigateur Chrome
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    await page.setViewport({ width: 1440, height: 900 });
    await page.setExtraHTTPHeaders({
      'Accept-Language': 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
    });

    // Bloque fonts et mÃŠdias pour ÃŠconomiser mÃŠmoire et temps
    await page.setRequestInterception(true);
    page.on('request', (request) => {
      if (['font', 'media'].includes(request.resourceType())) {
        request.abort();
      } else {
        request.continue();
      }
    });

    console.log(`[NAV] Navigation...`);
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 25000 });

    // DÃŠlai pour que les graphiques Databox se rendent
    console.log(`[WAIT] Attente rendu graphiques...`);
    await new Promise(r => setTimeout(r, 6000));

    console.log(`[SNAP] Screenshot...`);
    const screenshot = await page.screenshot({
      encoding: 'base64',
      fullPage: true,
      type: 'jpeg',
      quality: 80
    });

    console.log(`[OK] Screenshot rÃŠussi`);
    res.json({ success: true, screenshot_base64: `data:image/jpeg;base64,${screenshot}` });

  } catch (error) {
    console.error(`[ERROR] ${error.message}`);
    res.status(500).json({ success: false, error: error.message });
  } finally {
    if (browser) await browser.close().catch(() => {});
  }
});

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.listen(process.env.PORT || 3000, () => {
  console.log('Screenshot service running on port', process.env.PORT || 3000);
});
