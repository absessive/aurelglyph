import {execFileSync} from 'node:child_process';
import {mkdtempSync, readFileSync, rmSync, statSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join, resolve} from 'node:path';

const projectRoot = resolve(import.meta.dirname, '..');
const cliPath = resolve(projectRoot, '../../node_modules/react-native/cli.js');
const temporaryRoot = mkdtempSync(join(tmpdir(), 'aurelglyph-rn-android-smoke-'));
const bundleOutput = join(temporaryRoot, 'index.android.bundle');
const assetsDestination = join(temporaryRoot, 'assets');

try {
  const config = JSON.parse(
    execFileSync(process.execPath, [cliPath, 'config'], {
      cwd: projectRoot,
      encoding: 'utf8',
    }),
  );
  const androidProject = config.project?.android;
  if (
    androidProject?.packageName !== 'com.absessive.aurelglyphsmoke' ||
    androidProject?.mainActivity !== '.MainActivity'
  ) {
    throw new Error(`Unexpected Android host configuration: ${JSON.stringify(androidProject)}`);
  }

  execFileSync(
    process.execPath,
    [
      cliPath,
      'bundle',
      '--entry-file',
      'index.js',
      '--platform',
      'android',
      '--dev',
      'false',
      '--minify',
      'true',
      '--bundle-output',
      bundleOutput,
      '--assets-dest',
      assetsDestination,
    ],
    {cwd: projectRoot, stdio: 'inherit'},
  );

  const bundle = readFileSync(bundleOutput, 'utf8');
  if (statSync(bundleOutput).size < 1_024 || !bundle.includes('aurelglyph-overlay-host')) {
    throw new Error('The Android release bundle did not include the Aurelglyph overlay host contract.');
  }
  process.stdout.write('[rn-smoke] Android release bundle and native project configuration passed.\n');
} finally {
  rmSync(temporaryRoot, {force: true, recursive: true});
}
