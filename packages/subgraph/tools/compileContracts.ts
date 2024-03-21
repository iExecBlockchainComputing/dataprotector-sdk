import { $ } from 'zx';

$.verbose = true; // Enable verbose output to see the commands being executed.

const contractsFolders = ['../smart-contract', '../sharing-smart-contract'];

async function compileContracts() {
  await Promise.all(
    contractsFolders.map(
      (folder) => $`cd ${folder} && npm ci && npm run compile`
    )
  );
}

compileContracts();
