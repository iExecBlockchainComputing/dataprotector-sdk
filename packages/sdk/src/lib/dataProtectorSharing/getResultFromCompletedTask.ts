import { decryptResult } from 'iexec/utils';
import JSZip from 'jszip';
import { getSavedKeyPair } from '../../utils/indexedDb.js';
import { privateAsPem } from '../../utils/rsa.js';
import {
  throwIfMissing,
  validateOnStatusUpdateCallback,
} from '../../utils/validators.js';
import {
  GetResultFromCompletedTaskParams,
  GetResultFromCompletedTaskResponse,
  GetResultFromCompletedTaskStatuses,
  OnStatusUpdateFn,
} from '../types/index.js';
import { IExecConsumer } from '../types/internalTypes.js';

export const getResultFromCompletedTask = async ({
  iexec = throwIfMissing(),
  path,
  taskId,
  onStatusUpdate = () => {},
}: IExecConsumer &
  GetResultFromCompletedTaskParams): Promise<GetResultFromCompletedTaskResponse> => {
  const vOnStatusUpdate =
    validateOnStatusUpdateCallback<
      OnStatusUpdateFn<GetResultFromCompletedTaskStatuses>
    >(onStatusUpdate);
  try {
    vOnStatusUpdate({
      title: 'CONSUME_RESULT_DOWNLOAD',
      isDone: false,
    });
    const taskResult = await iexec.task.fetchResults(taskId);
    vOnStatusUpdate({
      title: 'CONSUME_RESULT_DOWNLOAD',
      isDone: true,
    });

    const rawTaskResult = await taskResult.arrayBuffer();
    const { dealid } = await iexec.task.show(taskId);
    const { params } = await iexec.deal.show(dealid);
    const jsonParams = JSON.parse(params);
    const isEncryptedResult = jsonParams?.iexec_result_encryption;

    let resultBuffer = rawTaskResult;

    if (isEncryptedResult) {
      const { keyPair } = await getSavedKeyPair();
      const pemPrivateKey = await privateAsPem(keyPair.privateKey);
      vOnStatusUpdate({
        title: 'CONSUME_RESULT_DECRYPT',
        isDone: false,
      });
      resultBuffer = await decryptResult(rawTaskResult, pemPrivateKey);
      vOnStatusUpdate({
        title: 'CONSUME_RESULT_DECRYPT',
        isDone: true,
      });
    }

    if (path) {
      return await extractFileFromZip(resultBuffer, path);
    }

    return { result: resultBuffer };
  } catch (error) {
    console.error('Error in getResultFromCompletedTask:', error);
    throw new Error('Failed to process task result');
  }
};

async function extractFileFromZip(
  resultBuffer: ArrayBuffer,
  path: string
): Promise<GetResultFromCompletedTaskResponse> {
  const resultZip = await new JSZip().loadAsync(resultBuffer);
  const file = resultZip.file(path);

  if (!file) {
    throw new Error('No "content" file found in decrypted zip');
  }

  const contentAsBuffer = await file.async('arraybuffer');
  return { result: contentAsBuffer };
}
