import { $ } from 'zx';

$.verbose = false; // Disable bash commands logging.

async function generateTypechain() {
  console.log(`Generating typechain`);
  await $`cd ../sharing-smart-contract && npm ci && npm run compile`;
  await $`cd ../smart-contract && npm ci && npm run compile`;
  await $`rimraf typechain && typechain --target=ethers-v6 --out-dir ./typechain '{../sharing-smart-contract/artifacts/contracts/**,../smart-contract/artifacts/contracts/**}/!(*.dbg).json' --node16-modules`;
}

generateTypechain();
