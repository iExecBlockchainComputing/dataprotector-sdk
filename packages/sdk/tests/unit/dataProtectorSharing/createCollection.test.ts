import { describe, expect, it, jest } from '@jest/globals';
import { HDNodeWallet, Wallet } from 'ethers';
import { IExec, utils } from 'iexec';
import { CreateCollection } from '../../../src/lib/dataProtectorSharing/createCollection.js';
import { getRandomAddress, getRandomTxHash } from '../../test-utils.js';

jest.unstable_mockModule(
  '../../../src/lib/dataProtectorSharing/smartContract/getSharingContract.js',
  () => ({
    getSharingContract: jest
      .fn<
        () => Promise<{
          createCollection: () => any;
        }>
      >()
      .mockResolvedValue({
        createCollection: () =>
          Promise.resolve({
            hash: getRandomTxHash(),
            wait: () =>
              Promise.resolve({
                logs: [
                  {
                    eventName: 'DatasetSchema',
                    args: { tokenId: 123 },
                  },
                ],
              }),
          }),
      }),
  })
);

jest.unstable_mockModule('../../../src/utils/getEventFromLogs.js', () => ({
  getEventFromLogs: jest.fn(),
}));

describe('dataProtectorSharing.createCollection()', () => {
  let testedModule: any;
  let wallet: HDNodeWallet;
  let iexec: IExec;
  let createCollection: CreateCollection;

  beforeEach(async () => {
    wallet = Wallet.createRandom();
    iexec = new IExec({
      ethProvider: utils.getSignerFromPrivateKey(
        'https://bellecour.iex.ec',
        wallet.privateKey
      ),
    });

    const getEventFromLogsModule: any = await import(
      '../../../src/utils/getEventFromLogs.js'
    );
    getEventFromLogsModule.getEventFromLogs.mockReturnValue({
      args: { tokenId: 123 },
    });

    // import tested module after all mocked modules
    testedModule = await import(
      '../../../src/lib/dataProtectorSharing/createCollection.js'
    );
    createCollection = testedModule.createCollection;
  });

  describe('When sharing smart contract answers successfully with a newly minted token', () => {
    it('should answer with the collection id and the transaction hash', async () => {
      // --- WHEN
      const createCollectionResult = await createCollection({
        iexec,
        sharingContractAddress: getRandomAddress(),
      });

      // --- THEN
      expect(createCollectionResult).toEqual({
        collectionId: 123,
        txHash: expect.any(String),
      });
    });
  });
});
