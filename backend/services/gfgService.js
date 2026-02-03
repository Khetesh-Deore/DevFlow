const { Builder, By, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');

const createDriver = async () => {
	const options = new chrome.Options();
	options.addArguments('--headless=new');
	options.addArguments('--disable-gpu');
	options.addArguments('--no-sandbox');
	options.addArguments('--disable-dev-shm-usage');
	options.addArguments('--disable-blink-features=AutomationControlled');
	options.addArguments('--disable-extensions');
	options.addArguments('--disable-logging');
	options.addArguments('--log-level=3');
	options.addArguments('--silent');
	options.addArguments('--disable-background-networking');
	options.addArguments('--disable-sync');
	options.addArguments('--metrics-recording-only');
	options.addArguments('--disable-default-apps');
	options.addArguments('--mute-audio');
	options.addArguments('--no-first-run');
	options.addArguments('--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36');
	options.excludeSwitches('enable-logging');

	return await new Builder()
		.forBrowser('chrome')
		.setChromeOptions(options)
		.build();
};

const extractData = async (driver) => {
	await driver.sleep(3000);

	try {
		await driver.wait(until.elementLocated(By.css('.problems_problem_content__Xm_eO, .problem-statement')), 20000);
	} catch (e) {
		throw new Error('Problem not found');
	}

	let title = '';
	try {
		title = await driver.findElement(By.css('.problems_header_content__FuJIv h3, .problem-title')).getText();
	} catch (e) {
		try {
			title = await driver.findElement(By.css('h1, h2')).getText();
		} catch (e2) { }
	}

	let difficulty = '';
	try {
		difficulty = await driver.findElement(By.css('.problems_tag_container__kWANg span, .difficulty')).getText();
	} catch (e) { }

	let accuracy = '';
	try {
		accuracy = await driver.findElement(By.css('.problems_header_description__qjgHC div:nth-child(2), .accuracy')).getText();
	} catch (e) { }

	let problemStatement = '';
	try {
		problemStatement = await driver.findElement(By.css('.problems_problem_content__Xm_eO, .problem-statement')).getText();
	} catch (e) { }

	let examples = '';
	try {
		const exampleElements = await driver.findElements(By.css('.example, .examples'));
		if (exampleElements.length > 0) {
			examples = await exampleElements[0].getText();
		}
	} catch (e) { }

	let constraints = '';
	try {
		const constraintElements = await driver.findElements(By.css('.constraints'));
		if (constraintElements.length > 0) {
			constraints = await constraintElements[0].getText();
		}
	} catch (e) {
		const text = problemStatement.toLowerCase();
		if (text.includes('constraints:')) {
			const idx = text.indexOf('constraints:');
			constraints = problemStatement.substring(idx);
		}
	}

	let expectedTC = '';
	let expectedAux = '';
	try {
		const tcElements = await driver.findElements(By.css('.expected-time-complexity, .time-complexity'));
		if (tcElements.length > 0) {
			expectedTC = await tcElements[0].getText();
		}
	} catch (e) { }

	try {
		const auxElements = await driver.findElements(By.css('.expected-auxiliary-space, .space-complexity'));
		if (auxElements.length > 0) {
			expectedAux = await auxElements[0].getText();
		}
	} catch (e) { }

	return {
		title,
		difficulty,
		accuracy,
		problemStatement,
		examples,
		constraints,
		expectedTC,
		expectedAux
	};
};

const formatOutput = (data) => {
	const lines = [];

	if (data.title) {
		lines.push(`Problem: ${data.title}`);
	}

	if (data.difficulty) {
		lines.push(`Difficulty: ${data.difficulty}`);
	}

	if (data.accuracy) {
		lines.push(`Accuracy: ${data.accuracy}`);
	}

	lines.push('');
	lines.push('Problem Statement:');
	lines.push(data.problemStatement.trim());

	if (data.examples) {
		lines.push('');
		lines.push('Examples:');
		lines.push(data.examples.trim());
	}

	if (data.constraints) {
		lines.push('');
		lines.push(data.constraints.trim());
	}

	if (data.expectedTC) {
		lines.push('');
		lines.push(data.expectedTC.trim());
	}

	if (data.expectedAux) {
		lines.push('');
		lines.push(data.expectedAux.trim());
	}

	return lines.join('\n');
};

exports.scrapeAndFormat = async (url) => {
	let driver;

	try {
		driver = await createDriver();
		await driver.get(url);

		const data = await extractData(driver);
		return formatOutput(data);
	} catch (error) {
		if (error.name === 'TimeoutError') {
			throw new Error('Request timeout');
		}
		throw error;
	} finally {
		if (driver) {
			await driver.quit();
		}
	}
};
