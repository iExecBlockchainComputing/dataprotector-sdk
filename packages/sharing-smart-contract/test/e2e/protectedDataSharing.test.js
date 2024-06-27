/* eslint-disable no-unused-expressions */
import { loadFixture } from '@nomicfoundation/hardhat-toolbox/network-helpers.js';
import { expect } from 'chai';
import pkg from 'hardhat';
import { deploySCFixture } from './fixtures/globalFixture.js';

const { ethers } = pkg;

describe('ProtectedDataSharing', () => {
  describe('AccessControl', () => {
    it('should set the DEFAULT_ADMIN_ROLE to defaultAdmin', async () => {
      const { dataProtectorSharingContract, owner, addr1 } = await loadFixture(deploySCFixture);
      const DEFAULT_ADMIN_ROLE = ethers.toBeHex(0, 32);
      expect(await dataProtectorSharingContract.hasRole(DEFAULT_ADMIN_ROLE, owner.address)).to.be.true;
      expect(await dataProtectorSharingContract.hasRole(DEFAULT_ADMIN_ROLE, addr1.address)).to.be.false;
    });
  });
});
