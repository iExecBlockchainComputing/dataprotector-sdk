import { beforeAll, describe, expect, it, jest } from '@jest/globals';
import { Wallet, type HDNodeWallet } from 'ethers';
import { IExecDataProtector, getWeb3Provider } from '../../../src/index.js';
import { MAX_EXPECTED_BLOCKTIME } from '../../test-utils.js';

describe('dataProtector.setProtectedDataToSubscription()', () => {
  let dataProtector: IExecDataProtector;
  let wallet: HDNodeWallet;

  beforeAll(async () => {
    wallet = Wallet.createRandom();
    dataProtector = new IExecDataProtector(getWeb3Provider(wallet.privateKey));
  });

  describe('When calling setProtectedDataToSubscription()', () => {
    it(
      'should answer with success true',
      async () => {
        //Create a Protected data
        const result = await dataProtector.protectData({
          name: 'test',
          data: { doNotUse: 'test' },
        });
        const { collectionId } = await dataProtector.createCollection();

        /* // Approve protected Data
        const registryContract = new ethers.Contract(
          POCO_REGISTRY_CONTRACT_ADDRESS,
          registryABI,
          wallet.provider
        );
        const protectedDataTokenId = ethers
          .getBigInt(result.address.toLowerCase())
          .toString();
        await (
          registryContract.connect(
            getWeb3Provider(wallet.privateKey)
          ) as Contract
        )
          .approve(DEFAULT_COLLECTION_CONTRACT_ADDRESS, protectedDataTokenId)
          .then((tx) => tx.wait())
          .catch((e: Error) => {
            console.log(e.message);
            throw new WorkflowError('Failed to approve data into registry', e);
          });
        //TODO:Replace this add protected data to collection with the real sdk implementation of the add to collection
        const collectionContract = new ethers.Contract(
          DEFAULT_COLLECTION_CONTRACT_ADDRESS,
          collectionABI,
          wallet.provider
        );
        await (
          collectionContract.connect(
            getWeb3Provider(wallet.privateKey)
          ) as Contract
        )
          .addProtectedDataToCollection(collectionId, result.address)
          .then((tx) => tx.wait())
          .catch((e: Error) => {
            console.log(e.message);
            throw new WorkflowError(
              'Failed to add Protected Data To Collection into collection smart contract',
              e
            );
          }); */
        const onStatusUpdateMock = jest.fn();
        await dataProtector.addToCollection({
          protectedDataAddress: result.address,
          collectionId,
          onStatusUpdate: onStatusUpdateMock,
        });
        // call the setProtectedDataToSubscription method
        const { success } = await dataProtector.setProtectedDataToSubscription({
          collectionTokenId: collectionId,
          protectedDataAddress: result.address,
        });
        expect(success).toBe(true);
      },
      10 * MAX_EXPECTED_BLOCKTIME
    );
  });
});
