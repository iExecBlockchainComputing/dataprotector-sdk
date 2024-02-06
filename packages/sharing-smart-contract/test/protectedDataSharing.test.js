/* eslint-disable no-unused-expressions */
import { loadFixture } from '@nomicfoundation/hardhat-toolbox/network-helpers.js';
import { expect } from 'chai';
import pkg from 'hardhat';
import { POCO_PROXY_ADDRESS, POCO_REGISTRY_ADDRESS } from '../config/config.js';

const { ethers, upgrades } = pkg;

// TODO : Should be validated in ticket PRO-691
describe('ProtectedDataSharing', () => {
  async function deploySCFixture() {
    const [owner, addr1, addr2] = await ethers.getSigners();

    const ProtectedDataSharingFactory = await ethers.getContractFactory('ProtectedDataSharing');
    const protectedDataSharingContract = await upgrades.deployProxy(
      ProtectedDataSharingFactory,
      [POCO_PROXY_ADDRESS, POCO_REGISTRY_ADDRESS, owner.address],
      { kind: 'transparent' },
    );
    await protectedDataSharingContract.waitForDeployment();

    return { protectedDataSharingContract, owner, addr1, addr2 };
  }
  describe('AccessControl()', () => {
    it('AccessControl should be correctly set up', async () => {
      const { protectedDataSharingContract, owner } = await loadFixture(deploySCFixture);
      const DEFAULT_ADMIN_ROLE = ethers.toBeHex(0, 32);
      const hasRole = await protectedDataSharingContract.hasRole(DEFAULT_ADMIN_ROLE, owner.address);
      expect(hasRole).to.be.true;
    });
  });
});
