import pkg from 'hardhat';

const { ethers, upgrades } = pkg;
const proxyAddress = '...';

async function main() {
  console.log('Starting deployment...');
  const [deployer] = await ethers.getSigners();
  console.log('Deploying contracts with the account:', deployer.address);

  // pass the registry instance to the deploy method
  const ProtectedDataSharingFactoryV2 = await ethers.getContractFactory('ProtectedDataSharing');
  const proxyUpgrade = await upgrades.upgradeProxy(proxyAddress, ProtectedDataSharingFactoryV2, {
    kind: 'transparent',
  });
  await proxyUpgrade.waitForDeployment();

  console.log(`Proxy address: ${proxyAddress}`);
  console.log(
    'Implementation address (ProtectedDataSharing.sol):',
    await upgrades.erc1967.getImplementationAddress(proxyAddress),
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
