const express = require('express');
const puppeteer = require('puppeteer');
const app = express();

app.get('/screenshot', async (req, res) => {
  const { url } = req.query;
  if (!url) return res.status(400).json({ error: 'url manquante' });

  let browser;
  try {
    browser = await puppeteer.launch({
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--no-zygote'
      ],
      headless: true
    });

    const page = await browser.newPage();

    // Simule un vrai navigateur pour bypasser le blocage Databox
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    await page.setViewport({ width: 1440, height: 900 });

    await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });

    // Delai extra pour les dashboards JS lourds (graphiques Databox)
    await new Promise(r => setTimeout(r, 15000));

    const screenshot = await page.screenshot({
      encoding: 'base64',
      fullPage: true,
      type: 'jpeg',
      quality: 85
    });

    res.json({
      success: true,
      screenshot_base64: `data:image/jpeg;base64,${screenshot}`
    });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  } finally {
    if (browser) await browser.close();
  }
});

// Keep-alive ping
app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.listen(process.env.PORT || 3000, () => {
  console.log('Screenshot service running on port', process.env.PORT || 3000);
});
