#!/usr/bin/env zx

// Usage: "npm run sol-to-uml" or "npx zx tools/solidity-to-uml"
// For sol2uml documentation, see https://github.com/naddison36/sol2uml#usage

$.verbose = false; // Disable bash commands logging.

/**
 * Generate UML class diagrams for contracts in a given directory.
 * @param contractsList
 */
async function generateClassDiagramOfDirectory() {
  console.log(`Generating class diagram for contracts`);
  await $`sol2uml class contracts -he -hs -hi -o docs/uml/class-uml.svg`;
}

await generateClassDiagramOfDirectory();
