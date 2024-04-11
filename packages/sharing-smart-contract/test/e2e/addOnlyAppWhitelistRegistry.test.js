/* eslint-disable no-unused-expressions */
import { loadFixture } from '@nomicfoundation/hardhat-toolbox/network-helpers.js';
import { expect } from 'chai';
import pkg from 'hardhat';
import { deploySCFixture } from './utils/loadFixture.test.js';
import { getEventFromLogs } from './utils/utils.js';

const { ethers } = pkg;

describe('AddOnlyAppWhitelistRegistry', () => {
  describe('createAddOnlyAppWhitelist', () => {
    it('should create correctly a new addOnlyAppWhitelist', async () => {
      const { addOnlyAppWhitelistRegistryContract, addr1 } = await loadFixture(deploySCFixture);
      const newAddOnlyAppWhitelistTx = await addOnlyAppWhitelistRegistryContract.createAddOnlyAppWhitelist(addr1.address);
      const transactionReceipt = await newAddOnlyAppWhitelistTx.wait();
      const specificEventForPreviousTx = getEventFromLogs('Transfer', transactionReceipt.logs, {
        strict: true,
      });
      const addOnlyAppWhitelistTokenId = specificEventForPreviousTx.args?.tokenId;
      const addOnlyAppWhitelistContractAddress = ethers.toBeHex(addOnlyAppWhitelistTokenId);

      expect(ethers.isAddress(addOnlyAppWhitelistContractAddress)).to.be.true;
      expect(addOnlyAppWhitelistTokenId).to.not.equal(0);

      expect(await addOnlyAppWhitelistRegistryContract.ownerOf(addOnlyAppWhitelistTokenId)).to.equal(addr1.address);

      await expect(newAddOnlyAppWhitelistTx)
        .to.emit(addOnlyAppWhitelistRegistryContract, 'Transfer')
        .withArgs(ethers.ZeroAddress, addr1.address, addOnlyAppWhitelistTokenId);
    });
  });

  describe('transfer', () => {
    it('should transfer the AddOnlyAppWhitelist and share coherent state between AddOnlyAppWhitelist & the whitelistRegistry', async () => {
      const { addOnlyAppWhitelistRegistryContract, addr1, addr2 } = await loadFixture(deploySCFixture);
      const newAddOnlyAppWhitelistTx = await addOnlyAppWhitelistRegistryContract.createAddOnlyAppWhitelist(addr1.address);
      const transactionReceipt = await newAddOnlyAppWhitelistTx.wait();
      const specificEventForPreviousTx = getEventFromLogs('Transfer', transactionReceipt.logs, {
        strict: true,
      });
      const addOnlyAppWhitelistTokenId = specificEventForPreviousTx.args?.tokenId;
      const addOnlyAppWhitelistContractAddress = ethers.toBeHex(addOnlyAppWhitelistTokenId);
      const addOnlyAppWhitelistContractFactory = await ethers.getContractFactory('AddOnlyAppWhitelist');
      const addOnlyAppWhitelistContract = addOnlyAppWhitelistContractFactory.attach(addOnlyAppWhitelistContractAddress);
      await addOnlyAppWhitelistRegistryContract
        .connect(addr1)
        .safeTransferFrom(addr1.address, addr2.address, addOnlyAppWhitelistTokenId);

      expect(await addOnlyAppWhitelistRegistryContract.ownerOf(addOnlyAppWhitelistTokenId)).to.be.equal(addr2.address);
      expect(await addOnlyAppWhitelistRegistryContract.ownerOf(addOnlyAppWhitelistTokenId)).to.be.equal(
        await addOnlyAppWhitelistContract.owner(),
      );
    });
  });
});
