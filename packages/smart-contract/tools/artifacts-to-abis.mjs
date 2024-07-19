import {
  rmSync,
  readdirSync,
  readFileSync,
  mkdirSync,
  writeFileSync,
} from 'fs';
import { join } from 'path';

const ARTIFACTS_CONTRACTS_INPUT_DIR = join('artifacts', 'contracts');
const ABIS_TARGET_DIR = join('abis');

const getContractsDirectories = (directory = ARTIFACTS_CONTRACTS_INPUT_DIR) => {
  const items = readdirSync(directory);
  return items.reduce((directories, itemName) => {
    const itemPath = join(directory, itemName);
    if (itemName.endsWith('.sol')) {
      // this is a contract directory
      return [...directories, itemPath];
    }
    return [...directories, ...getContractsDirectories(itemPath)];
  }, []);
};

const extractAbi = (contractDirectory) => {
  const [artifactName] = readdirSync(contractDirectory).filter(
    (fileName) => fileName.endsWith('.json') && !fileName.endsWith('.dbg.json')
  );
  const artifactContent = readFileSync(join(contractDirectory, artifactName));
  const { abi } = JSON.parse(artifactContent);
  const targetDirPath = join(
    ABIS_TARGET_DIR,
    contractDirectory.split(ARTIFACTS_CONTRACTS_INPUT_DIR)[1]
  );
  mkdirSync(targetDirPath, { recursive: true });
  writeFileSync(
    join(targetDirPath, artifactName),
    JSON.stringify(abi, null, 2)
  );
  console.log(`generated ${artifactName} ABI in ${targetDirPath}`);
};

// clean abis
rmSync(ABIS_TARGET_DIR, {
  recursive: true,
  force: true,
});
// regen abis
getContractsDirectories().forEach(extractAbi);
