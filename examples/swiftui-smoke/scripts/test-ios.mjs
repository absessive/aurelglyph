import {execFileSync, spawnSync} from 'node:child_process';
import {existsSync, mkdtempSync, readdirSync, readFileSync, rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join, resolve} from 'node:path';

const projectRoot = resolve(import.meta.dirname, '..');
const temporaryRoot = mkdtempSync(join(tmpdir(), 'aurelglyph-swiftui-test-'));
const resultBundle = join(temporaryRoot, 'AurelglyphSwiftUISmoke.xcresult');
const derivedData = join(temporaryRoot, 'DerivedData');
const expectedTests = [
  'AurelglyphSwiftUISmokeUITests/AurelglyphSwiftUISmokeUITests/testAccessibilityCoverage',
  'AurelglyphSwiftUISmokeUITests/AurelglyphSwiftUISmokeUITests/testAppearanceMatrix',
  'AurelglyphSwiftUISmokeUITests/AurelglyphSwiftUISmokeUITests/testCatalogChipDisclosureAndRatingContracts',
  'AurelglyphSwiftUISmokeUITests/AurelglyphSwiftUISmokeUITests/testCatalogLocalizedCopyAndAccessibleTextReachability',
  'AurelglyphSwiftUISmokeUITests/AurelglyphSwiftUISmokeUITests/testCatalogPasswordPreservesFocusValueAndMasksAgain',
  'AurelglyphSwiftUISmokeUITests/AurelglyphSwiftUISmokeUITests/testDialogAndMoreInformationPresentation',
  'AurelglyphSwiftUISmokeUITests/AurelglyphSwiftUISmokeUITests/testDisabledRowsAndPresentationRecovery',
  'AurelglyphSwiftUISmokeUITests/AurelglyphSwiftUISmokeUITests/testLaunchesRootPackageShowcase',
  'AurelglyphSwiftUISmokeUITests/AurelglyphSwiftUISmokeUITests/testLocalizedControlCopy',
];

function testCaseNodes(nodes) {
  return nodes.flatMap(node => [
    ...(node.nodeType === 'Test Case' ? [node] : []),
    ...testCaseNodes(node.children ?? []),
  ]);
}

function verifyExactTestContract(testReport) {
  const nodes = testCaseNodes(testReport.testNodes ?? []);
  const expectedMethods = expectedTests.map(identifier => identifier.split('/').at(-1));
  const actualMethods = nodes.map(node => {
    const identity = `${node.nodeIdentifier ?? ''} ${node.name ?? ''}`;
    const matches = expectedMethods.filter(method => identity.includes(method));
    if (matches.length !== 1) {
      throw new Error(`Unexpected UI test identifier: ${identity.trim() || '<missing>'}`);
    }
    return matches[0];
  });
  const missing = expectedMethods.filter(method => !actualMethods.includes(method));
  const duplicates = actualMethods.filter((method, index) => actualMethods.indexOf(method) !== index);
  if (nodes.length !== expectedTests.length || missing.length || duplicates.length) {
    throw new Error(
      `Expected exactly ${expectedTests.length} declared UI tests. ` +
        `Actual: ${JSON.stringify(actualMethods)}; missing: ${JSON.stringify(missing)}; ` +
        `duplicates: ${JSON.stringify([...new Set(duplicates)])}`,
    );
  }
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
    phones.find(device => device.name.includes('Pro')) ??
    phones[0]
  );
}

try {
  const device = availableIphone();
  if (!device) {
    throw new Error('No available iPhone simulator was found. Install an iOS simulator runtime with Xcode.');
  }

  process.stdout.write(`[swiftui-smoke] Running native UI contract on ${device.name} (${device.udid}).\n`);
  const test = spawnSync(
    'xcodebuild',
    [
      '-quiet',
      '-project',
      'AurelglyphSwiftUISmoke.xcodeproj',
      '-scheme',
      'AurelglyphSwiftUISmoke',
      '-configuration',
      'Release',
      '-destination',
      `platform=iOS Simulator,id=${device.udid}`,
      '-derivedDataPath',
      derivedData,
      '-resultBundlePath',
      resultBundle,
      ...expectedTests.map(identifier => `-only-testing:${identifier}`),
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
      summary = JSON.parse(
        execFileSync(
          'xcrun',
          ['xcresulttool', 'get', 'test-results', 'summary', '--path', resultBundle],
          {encoding: 'utf8'},
        ),
      );
      testReport = JSON.parse(
        execFileSync(
          'xcrun',
          ['xcresulttool', 'get', 'test-results', 'tests', '--path', resultBundle],
          {encoding: 'utf8'},
        ),
      );
      if (summary.testFailures?.length) {
        process.stderr.write(
          `[swiftui-smoke] Native UI failures:\n${JSON.stringify(summary.testFailures, null, 2)}\n`,
        );
        for (const failure of summary.testFailures) {
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
                failure.testIdentifierString,
              ],
              {encoding: 'utf8'},
            );
            process.stderr.write(`[swiftui-smoke] ${failure.testName} details:\n${details}\n`);
          } catch (error) {
            process.stderr.write(
              `[swiftui-smoke] Could not read ${failure.testName} details: ${error.message}\n`,
            );
          }
        }

        const attachmentRoot = join(temporaryRoot, 'FailureAttachments');
        try {
          execFileSync(
            'xcrun',
            [
              'xcresulttool',
              'export',
              'attachments',
              '--path',
              resultBundle,
              '--output-path',
              attachmentRoot,
              '--only-failures',
            ],
            {encoding: 'utf8'},
          );
          for (const file of readdirSync(attachmentRoot, {recursive: true})) {
            if (typeof file === 'string' && file.endsWith('.txt')) {
              process.stderr.write(
                `[swiftui-smoke] ${file}:\n${readFileSync(join(attachmentRoot, file), 'utf8')}\n`,
              );
            }
          }
        } catch (error) {
          process.stderr.write(`[swiftui-smoke] Could not export failure attachments: ${error.message}\n`);
        }
      }
    } catch (error) {
      process.stderr.write(`[swiftui-smoke] Could not read the UI result bundle: ${error.message}\n`);
    }
  }

  if (test.status !== 0) {
    throw new Error(`xcodebuild failed with status ${test.status ?? 1}`);
  }
  if (!summary) {
    throw new Error('xcodebuild did not produce a readable UI test summary.');
  }
  if (!testReport) {
    throw new Error('xcodebuild did not produce a readable UI test report.');
  }
  verifyExactTestContract(testReport);
  if (
    summary.result !== 'Passed' ||
    summary.failedTests !== 0 ||
    summary.passedTests !== expectedTests.length ||
    summary.totalTestCount !== expectedTests.length
  ) {
    throw new Error(`Unexpected UI test summary: ${JSON.stringify(summary)}`);
  }
  process.stdout.write(
    `[swiftui-smoke] ${summary.passedTests}/${summary.totalTestCount} native UI tests passed.\n`,
  );
} finally {
  rmSync(temporaryRoot, {force: true, recursive: true});
}
