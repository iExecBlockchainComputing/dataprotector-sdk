import { existsSync, readFileSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { env } from '../config/env';

// Get current file directory in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Path to the networks.json file (one directory up)
const networksFilePath = join(__dirname, '..', 'networks.json');

/**
 * Update networks.json file with the current block number
 * @param {string} networkName - The network to update
 * @param {number} startBlock - The block number to fork from
 */
async function updateNetworksFile({
  networkName,
  startBlock,
}: {
  networkName: string;
  startBlock: number;
}) {
  if (!existsSync(networksFilePath)) {
    console.warn(`networks.json file not found at ${networksFilePath}`);
    return;
  }

  console.log(`Updating ${networksFilePath} for network '${networkName}'`);

  try {
    // Read the current networks.json file
    const networksData = JSON.parse(readFileSync(networksFilePath, 'utf8'));

    // Check if the specified network exists in the file
    if (networksData[networkName]) {
      console.log(
        `Updating startBlock for network '${networkName}' to ${startBlock}`
      );

      // Update all startBlock values for the specified network
      Object.keys(networksData[networkName]).forEach((contract) => {
        networksData[networkName][contract].startBlock = startBlock;
      });

      // Write the updated networks.json file
      writeFileSync(networksFilePath, JSON.stringify(networksData, null, 4));
      console.log(`Successfully updated ${networksFilePath}`);
    } else {
      console.warn(
        `Network '${networkName}' not found in networks.json. File unchanged.`
      );
    }
  } catch (error) {
    console.error(`Error updating networks.json file: ${error}`);
  }
}

/**
 * Main function to orchestrate the process
 */
async function main() {
  try {
    if (env.NETWORK_NAME && env.START_BLOCK) {
      await updateNetworksFile({
        networkName: env.NETWORK_NAME,
        startBlock: env.START_BLOCK,
      });
    } else {
      console.log('nothing to update in networks');
    }
  } catch (error) {
    console.error(`Error in main process: ${error}`);
    process.exit(1);
  }
}

main();
