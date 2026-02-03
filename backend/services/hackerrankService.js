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
    await driver.wait(until.elementLocated(By.css('.challenge-body-html')), 20000);
  } catch (e) {
    throw new Error('Problem not found');
  }
  
  let title = '';
  try {
    title = await driver.findElement(By.css('.page-header h1, .challenge-page-header h1')).getText();
  } catch (e) {
    try {
      title = await driver.findElement(By.css('.challenge-name')).getText();
    } catch (e2) {}
  }
  
  let difficulty = '';
  try {
    difficulty = await driver.findElement(By.css('.difficulty-block, .difficulty')).getText();
  } catch (e) {}
  
  let maxScore = '';
  try {
    maxScore = await driver.findElement(By.css('.max-score, .score')).getText();
  } catch (e) {}
  
  const problemBody = await driver.findElement(By.css('.challenge-body-html')).getText();
  
  let inputFormat = '';
  let outputFormat = '';
  let constraints = '';
  let sampleInput = '';
  let sampleOutput = '';
  let explanation = '';
  
  try {
    const sections = await driver.findElements(By.css('.challenge-body-html h3, .challenge-body-html h4'));
    
    for (const section of sections) {
      const heading = await section.getText();
      const lowerHeading = heading.toLowerCase();
      
      if (lowerHeading.includes('input format')) {
        try {
          const nextElement = await driver.executeScript('return arguments[0].nextElementSibling', section);
          inputFormat = await driver.executeScript('return arguments[0].textContent', nextElement);
        } catch (e) {}
      } else if (lowerHeading.includes('output format')) {
        try {
          const nextElement = await driver.executeScript('return arguments[0].nextElementSibling', section);
          outputFormat = await driver.executeScript('return arguments[0].textContent', nextElement);
        } catch (e) {}
      } else if (lowerHeading.includes('constraints')) {
        try {
          const nextElement = await driver.executeScript('return arguments[0].nextElementSibling', section);
          constraints = await driver.executeScript('return arguments[0].textContent', nextElement);
        } catch (e) {}
      }
    }
  } catch (e) {}
  
  try {
    const sampleInputElements = await driver.findElements(By.css('.challenge-sample-input pre, .sample-input pre'));
    if (sampleInputElements.length > 0) {
      sampleInput = await sampleInputElements[0].getText();
    }
  } catch (e) {}
  
  try {
    const sampleOutputElements = await driver.findElements(By.css('.challenge-sample-output pre, .sample-output pre'));
    if (sampleOutputElements.length > 0) {
      sampleOutput = await sampleOutputElements[0].getText();
    }
  } catch (e) {}
  
  try {
    const explanationElements = await driver.findElements(By.css('.challenge-explanation, .explanation'));
    if (explanationElements.length > 0) {
      explanation = await explanationElements[0].getText();
    }
  } catch (e) {}
  
  return {
    title,
    difficulty,
    maxScore,
    problemBody,
    inputFormat,
    outputFormat,
    constraints,
    sampleInput,
    sampleOutput,
    explanation
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
  
  if (data.maxScore) {
    lines.push(`Max Score: ${data.maxScore}`);
  }
  
  lines.push('');
  lines.push('Problem Statement:');
  lines.push(data.problemBody.trim());
  
  if (data.inputFormat) {
    lines.push('');
    lines.push('Input Format:');
    lines.push(data.inputFormat.trim());
  }
  
  if (data.outputFormat) {
    lines.push('');
    lines.push('Output Format:');
    lines.push(data.outputFormat.trim());
  }
  
  if (data.constraints) {
    lines.push('');
    lines.push('Constraints:');
    lines.push(data.constraints.trim());
  }
  
  if (data.sampleInput) {
    lines.push('');
    lines.push('Sample Input:');
    lines.push(data.sampleInput.trim());
  }
  
  if (data.sampleOutput) {
    lines.push('');
    lines.push('Sample Output:');
    lines.push(data.sampleOutput.trim());
  }
  
  if (data.explanation) {
    lines.push('');
    lines.push('Explanation:');
    lines.push(data.explanation.trim());
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
