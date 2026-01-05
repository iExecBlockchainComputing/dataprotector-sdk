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
    dataProtectorCore = new IExecDataProtectorCore(
      ...getTestConfig(wallet.privateKey)
    );
    // create app & workerpool
    const [ethProvider, options] = getTestConfig(wallet.privateKey);
    appAddress = await deployRandomApp({
      ethProvider,
      teeFramework: 'scone',
    });
    iexec = new IExec({ ethProvider }, options.iexecOptions);
    await iexec.order
      .createApporder({ app: appAddress, volume: 1000, tag: ['tee', 'scone'] })
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
        tag: ['tee', 'scone'],
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
      app: '0x650386bA74015Cd0a67034D7f9035CD5e23b46BC',
      appmaxprice: '0',
      dataset: '0x0000000000000000000000000000000000000000',
      datasetmaxprice: '0',
      workerpool: '0xB967057a21dc6A66A29721d96b8Aa7454B7c383F',
      workerpoolmaxprice: '100000000',
      requester: '0xB0b552107C14A5e4BCf20f359DeF23Ac6003Abde',
      volume: '2',
      tag: '0x0000000000000000000000000000000000000000000000000000000000000003',
      category: '0',
      trust: '0',
      beneficiary: '0xB0b552107C14A5e4BCf20f359DeF23Ac6003Abde',
      callback: '0x0000000000000000000000000000000000000000',
      params:
        '{"iexec_secrets":{"1":"0xf5452d11237fab687de562d6905d1d1f"},"iexec_result_storage_provider":"ipfs","bulk_cid":"QmXoH2m21wvNckTAFBYQ3arVpuPCrXggZdLGTrc5GaBM5M","iexec_input_files":[],"iexec_args":"EXISTING"}',
      salt: '0x40aac92300aacfc33d0664ac8f45465527d28aba0c91f799597828032490cb60',
      sign: '0x7a469e82458e6a3ac728dd432321f8385f38c46f5f8513abe127f288b5c1296247dcd2c60704a483ee9b196d162d2d6f8f1fd8e10aa70ac3c65b039c25e7baa91b',
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
      expect(inspectResponse.tasksTotalCount).toBe(2);
      expect(inspectResponse.tasksToCreateCount).toBe(0);
      expect(inspectResponse.tasksProcessingCount).toBe(0);
      expect(inspectResponse.tasksCompletedCount).toBe(2);
      expect(inspectResponse.tasks).toHaveLength(2);

      const task0 = inspectResponse.tasks[0];
      expect(task0.taskId).toBe(
        '0x333c91c3e90597c24ff69fd5fe3cec50c3d87a78ff4d3df7c0895b30777d0951'
      );
      expect(task0.dealId).toBe(
        '0xb76713c910641d7000e05ece0c7b77a2a6fef4f43b94811e2322e6f5ffefa773'
      );
      expect(task0.bulkIndex).toBe(0);
      expect(task0.status).toBe('COMPLETED');
      expect(task0.protectedDataAddresses).toBeUndefined();
      expect(task0.success).toBe(true);

      const task1 = inspectResponse.tasks[1];
      expect(task1.taskId).toBe(
        '0xafef56f10938b865377002eaaa75a90545153f0aa5f0ba29101e10c3b1956675'
      );
      expect(task1.dealId).toBe(
        '0xb76713c910641d7000e05ece0c7b77a2a6fef4f43b94811e2322e6f5ffefa773'
      );
      expect(task1.bulkIndex).toBe(1);
      expect(task1.status).toBe('COMPLETED');
      expect(task1.protectedDataAddresses).toBeUndefined();
      expect(task1.success).toBe(true);
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
          expect(inspectResponse.tasks).toHaveLength(2);
          expect(inspectResponse.tasks[0].protectedDataAddresses).toStrictEqual(
            [
              '0x017f354098459b4c440b6e404030dbde75c837a6',
              '0x030e6a91df6909de2d34abbc13563bead82a63a2',
              '0x085cdffabeaff870f0233d6e11a2bae07b1a92aa',
              '0x15de1cba5154a9d82e4bf3292c3e5031c0f11091',
              '0x16333cfbf307e36551511050489f310cf51e2999',
              '0x18ac83aa5a211317a872bb72cbbba296aae26c2c',
              '0x19c04c5ba2d408465e3a297baf93f269a9f00ef2',
              '0x1cd41098e3901d1543710aa93b306a08b90b7c2b',
              '0x1e76fd850074ab9a7885c8f4b010db66c40a8bc7',
              '0x206cdf322e224b98fda1f6089a7d64eda0446da7',
              '0x221f87649d4ec3e95f500b9ab3d4c36ca1ce7ec0',
              '0x23d7cee8d89e4c3cebf9d1012a64650a6d433450',
              '0x23f489b2af8c1ffcd5db86ec224787119269c01b',
              '0x2699c8472f05d89796a5a197207aa3fd78ca78d3',
              '0x26c64687982b8ae74e9a0d490d3cdccb9d7cc7ef',
              '0x2a09d32a1491bc32f0466ac969477e379414127b',
              '0x2d00d107f2effc1fc7c07fb500d3dc208a69de6c',
              '0x2f33aa58a0ad731a3fa0dafa9841261dabfedf7a',
              '0x371365165ba6c8757ba84938d58f2e0bdbabccf5',
              '0x38459ef2da1365fce481ce779a1a236d4710c2c7',
              '0x397a1b86192f0aeb8e0ff167f9bebd83210f4772',
              '0x3cbfd616bfcbb9c5740483535ed492625466051c',
              '0x40e32f2ca294eb2c799fbfd55a7566e90e9d15bb',
              '0x43b9f7c776ed025afaeae0bc7d9fb9864eb302c2',
              '0x45dcd4511fafa41f6f6bbe7535559e4ba93aa7a9',
              '0x4872ccc304de6f3f0ef42c5362ec489a83f423e3',
              '0x4ac074d06b3a00599f3931e1ec436077fd961d1e',
              '0x4f1bbc9d791dc9abdaa4b6d54b513354a9910a59',
              '0x5218f845f79e0947d0a498a0648fc6bcd18769dc',
              '0x5391aa9b2e973dd2a137850c13dc75353fd529d9',
              '0x56811938fddcec68ef83903a1a9b473eddabe160',
              '0x600c3a2e46f8f6a8e38ebce4c7649f3a05388140',
              '0x60b5f6e779065eab67b02e9e982a784016094353',
              '0x619c8a00ee131d52e0605e95d0c39d466fa24bea',
              '0x6523b65f8c9e48c9220f59e176ff22abc72f4dc7',
              '0x6558559f98f0b4cc79b660e6f7d73e68d842f4ff',
              '0x66cb1edec3385605bb4a3aaf0ff0d75f4c9ed0b7',
              '0x6c907502e6f2f61b062f24461630261942989212',
              '0x6d1ade11ea005b32ecc90e68df86c0a6d0710dab',
              '0x6e01ecacb7f0a04df3353150e1a30f0f14bdf550',
              '0x75ae7c6c0ffa7ff2b1b7420b747731e92c5b991b',
              '0x78f8e262a603f5cfe3bb2ad30ad9052f8fce6630',
              '0x7b9645a59d1883db6922c94e8071626c7d564095',
              '0x82d71ed9d14e0ed7605b686f37651b7365a4ed6a',
              '0x82efae19aec7e1c1333501b03fb5b987f26a3744',
              '0x836553507fe02ef81224485274a586ac284f7c31',
              '0x8610aab99e294a966c1cee4a6e59925974d04905',
              '0x89363ba962041232fb0d03ca8833d15e8a33d98f',
              '0x8bf71fad528ef3b085e0d2e5cd34f159bfcf2c13',
              '0x8d3352ae80f0ad63e9f7fead2a21a212ff674ac6',
              '0x8da3990e153dc2f829781ac71e0f1850beefdc29',
              '0x8e5088a991814d9de31dd209ff7572d49e68d541',
              '0x905369a2f4e4b84c29e3389f3237e7a77656e80c',
              '0x9232cbf4fc50a36aac9bb4bb5c23c2d66993a8a4',
              '0x95b11e00c69f5d298d986321c7c556cd1032e86c',
              '0x98257afee41068fff012a3fa853be32c5b6b8c91',
              '0x9f8854e4ee9d93491092645002f9c8e091f262d5',
              '0xa1c59808b422c970cab32eecca67257242c7aca8',
              '0xa2a997b196ec1d45fac584a3a44a30d310781a10',
              '0xa91e8be343b25084efdc60951b82cbe64649731e',
              '0xab6bc91d650f4468d8a4f181f8db9a4bbd7da931',
              '0xac1f6e47d6ca4f0948774fa92f1d7dfe2e82b963',
              '0xac30b2621aa8df33effd957bc3c4aabd80aef02a',
              '0xacbd220d422cb1ac63afbfdd05bac426b643c4e3',
              '0xad1550347be905fe846389ca20c40535573bb9bc',
              '0xae3b1c7a68a9d073940a89ea6beb4a229c556299',
              '0xafe44084479964f80d32aeadb369c721a40bcdb8',
              '0xb3afb6f81791604324409435ab4ebdb45d5905c8',
              '0xb59ec5a53c97efe846dd7cd66fdf835e57341c18',
              '0xb611340106517c9a48dd91e5e15b2e324f22ca10',
              '0xb7f83baf0c28bf43a8e3aea18721755bebeb8013',
              '0xbc5882142c328d0cc30f0abe461c441f6a7ca91b',
              '0xbde7166515ed6d47b6fcaa820841572d113eb1a4',
              '0xbfd9200ae8bb1f7453fc554d4fb1dbce7e5b3b8b',
              '0xc1fc82a8b4cd2ecc8f4770c07f0d92b37ff9f804',
              '0xc4b18db491c222bb83263e14aad3c3e43b01e25b',
              '0xc8c2ad61e09610716a301c3e1bf1b77888c4ad00',
              '0xca7415b0be0edbb9a50633d386e1d64089c70682',
              '0xca7bedd67808de0288c8c56d8df964435a9f8cc9',
              '0xd0f7094b084d728441e6f4fec534945c8a978b4f',
              '0xd2468ad03256c65facc18d938b3fcbee9eecfec4',
              '0xd3809d64a90a5d2867997d01c10a323bfab5bba7',
              '0xde768628f787ea19adb933f37518c10628503c8f',
              '0xe06d76693117070b4adb9def80692f224d444256',
              '0xe147db10c54c18593f49f9654c01138071923b3e',
              '0xe1a777b9f1933b250cef02e292a092a256495c4b',
              '0xe3a016d1360a946c8d1c1d9dfc025697c436e1d4',
              '0xe3fa895e42f1e7bd874751b0f8f5889737c166c0',
              '0xe4173610be5e66941a2d8d47bd6fd906e9161ab5',
              '0xe53b0833f871d76bc3cf803d41e10e10a1dddc79',
              '0xe53f37e597a4d66801486f8ea53a0b0895535643',
              '0xea52a6686987c1689512c4bfb816356b2259242e',
              '0xec0e9be51285a4fdf17db5c2ae9dbc6032276a65',
              '0xeca3f6b883bd7c4c789f6e091a3459e1b0814dfb',
              '0xee6c677be075fbf3f246f1005315e2d7f1aea8cf',
              '0xf09e1cd068c45d200b26e1cf8fa89bf419f362fa',
              '0xf4b5473b8d0dfa8dc64b1e82bc91b06cc6c3a6be',
              '0xf55074873f183d6593600e14684f120c361b59ea',
              '0xf6fc9c6dcef021aad8c549a1977deadb47dcd050',
              '0xfaebbc4d93df155fabc7391b401479f58cfaf21d',
            ]
          );
          expect(inspectResponse.tasks[1].protectedDataAddresses).toStrictEqual(
            [
              '0x046aa3521a570016f8c55870c82fc49dcfa51c8d',
              '0x0752314d058e3c80f82952cadd66fddcf83ac9e4',
              '0x0df222bc8e6a3685bea4cfa9998fbb3675b12fa9',
              '0x11e85d053f733930d0234687d27bc78687ff40f5',
              '0x1535708698ac554e455c7a4b07018b0531f961dc',
              '0x2346ecefe1009d735898247f6e3ea58d65726aeb',
              '0x32cad04924838f64e27cad93bf40772583f24520',
              '0x332935525167f518dcda26dedb3f20fdc356e843',
              '0x39a2a91f07cda61415d0cfd8012034560295c3f5',
              '0x3ac290236621f6b58508c6e1feafd9158e671dfb',
              '0x3fe78730dffc2297bc61c4dc8f900d5e19cc975c',
              '0x4169e2e4d0dfa7b094cb33819bfa5b3a93f28b0e',
              '0x4eb39b3df1e7a83247f549307aa1a07d1cfe1137',
              '0x51e8378ef9ef8db76663133cdb1a4e9b685266d1',
              '0x582685da6bf656e67147fc617e7953fd22dd446a',
              '0x5b20fbf28787ccc22e887e1a8a7fc5b6298a0019',
              '0x5c0f62600c02c55ba75fe79520e2f8b2dabc4c91',
              '0x5df438d28dcf12e342b9f1a769cd65b0b898a109',
              '0x5e0c9d8094cc609abaf57882644bf78096627f95',
              '0x60ebadc23e384835243adcaa33afad77d2c683f7',
              '0x683873397fba6db5f47ab4b0edb4f8857fb0d5ca',
              '0x75c2f99c0b49596efe7edd6401c7d3025cf0b2c2',
              '0x792cd604053a1997c0e1c3f057f25ae8ea227f5e',
              '0x7b8ff0ef9eb7948a90b266d34f910f7eb6e48f37',
              '0x7c7a9ef6daa32810f555dba64d5472f1649677a0',
              '0x823ab3ca1883e48e6fa8184370f0e46350b4c9f5',
              '0x832d92f3eea36d219b8c409fe0e4da8e20ab17d3',
              '0x846a42375d29ac9f54c04cbe6916c84fecb76212',
              '0x8630ae5ce15deb727952f22040dac42505e179c6',
              '0x8982a0d493397ef928eb58f95bbb84aad660c7c9',
              '0xb15e8eb120c139de26804aa978407bacc0da2ab6',
              '0xb16ac4e77fb21f11e07e7bf3cac2f1cb6225b9e6',
              '0xb8ecd307b9f3643a99b16ddafeb463985649f363',
              '0xbb6bfc355a12498044780c5e4003b7f2b0f021c8',
              '0xbc0475c978f11f02bf529e16e5e2f218606829e8',
              '0xc3dc62ba0b2487775249363f672eba729edb7985',
              '0xc46d86bc5c6e5ec86c80f2d9285d6cfbe89aef30',
              '0xcd1deb62243b5ea1d57c7f9006e2c30d9d78750d',
              '0xd11999d1cda0acf8fdd124050064a8431d1897a5',
              '0xd735679f9a4619681b119faebde2e48f6115c109',
              '0xd83423e7819dda53f0889b17d5e12d4656d5610e',
              '0xe49184fa101d7cd28f9bfc45c9541d27c86af4ec',
              '0xfb3f3fa87fc6e5d2e8dcf2e2126cea0f333a2fd4',
              '0xffc758fd24418b859b00f2d95ea48205d76c781e',
              '0xffd0e1a8bb9545ac370ea205c5e469656b97546c',
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
        expect(inspectResponse.tasks).toHaveLength(2);
        expect(inspectResponse.tasks[0].result.byteLength).toBe(3625);
        expect(inspectResponse.tasks[1].result.byteLength).toBe(1908);
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
          expect(inspectResponse.tasks).toHaveLength(2);
          expect(decoder.decode(inspectResponse.tasks[0].result)).toBe(
            expectedResultPathContent
          );
          expect(decoder.decode(inspectResponse.tasks[1].result)).toBe(
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
            expect(inspectResponse.tasks).toHaveLength(2);
            expect(inspectResponse.tasks[0].result).toBeUndefined();
            expect(inspectResponse.tasks[0].error).toEqual(
              new Error('Failed to process task result')
            );
            expect(inspectResponse.tasks[1].result).toBeUndefined();
            expect(inspectResponse.tasks[1].error).toEqual(
              new Error('Failed to process task result')
            );
          });
        });
      });
    });
  });
});
