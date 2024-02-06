import { beforeAll, describe, expect, it } from '@jest/globals';
import { Contract, Wallet, ethers, type HDNodeWallet } from 'ethers';
import { DEFAULT_SHARING_CONTRACT_ADDRESS } from '../../../src/config/config.js';
import { ABI as sharingABI } from '../../../src/contracts/sharingAbi.js';
import { IExecDataProtector, getWeb3Provider } from '../../../src/index.js';
import { WorkflowError } from '../../../src/utils/errors.js';
import { MAX_EXPECTED_BLOCKTIME } from '../../test-utils.js';

describe('dataProtector.getSubscribers()', () => {
  let dataProtector: IExecDataProtector;
  let wallet: HDNodeWallet;

  beforeAll(async () => {
    wallet = Wallet.createRandom();
    dataProtector = new IExecDataProtector(getWeb3Provider(wallet.privateKey));
  });

  describe('When calling getSubscribers()', () => {
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
            console.log(e.message);
            throw new WorkflowError(
              'Failed to set Subscription Options into sharing smart contract',
              e
            );
          });

        //simulate three subscribers
        const wallet1 = Wallet.createRandom();
        const dataProtector1 = new IExecDataProtector(
          getWeb3Provider(wallet1.privateKey)
        );
        const wallet2 = Wallet.createRandom();
        const dataProtector2 = new IExecDataProtector(
          getWeb3Provider(wallet2.privateKey)
        );
        const wallet3 = Wallet.createRandom();
        const dataProtector3 = new IExecDataProtector(
          getWeb3Provider(wallet3.privateKey)
        );

        await dataProtector1.subscribe({
          collectionId,
        });
        await dataProtector2.subscribe({
          collectionId,
        });
        await dataProtector3.subscribe({
          collectionId,
        });
        const result = await dataProtector.getSubscribers({ collectionId });
        expect(result.subscribers.length).toBe(3);
      },
      10 * MAX_EXPECTED_BLOCKTIME
    );
  });
});
