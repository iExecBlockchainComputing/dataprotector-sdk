import { loadFixture } from '@nomicfoundation/hardhat-toolbox/network-helpers.js';
import { assert, expect } from 'chai';
import pkg from 'hardhat';
import { createAppForContract } from '../scripts/singleFunction/app.js';
import { consumeProtectedData, setAppAddress } from '../scripts/singleFunction/contentContract.js';
import { createDatasetForContract } from '../scripts/singleFunction/dataset.js';
import { createWorkerpool, createWorkerpoolOrder } from '../scripts/singleFunction/workerpool.js';

const { ethers } = pkg;
const rpcURL = pkg.network.config.url;

// TODO : Should be validated in ticket PRO-691
describe('ConsumeProtectedData.sol', () => {
  async function deploySCFixture() {
    // pass the registry instance to the deploy method
    const ConsumeProtectedDataFactory = await ethers.getContractFactory('ConsumeProtectedData');
    const ConsumeProtectedDataContract = await ConsumeProtectedDataFactory.deploy();
    const deploymentTransaction = ConsumeProtectedDataContract.deploymentTransaction();
    await deploymentTransaction?.wait();

    return { ConsumeProtectedDataContract };
  }

  describe('ConsumeProtectedData()', () => {
    it.only('should create a deal on chain', async () => {
      const { ConsumeProtectedDataContract } = await loadFixture(deploySCFixture);
      const ConsumeProtectedDataContractAddress = await ConsumeProtectedDataContract.getAddress();

      // deploy fake appContract + workerpoolContract + datasetContract
      const appAddress = await createAppForContract(
        await ConsumeProtectedDataContract.getAddress(),
        rpcURL,
      );
      const contentAddress = await createDatasetForContract(
        ConsumeProtectedDataContractAddress,
        rpcURL,
      );
      const { iexecWorkerpoolOwner, workerpoolAddress } = await createWorkerpool(rpcURL);

      // create fake workerpoolOrder
      const workerpoolOrder = await createWorkerpoolOrder(iexecWorkerpoolOwner, workerpoolAddress);

      await setAppAddress(ConsumeProtectedDataContract, appAddress);

      const { tx } = await consumeProtectedData(
        ConsumeProtectedDataContract,
        contentAddress,
        workerpoolOrder,
        '',
      );

      expect(tx)
        .to.emit(ConsumeProtectedDataContract, 'DealId')
        .withArgs((eventArgs) => {
          const dealId = eventArgs[0];
          assert.equal(dealId.constructor, ethers.Bytes32, 'DealId should be of type bytes32');
        });
    });
  });
});
