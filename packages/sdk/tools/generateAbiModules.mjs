import { mkdirSync, readFileSync, readdirSync, writeFileSync } from 'fs';
import { basename, dirname, join } from 'path';

const ABIS_INPUT_DIR = join('abis');
const ABI_MODULES_TARGET_DIR = join('generated', 'abis');

const getAbiJsonFiles = (directory = ABIS_INPUT_DIR) => {
  const items = readdirSync(directory);
  return items.reduce((directories, itemName) => {
    const itemPath = join(directory, itemName);
    if (itemName.endsWith('.json')) {
      // this is an ABI json file
      return [...directories, itemPath];
    }
    // this is a nested directory, dive in
    return [...directories, ...getAbiJsonFiles(itemPath)];
  }, []);
};

getAbiJsonFiles().forEach((jsonAbiPath) => {
  const targetDirectory = dirname(
    join(ABI_MODULES_TARGET_DIR, jsonAbiPath.split(ABIS_INPUT_DIR)[1])
  );
  mkdirSync(targetDirectory, { recursive: true });
  const targetFileName = basename(jsonAbiPath).replace('.json', '.ts');
  const abi = JSON.parse(readFileSync(jsonAbiPath));
  const abiModule = `// THIS FILE IS GENERATED DO NOT EDIT MANUALLY\nexport const ABI = ${JSON.stringify(
    abi,
    null,
    2
  )};`;
  writeFileSync(join(targetDirectory, targetFileName), abiModule);
});
