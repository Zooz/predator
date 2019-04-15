import {ChildProcess, spawn} from 'child_process';
import {assert, driver, IMochaServer, Key, useServer} from 'mocha-webdriver';
// tslint:disable:no-console

class MkdocsServer implements IMochaServer {
  public _proc?: ChildProcess;
  public async start() {
    this._proc = spawn(process.env.MKDOCS_BINARY || 'env/bin/mkdocs', ['serve', '-a', 'localhost:8000'],
      {cwd: '..', stdio: 'inherit'});
  }
  public async stop() {
    if (this._proc) {
      this._proc.kill('SIGINT');
      const res = await exitPromise(this._proc);
      if (res !== 0) { console.log("ERROR: could not run mkdocs: %s", res); }
    }
  }
  public getHost() {
    return "http://localhost:8000";
  }
}

describe('mkdocs_windmill', () => {
  const server = new MkdocsServer();
  useServer(server);

  before(async function() {
    this.timeout(60000);      // Set a longer default timeout.
    await driver.get(`${server.getHost()}`);
  });

  beforeEach(async () => {
    await driver.switchTo().defaultContent();
  });

  it('should load the homepage', async () => {
    // Menu has links for items, including the first one.
    assert.equal(await driver.findContent('.wm-toc-pane .wm-toc-text', /Usage/).getTagName(), 'a');
    assert.equal(await driver.findContent('.wm-toc-pane .wm-toc-text', /Cust/).getTagName(), 'a');

    // In certain configurations, the first page isn't selected until clicked in
    // (this could be fixed, but for now we just test that it works once clicked).
    await driver.findContent('.wm-toc-pane .wm-article-link', /Cust/).click();
    await driver.findContent('.wm-toc-pane .wm-article-link', /Usage/).click();
    assert.equal(await driver.find('.wm-current').getText(), 'Usage');

    // The page table-of-contents is expanded in the menu.
    assert.includeMembers(await driver.findAll('.wm-page-toc .wm-article-link',
      (el) => el.getText()), ['About', 'Installation']);

    // Check that homepage is visible in iframe
    await driver.switchTo().frame(driver.find('.wm-article'));
    assert.equal(await driver.find('h1').getText(), 'Windmill theme');
  });

  it('should go through all pages with nav links', async function() {
    await driver.switchTo().frame(driver.find('.wm-article'));
    const next = () => driver.findContent('.wm-article-nav a', /Next/).click();
    const prev = () => driver.findContent('.wm-article-nav a', /Previous/).click();
    await next();
    assert.equal(await driver.find('h1').getText(), 'Customization');
    await next();
    assert.equal(await driver.find('h1').getText(), 'Heading A');
    await next();
    assert.equal(await driver.find('h1').getText(), 'Heading A1');
    await next();
    assert.equal(await driver.find('h1').getText(), 'Heading A2');
    await prev();
    assert.equal(await driver.find('h1').getText(), 'Heading A1');
    await prev();
    assert.equal(await driver.find('h1').getText(), 'Heading A');
    await prev();
    assert.equal(await driver.find('h1').getText(), 'Customization');
    await prev();
    assert.equal(await driver.find('h1').getText(), 'Windmill theme');
  });

  it('should follow links in search dropdown', async function() {
    await driver.find('#mkdocs-search-query').doSendKeys('extra');
    await assert.includeMembers(await driver.findAll('#mkdocs-search-results .search-title',
      (el) => el.getText()), ['Extra configuration options', 'Usage']);
    await driver.findContent('#mkdocs-search-results .search-title', /Extra conf/).click();

    await driver.switchTo().frame(driver.find('.wm-article'));
    assert.match(await driver.find('h1').getText(), /Customization/);
    await driver.switchTo().defaultContent();

    await driver.navigate().back();
    await driver.find('#mkdocs-search-query').doClick();
    await driver.findContent('#mkdocs-search-results .search-title', /Usage/).click();

    await driver.switchTo().frame(driver.find('.wm-article'));
    assert.match(await driver.find('h1').getText(), /Windmill theme/);
    await driver.switchTo().defaultContent();
  });

  it('should follow links in search results page', async function() {
    await driver.find('#mkdocs-search-query').doClear().doSendKeys('extra', Key.ENTER);

    // Switch to the iframe with results. The actual elements to interact with are similar to the
    // case above, because the search code is actually reused.
    await driver.switchTo().frame(driver.find('.wm-article'));

    await assert.includeMembers(await driver.findAll('#mkdocs-search-results .search-title',
      (el) => el.getText()), ['Extra configuration options', 'Usage']);
    await driver.findContent('#mkdocs-search-results .search-title', /Extra conf/).click();

    assert.match(await driver.find('h1').getText(), /Customization/);

    await driver.switchTo().defaultContent();
    await driver.navigate().back();

    await driver.find('#mkdocs-search-query').doClick().doSendKeys(Key.ENTER);

    await driver.switchTo().frame(driver.find('.wm-article'));
    await driver.findContent('#mkdocs-search-results .search-title', /Usage/).click();

    assert.match(await driver.find('h1').getText(), /Windmill theme/);
  });
});

export function exitPromise(child: ChildProcess): Promise<number|string> {
  return new Promise((resolve, reject) => {
    // Called if process could not be spawned, or could not be killed(!), or sending a message failed.
    child.on('error', reject);
    child.on('exit', (code: number, signal: string) => resolve(signal || code));
  });
}
