const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.toString()));
  await page.goto('http://localhost:3491/admin.html', {waitUntil: 'networkidle0'});
  
  await page.type('#adminEmail', 'test@test.com');
  await page.type('#adminPassword', 'password');
  
  await Promise.all([
    page.waitForNavigation({ timeout: 3000 }).catch(e => console.log('No navigation (good)')),
    page.click('button[type="submit"]')
  ]);
  
  await new Promise(r => setTimeout(r, 2000));
  
  await browser.close();
})();
