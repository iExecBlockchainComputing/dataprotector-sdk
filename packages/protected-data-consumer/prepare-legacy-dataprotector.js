import * as fs from 'fs';

const packageJsonPath = './node_modules/@iexec/dataprotector/package.json';

console.log(`removing "exports" from ${packageJsonPath}`);

const { exports, ...packageJson } = JSON.parse(
  fs
    .readFileSync(packageJsonPath, {
      encoding: 'utf-8',
    })
    .toString()
);
fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson));
