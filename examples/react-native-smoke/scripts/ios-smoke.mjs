import {execFileSync, spawnSync} from 'node:child_process';
import {existsSync, mkdtempSync, rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join, resolve} from 'node:path';

const projectRoot = resolve(import.meta.dirname, '..');
const temporaryRoot = mkdtempSync(join(tmpdir(), 'aurelglyph-rn-smoke-'));
const resultBundle = join(temporaryRoot, 'AurelglyphSmoke.xcresult');
const derivedData = join(temporaryRoot, 'DerivedData');

function availableIphone() {
  const output = execFileSync('xcrun', ['simctl', 'list', 'devices', 'available', '--json'], {
    encoding: 'utf8',
  });
  const runtimes = Object.entries(JSON.parse(output).devices);
  const devices = runtimes.flatMap(([runtime, entries]) =>
    runtime.includes('iOS') ? entries : [],
  );
  const phones = devices.filter(device => device.isAvailable && device.name.includes('iPhone'));
  return (
    phones.find(device => device.state === 'Booted') ??
    phones.find(device => device.name === 'iPhone 16 Pro') ??
    phones[0]
  );
}

try {
  const device = availableIphone();
  if (!device) {
    throw new Error('No available iPhone simulator was found. Install an iOS simulator runtime with Xcode.');
  }

  process.stdout.write(`[rn-smoke] Running native UI contract on ${device.name} (${device.udid}).\n`);
  const test = spawnSync(
    'xcodebuild',
    [
      '-quiet',
      '-workspace',
      'ios/AurelglyphSmoke.xcworkspace',
      '-scheme',
      'AurelglyphSmoke',
      '-configuration',
      'Release',
      '-destination',
      `platform=iOS Simulator,id=${device.udid}`,
      '-derivedDataPath',
      derivedData,
      '-resultBundlePath',
      resultBundle,
      'test',
      'CODE_SIGNING_ALLOWED=NO',
    ],
    {cwd: projectRoot, encoding: 'utf8'},
  );
  process.stdout.write(test.stdout);
  process.stderr.write(test.stderr);

  let summary;
  if (existsSync(resultBundle)) {
    try {
      const summaryOutput = execFileSync(
        'xcrun',
        ['xcresulttool', 'get', 'test-results', 'summary', '--path', resultBundle],
        {encoding: 'utf8'},
      );
      summary = JSON.parse(summaryOutput);
      if (summary.testFailures?.length) {
        process.stderr.write(
          `[rn-smoke] Native UI failures:\n${JSON.stringify(summary.testFailures, null, 2)}\n`,
        );
        for (const failure of summary.testFailures) {
          const details = execFileSync(
            'xcrun',
            [
              'xcresulttool',
              'get',
              'test-results',
              'test-details',
              '--path',
              resultBundle,
              '--test-id',
              failure.testIdentifierString,
            ],
            {encoding: 'utf8'},
          );
          process.stderr.write(`[rn-smoke] ${failure.testName} details:\n${details}\n`);
        }
      }
    } catch (error) {
      process.stderr.write(`[rn-smoke] Could not read the native UI result bundle: ${error.message}\n`);
    }
  }

  if (test.status !== 0) {
    throw new Error(`xcodebuild failed with status ${test.status ?? 1}`);
  }

  if (!summary) {
    throw new Error('xcodebuild did not produce a readable UI test summary.');
  }
  if (summary.result !== 'Passed' || summary.failedTests !== 0 || summary.passedTests < 2) {
    throw new Error(`Unexpected UI test summary: ${JSON.stringify(summary)}`);
  }
  process.stdout.write(
    `[rn-smoke] ${summary.passedTests}/${summary.totalTestCount} native UI tests passed with zero failures.\n`,
  );
} finally {
  rmSync(temporaryRoot, {force: true, recursive: true});
}
