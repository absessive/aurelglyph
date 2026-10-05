import {execFileSync, spawnSync} from 'node:child_process';
import {existsSync, mkdtempSync, readFileSync, rmSync} from 'node:fs';
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

function testCaseAttempts(nodes, parentTest) {
  return nodes.flatMap(node => {
    const testName = node.nodeType === 'Test Case' ? node.name : parentTest;
    const repetitions = (node.children ?? []).some(child => child.nodeType === 'Repetition');
    const isAttempt = node.nodeType === 'Repetition' || (node.nodeType === 'Test Case' && !repetitions);
    return [
      ...(isAttempt
        ? [{
            attempt: node.nodeType === 'Repetition' ? node.name : 'Only run',
            identifier: node.nodeIdentifier ?? testName ?? '<unknown>',
            name: testName ?? node.name ?? '<unknown>',
            result: node.result ?? 'Unknown',
          }]
        : []),
      ...testCaseAttempts(node.children ?? [], testName),
    ];
  });
}

function retryTelemetry(testReport, buildOutput) {
  const attempts = testCaseAttempts(testReport?.testNodes ?? []);
  const byIdentifier = new Map();
  for (const attempt of attempts) {
    const key = attempt.name;
    const entries = byIdentifier.get(key) ?? [];
    entries.push(attempt.result);
    byIdentifier.set(key, entries);
  }
  const recoveredTests = [...byIdentifier.entries()]
    .filter(([, results]) => results.includes('Failed') && results.at(-1) === 'Passed')
    .map(([identifier, results]) => ({identifier, results}));
  const retryLog = buildOutput
    .split('\n')
    .filter(line => /retry|repetition/i.test(line))
    .map(line => line.trim())
    .filter(Boolean);
  return {
    attempts,
    maxAttempts: 2,
    policy: 'xcode-retry-tests-on-failure',
    recoveredTests,
    retryLog,
  };
}

try {
  const podfile = readFileSync(join(projectRoot, 'ios/Podfile'), 'utf8');
  const sourceCoreSetting = podfile.indexOf("ENV['RCT_USE_PREBUILT_RNCORE'] = '0'");
  const prepareCall = podfile.indexOf('prepare_react_native_project!');
  if (sourceCoreSetting < 0 || prepareCall < 0 || sourceCoreSetting > prepareCall) {
    throw new Error(
      "The RN 0.87 iOS host must disable prebuilt RNCore before prepare_react_native_project! so community Fabric headers remain importable.",
    );
  }
  const fabricHeader = join(
    projectRoot,
    'ios/Pods/Headers/Public/React-RCTFabric/React/RCTComponentViewProtocol.h',
  );
  if (!existsSync(fabricHeader)) {
    throw new Error(
      'The React-RCTFabric public headers are missing. Run bundle exec pod install --project-directory=ios before the iOS smoke.',
    );
  }

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
      '-test-iterations',
      '2',
      '-retry-tests-on-failure',
      '-test-repetition-relaunch-enabled',
      'YES',
      'test',
      'CODE_SIGNING_ALLOWED=NO',
    ],
    {cwd: projectRoot, encoding: 'utf8'},
  );
  process.stdout.write(test.stdout);
  process.stderr.write(test.stderr);

  let summary;
  let testReport;
  if (existsSync(resultBundle)) {
    try {
      const summaryOutput = execFileSync(
        'xcrun',
        ['xcresulttool', 'get', 'test-results', 'summary', '--path', resultBundle],
        {encoding: 'utf8'},
      );
      summary = JSON.parse(summaryOutput);
      testReport = JSON.parse(
        execFileSync(
          'xcrun',
          ['xcresulttool', 'get', 'test-results', 'tests', '--path', resultBundle],
          {encoding: 'utf8'},
        ),
      );
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

  if (!testReport) {
    throw new Error('xcodebuild did not produce a readable UI test report.');
  }
  const telemetry = retryTelemetry(testReport, `${test.stdout}\n${test.stderr}`);
  process.stdout.write(`[rn-smoke] retry-telemetry ${JSON.stringify(telemetry)}\n`);
  if (test.status !== 0) {
    throw new Error(`xcodebuild failed with status ${test.status ?? 1}`);
  }

  if (!summary) {
    throw new Error('xcodebuild did not produce a readable UI test summary.');
  }
  if (summary.result !== 'Passed' || summary.failedTests !== 0 || summary.passedTests < 4) {
    throw new Error(`Unexpected UI test summary: ${JSON.stringify(summary)}`);
  }
  process.stdout.write(
    `[rn-smoke] ${summary.passedTests}/${summary.totalTestCount} native UI tests passed with zero failures.\n`,
  );
} finally {
  rmSync(temporaryRoot, {force: true, recursive: true});
}
