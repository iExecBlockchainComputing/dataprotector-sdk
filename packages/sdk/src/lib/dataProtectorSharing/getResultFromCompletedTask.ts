import { decryptResult } from 'iexec/utils';
import JSZip from 'jszip';
import { getSavedKeyPair } from '../../utils/indexedDb.js';
import { privateAsPem } from '../../utils/rsa.js';
import { throwIfMissing } from '../../utils/validators.js';
import {
  GetResultFromCompletedTaskParams,
  GetResultFromCompletedTaskResponse,
} from '../types/index.js';
import { IExecConsumer } from '../types/internalTypes.js';

export const getResultFromCompletedTask = async ({
  iexec = throwIfMissing(),
  taskId,
  onStatusUpdate = () => {},
}: IExecConsumer &
  GetResultFromCompletedTaskParams): Promise<GetResultFromCompletedTaskResponse> => {
  onStatusUpdate({
    title: 'CONSUME_RESULT_DOWNLOAD',
    isDone: false,
  });
  const taskResult = await iexec.task.fetchResults(taskId);
  onStatusUpdate({
    title: 'CONSUME_RESULT_DOWNLOAD',
    isDone: true,
  });

  const rawTaskResult = await taskResult.arrayBuffer();

  const { keyPair } = await getSavedKeyPair();
  const pemPrivateKey = await privateAsPem(keyPair.privateKey);

  onStatusUpdate({
    title: 'CONSUME_RESULT_DECRYPT',
    isDone: false,
  });
  const decryptedFileBuffer = await decryptResult(rawTaskResult, pemPrivateKey);
  onStatusUpdate({
    title: 'CONSUME_RESULT_DECRYPT',
    isDone: true,
  });

  // Buffer is a zip containing:
  //  - a "computed.json" file
  //  - a "content" file = the initial protected file

  // Unzip that
  const resultZip = await new JSZip()
    .loadAsync(decryptedFileBuffer)
    .catch((error) => {
      console.error('JSZip ERROR', error);
      throw Error(`Failed to load encrypted results zip file`);
    });
  const content = resultZip.file('content');
  if (!content) {
    throw new Error('No "content" file found in decrypted zip');
  }
  const contentAsBuffer = await content.async('arraybuffer');

  const contentAsObjectURL = URL.createObjectURL(new Blob([contentAsBuffer]));

  return {
    contentAsObjectURL,
  };
};
