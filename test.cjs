const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    page.on('console', msg => {
        if (msg.type() === 'error') console.log('ERROR:', msg.text());
        else console.log(msg.type(), msg.text());
    });
    page.on('pageerror', error => console.log('PAGE ERROR:', error.message));
    try {
        await page.goto('http://localhost:5173', { waitUntil: 'networkidle0' });
    } catch (e) { console.log('Goto Error:', e); }
    await browser.close();
})();
