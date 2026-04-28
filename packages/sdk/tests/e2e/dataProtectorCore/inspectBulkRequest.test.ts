import { beforeAll, describe, expect, it } from '@jest/globals';
import { HDNodeWallet, Wallet } from 'ethers';
import { IExec } from 'iexec';
import {
  BulkRequest,
  GrantedAccess,
  IExecDataProtectorCore,
} from '../../../src/index.js';
import {
  MAX_EXPECTED_BLOCKTIME,
  MAX_EXPECTED_WEB2_SERVICES_TIME,
  deployRandomApp,
  getTestConfig,
} from '../../test-utils.js';

describe('dataProtectorCore.inspectBulkRequest()', () => {
  let iexec: IExec;
  let dataProtectorCore: IExecDataProtectorCore;
  let wallet: HDNodeWallet;

  const grantedAccesses: GrantedAccess[] = [];

  let appAddress: string;
  let workerpoolAddress: string;

  beforeAll(async () => {
    wallet = Wallet.createRandom();
    const config = await getTestConfig(wallet.privateKey);
    dataProtectorCore = new IExecDataProtectorCore(...config);
    // create app & workerpool
    const [ethProvider, options] = await getTestConfig(wallet.privateKey);
    appAddress = await deployRandomApp({
      ethProvider,
    });
    iexec = new IExec({ ethProvider }, options.iexecOptions);
    await iexec.order
      .createApporder({ app: appAddress, volume: 1000, tag: ['tee', 'tdx'] })
      .then(iexec.order.signApporder)
      .then(iexec.order.publishApporder);
    const { address: workerpool } = await iexec.workerpool.deployWorkerpool({
      description: 'test pool',
      owner: await iexec.wallet.getAddress(),
    });
    workerpoolAddress = workerpool;
    await iexec.order
      .createWorkerpoolorder({
        workerpool: workerpoolAddress,
        category: 0,
        volume: 1000,
        tag: ['tee', 'tdx'],
      })
      .then(iexec.order.signWorkerpoolorder)
      .then(iexec.order.publishWorkerpoolorder);

    const createTestData = async () => {
      const protectedData = await dataProtectorCore.protectData({
        data: { email: 'example@example.com' },
        name: 'test do not use',
      });
      const grantedAccess = await dataProtectorCore.grantAccess({
        authorizedApp: appAddress,
        protectedData: protectedData.address,
        authorizedUser: wallet.address,
        allowBulk: true,
      });
      return {
        address: protectedData.address,
        grantedAccess,
      };
    };

    for (let i = 0; i < 10; i++) {
      const { grantedAccess } = await createTestData();
      grantedAccesses.push(grantedAccess);
    }
  }, 10 * 2 * MAX_EXPECTED_BLOCKTIME + MAX_EXPECTED_WEB2_SERVICES_TIME);

  describe('when bulk request is not yet processed', () => {
    it('should inspect INITIALIZING bulk request successfully', async () => {
      // --- GIVEN
      const { bulkRequest } = await dataProtectorCore.prepareBulkRequest({
        app: appAddress,
        bulkAccesses: grantedAccesses,
        maxProtectedDataPerTask: 3,
      });
      // --- WHEN
      const inspectResponse = await dataProtectorCore.inspectBulkRequest({
        bulkRequest,
        withResult: false,
        detailed: true,
      });

      // --- THEN
      expect(inspectResponse).toBeDefined();
      expect(inspectResponse.bulkStatus).toBe('INITIALIZING');
      expect(inspectResponse.tasksTotalCount).toBe(4);
      expect(inspectResponse.tasksToCreateCount).toBe(4);
      expect(inspectResponse.tasksProcessingCount).toBe(0);
      expect(inspectResponse.tasksCompletedCount).toBe(0);
      expect(inspectResponse.tasks).toHaveLength(0);
    }, 60000);
  });

  describe('when bulk request is in progress', () => {
    it(
      'should inspect IN_PROGRESS bulk request successfully',
      async () => {
        // --- GIVEN
        const { bulkRequest } = await dataProtectorCore.prepareBulkRequest({
          app: appAddress,
          bulkAccesses: grantedAccesses,
          maxProtectedDataPerTask: 5,
        });
        await dataProtectorCore.processBulkRequest({
          bulkRequest,
          workerpool: workerpoolAddress,
          checkInterval: 1_000,
          timeout: 10_000,
        });
        // --- WHEN
        const inspectResponse = await dataProtectorCore.inspectBulkRequest({
          bulkRequest,
          withResult: false,
          detailed: true,
        });

        // --- THEN
        expect(inspectResponse).toBeDefined();
        expect(inspectResponse.bulkStatus).toBe('IN_PROGRESS');
        expect(inspectResponse.tasksTotalCount).toBe(2);
        expect(inspectResponse.tasksToCreateCount).toBe(0);
        expect(inspectResponse.tasksProcessingCount).toBe(2);
        expect(inspectResponse.tasksCompletedCount).toBe(0);
        expect(inspectResponse.tasks).toHaveLength(2);
        for (const task of inspectResponse.tasks) {
          expect(task.status).toBe('UNSET');
          expect(task.protectedDataAddresses).toBeUndefined();
          expect(task.success).toBeUndefined();
        }
      },
      MAX_EXPECTED_BLOCKTIME * 8 + MAX_EXPECTED_WEB2_SERVICES_TIME
    );
  });

  describe('when bulk request is finished', () => {
    const dataProtectorCoreArbSepolia = new IExecDataProtectorCore(
      'arbitrum-sepolia-testnet'
    );
    const bulkRequestArbSepolia: BulkRequest = {
      params:
        '{"iexec_secrets":{"1":"0xe12da94587fd9750e0ae7907a91856c4"},"iexec_result_storage_provider":"ipfs","bulk_cid":"QmScn2gunmzFrAevz7vQ8PSdjtBc9e3A2Z9f2XVV1PWBnG","iexec_input_files":[]}',
      callback: '0x0000000000000000000000000000000000000000',
      beneficiary: '0xc063e7ed698DEf5Ab483299a4867b516a00135Be',
      trust: '0',
      category: '0',
      tag: '0x0000000000000000000000000000000000000000000000000000000000000001',
      volume: '1',
      requester: '0xc063e7ed698DEf5Ab483299a4867b516a00135Be',
      workerpoolmaxprice: '100000000',
      workerpool: '0xB967057a21dc6A66A29721d96b8Aa7454B7c383F',
      datasetmaxprice: '0',
      dataset: '0x0000000000000000000000000000000000000000',
      appmaxprice: '0',
      app: '0x97792094EDf25a3AA607ed198aa22c32D7B33b62',
      salt: '0x548435d89c7c3c30bd6593dd483d0d841444d2fda86605859bef3f3a8f5c99c8',
      sign: '0x36a9d424cd4799cc5c68798d32e9e116115f1548cd9c539c31909d26524ef2b178667db6f744c9ceba520d76b8edac26071d194bb00f926f47f9114cb63bc1f61c',
    };

    it('should inspect FINISHED bulk request successfully', async () => {
      // --- GIVEN
      // --- WHEN
      const inspectResponse =
        await dataProtectorCoreArbSepolia.inspectBulkRequest({
          bulkRequest: bulkRequestArbSepolia,
        });

      // --- THEN
      expect(inspectResponse).toBeDefined();
      expect(inspectResponse.bulkStatus).toBe('FINISHED');
      expect(inspectResponse.tasksTotalCount).toBe(1);
      expect(inspectResponse.tasksToCreateCount).toBe(0);
      expect(inspectResponse.tasksProcessingCount).toBe(0);
      expect(inspectResponse.tasksCompletedCount).toBe(1);
      expect(inspectResponse.tasks).toHaveLength(1);

      const task0 = inspectResponse.tasks[0];
      expect(task0.taskId).toBe(
        '0x4db61bd82060d69607840ab01dff651a6d16f36be2ae4c330d09e2a7b6c23040'
      );
      expect(task0.dealId).toBe(
        '0x3f483145b52a7ea342b88e3701b3db10e0b51527879d7903803eac25406389fa'
      );
      expect(task0.bulkIndex).toBe(0);
      expect(task0.status).toBe('COMPLETED');
      expect(task0.protectedDataAddresses).toBeUndefined();
      expect(task0.success).toBe(true);
    });

    describe('when detailed is true', () => {
      it(
        'should include protected data addresses',
        async () => {
          // --- GIVEN
          // --- WHEN
          const inspectResponse =
            await dataProtectorCoreArbSepolia.inspectBulkRequest({
              bulkRequest: bulkRequestArbSepolia,
              detailed: true,
            });

          // --- THEN
          expect(inspectResponse.tasks).toHaveLength(1);
          expect(inspectResponse.tasks[0].protectedDataAddresses).toStrictEqual(
            [
              '0x9dea439dd4cfecaef6cee364e65a72a1c2158150',
              '0xb638a2233ed1e19bb42eae6cbf70e406824a2fca',
            ]
          );
        },
        MAX_EXPECTED_BLOCKTIME * 8 + MAX_EXPECTED_WEB2_SERVICES_TIME
      );
    });

    describe('when withResult is true', () => {
      it('should include tasks results', async () => {
        // --- GIVEN
        // --- WHEN
        const inspectResponse =
          await dataProtectorCoreArbSepolia.inspectBulkRequest({
            bulkRequest: bulkRequestArbSepolia,
            withResult: true,
          });

        // --- THEN
        expect(inspectResponse.tasks).toHaveLength(1);
        expect(inspectResponse.tasks[0].result.byteLength).toBe(524);
      });
      describe('when path is specified', () => {
        it('should include tasks results at specified path', async () => {
          // --- GIVEN
          // --- WHEN
          const inspectResponse =
            await dataProtectorCoreArbSepolia.inspectBulkRequest({
              bulkRequest: bulkRequestArbSepolia,
              withResult: true,
              path: 'computed.json',
            });
          const decoder = new TextDecoder();
          // --- THEN
          const expectedResultPathContent = `{
  "deterministic-output-path": "/iexec_out/result.json"
}`;
          expect(inspectResponse.tasks).toHaveLength(1);
          expect(decoder.decode(inspectResponse.tasks[0].result)).toBe(
            expectedResultPathContent
          );
        });
        describe('when result path does not exist', () => {
          it('should report the error', async () => {
            // --- GIVEN
            // --- WHEN
            const inspectResponse =
              await dataProtectorCoreArbSepolia.inspectBulkRequest({
                bulkRequest: bulkRequestArbSepolia,
                withResult: true,
                path: 'does/not/exist',
              });
            // --- THEN
            expect(inspectResponse.tasks).toHaveLength(1);
            expect(inspectResponse.tasks[0].result).toBeUndefined();
            expect(inspectResponse.tasks[0].error).toEqual(
              new Error('Failed to process task result')
            );
          });
        });
      });
    });
  });
});
