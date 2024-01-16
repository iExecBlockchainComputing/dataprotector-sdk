import pkg from 'hardhat';

const { ethers } = pkg;
const rpcURL = pkg.network.config.url;

describe('Renting.sol', () => {
  async function deploySCFixture() {
    const [owner, addr1, addr2] = await ethers.getSigners();

    // pass the registry instance to the deploy method
    const CollectionFactory = await ethers.getContractFactory('Collection');
    const collectionContract = await CollectionFactory.deploy(
      '0x799daa22654128d0c64d5b79eac9283008158730',
    );
    const deploymentTransaction = collectionContract.deploymentTransaction();
    await deploymentTransaction?.wait();

    return { collectionContract, owner, addr1, addr2 };
  }

  describe('setProtectedDataAsRentable()', () => {
    it('Should create a collection and set the owner', async () => {});
  });
});
