import { describe, expect, it, jest } from '@jest/globals';
import { ApiCallError } from 'iexec/errors';
import { ValidationError } from 'yup';
import { WorkflowError } from '../../../src/index.js';
import { getGrantedAccess } from '../../../src/lib/dataProtectorCore/getGrantedAccess.js';

describe('getGrantedAccess', () => {
  describe('Check validation for input parameters', () => {
    describe('When given protected data is invalid', () => {
      it('should throw a yup ValidationError with the correct message', async () => {
        // --- GIVEN
        const invalidProtectedDataAddress = '0x123456...';

        await expect(
          // --- WHEN
          getGrantedAccess({
            // @ts-expect-error No need for iexec here
            iexec: {},
            protectedData: invalidProtectedDataAddress,
          })
          // --- THEN
        ).rejects.toThrow(
          new ValidationError(
            'protectedData should be an ethereum address or a ENS name'
          )
        );
      });
    });

    describe('When given authorizedApp is invalid', () => {
      it('should throw a yup ValidationError with the correct message', async () => {
        // --- GIVEN
        const invalidAuthorizedAppAddress = '0x123456...';

        await expect(
          // --- WHEN
          getGrantedAccess({
            // @ts-expect-error No need for iexec here
            iexec: {},
            authorizedApp: invalidAuthorizedAppAddress,
          })
          // --- THEN
        ).rejects.toThrow(
          new ValidationError(
            'authorizedApp should be an ethereum address or a ENS name'
          )
        );
      });
    });

    describe('When given authorizedUser is invalid', () => {
      it('should throw a yup ValidationError with the correct message', async () => {
        // --- GIVEN
        const invalidAuthorizedUserAddress = '0x123456...';

        await expect(
          // --- WHEN
          getGrantedAccess({
            // @ts-expect-error No need for iexec here
            iexec: {},
            authorizedUser: invalidAuthorizedUserAddress,
          })
          // --- THEN
        ).rejects.toThrow(
          new ValidationError(
            'authorizedUser should be an ethereum address or a ENS name'
          )
        );
      });
    });

    describe('When given pageSize is invalid', () => {
      it('should throw a yup ValidationError with the correct message', async () => {
        // --- GIVEN
        const pageSize = 9;

        await expect(
          // --- WHEN
          getGrantedAccess({
            // @ts-expect-error No need for iexec here
            iexec: {},
            page: 0,
            pageSize,
          })
          // --- THEN
        ).rejects.toThrow(
          new ValidationError('pageSize must be greater than or equal to 10')
        );
      });
    });
  });

  describe('Check parameters given to fetchDatasetOrderbook()', () => {
    describe('When specific values are given to getGrantedAccess', () => {
      it('should transfer them correctly to fetchDatasetOrderbook()', async () => {
        // --- GIVEN
        const fetchDatasetOrderbookSpy = jest.fn().mockReturnValue({
          count: 0,
          orders: [],
        });
        const iexec = {
          orderbook: {
            fetchDatasetOrderbook: fetchDatasetOrderbookSpy,
          },
        };

        // --- WHEN
        await getGrantedAccess({
          // @ts-expect-error Minimal iexec implementation with only what's necessary for this test
          iexec,
          protectedData: '0x35396912db97ff130411301ec722fc92ac37b00d',
          authorizedApp: '0x7a8f4c23ef61dd295b683409fe15ad76bc92c14e',
          authorizedUser: '0x1e4b7a56c8d9ab34f0126789bcde3456f7890abc',
          isUserStrict: true,
          page: 1,
          pageSize: 10,
        });

        // --- THEN
        expect(fetchDatasetOrderbookSpy).toHaveBeenNthCalledWith(
          1,
          '0x35396912db97ff130411301ec722fc92ac37b00d',
          {
            app: '0x7a8f4c23ef61dd295b683409fe15ad76bc92c14e',
            requester: '0x1e4b7a56c8d9ab34f0126789bcde3456f7890abc',
            page: 1,
            pageSize: 10,
            isRequesterStrict: true,
            isAppStrict: true,
          }
        );
      });
    });
  });

  describe('Check catch block', () => {
    describe('When orders returned are not an array', () => {
      it('should throw a WorkflowError', async () => {
        // --- GIVEN
        const fetchDatasetOrderbookSpy = jest.fn().mockReturnValue({
          count: 0,
          orders: 27,
        });
        const iexec = {
          orderbook: {
            fetchDatasetOrderbook: fetchDatasetOrderbookSpy,
          },
        };

        // --- THEN
        await expect(
          // --- WHEN
          // @ts-expect-error No need for iexec here
          getGrantedAccess({ iexec })
          // --- THEN
        ).rejects.toThrow(
          new WorkflowError({
            message: 'Failed to fetch granted access',
            errorCause: new Error('orders?.map is not a function'),
          })
        );
      });
    });

    describe('When error is an ApiCallError', () => {
      it('should throw a WorkflowError with isProtocolError: true', async () => {
        // --- GIVEN
        const fetchDatasetOrderbookSpy = jest.fn().mockImplementation(() => {
          throw new ApiCallError(
            `Server at https://api-market.iex.ec encountered an internal error`,
            Error('Server internal error: 500 Server is too tired')
          );
        });
        const iexec = {
          orderbook: {
            fetchDatasetOrderbook: fetchDatasetOrderbookSpy,
          },
        };

        // --- THEN
        await expect(
          // --- WHEN
          // @ts-expect-error No need for iexec here
          getGrantedAccess({ iexec })
          // --- THEN
        ).rejects.toThrow(
          new WorkflowError({
            message:
              "A service in the iExec protocol appears to be unavailable. You can retry later or contact iExec's technical support for help.",
            errorCause: new ApiCallError(
              'Server at https://api-market.iex.ec encountered an internal error',
              new Error('Server internal error: 500 Server is too tired')
            ),
            isProtocolError: true,
          })
        );
      });
    });
  });

  describe('When calling getGrantedAccess with valid inputs', () => {
    it('should correctly call fetchDatasetOrderbook and format a fetchDatasetOrderbook() order', async () => {
      // --- GIVEN
      const fetchDatasetOrderbookSpy = jest.fn().mockReturnValue({
        count: 1,
        orders: [
          {
            order: {
              dataset: '0x35396912Db97ff130411301Ec722Fc92Ac37B00d',
              datasetprice: 0,
              volume: 10,
              tag: '0x0000000000000000000000000000000000000000000000000000000000000003',
              apprestrict: '0x0000000000000000000000000000000000000000',
              workerpoolrestrict: '0x0000000000000000000000000000000000000000',
              requesterrestrict: '0x0000000000000000000000000000000000000000',
              salt: '0x2a366726dc6321e78bba6697102f5953ceccfe6c0ddf9499dbb49c99bac1c16d',
              sign: '0xb00707c4be504e6e07d20bd2e52babd72cbd26f064ec7648c6b684578232bee255a9c98aa2e9b18b4088602967d4f0641d52c0fbb3d5c00304a1f6d3c19eaf4f1c',
            },
            orderHash:
              '0x396392835c2cbe933023dd28a3d6eedceb21c52b1dba199835a6f24cc75e7685',
            chainId: 134,
            publicationTimestamp: '2023-06-15T16:39:22.713Z',
            signer: '0xD52C27CC2c7D3fb5BA4440ffa825c12EA5658D60',
            status: 'open',
            remaining: 10,
          },
        ],
      });
      const iexec = {
        orderbook: {
          fetchDatasetOrderbook: fetchDatasetOrderbookSpy,
        },
      };

      // --- WHEN
      // @ts-expect-error Minimal iexec implementation with only what's necessary for this test
      const grantedAccessResult = await getGrantedAccess({ iexec });

      // --- THEN
      expect(fetchDatasetOrderbookSpy).toHaveBeenNthCalledWith(1, 'any', {
        app: 'any',
        requester: 'any',
        page: undefined,
        pageSize: undefined,
        isRequesterStrict: false,
        isAppStrict: true,
      });

      expect(grantedAccessResult.count).toBe(1);
      expect(grantedAccessResult.grantedAccess).toEqual([
        {
          dataset: '0x35396912db97ff130411301ec722fc92ac37b00d',
          datasetprice: '0',
          volume: '10',
          tag: '0x0000000000000000000000000000000000000000000000000000000000000003',
          apprestrict: '0x0000000000000000000000000000000000000000',
          workerpoolrestrict: '0x0000000000000000000000000000000000000000',
          requesterrestrict: '0x0000000000000000000000000000000000000000',
          salt: '0x2a366726dc6321e78bba6697102f5953ceccfe6c0ddf9499dbb49c99bac1c16d',
          sign: '0xb00707c4be504e6e07d20bd2e52babd72cbd26f064ec7648c6b684578232bee255a9c98aa2e9b18b4088602967d4f0641d52c0fbb3d5c00304a1f6d3c19eaf4f1c',
        },
      ]);
    });
  });
});
