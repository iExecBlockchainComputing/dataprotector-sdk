import { Wallet } from 'ethers';
import { Observable } from '../dist/utils/reactive';
import { IExecAppModule, TeeFramework } from 'iexec';
import { getWeb3Provider, Web3SignerProvider } from '../dist/index';

export const getRequiredFieldMessage = (field: string = 'this') =>
  `${field} is a required field`;

export const getRandomAddress = () => Wallet.createRandom().address;

export const deployRandomApp = async (
  options: {
    ethProvider?: Web3SignerProvider;
    teeFramework?: TeeFramework;
  } = {}
) => {
  const ethProvider =
    options.ethProvider || getWeb3Provider(Wallet.createRandom().privateKey);
  const iexecAppModule = new IExecAppModule({ ethProvider });
  const { address } = await iexecAppModule.deployApp({
    owner: ethProvider.address,
    name: 'test-do-not-use',
    type: 'DOCKER',
    multiaddr: 'foo/bar:baz',
    checksum:
      '0x00f51494d7a42a3c1c43464d9f09e06b2a99968e3b978f6cd11ab3410b7bcd14',
    mrenclave:
      options.teeFramework &&
      ({
        // base
        framework: options.teeFramework,
        version: 'v0',
        fingerprint: 'thumb',
        // scone specific
        entrypoint: options.teeFramework === 'scone' ? 'foo' : undefined,
        heapSize: options.teeFramework === 'scone' ? 1 : undefined,
      } as any),
  });
  return address;
};

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

export const sleep = (ms: number): Promise<void> =>
  new Promise((res) => setTimeout(res, ms));

/**
 * on bellecour the blocktime is expected to be 5sec but in case of issue on the network this blocktime can reach unexpected length
 *
 * use this variable as a reference blocktime for tests timeout
 *
 * when the network is degraded, tweak the `MAX_EXPECTED_BLOCKTIME` value to reflect the network conditions
 */
export const MAX_EXPECTED_BLOCKTIME = 20_000;
