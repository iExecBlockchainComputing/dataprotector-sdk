import { loadFixture } from '@nomicfoundation/hardhat-toolbox/network-helpers.js';
import { assert, expect } from 'chai';
import pkg from 'hardhat';
import { POCO_PROXY_ADDRESS, POCO_REGISTRY_ADDRESS } from '../config/config.js';
import { createDatasetForContract } from '../scripts/singleFunction/dataset.js';
import { createWorkerpool, createWorkerpoolOrder } from '../scripts/singleFunction/workerpool.js';

const { ethers } = pkg;
const rpcURL = pkg.network.config.url;

describe('ConsumeProtectedData', () => {
  async function deploySCFixture() {
    const [owner, addr1, addr2] = await ethers.getSigners();

    const ProtectedDataSharingFactory = await ethers.getContractFactory('ProtectedDataSharing');
    const protectedDataSharingContract = await ProtectedDataSharingFactory.deploy(
      POCO_PROXY_ADDRESS,
      POCO_REGISTRY_ADDRESS,
      owner.address,
    );
    const deploymentTransaction = protectedDataSharingContract.deploymentTransaction();
    await deploymentTransaction?.wait();

    return { protectedDataSharingContract, owner, addr1, addr2 };
  }

  async function createAssets() {
    const { protectedDataSharingContract } = await loadFixture(deploySCFixture);
    const protectedDataSharingContractAddress = await protectedDataSharingContract.getAddress();

    const protectedDataAddress = await createDatasetForContract(
      protectedDataSharingContractAddress,
      rpcURL,
    );
    const { iexecWorkerpoolOwner, workerpoolAddress } = await createWorkerpool(rpcURL);
    const workerpoolOrder = await createWorkerpoolOrder(iexecWorkerpoolOwner, workerpoolAddress);
    return { protectedDataSharingContract, protectedDataAddress, workerpoolOrder };
  }

  describe('ConsumeProtectedData()', () => {
    it('should create a deal on chain', async () => {
      const { protectedDataSharingContract, protectedDataAddress, workerpoolOrder } =
        await loadFixture(createAssets);

      const tx = await protectedDataSharingContract.consumeProtectedData(
        protectedDataAddress,
        workerpoolOrder,
        '',
      );
      await tx.wait();

      expect(tx)
        .to.emit(protectedDataSharingContract, 'DealId')
        .withArgs((eventArgs) => {
          const dealId = eventArgs[0];
          assert.equal(dealId.constructor, ethers.Bytes32, 'DealId should be of type bytes32');
        });
    });
  });
});
