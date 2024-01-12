import { expect } from 'chai';
import { loadFixture } from '@nomicfoundation/hardhat-network-helpers';
import { ethers } from 'hardhat';

describe('DataProtector', function () {
  async function deploySCFixture() {
    const [owner, otherAccount] = await ethers.getSigners();
    // Create an instance of DatasetRegistry using the address
    const DatasetRegistry = await ethers.getContractFactory(
      'DatasetRegistryMock'
    );
    const datasetRegistry = await DatasetRegistry.deploy();

    // pass the registry instance to the deploy method
    const DataProtector = await ethers.getContractFactory('DataProtector');
    const deployedContract = await DataProtector.deploy(
      datasetRegistry.address
    );
    return { deployedContract, owner, otherAccount };
  }

  it('CreateDatasetWithSchema function : should emit event', async function () {
    const { deployedContract, owner } = await loadFixture(deploySCFixture);
    const datasetOwner = owner.address;
    const datasetName = 'ProtectedData Name';
    const datasetSchema = JSON.stringify({
      email: 'string',
      age: 'number',
    });
    const datasetMultiaddr = ethers.constants.HashZero;
    const datasetChecksum = ethers.constants.HashZero;
    const tx = await deployedContract.createDatasetWithSchema(
      datasetOwner,
      datasetName,
      datasetSchema,
      datasetMultiaddr,
      datasetChecksum
    );

    // expect event to be emitted
    await expect(tx)
      .to.emit(deployedContract, 'DatasetSchema')
      .withArgs((value: string) => {
        return ethers.utils.isAddress(value);
      }, datasetSchema);
  });
});
