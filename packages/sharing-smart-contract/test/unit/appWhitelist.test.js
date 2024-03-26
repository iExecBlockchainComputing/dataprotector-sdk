/* eslint-disable no-unused-expressions */
import { loadFixture } from '@nomicfoundation/hardhat-toolbox/network-helpers.js';
import { expect } from 'chai';
import pkg from 'hardhat';
import { createAppFor } from '../../scripts/singleFunction/app.js';
import { deploySCFixture } from '../utils/loadFixture.test.js';

const { ethers } = pkg;
const rpcURL = pkg.network.config.url;

describe('AppWhitelist', () => {
  describe('addApp', () => {
    it('should add an app correctly', async () => {
      const { dataProtectorSharingContract, appWhitelistRegistryContract, addr1 } =
        await loadFixture(deploySCFixture);
      const newAppWhitelistTx = await appWhitelistRegistryContract.createAppWhitelist(
        addr1.address,
      );
      const transactionReceipt = await newAppWhitelistTx.wait();
      const appWhitelistTokenId = transactionReceipt.logs.find(
        ({ eventName }) => eventName === 'Transfer',
      )?.args.tokenId;
      const appWhitelistContractAddress = ethers.toBeHex(appWhitelistTokenId);
      const appWhitelistContractFactory = await ethers.getContractFactory('AppWhitelist');
      const appWhitelistContract = appWhitelistContractFactory.attach(appWhitelistContractAddress);
      const appAddress = await createAppFor(
        await dataProtectorSharingContract.getAddress(),
        rpcURL,
      );

      await expect(appWhitelistContract.connect(addr1).addApp(appAddress))
        .to.emit(appWhitelistContract, 'NewAppAddedToAppWhitelist')
        .withArgs(appAddress);

      // Verify the app is now registered
      expect(await appWhitelistContract.isRegistered(appAddress)).to.be.true;
    });
  });
});
