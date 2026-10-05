import {spawnSync} from 'node:child_process';
import {mkdtempSync, rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join, resolve} from 'node:path';

const projectRoot = resolve(import.meta.dirname, '..');
const temporaryRoot = mkdtempSync(join(tmpdir(), 'aurelglyph-swiftui-build-'));

try {
  const build = spawnSync(
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
      'generic/platform=iOS Simulator',
      '-derivedDataPath',
      join(temporaryRoot, 'DerivedData'),
      'build',
      'CODE_SIGNING_ALLOWED=NO',
    ],
    {cwd: projectRoot, encoding: 'utf8'},
  );
  process.stdout.write(build.stdout);
  process.stderr.write(build.stderr);
  if (build.status !== 0) {
    throw new Error(`xcodebuild failed with status ${build.status ?? 1}`);
  }
  process.stdout.write('[swiftui-smoke] Release simulator build passed.\n');
} finally {
  rmSync(temporaryRoot, {force: true, recursive: true});
}
