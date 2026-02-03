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
  await driver.sleep(2000);
  
  try {
    await driver.wait(until.elementLocated(By.css('.problem-statement')), 20000);
  } catch (e) {
    throw new Error('Problem not found');
  }
  
  const title = await driver.findElement(By.css('.title')).getText();
  const timeLimit = await driver.findElement(By.css('.time-limit')).getText();
  const memoryLimit = await driver.findElement(By.css('.memory-limit')).getText();
  
  const problemStatement = await driver.findElement(By.css('.problem-statement')).getText();
  
  let inputSpec = '';
  let outputSpec = '';
  let note = '';
  
  try {
    inputSpec = await driver.findElement(By.css('.input-specification')).getText();
  } catch (e) {}
  
  try {
    outputSpec = await driver.findElement(By.css('.output-specification')).getText();
  } catch (e) {}
  
  try {
    note = await driver.findElement(By.css('.note')).getText();
  } catch (e) {}
  
  const sampleTests = await driver.findElements(By.css('.sample-test'));
  let examples = '';
  
  if (sampleTests.length > 0) {
    const inputs = await driver.findElements(By.css('.input pre'));
    const outputs = await driver.findElements(By.css('.output pre'));
    
    for (let i = 0; i < Math.min(inputs.length, outputs.length); i++) {
      const input = await inputs[i].getText();
      const output = await outputs[i].getText();
      examples += `Example ${i + 1}:\nInput:\n${input}\n\nOutput:\n${output}\n\n`;
    }
  }
  
  return {
    title,
    timeLimit,
    memoryLimit,
    problemStatement,
    inputSpec,
    outputSpec,
    examples,
    note
  };
};

const formatOutput = (data) => {
  const lines = [];
  
  lines.push(data.title);
  lines.push(data.timeLimit);
  lines.push(data.memoryLimit);
  lines.push('');
  lines.push('Problem Statement:');
  lines.push(data.problemStatement);
  
  if (data.inputSpec) {
    lines.push('');
    lines.push(data.inputSpec);
  }
  
  if (data.outputSpec) {
    lines.push('');
    lines.push(data.outputSpec);
  }
  
  if (data.examples) {
    lines.push('');
    lines.push(data.examples.trim());
  }
  
  if (data.note) {
    lines.push('');
    lines.push(data.note);
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
