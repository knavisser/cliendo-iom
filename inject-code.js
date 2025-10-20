const puppeteer = require('puppeteer');

module.exports.main = main;

if (require.main === module) {
	main();
}

function extractTopLevelLocalName(code) {
	const beforeForms = code.split(/['"]forms['"]\s*=>/)[0];
	const match = beforeForms.match(/['"]localName['"]\s*=>\s*['"]([^'"]+)['"]/);
	return match ? match[1] : null;
}

async function getBrowserInstance() {
	// Try to get the shared browser instance from boot-all.js
	try {
		const bootAll = require('./boot-all.js');
		const sharedBrowser = bootAll.getBrowser();
		if (sharedBrowser && sharedBrowser.isConnected()) {
			return sharedBrowser;
		}
	} catch (error) {
		console.log('[ℹ] No shared browser instance found, launching new one...');
	}
	
	// If no shared browser, launch a new one
	return await puppeteer.launch({
		headless: false,
		devtools: false,
		args: [
			'--no-first-run',
			'--no-default-browser-check',
			'--disable-web-security',
			'--disable-features=IsolateOrigins,site-per-process',
			'--remote-allow-origins=*'
		]
	});
}

async function main(encodedPhpFromParent = null) {
	const rawInput = encodedPhpFromParent || process.argv[2];
	if (!rawInput) {
		console.error('❌ No PHP code was passed as an argument.');
		process.exit(1);
	}

	let phpCode = decodeURIComponent(rawInput);
	phpCode = phpCode
		.replace(/^```php/, '')
		.replace(/```$/, '')
		.replace(/\/\/.*$/gm, '')
		.replace(/\/\*[\s\S]*?\*\//gm, '')
		.trim();

	const start = phpCode.indexOf('<?php');
	const end = phpCode.lastIndexOf('?>');
	if (start !== -1 && end !== -1) {
		phpCode = phpCode.slice(start, end + 2).trim();
	} else {
		console.error('❌ Could not find valid <?php ... ?> block in input.');
		process.exit(1);
	}

	const expectedTabName = extractTopLevelLocalName(phpCode);
	if (!expectedTabName) {
		console.error('❌ Could not extract top-level localName from PHP code.');
		process.exit(1);
	}
	console.log(`[🔍] Using extracted tab name: "${expectedTabName}"`);

	const browser = await getBrowserInstance();
	
	// Find the target page (Cliendo platform)
	let targetPage;
	const pages = await browser.pages();
	targetPage = pages.find(p => p.url().includes('/d8v3/inrichting/details'));
	
	if (!targetPage) {
		console.log('[ℹ] Target page not found, creating new page...');
		targetPage = await browser.newPage();
		await targetPage.goto('https://secure.cliendo.com/d8v3/inrichting/details/', {
			waitUntil: 'networkidle0'
		});
	}

	await targetPage.setViewport(null);
	console.log('[✓] Found target page');

	console.log("[↩] Looking for tab containing 'input'...");
	await targetPage.waitForFunction(`
		Array.from(document.querySelectorAll('div.tab2 > span'))
			.some(s => s.innerText.toLowerCase().includes('input'))
	`);

	await targetPage.evaluate(`
		Array.from(document.querySelectorAll('div.tab2 > span'))
			.find(s => s.innerText.toLowerCase().includes('input'))
			?.click()
	`);
	console.log("[✓] Switched to 'input' tab");

	const selector = 'div.field.textarea2.tabTestDev div.right textarea.multiLine.twAs';
	await targetPage.waitForSelector(selector);
	const textareaHandle = await targetPage.$(selector);
	await textareaHandle.click();

	const existingValue = await targetPage.evaluate(el => el.value, textareaHandle);
	if (existingValue.trim().length > 0) {
		console.log(`[🧹] Clearing existing content (${existingValue.length} characters)...`);

		const isMac = process.platform === 'darwin';
		await targetPage.keyboard.down(isMac ? 'Meta' : 'Control');
		await targetPage.keyboard.press('KeyA');
		await targetPage.keyboard.up(isMac ? 'Meta' : 'Control');
		await targetPage.keyboard.press('Backspace');
		await new Promise(resolve => setTimeout(resolve, 250));
	} else {
		console.log('[✅] Field is already empty.');
	}

	const lines = phpCode.split('\n');
	for (const line of lines) {
		await targetPage.keyboard.type(line);
		await targetPage.keyboard.press('Enter');
	}
	console.log('[✓] Typed PHP code into the correct field');

	await targetPage.mouse.click(10, 10);
	console.log('[✓] Clicked outside to trigger UI update');

	await targetPage.waitForFunction(
		'(tabName) => Array.from(document.querySelectorAll("div.tab2 > span")).some(s => s.innerText.includes(tabName))',
		{},
		expectedTabName
	);
	console.log(`[✓] Tab "${expectedTabName}" created`);

	await targetPage.evaluate(
		'(tabName) => { const span = Array.from(document.querySelectorAll("div.tab2 > span")).find(s => s.innerText.includes(tabName)); if (span) span.click(); }',
		expectedTabName
	);

	console.log(`[🕒] Waiting briefly and retrying click on tab: ${expectedTabName}`);
	await new Promise(resolve => setTimeout(resolve, 300));

	await targetPage.evaluate(
		'(tabName) => { const span = Array.from(document.querySelectorAll("div.tab2 > span")).find(s => s.innerText.includes(tabName)); if (span) span.click(); }',
		expectedTabName
	);

	console.log(`[✓] Re-clicked tab: ${expectedTabName}`);
}
