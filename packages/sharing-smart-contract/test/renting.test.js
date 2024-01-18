import pkg from 'hardhat';
import { POCO_PROXY_ADDRESS, POCO_REGISTRY_ADDRESS } from '../config/config.js';

const { ethers } = pkg;
const rpcURL = pkg.network.config.url;

describe('Renting.sol', () => {
  async function deploySCFixture() {
    const [owner, addr1, addr2] = await ethers.getSigners();

    const ProtectedDataSharingFactory = await ethers.getContractFactory('ProtectedDataSharing');
    const protectedDataSharingContract = await ProtectedDataSharingFactory.deploy(
      POCO_PROXY_ADDRESS,
      POCO_REGISTRY_ADDRESS,
    );
    const deploymentTransaction = protectedDataSharingContract.deploymentTransaction();
    await deploymentTransaction?.wait();

    const CollectionFactory = await ethers.getContractFactory('Collection');
    const collectionContract = await CollectionFactory.attach(
      await protectedDataSharingContract.m_collection(),
    );

    return { protectedDataSharingContract, collectionContract, owner, addr1, addr2 };
  }

  describe('setProtectedDataAsRentable()', () => {
    it('Should create a collection and set the owner', async () => {
      const { protectedDataSharingContract, collectionContract, addr1 } =
        await loadFixture(deploySCFixture);
      const tx = await collectionContract.connect(addr1).createCollection();
      const receipt = await tx.wait();
      const tokenId = ethers.toNumber(receipt.logs[0].args[2]);
      
    });
  });
});
