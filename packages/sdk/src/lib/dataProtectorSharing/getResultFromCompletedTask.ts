import { decryptResult } from 'iexec/utils';
import JSZip from 'jszip';
import { getSavedKeyPair } from '../../utils/indexedDb.js';
import { privateAsPem } from '../../utils/rsa.js';
import {
  stringSchema,
  taskIdSchema,
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
  taskId,
  path,
  pemPrivateKey,
  onStatusUpdate = () => {},
}: IExecConsumer &
  GetResultFromCompletedTaskParams): Promise<GetResultFromCompletedTaskResponse> => {
  const vTaskId = taskIdSchema()
    .required()
    .label('taskId')
    .validateSync(taskId);
  const vPath = stringSchema().label('path').validateSync(path);
  const vOnStatusUpdate =
    validateOnStatusUpdateCallback<
      OnStatusUpdateFn<GetResultFromCompletedTaskStatuses>
    >(onStatusUpdate);

  try {
    vOnStatusUpdate({
      title: 'CONSUME_RESULT_DOWNLOAD',
      isDone: false,
    });
    const taskResult = await iexec.task.fetchResults(vTaskId);
    vOnStatusUpdate({
      title: 'CONSUME_RESULT_DOWNLOAD',
      isDone: true,
    });

    const rawTaskResult = await taskResult.arrayBuffer();
    const { dealid } = await iexec.task.show(vTaskId);
    const { params } = await iexec.deal.show(dealid);
    const jsonParams = JSON.parse(params);
    const isEncryptedResult = jsonParams?.iexec_result_encryption;

    let resultBuffer = rawTaskResult;

    if (isEncryptedResult) {
      if (!pemPrivateKey) {
        const savedKeyPair = await getSavedKeyPair();
        if (!savedKeyPair) {
          throw new Error(
            'No private key provided and no key pair found in indexedDB'
          );
        }
        pemPrivateKey = await privateAsPem(savedKeyPair.keyPair.privateKey);
      }
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

    if (vPath) {
      return await extractFileFromZip(resultBuffer, vPath);
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
  const resultZip = await JSZip().loadAsync(resultBuffer);
  const file = resultZip.file(path);

  if (!file) {
    throw new Error(`No "${path}" file found in decrypted zip`);
  }

  const contentAsBuffer = await file.async('arraybuffer');
  return { result: contentAsBuffer };
}
