/* eslint-disable no-unused-expressions */
import { loadFixture } from '@nomicfoundation/hardhat-toolbox/network-helpers.js';
import { expect } from 'chai';
import pkg from 'hardhat';
import {
  POCO_APP_REGISTRY_ADDRESS,
  POCO_PROTECTED_DATA_REGISTRY_ADDRESS,
  POCO_PROXY_ADDRESS,
} from '../config/config.js';

const { ethers, upgrades } = pkg;

// TODO : Should be validated in ticket PRO-691
describe('ProtectedDataSharing', () => {
  async function deploySCFixture() {
    const [owner, addr1, addr2] = await ethers.getSigners();

    const ProtectedDataSharingFactory = await ethers.getContractFactory('ProtectedDataSharing');
    const protectedDataSharingContract = await upgrades.deployProxy(
      ProtectedDataSharingFactory,
      [owner.address],
      {
        kind: 'transparent',
        constructorArgs: [
          POCO_PROXY_ADDRESS,
          POCO_APP_REGISTRY_ADDRESS,
          POCO_PROTECTED_DATA_REGISTRY_ADDRESS,
        ],
      },
    );
    await protectedDataSharingContract.waitForDeployment();

    return { protectedDataSharingContract, owner, addr1, addr2 };
  }
  describe('AccessControl', () => {
    it('should set the DEFAULT_ADMIN_ROLE to defaultAdmin', async () => {
      const { protectedDataSharingContract, owner, addr1 } = await loadFixture(deploySCFixture);
      const DEFAULT_ADMIN_ROLE = ethers.toBeHex(0, 32);
      expect(await protectedDataSharingContract.hasRole(DEFAULT_ADMIN_ROLE, owner.address)).to.be
        .true;
      expect(await protectedDataSharingContract.hasRole(DEFAULT_ADMIN_ROLE, addr1.address)).to.be
        .false;
    });
  });
});
