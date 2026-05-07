const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const packageJsonPath = path.join(rootDir, 'package.json');
const manifestPath = path.join(rootDir, 'CSXS', 'manifest.xml');
const bootstrapPath = path.join(rootDir, 'src', 'scripts', '_runtime', 'bootstrap.jsx');

const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
const version = packageJson.version;

if (!/^\d+\.\d+\.\d+$/.test(version)) {
  throw new Error(`package.json version must be x.y.z, got "${version}"`);
}

function replaceInFile(filePath, replacements) {
  let content = fs.readFileSync(filePath, 'utf8');
  const original = content;

  for (const [pattern, replacement] of replacements) {
    if (!pattern.test(content)) {
      throw new Error(`Version marker not found in ${path.relative(rootDir, filePath)}: ${pattern}`);
    }
    content = content.replace(pattern, replacement);
  }

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
  }
}

replaceInFile(manifestPath, [
  [/ExtensionBundleVersion="[^"]+"/, `ExtensionBundleVersion="${version}"`],
  [/<Extension Id="com\.hopeflow\.toolbox\.panel" Version="[^"]+" \/>/, `<Extension Id="com.hopeflow.toolbox.panel" Version="${version}" />`],
]);

replaceInFile(bootstrapPath, [
  [/\$\.hopeflow\.version = '[^']+';/, `$.hopeflow.version = '${version}';`],
]);

console.log(`Synced HopeFlow version ${version}`);
