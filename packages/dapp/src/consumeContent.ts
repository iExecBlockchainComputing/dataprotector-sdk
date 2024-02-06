import { promises as fs } from 'fs';
import extractContentFromZipFile from './extractContentFromZipFile.js';

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
  const iexecIn: string = process.env.IEXEC_IN || '';
  const iexecOut: string = process.env.IEXEC_OUT || '';
  const dataFileName: string = process.env.IEXEC_DATASET_FILENAME || '';
  const contentPath = process.argv[2] || process.env.CONTENT_PATH || '';

  const content = await extractContentFromZipFile(
    `${iexecIn}/${dataFileName}`,
    contentPath
  );

  try {
    await fs.writeFile(`${iexecOut}/content`, content);
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
