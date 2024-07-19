import {
  createArrayBufferFromFile,
  type OneProtectDataStatus,
} from '@iexec/dataprotector';
import { getDataProtectorClient } from '../../externals/dataProtectorClient.ts';

type CreateProtectedDataStatusUpdateFn = (params: {
  title: string;
  isDone: boolean;
  payload?: Record<string, string>;
}) => void;

export async function createProtectedData({
  file,
  onStatusUpdate,
}: {
  file: File;
  onStatusUpdate: CreateProtectedDataStatusUpdateFn;
}) {
  const { dataProtector } = await getDataProtectorClient();

  const fileAsArrayBuffer = await createArrayBufferFromFile(file);

  onStatusUpdate({
    title: 'Create protected data into DataProtector registry smart-contract',
    isDone: false,
  });

  return dataProtector.protectData({
    data: { file: fileAsArrayBuffer },
    name: file.name,
    onStatusUpdate: (status) => {
      keepInterestingStatusUpdates(onStatusUpdate, status);
    },
  });
}

function keepInterestingStatusUpdates(
  onStatusUpdate: CreateProtectedDataStatusUpdateFn,
  status: OneProtectDataStatus
) {
  if (status.title === 'DEPLOY_PROTECTED_DATA' && status.isDone === true) {
    onStatusUpdate({
      title: 'Create protected data into DataProtector registry smart-contract',
      isDone: true,
      // payload: status.payload,
    });

    onStatusUpdate({
      title: 'Push protected data encryption key to iExec SMS',
      isDone: false,
    });
  }

  if (status.title === 'PUSH_SECRET_TO_SMS' && status.isDone === true) {
    onStatusUpdate({
      title: 'Push protected data encryption key to iExec SMS',
      isDone: true,
    });
  }
}
