/**
 * strips the `"exports"` key from the `package.json` of `@iexec/dataprotector`
 * this allow us to import an otherwise not exported internal module
 */

import * as fs from 'fs';

const packageJsonPath = './node_modules/@iexec/dataprotector/package.json';

const { exports, ...packageJson } = JSON.parse(
  fs
    .readFileSync(packageJsonPath, {
      encoding: 'utf-8',
    })
    .toString()
);
fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson));

console.log(`removed "exports" from ${packageJsonPath}`);
