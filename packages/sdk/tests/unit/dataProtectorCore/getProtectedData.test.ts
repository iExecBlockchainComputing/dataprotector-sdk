import { describe, expect, it, jest } from '@jest/globals';
import { getProtectedData } from '../../../src/lib/dataProtectorCore/getProtectedData.js';
import { ProtectedDatasGraphQLResponse } from '../../../src/lib/types/graphQLTypes.js';
import { ValidationError } from '../../../src/utils/errors.js';

describe('dataProtectorCore > getProtectedData()', () => {
  describe('Check validation for input parameters', () => {
    describe('When given protected data address is invalid', () => {
      it('should throw a yup ValidationError with the correct message', async () => {
        // --- GIVEN
        const invalidProtectedDataAddress = '0x123456...';

        await expect(
          // --- WHEN
          getProtectedData({
            // @ts-expect-error No need for iexec here
            iexec: {},
            // @ts-expect-error No need for graphQLClient here
            graphQLClient: {},
            protectedDataAddress: invalidProtectedDataAddress,
          })
          // --- THEN
        ).rejects.toThrow(
          new ValidationError(
            'protectedDataAddress should be an ethereum address or a ENS name'
          )
        );
      });
    });

    describe('When given required schema is invalid', () => {
      it('should throw a yup ValidationError with the correct message', async () => {
        // --- GIVEN
        const invalidRequiredSchema = {
          testField: 'une-string',
        };

        await expect(
          // --- WHEN
          getProtectedData({
            // @ts-expect-error No need for iexec here
            iexec: {},
            // @ts-expect-error No need for graphQLClient here
            graphQLClient: {},
            // @ts-expect-error This is intended to actually test yup runtime validation
            requiredSchema: invalidRequiredSchema,
          })
          // --- THEN
        ).rejects.toThrow(
          new ValidationError(
            'requiredSchema is not valid: Unsupported type "une-string" in schema'
          )
        );
      });
    });

    describe('When given owner is invalid', () => {
      it('should throw a yup ValidationError with the correct message', async () => {
        // --- GIVEN
        const invalidOwnerAddress = '0xa0c15e...';

        await expect(
          // --- WHEN
          getProtectedData({
            // @ts-expect-error No need for iexec here
            iexec: {},
            // @ts-expect-error No need for graphQLClient here
            graphQLClient: {},
            owner: invalidOwnerAddress,
          })
          // --- THEN
        ).rejects.toThrow(
          new ValidationError(
            'owner should be an ethereum address or a ENS name'
          )
        );
      });
    });

    describe('When given createdAfterTimestamp is invalid', () => {
      it('should throw a yup ValidationError with the correct message', async () => {
        // --- GIVEN
        const invalidCreatedAfterTimestamp = -1;

        await expect(
          // --- WHEN
          getProtectedData({
            // @ts-expect-error No need for iexec here
            iexec: {},
            // @ts-expect-error No need for graphQLClient here
            graphQLClient: {},
            createdAfterTimestamp: invalidCreatedAfterTimestamp,
          })
          // --- THEN
        ).rejects.toThrow(
          new ValidationError(
            'createdAfterTimestamp must be greater than or equal to 0'
          )
        );
      });
    });

    describe('When given page is not a number', () => {
      it('should throw a yup ValidationError with the correct message', async () => {
        // --- GIVEN
        const page = 'abc';

        await expect(
          // --- WHEN
          getProtectedData({
            // @ts-expect-error No need for iexec here
            iexec: {},
            // @ts-expect-error No need for graphQLClient here
            graphQLClient: {},
            // @ts-expect-error This is intended to actually test yup runtime validation
            page,
          })
          // --- THEN
        ).rejects.toThrow(
          new ValidationError('page must be a non-negative number')
        );
      });
    });

    describe('When given page is less than zero', () => {
      it('should throw a yup ValidationError with the correct message', async () => {
        // --- GIVEN
        const page = -1;

        await expect(
          // --- WHEN
          getProtectedData({
            // @ts-expect-error No need for iexec here
            iexec: {},
            // @ts-expect-error No need for graphQLClient here
            graphQLClient: {},
            page,
          })
          // --- THEN
        ).rejects.toThrow(
          new ValidationError('page must be greater than or equal to 0')
        );
      });
    });

    describe('When given pageSize is too low', () => {
      it('should throw a yup ValidationError with the correct message', async () => {
        // --- GIVEN
        const pageSize = 9;

        await expect(
          // --- WHEN
          getProtectedData({
            // @ts-expect-error No need for iexec here
            iexec: {},
            // @ts-expect-error No need for graphQLClient here
            graphQLClient: {},
            pageSize,
          })
          // --- THEN
        ).rejects.toThrow(
          new ValidationError('pageSize must be greater than or equal to 10')
        );
      });
    });

    describe('When given pageSize is too high', () => {
      it('should throw a yup ValidationError with the correct message', async () => {
        // --- GIVEN
        const pageSize = 10_000;

        await expect(
          // --- WHEN
          getProtectedData({
            // @ts-expect-error No need for iexec here
            iexec: {},
            // @ts-expect-error No need for graphQLClient here
            graphQLClient: {},
            pageSize,
          })
          // --- THEN
        ).rejects.toThrow(
          new ValidationError('pageSize must be less than or equal to 1000')
        );
      });
    });
  });

  describe('When giving a valid owner, page and pageSize', () => {
    it('should call graphql request with the correct variables and return a correctly transformed result', async () => {
      // --- GIVEN
      // Mock response from dataprotector subgraph
      const fetchProtectedDataFromSubgraphSpy = jest
        .fn<() => Promise<ProtectedDatasGraphQLResponse>>()
        .mockResolvedValue({
          protectedDatas: [
            {
              id: '0x0000b01de8afa670288b63bf13f5d552aa153c5e',
              name: 'Email address for Privacy Pass',
              owner: {
                id: '0x56d8d1eee126f6f00435586b65fab86fedf7f0b8',
              },
              schema: [
                {
                  id: 'email:string',
                },
              ],
              creationTimestamp: 1713379450, // Wed Apr 17 2024 20:44:10 GMT+0200
              multiaddr:
                '0xa50322122038d76d7059153e707cd0951cf2ff64d17f69352a285503800c7787c3af0c63dd',
            },
            {
              id: '0x0000bfe3d595fb43c96f78c2b5bbbafeb3688945',
              name: 'OKR 2.2 test Protected Data',
              owner: {
                id: '0xd286020cf43e8556fe53fd2132daeab82f422288',
              },
              schema: [
                {
                  id: 'email:string',
                },
              ],
              creationTimestamp: 1702422160, // Wed Dec 13 2023 00:02:40 GMT+0100
              multiaddr:
                '0xa50322122036793de1858019c80f6b60787ef3484e6653fd5548eb310fdb634ed4c6a2d6fa',
            },
          ],
        });
      const graphQLClient = {
        request: fetchProtectedDataFromSubgraphSpy,
      };

      const ownerAddress = '0xB151dDE0e776a64F66f46ca9E8bF20740b9b0baD';
      const page = 0;
      const pageSize = 10;

      // --- WHEN
      const protectedDataForOwner = await getProtectedData({
        // @ts-expect-error No need for iexec here
        iexec: {},
        // @ts-expect-error Minimal GraphQL client with only what's necessary for this test
        graphQLClient,
        owner: ownerAddress,
        page,
        pageSize,
      });

      // --- THEN
      expect(fetchProtectedDataFromSubgraphSpy).toHaveBeenCalledWith(
        expect.anything(),
        {
          where: {
            and: [{ owner: '0xb151dde0e776a64f66f46ca9e8bf20740b9b0bad' }],
          },
          start: 0,
          range: 10,
        }
      );

      expect(protectedDataForOwner).toEqual([
        {
          address: '0x0000b01de8afa670288b63bf13f5d552aa153c5e',
          creationTimestamp: 1713379450,
          multiaddr: '/p2p/QmSAY4mYRkCvdDzcD3A3sDeN5nChyn82p88xt7HhYHqXfi', // <- Readable multiaddr
          name: 'Email address for Privacy Pass',
          owner: '0x56d8d1eee126f6f00435586b65fab86fedf7f0b8',
          schema: {
            email: 'string', // <- Schema formatted differently
          },
        },
        {
          address: '0x0000bfe3d595fb43c96f78c2b5bbbafeb3688945',
          creationTimestamp: 1702422160,
          multiaddr: '/p2p/QmS1HxApPobQJ5W5StEk6MyUqgz6Uk4HMw1JXSpFM1EmAy', // <- Readable multiaddr
          name: 'OKR 2.2 test Protected Data',
          owner: '0xd286020cf43e8556fe53fd2132daeab82f422288',
          schema: {
            email: 'string', // <- Schema formatted differently
          },
        },
      ]);
    });
  });
});
