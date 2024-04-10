import { promises as fs } from 'fs';
import extractContentFromZipFile from './extractContentFromZipFile.js';
import { IExecDataProtectorDeserializer } from '@iexec/dataprotector-deserializer';

const writeTaskOutput = async (
  path: string,
  message: string
): Promise<void> => {
  try {
    await fs.writeFile(path, message);
    console.log(`File successfully written at path: ${path}`);
  } catch {
    console.error(`Failed to write Task Output`);
    process.exit(1);
  }
};

const start = async (): Promise<void> => {
  const iexecOut: string = process.env.IEXEC_OUT;

  const deserializer = new IExecDataProtectorDeserializer();
  const file = await deserializer.getValue('file', 'application/octet-stream'); //to be compatible with dataProtectorSharing the protectedData should contain a file named file

  try {
    await fs.writeFile(`${iexecOut}/content`, file); // post-compute will zip the folder inside the iexec_out
  } catch (err) {
    console.error('Failed to copy content to output');
  }

  await writeTaskOutput(
    `${iexecOut}/computed.json`,
    JSON.stringify({
      'deterministic-output-path': `${iexecOut}/content`,
    })
  );
};

export default start;
