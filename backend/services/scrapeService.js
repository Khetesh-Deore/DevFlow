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
    await driver.wait(until.elementLocated(By.css('[data-cy="question-title"]')), 20000);
  } catch (e) {
    await driver.sleep(2000);
  }
  
  const pageSource = await driver.getPageSource();
  const scriptMatch = pageSource.match(/<script id="__NEXT_DATA__" type="application\/json">(.*?)<\/script>/s);
  
  if (!scriptMatch) {
    throw new Error('Failed to extract problem data');
  }
  
  const nextData = JSON.parse(scriptMatch[1]);
  const queries = nextData?.props?.pageProps?.dehydratedState?.queries;
  
  if (!queries) {
    throw new Error('Failed to extract problem data');
  }
  
  for (const query of queries) {
    if (query?.state?.data?.question) {
      return query.state.data.question;
    }
  }
  
  throw new Error('Failed to extract problem data');
};

const formatOutput = (data) => {
  const lines = [];
  
  lines.push(`Problem: ${data.questionFrontendId}. ${data.title}`);
  lines.push(`Difficulty: ${data.difficulty}`);
  
  if (data.topicTags?.length) {
    lines.push(`Topics: ${data.topicTags.map(t => t.name).join(', ')}`);
  }
  
  if (data.companyTagStats) {
    try {
      const companies = JSON.parse(data.companyTagStats);
      if (companies?.length) {
        lines.push(`Companies: ${companies.slice(0, 10).map(c => c.name || c.slug).join(', ')}`);
      }
    } catch (e) {}
  }
  
  if (data.hints?.length) {
    lines.push('\nHints:');
    data.hints.forEach((hint, i) => {
      lines.push(`${i + 1}. ${hint}`);
    });
  }
  
  lines.push('\nProblem Statement:');
  lines.push(data.content.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&').trim());
  
  if (data.exampleTestcases) {
    lines.push('\nExamples:');
    lines.push(data.exampleTestcases);
  }
  
  lines.push('\nConstraints:');
  const constraintMatch = data.content.match(/<strong[^>]*>Constraints:<\/strong>(.*?)(?=<p><strong|$)/is);
  if (constraintMatch) {
    const constraints = constraintMatch[1].replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&').trim();
    lines.push(constraints);
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
