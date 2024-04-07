/* eslint-disable no-unused-expressions */
import { loadFixture } from '@nomicfoundation/hardhat-toolbox/network-helpers.js';
import { expect } from 'chai';
import pkg from 'hardhat';
import { getEventFromLogs } from './utils//utils.js';
import { deploySCFixture } from './utils/loadFixture.test.js';

const { ethers } = pkg;

describe('AppWhitelistRegistry', () => {
  describe('createAppWhitelist', () => {
    it('should create correctly a new appWhitelist', async () => {
      const { appWhitelistRegistryContract, addr1 } = await loadFixture(deploySCFixture);
      const newAppWhitelistTx = await appWhitelistRegistryContract.createAppWhitelist(
        addr1.address,
      );
      const transactionReceipt = await newAppWhitelistTx.wait();
      const specificEventForPreviousTx = getEventFromLogs('Transfer', transactionReceipt.logs, {
        strict: true,
      });
      const appWhitelistTokenId = specificEventForPreviousTx.args?.tokenId;
      const appWhitelistContractAddress = ethers.toBeHex(appWhitelistTokenId);

      expect(ethers.isAddress(appWhitelistContractAddress)).to.be.true;
      expect(appWhitelistTokenId).to.not.equal(0);

      expect(await appWhitelistRegistryContract.ownerOf(appWhitelistTokenId)).to.equal(
        addr1.address,
      );

      await expect(newAppWhitelistTx)
        .to.emit(appWhitelistRegistryContract, 'Transfer')
        .withArgs(ethers.ZeroAddress, addr1.address, appWhitelistTokenId);
    });
  });

  describe('transfer', () => {
    it('should transfer the appWhitelist and share coherent state between appWhitelist & the whitelistRegistry', async () => {
      const { appWhitelistRegistryContract, addr1, addr2 } = await loadFixture(deploySCFixture);
      const newAppWhitelistTx = await appWhitelistRegistryContract.createAppWhitelist(
        addr1.address,
      );
      const transactionReceipt = await newAppWhitelistTx.wait();
      const specificEventForPreviousTx = getEventFromLogs('Transfer', transactionReceipt.logs, {
        strict: true,
      });
      const appWhitelistTokenId = specificEventForPreviousTx.args?.tokenId;
      const appWhitelistContractAddress = ethers.toBeHex(appWhitelistTokenId);
      const appWhitelistContractFactory = await ethers.getContractFactory('AppWhitelist');
      const appWhitelistContract = appWhitelistContractFactory.attach(appWhitelistContractAddress);
      await appWhitelistRegistryContract
        .connect(addr1)
        .safeTransferFrom(addr1.address, addr2.address, appWhitelistTokenId);

      expect(await appWhitelistRegistryContract.ownerOf(appWhitelistTokenId)).to.be.equal(
        addr2.address,
      );
      expect(await appWhitelistRegistryContract.ownerOf(appWhitelistTokenId)).to.be.equal(
        await appWhitelistContract.owner(),
      );
    });
  });
});
