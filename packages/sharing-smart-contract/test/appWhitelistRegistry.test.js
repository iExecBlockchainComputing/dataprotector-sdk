/* eslint-disable no-unused-expressions */
import { loadFixture } from '@nomicfoundation/hardhat-toolbox/network-helpers.js';
import { expect } from 'chai';
import pkg from 'hardhat';
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
      const appWhitelistTokenId = transactionReceipt.logs.find(
        ({ eventName }) => eventName === 'Transfer',
      )?.args.tokenId;
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
});
