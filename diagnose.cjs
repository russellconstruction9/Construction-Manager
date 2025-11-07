const { chromium } = require('playwright');
const { spawn } = require('child_process');

const waitForServer = (proc) => {
  return new Promise((resolve, reject) => {
    const onData = (data) => {
      const text = data.toString();
      process.stdout.write(text);
      if (text.includes('Local:')) {
        proc.stdout.off('data', onData);
        resolve();
      }
    };
    proc.stdout.on('data', onData);
    proc.stderr.on('data', (data) => process.stderr.write(data.toString()));
    proc.on('exit', (code) => {
      reject(new Error(`Preview server exited early with code ${code}`));
    });
  });
};

(async () => {
  const host = '127.0.0.1';
  const port = 4173;
  const url = process.argv[2] || `http://${host}:${port}/`;

  console.log('Starting preview server...');
  const previewProc = spawn('npm', ['run', 'preview', '--', '--host', host, '--port', String(port)], {
    stdio: ['ignore', 'pipe', 'pipe'],
    shell: true,
  });

  try {
    await waitForServer(previewProc);
    console.log('Preview server ready. Launching browser...');

    const browser = await chromium.launch();
    const page = await browser.newPage();
    page.on('console', msg => {
      console.log(`[console.${msg.type()}]`, msg.text());
    });
    page.on('pageerror', error => {
      console.log('[pageerror]', error.toString());
    });

    console.log('Navigating to', url);
    await page.goto(url, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    console.log('Page title:', await page.title());

    await browser.close();
  } catch (error) {
    console.error('Diagnostics failed:', error);
  } finally {
    console.log('Shutting down preview server...');
    previewProc.kill('SIGINT');
  }
})();