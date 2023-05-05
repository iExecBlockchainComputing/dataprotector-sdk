import { Wallet } from 'ethers';
import { getSignerFromPrivateKey } from 'iexec/utils';
import { Observable } from '../dist/utils/reactive';

export const getEthProvider = (privateKey) =>
  getSignerFromPrivateKey('bellecour', privateKey);

export const getRequiredFieldMessage = (field: string = 'this') =>
  `${field} is a required field`;

export const getRandomAddress = () => Wallet.createRandom().address;

/**
 * call `subscribe()` on a Observable and return a Promise containing sent messages, completed status and error
 */
export const runObservableSubscribe = async (observable: Observable<any>) => {
  const messages: Array<any> = [];
  let completed = false;
  let error: any = undefined;
  await new Promise<void>((resolve) => {
    observable.subscribe(
      (message: any) => messages.push(message),
      (err) => {
        error = err;
        resolve();
      },
      () => {
        completed = true;
        resolve();
      }
    );
  });
  return {
    messages,
    completed,
    error,
  };
};
