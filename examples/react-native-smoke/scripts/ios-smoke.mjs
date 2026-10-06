import {execFileSync, spawnSync} from 'node:child_process';
import {cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync, writeSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join, resolve} from 'node:path';

import {retryTelemetry} from './ios-results.mjs';

const projectRoot = resolve(import.meta.dirname, '..');
const temporaryRoot = mkdtempSync(join(tmpdir(), 'aurelglyph-rn-smoke-'));
const resultBundle = join(temporaryRoot, 'AurelglyphSmoke.xcresult');
const derivedData = join(temporaryRoot, 'DerivedData');
let buildOutput = '';
let completed = false;

function log(message) {
  writeSync(process.stdout.fd, `${message}\n`);
}

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

  log(`[rn-smoke] Running native UI contract on ${device.name} (${device.udid}).`);
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
    {cwd: projectRoot, encoding: 'utf8', maxBuffer: 32 * 1024 * 1024},
  );
  buildOutput = `${test.stdout ?? ''}\n${test.stderr ?? ''}`;
  if (test.status !== 0) log(`[rn-smoke] Xcode output tail:\n${buildOutput.split('\n').slice(-80).join('\n')}`);

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
        log(`[rn-smoke] Native UI failures:\n${JSON.stringify(summary.testFailures, null, 2)}`);
      }
      const telemetry = retryTelemetry(testReport, buildOutput);
      log(`[rn-smoke] retry-telemetry ${JSON.stringify(telemetry)}`);
      const failedIdentifiers = new Set([
        ...(summary.testFailures ?? []).map(failure => failure.testIdentifierString),
        ...telemetry.attempts.filter(attempt => attempt.result === 'Failed').map(attempt => attempt.identifier),
      ]);
      for (const identifier of failedIdentifiers) {
        try {
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
              identifier,
            ],
            {encoding: 'utf8'},
          );
          log(`[rn-smoke] ${identifier} details:\n${details}`);
        } catch (error) {
          log(`[rn-smoke] Could not read ${identifier} details: ${error.message}`);
        }
      }
    } catch (error) {
      log(`[rn-smoke] Could not read the native UI result bundle: ${error.message}`);
    }
  }

  if (!testReport) {
    throw new Error('xcodebuild did not produce a readable UI test report.');
  }
  const telemetry = retryTelemetry(testReport, buildOutput);
  if (test.error) throw test.error;
  if (test.status !== 0) {
    throw new Error(`xcodebuild failed with status ${test.status ?? 1}`);
  }
  if (telemetry.recoveredTests.length > 0) {
    throw new Error(`Native UI tests required retry recovery: ${JSON.stringify(telemetry.recoveredTests)}`);
  }

  if (!summary) {
    throw new Error('xcodebuild did not produce a readable UI test summary.');
  }
  if (summary.result !== 'Passed' || summary.failedTests !== 0 || summary.passedTests < 9) {
    throw new Error(`Unexpected UI test summary: ${JSON.stringify(summary)}`);
  }
  log(`[rn-smoke] ${summary.passedTests}/${summary.totalTestCount} native UI tests passed with zero failures.`);
  completed = true;
} finally {
  if (!completed && (buildOutput || existsSync(resultBundle))) {
    const artifactParent = join(projectRoot, 'build');
    mkdirSync(artifactParent, {recursive: true});
    const artifactRoot = mkdtempSync(join(artifactParent, 'ios-smoke-'));
    writeFileSync(join(artifactRoot, 'xcodebuild.log'), buildOutput);
    if (existsSync(resultBundle)) cpSync(resultBundle, join(artifactRoot, 'AurelglyphSmoke.xcresult'), {recursive: true});
    log(`[rn-smoke] Failed native diagnostics retained at ${artifactRoot}`);
  }
  rmSync(temporaryRoot, {force: true, recursive: true});
}
