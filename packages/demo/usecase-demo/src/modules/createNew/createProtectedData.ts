import { Connector } from 'wagmi';
import {
  Address,
  OnStatusUpdateFn,
  ProtectDataMessage,
} from '../../../../../sdk/src';
import { getDataProtectorClient } from '../../externals/dataProtectorClient.ts';
import { createArrayBufferFromFile } from '../../utils/createArrayBufferFromFile.ts';

export async function createProtectedData({
  connector,
  file,
  onStatusUpdate,
}: {
  connector: Connector;
  file: File;
  onStatusUpdate: OnStatusUpdateFn;
}) {
  const dataProtector = await getDataProtectorClient({
    connector: connector!,
  });

  const fileAsArrayBuffer = await createArrayBufferFromFile(file);

  onStatusUpdate({
    title: 'Create protected data into DataProtector registry smart-contract',
    isDone: false,
  });

  // TODO: Refactor SDK and replace the following code with:
  // const protectedDataAddress = await dataProtector.protectData({
  //   data: { file: fileAsArrayBuffer },
  //   name: file.name,
  //   onStatusUpdate,
  // });

  let address: Address;
  const protectedDataAddress: string = await new Promise((resolve, reject) => {
    try {
      dataProtector
        .protectDataObservable({
          data: { file: fileAsArrayBuffer },
          name: file.name,
        })
        .subscribe(
          (messageData: ProtectDataMessage) => {
            const { message } = messageData;
            if (message === 'PROTECTED_DATA_DEPLOYMENT_SUCCESS') {
              address = messageData.address;
              onStatusUpdate({
                title:
                  'Create protected data into DataProtector registry smart-contract',
                isDone: true,
                payload: {
                  protectedDataAddress: address,
                  explorerUrl: `https://explorer.iex.ec/bellecour/dataset/${address}`,
                },
              });
              onStatusUpdate({
                title: 'Push protected data encryption key to iExec SMS',
                isDone: false,
              });
            }
            if (message === 'PUSH_SECRET_TO_SMS_SUCCESS') {
              onStatusUpdate({
                title: 'Push protected data encryption key to iExec SMS',
                isDone: true,
              });
            }
          },
          (err) => {
            reject(err);
          },
          () => {
            resolve(address);
          }
        );
    } catch (err) {
      reject(err);
    }
  });
  return protectedDataAddress;
}
