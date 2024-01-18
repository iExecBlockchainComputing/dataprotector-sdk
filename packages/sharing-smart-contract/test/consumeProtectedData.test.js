import { loadFixture } from '@nomicfoundation/hardhat-toolbox/network-helpers.js';
import { assert, expect } from 'chai';
import pkg from 'hardhat';
import { POCO_PROXY_ADDRESS, POCO_REGISTRY_ADDRESS } from '../config/config.js';
import { createAppForContract } from '../scripts/singleFunction/app.js';
import { consumeProtectedData, setAppAddress } from '../scripts/singleFunction/contentContract.js';
import { createDatasetForContract } from '../scripts/singleFunction/dataset.js';
import { createWorkerpool, createWorkerpoolOrder } from '../scripts/singleFunction/workerpool.js';

const { ethers } = pkg;
const rpcURL = pkg.network.config.url;

// TODO : Should be validated in ticket PRO-691
describe('ConsumeProtectedData.sol', () => {
  async function deploySCFixture() {
    const [owner, addr1, addr2] = await ethers.getSigners();

    const ProtectedDataSharingFactory = await ethers.getContractFactory('ProtectedDataSharing');
    const protectedDataSharingContract = await ProtectedDataSharingFactory.deploy(
      POCO_PROXY_ADDRESS,
      POCO_REGISTRY_ADDRESS,
    );
    const deploymentTransaction = protectedDataSharingContract.deploymentTransaction();
    await deploymentTransaction?.wait();

    return { protectedDataSharingContract, owner, addr1, addr2 };
  }

  describe('ConsumeProtectedData()', () => {
    it('should create a deal on chain', async () => {
      const { protectedDataSharingContract } = await loadFixture(deploySCFixture);
      const protectedDataSharingContractAddress = await protectedDataSharingContract.getAddress();

      // deploy fake appContract + workerpoolContract + datasetContract
      const appAddress = await createAppForContract(
        await protectedDataSharingContract.getAddress(),
        rpcURL,
      );
      const contentAddress = await createDatasetForContract(
        protectedDataSharingContractAddress,
        rpcURL,
      );

      const { iexecWorkerpoolOwner, workerpoolAddress } = await createWorkerpool(rpcURL);

      // create fake workerpoolOrder
      const workerpoolOrder = await createWorkerpoolOrder(iexecWorkerpoolOwner, workerpoolAddress);

      await setAppAddress(protectedDataSharingContract, appAddress);

      const { tx } = await consumeProtectedData(
        protectedDataSharingContract,
        contentAddress,
        workerpoolOrder,
        '',
      );
      console.log('test6');

      expect(tx)
        .to.emit(protectedDataSharingContract, 'DealId')
        .withArgs((eventArgs) => {
          const dealId = eventArgs[0];
          assert.equal(dealId.constructor, ethers.Bytes32, 'DealId should be of type bytes32');
        });
    });
  });
});
