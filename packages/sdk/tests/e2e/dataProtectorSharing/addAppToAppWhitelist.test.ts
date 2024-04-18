import { HDNodeWallet, Wallet } from 'ethers';
import { Address, IExec } from 'iexec';
import { ValidationError } from 'yup';
import { DEFAULT_SHARING_CONTRACT_ADDRESS } from '../../../src/config/config.js';
import { IExecDataProtector } from '../../../src/index.js';
import {
  getTestConfig,
  getTestWeb3SignerProvider,
  timeouts,
} from '../../test-utils.js';

describe('dataProtector.addAppToAddOnlyAppWhitelist()', () => {
  let dataProtector: IExecDataProtector;
  let wallet: HDNodeWallet;
  let appWhitelistAddress: Address;
  let appAddress: Address;

  const createAppFor = async (appWallet: HDNodeWallet, owner: Address) => {
    const iexecAppOwner = new IExec({
      ethProvider: getTestWeb3SignerProvider(appWallet.privateKey),
    });
    const { address } = await iexecAppOwner.app.deployApp({
      owner: owner,
      name: `test app${Date.now()}`,
      type: 'DOCKER',
      multiaddr: 'registry.hub.docker.com/iexechub/vanityeth:1.1.1',
      checksum:
        '0x00f51494d7a42a3c1c43464d9f09e06b2a99968e3b978f6cd11ab3410b7bcd14',
    });
    return address;
  };

  beforeAll(async () => {
    wallet = Wallet.createRandom();
    dataProtector = new IExecDataProtector(...getTestConfig(wallet.privateKey));
    const createAppWhitelistResponse =
      await dataProtector.sharing.createAddOnlyAppWhitelist();
    appWhitelistAddress = createAppWhitelistResponse.addOnlyAppWhitelist;
    appAddress = await createAppFor(wallet, DEFAULT_SHARING_CONTRACT_ADDRESS);
  }, timeouts.createAddOnlyAppWhitelist + timeouts.createAppInPocoRegistry);

  describe('When the given addOnlyAppWhitelist is not valid', () => {
    it(
      'should throw the corresponding error if addOnlyAppWhitelist is not a valid address',
      async () => {
        // --- GIVEN
        const invalidAppWhitelistAddress = '0x123...';

        // --- WHEN / THEN
        await expect(
          dataProtector.sharing.addAppToAddOnlyAppWhitelist({
            addOnlyAppWhitelist: invalidAppWhitelistAddress,
            app: appAddress,
          })
        ).rejects.toThrow(
          new ValidationError(
            'addOnlyAppWhitelist should be an ethereum address'
          )
        );
      },
      timeouts.addAppToAddOnlyAppWhitelist
    );
    it(
      'should throw the corresponding error if app is not a valid address',
      async () => {
        // --- GIVEN
        const invalidAppAddress = '0x123...';

        // --- WHEN / THEN
        await expect(
          dataProtector.sharing.addAppToAddOnlyAppWhitelist({
            addOnlyAppWhitelist: appWhitelistAddress,
            app: invalidAppAddress,
          })
        ).rejects.toThrow(
          new ValidationError(
            'appAddress should be an ethereum address or a ENS name'
          )
        );
      },
      timeouts.addAppToAddOnlyAppWhitelist
    );
  });

  describe('When the given addOnlyAppWhitelist does not pass preflight check', () => {
    it(
      'should fail if the addOnlyAppWhitelist is registered in the addOnlyAppWhitelist registry',
      async () => {
        // --- GIVEN
        const appWhitelistThatIsNotRegistered =
          '0xbb673ac41acfbee381fe2e784d14c53b1cdc5946';

        // --- WHEN / THEN
        await expect(
          dataProtector.sharing.addAppToAddOnlyAppWhitelist({
            addOnlyAppWhitelist: appWhitelistThatIsNotRegistered,
            app: appAddress,
          })
        ).rejects.toThrow(
          new Error(
            `This whitelist contract ${appWhitelistThatIsNotRegistered} does not exist in the app whitelist registry.`
          )
        );
      },
      timeouts.addAppToAddOnlyAppWhitelist
    );
    it(
      'should fail if the addOnlyAppWhitelist is not owned by the sender',
      async () => {
        const wallet2 = Wallet.createRandom();
        const dataProtector2 = new IExecDataProtector(
          ...getTestConfig(wallet2.privateKey)
        );
        const { addOnlyAppWhitelist: appWhitelist2 } =
          await dataProtector2.sharing.createAddOnlyAppWhitelist();

        // --- WHEN / THEN
        await expect(
          dataProtector.sharing.addAppToAddOnlyAppWhitelist({
            addOnlyAppWhitelist: appWhitelist2,
            app: appAddress,
          })
        ).rejects.toThrow(
          new Error(
            `This whitelist contract ${appWhitelist2} is not owned by the wallet: ${wallet.address}.`
          )
        );
      },
      timeouts.addAppToAddOnlyAppWhitelist
    );
  });

  describe('When the given app is not own by the sharing contract', () => {
    it(
      'should throw corresponding error if the app does NOT exist in the Poco registry',
      async () => {
        // --- GIVEN
        const appThatIsNotRegisteredInPoco =
          '0xbb673ac41acfbee381fe2e784d14c53b1cdc5946';

        // --- WHEN / THEN
        await expect(
          dataProtector.sharing.addAppToAddOnlyAppWhitelist({
            addOnlyAppWhitelist: appWhitelistAddress,
            app: appThatIsNotRegisteredInPoco,
          })
        ).rejects.toThrow(
          new Error('This app does not seem to exist or it has been burned.')
        );
      },
      timeouts.addAppToAddOnlyAppWhitelist
    );

    it(
      'should throw corresponding error if the app is not owned by the sharing contract',
      async () => {
        // --- GIVEN
        const appOwnByMe = await createAppFor(wallet, wallet.address);

        // --- WHEN / THEN
        await expect(
          dataProtector.sharing.addAppToAddOnlyAppWhitelist({
            addOnlyAppWhitelist: appWhitelistAddress,
            app: appOwnByMe,
          })
        ).rejects.toThrow(
          new Error(`This app is not owned by the sharing contract.`)
        );
      },
      timeouts.addAppToAddOnlyAppWhitelist + timeouts.createAppInPocoRegistry
    );
  });

  describe('When all prerequisites are met', () => {
    it(
      'should correctly add app to addOnlyAppWhitelist',
      async () => {
        const addAppToAppWhitelistResult =
          await dataProtector.sharing.addAppToAddOnlyAppWhitelist({
            addOnlyAppWhitelist: appWhitelistAddress,
            app: appAddress,
          });

        expect(addAppToAppWhitelistResult).toEqual({
          txHash: expect.any(String),
        });
      },
      timeouts.addAppToAddOnlyAppWhitelist
    );
  });

  describe('When the given app is already in the addOnlyAppWhitelist', () => {
    it(
      'should throw with the corresponding error',
      async () => {
        // --- GIVEN
        // previous test add the app to the addOnlyAppWhitelist.

        // --- WHEN / THEN
        await expect(
          dataProtector.sharing.addAppToAddOnlyAppWhitelist({
            addOnlyAppWhitelist: appWhitelistAddress,
            app: appAddress,
          })
        ).rejects.toThrow(
          new Error(
            `This whitelist contract already have registered this app: ${appAddress.toLowerCase()}.`
          )
        );
      },
      timeouts.addAppToAddOnlyAppWhitelist
    );
  });
});
