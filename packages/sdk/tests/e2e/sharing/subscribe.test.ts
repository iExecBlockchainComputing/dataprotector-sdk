import { beforeAll, describe, expect, it } from '@jest/globals';
import { Contract, Wallet, ethers, type HDNodeWallet } from 'ethers';
import { DEFAULT_SHARING_CONTRACT_ADDRESS } from '../../../src/config/config.js';
import { ABI as sharingABI } from '../../../src/contracts/sharingAbi.js';
import { IExecDataProtector, getWeb3Provider } from '../../../src/index.js';
import { WorkflowError } from '../../../src/utils/errors.js';
import { MAX_EXPECTED_BLOCKTIME } from '../../test-utils.js';

describe('dataProtector.subscribe()', () => {
  let dataProtector: IExecDataProtector;
  let wallet: HDNodeWallet;

  beforeAll(async () => {
    wallet = Wallet.createRandom();
    dataProtector = new IExecDataProtector(getWeb3Provider(wallet.privateKey));
  });

  describe('When calling subscribe()', () => {
    it(
      'should work',
      async () => {
        const { collectionId } = await dataProtector.createCollection();
        //TODO:replace this implem with setsubscriptionOptions method
        //Test price and duration values
        const priceInNRLC = BigInt('0');
        const durationInSeconds = 2000;
        const sharingContract = new ethers.Contract(
          DEFAULT_SHARING_CONTRACT_ADDRESS,
          sharingABI,
          wallet.provider
        );
        await (
          sharingContract.connect(
            getWeb3Provider(wallet.privateKey)
          ) as Contract
        )
          .setSubscriptionParams(collectionId, [priceInNRLC, durationInSeconds])
          .then((tx) => tx.wait())
          .catch((e: Error) => {
            throw new WorkflowError(
              'Failed to set Subscription Options into sharing smart contract',
              e
            );
          });
        await dataProtector.subscribe({
          collectionId,
        });
        expect(true).toBe(true);
      },
      10 * MAX_EXPECTED_BLOCKTIME
    );
  });
});
