import { Wallet } from 'ethers';
import { Observable } from '../dist/utils/reactive';

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

/**
 * on bellecour the blocktime is expected to be 5sec but in case of issue on the network this blocktime can reach unexpected length
 *
 * use this variable as a reference blocktime for tests timeout
 *
 * when the network is degraded, tweak the `MAX_EXPECTED_BLOCKTIME` value to reflect the network conditions
 */
export const MAX_EXPECTED_BLOCKTIME = 20_000;
