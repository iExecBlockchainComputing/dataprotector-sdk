#!/usr/bin/env zx

// Usage: "npm run storage-to-diagrams" or "npx zx tools/storage-to-diagrams"
// Check sol2uml documentation at https://github.com/naddison36/sol2uml#storage-usage.

$.verbose = false; // Disable bash commands logging.

/**
 * Generate storage diagram of a given contract.
 * @param contractName
 */
async function generateStorageDiagram(contractName) {
  console.log(`Generating storage diagram for contract : ${contractName}`);
  await $`sol2uml storage contracts,node_modules/@openzeppelin -c ${contractName} -o docs/uml/storage-${contractName}.svg .`;
}

generateStorageDiagram('AppWhitelistRegistry');
generateStorageDiagram('DataProtectorSharing');
generateStorageDiagram('ManageOrders');
generateStorageDiagram('AppWhitelist');
