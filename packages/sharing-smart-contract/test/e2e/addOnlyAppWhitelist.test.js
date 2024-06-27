/* eslint-disable no-unused-expressions */
import { loadFixture } from '@nomicfoundation/hardhat-toolbox/network-helpers.js';
import { expect } from 'chai';
import pkg from 'hardhat';
import { createAppFor } from '../../scripts/singleFunction/app.js';
import { deploySCFixture } from './fixtures/globalFixture.js';
import { getEventFromLogs } from './utils/utils.js';

const { ethers } = pkg;
const rpcURL = pkg.network.config.url;

describe('AddOnlyAppWhitelist', () => {
  describe('addApp', () => {
    it('should add an app correctly', async () => {
      const { dataProtectorSharingContract, addOnlyAppWhitelistRegistryContract, addr1 } =
        await loadFixture(deploySCFixture);
      const newAddOnlyAppWhitelistTx = await addOnlyAppWhitelistRegistryContract.createAddOnlyAppWhitelist(
        addr1.address,
      );
      const transactionReceipt = await newAddOnlyAppWhitelistTx.wait();
      const specificEventForPreviousTx = getEventFromLogs('Transfer', transactionReceipt.logs, {
        strict: true,
      });
      const addOnlyAppWhitelistContractAddress = ethers.toBeHex(specificEventForPreviousTx.args?.tokenId);
      const addOnlyAppWhitelistContractFactory = await ethers.getContractFactory('AddOnlyAppWhitelist');
      const addOnlyAppWhitelistContract = addOnlyAppWhitelistContractFactory.attach(addOnlyAppWhitelistContractAddress);
      const appAddress = await createAppFor(await dataProtectorSharingContract.getAddress(), rpcURL);

      const tx = await addOnlyAppWhitelistContract.connect(addr1).addApp(appAddress);
      tx.wait();
      expect(tx).to.emit(addOnlyAppWhitelistContract, 'NewAppAddedToAddOnlyAppWhitelist').withArgs(appAddress);

      // Verify the app is now registered
      expect(await addOnlyAppWhitelistContract.isRegistered(appAddress)).to.be.true;
    });
  });

  describe('owner', () => {
    it('should share the same owner address between addOnlyAppWhitelist & whitelistRegistry state', async () => {
      const { addOnlyAppWhitelistRegistryContract, addr1 } = await loadFixture(deploySCFixture);
      const newAddOnlyAppWhitelistTx = await addOnlyAppWhitelistRegistryContract.createAddOnlyAppWhitelist(
        addr1.address,
      );
      const transactionReceipt = await newAddOnlyAppWhitelistTx.wait();
      const specificEventForPreviousTx = getEventFromLogs('Transfer', transactionReceipt.logs, {
        strict: true,
      });
      const addOnlyAppWhitelistTokenId = specificEventForPreviousTx.args?.tokenId;
      const addOnlyAppWhitelistContractAddress = ethers.toBeHex(addOnlyAppWhitelistTokenId);
      const addOnlyAppWhitelistContractFactory = await ethers.getContractFactory('AddOnlyAppWhitelist');
      const addOnlyAppWhitelistContract = addOnlyAppWhitelistContractFactory.attach(addOnlyAppWhitelistContractAddress);
      expect(await addOnlyAppWhitelistContract.owner()).to.be.equal(
        await addOnlyAppWhitelistRegistryContract.ownerOf(addOnlyAppWhitelistTokenId),
      );
    });
  });

  describe('transferOwnership', () => {
    it('should transfer the addOnlyAppWhitelist and have a coherent state between addOnlyAppWhitelist & the whitelistRegistry', async () => {
      const { addOnlyAppWhitelistRegistryContract, addr1, addr2 } = await loadFixture(deploySCFixture);
      const newAddOnlyAppWhitelistTx = await addOnlyAppWhitelistRegistryContract.createAddOnlyAppWhitelist(
        addr1.address,
      );
      const transactionReceipt = await newAddOnlyAppWhitelistTx.wait();
      const specificEventForPreviousTx = getEventFromLogs('Transfer', transactionReceipt.logs, {
        strict: true,
      });
      const addOnlyAppWhitelistTokenId = specificEventForPreviousTx.args?.tokenId;
      const addOnlyAppWhitelistContractAddress = ethers.toBeHex(addOnlyAppWhitelistTokenId);
      const addOnlyAppWhitelistContractFactory = await ethers.getContractFactory('AddOnlyAppWhitelist');
      const addOnlyAppWhitelistContract = addOnlyAppWhitelistContractFactory.attach(addOnlyAppWhitelistContractAddress);
      await addOnlyAppWhitelistContract.connect(addr1).transferOwnership(addr2.address);

      expect(await addOnlyAppWhitelistContract.owner()).to.be.equal(addr2.address);
      expect(await addOnlyAppWhitelistContract.owner()).to.be.equal(
        await addOnlyAppWhitelistRegistryContract.ownerOf(addOnlyAppWhitelistTokenId),
      );
    });
    it('should transfer the addOnlyAppWhitelist from an authorized operator and have a coherent state between addOnlyAppWhitelist & the whitelistRegistry', async () => {
      const { addOnlyAppWhitelistRegistryContract, addr1, addr2, addr3 } = await loadFixture(deploySCFixture);
      const newAddOnlyAppWhitelistTx = await addOnlyAppWhitelistRegistryContract.createAddOnlyAppWhitelist(
        addr1.address,
      );
      const transactionReceipt = await newAddOnlyAppWhitelistTx.wait();
      const specificEventForPreviousTx = getEventFromLogs('Transfer', transactionReceipt.logs, {
        strict: true,
      });
      const addOnlyAppWhitelistTokenId = specificEventForPreviousTx.args?.tokenId;
      const addOnlyAppWhitelistContractAddress = ethers.toBeHex(addOnlyAppWhitelistTokenId);
      const addOnlyAppWhitelistContractFactory = await ethers.getContractFactory('AddOnlyAppWhitelist');
      const addOnlyAppWhitelistContract = addOnlyAppWhitelistContractFactory.attach(addOnlyAppWhitelistContractAddress);
      await addOnlyAppWhitelistRegistryContract.connect(addr1).approve(addr3.address, addOnlyAppWhitelistTokenId);
      await addOnlyAppWhitelistContract.connect(addr3).transferOwnership(addr2.address);

      expect(await addOnlyAppWhitelistContract.owner()).to.be.equal(addr2.address);
      expect(await addOnlyAppWhitelistContract.owner()).to.be.equal(
        await addOnlyAppWhitelistRegistryContract.ownerOf(addOnlyAppWhitelistTokenId),
      );
    });
  });
});
