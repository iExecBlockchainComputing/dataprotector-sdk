import { describe, expect, it, jest } from '@jest/globals';
import { getProtectedData } from '../../../src/lib/dataProtectorCore/getProtectedData.js';
import { ProtectedDatasGraphQLResponse } from '../../../src/lib/types/graphQLTypes.js';
import { ValidationError } from '../../../src/utils/errors.js';
import { getRandomAddress } from '../../test-utils.js';

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

  describe('When giving a valid protected data address', () => {
    it('should call graphql request with the correct variable', async () => {
      // --- GIVEN
      const protectedDataAddress = getRandomAddress();
      // Mock response from dataprotector subgraph
      const fetchProtectedDataFromSubgraphSpy = jest
        .fn<() => Promise<ProtectedDatasGraphQLResponse>>()
        .mockResolvedValue({
          protectedDatas: [],
        });
      const graphQLClient = {
        request: fetchProtectedDataFromSubgraphSpy,
      };

      // --- WHEN
      await getProtectedData({
        // @ts-expect-error No need for iexec here
        iexec: {},
        // @ts-expect-error Minimal GraphQL client with only what's necessary for this test
        graphQLClient,
        protectedDataAddress,
      });

      // --- THEN
      expect(fetchProtectedDataFromSubgraphSpy).toHaveBeenCalledWith(
        expect.anything(), // The query itself
        {
          where: {
            and: [{ id: protectedDataAddress.toLowerCase() }],
          },
          start: 0,
          range: 1000,
        }
      );
    });
  });

  describe('When giving a valid owner, page and pageSize', () => {
    it('should call graphql request with the correct variables and return a correctly transformed result', async () => {
      // --- GIVEN
      const ownerAddress = getRandomAddress().toLowerCase();

      // Mock response from dataprotector subgraph
      const fetchProtectedDataFromSubgraphSpy = jest
        .fn<() => Promise<ProtectedDatasGraphQLResponse>>()
        .mockResolvedValue({
          protectedDatas: [
            {
              id: '0x0000b01de8afa670288b63bf13f5d552aa153c5e',
              name: 'Email address for Privacy Pass',
              owner: {
                id: ownerAddress,
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
                id: ownerAddress,
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
        expect.anything(), // The query itself
        {
          where: {
            and: [{ owner: ownerAddress }],
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
          owner: ownerAddress,
          schema: {
            email: 'string', // <- Schema formatted differently
          },
        },
        {
          address: '0x0000bfe3d595fb43c96f78c2b5bbbafeb3688945',
          creationTimestamp: 1702422160,
          multiaddr: '/p2p/QmS1HxApPobQJ5W5StEk6MyUqgz6Uk4HMw1JXSpFM1EmAy', // <- Readable multiaddr
          name: 'OKR 2.2 test Protected Data',
          owner: ownerAddress,
          schema: {
            email: 'string', // <- Schema formatted differently
          },
        },
      ]);
    });
  });

  describe('When giving a valid created after timestamp', () => {
    it('should call graphql request with the correct variable', async () => {
      // --- GIVEN
      const createdAfterTimestamp = 1728399092467;
      // Mock response from dataprotector subgraph
      const fetchProtectedDataFromSubgraphSpy = jest
        .fn<() => Promise<ProtectedDatasGraphQLResponse>>()
        .mockResolvedValue({
          protectedDatas: [],
        });
      const graphQLClient = {
        request: fetchProtectedDataFromSubgraphSpy,
      };

      // --- WHEN
      await getProtectedData({
        // @ts-expect-error No need for iexec here
        iexec: {},
        // @ts-expect-error Minimal GraphQL client with only what's necessary for this test
        graphQLClient,
        createdAfterTimestamp,
      });

      // --- THEN
      expect(fetchProtectedDataFromSubgraphSpy).toHaveBeenCalledWith(
        expect.anything(), // The query itself
        {
          where: {
            and: [{ creationTimestamp_gte: createdAfterTimestamp }],
          },
          start: 0,
          range: 1000,
        }
      );
    });
  });

  describe('requiredSchema', () => {
    let fetchProtectedDataFromSubgraphSpy;
    let graphQLClient;

    beforeAll(() => {
      // Mock response from dataprotector subgraph
      fetchProtectedDataFromSubgraphSpy = jest
        .fn<() => Promise<ProtectedDatasGraphQLResponse>>()
        .mockResolvedValue({
          protectedDatas: [],
        });
      graphQLClient = {
        request: fetchProtectedDataFromSubgraphSpy,
      };
    });

    afterAll(() => {
      jest.clearAllMocks();
    });

    describe('When giving a valid requiredSchema', () => {
      it('should correctly flatten the schema and include it in the subgraph query variables', async () => {
        // --- WHEN
        await getProtectedData({
          // @ts-expect-error No need for iexec here
          iexec: {},
          graphQLClient,
          requiredSchema: {
            email: 'string',
          },
        });

        // --- THEN
        expect(fetchProtectedDataFromSubgraphSpy).toHaveBeenCalledWith(
          expect.anything(), // The query itself
          {
            where: {
              and: [{ schema_contains: ['email:string'] }],
            },
            start: 0,
            range: 1000,
          }
        );
      });
    });

    describe('When giving a valid nested requiredSchema', () => {
      it('should correctly flatten the schema and include it in the subgraph query variables', async () => {
        // --- WHEN
        await getProtectedData({
          // @ts-expect-error No need for iexec here
          iexec: {},
          graphQLClient,
          requiredSchema: {
            photo: {
              thumbnail: 'image/png',
              fullSize: 'image/png',
            },
          },
        });

        // --- THEN
        expect(fetchProtectedDataFromSubgraphSpy).toHaveBeenCalledWith(
          expect.anything(), // The query itself
          {
            where: {
              and: [
                {
                  schema_contains: [
                    'photo.thumbnail:image/png',
                    'photo.fullSize:image/png',
                  ],
                },
              ],
            },
            start: 0,
            range: 1000,
          }
        );
      });
    });

    describe('When giving a valid requiredSchema with one field being an array of possible types', () => {
      it('should correctly flatten the schema and include it in the subgraph query variables', async () => {
        // --- WHEN
        await getProtectedData({
          // @ts-expect-error No need for iexec here
          iexec: {},
          graphQLClient,
          requiredSchema: {
            photo: ['image/jpeg', 'image/png'],
          },
        });

        // --- THEN
        expect(fetchProtectedDataFromSubgraphSpy).toHaveBeenCalledWith(
          expect.anything(), // The query itself
          {
            where: {
              and: [
                {
                  or: [
                    {
                      schema_contains: ['photo:image/jpeg'],
                    },
                    {
                      schema_contains: ['photo:image/png'],
                    },
                  ],
                },
              ],
            },
            start: 0,
            range: 1000,
          }
        );
      });
    });

    describe('When giving a valid requiredSchema with one field being an array of only one possible type', () => {
      it('should correctly flatten the schema and include it in the subgraph query variables', async () => {
        // --- WHEN
        await getProtectedData({
          // @ts-expect-error No need for iexec here
          iexec: {},
          graphQLClient,
          requiredSchema: {
            photo: ['image/png'],
          },
        });

        // --- THEN
        expect(fetchProtectedDataFromSubgraphSpy).toHaveBeenCalledWith(
          expect.anything(), // The query itself
          {
            where: {
              and: [
                {
                  schema_contains: ['photo:image/png'],
                },
              ],
            },
            start: 0,
            range: 1000,
          }
        );
      });
    });
  });
});
