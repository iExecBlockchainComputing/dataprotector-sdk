import { loadFixture } from '@nomicfoundation/hardhat-toolbox/network-helpers.js';
import { expect } from 'chai';
import hardhat from 'hardhat';
import { beforeEach } from 'mocha';
import { createCollection, deploySCFixture } from './utils/loadFixture.test.js';
const { ethers, upgrades } = hardhat;

// TODO convert to ts.
// TODO use typechain for factories.

let dataProtectorSharingContract;
let contractAddress;
let owner, addr1;

describe('DataProtectorSharing', function () {
    beforeEach('Deploy fixture', async function () {
        ({ dataProtectorSharingContract, owner, addr1 } = await loadFixture(deploySCFixture));
        contractAddress = await dataProtectorSharingContract.getAddress();
        await dataProtectorSharingContract.createCollection(owner).then((tx) => tx.wait());
    });

    describe('Upgrade', function () {
        it('Should upgrade', async function () {
            // Update the state of the original proxy.
            const { collectionTokenId } = await createCollection();
            // Upgrade the proxy.
            const newImplementationFactory = await ethers.getContractFactory(
                'DataProtectorSharingV2Mock',
                owner,
            );
            await upgrades
                .upgradeProxy(contractAddress, newImplementationFactory)
                .then((contract) => contract.waitForDeployment());
            const dataProtectorSharingContractV2 = await ethers.getContractAt(
                'DataProtectorSharingV2Mock',
                contractAddress,
            );
            await dataProtectorSharingContractV2.initializeV2('bar');
            // Check V1 storage.
            expect(await dataProtectorSharingContractV2.ownerOf(collectionTokenId)).to.equal(
                addr1.address,
            );
            // Check V2 storage.
            expect(await dataProtectorSharingContractV2.newStorage()).to.equal('bar');
            // Check address.
            expect(await dataProtectorSharingContractV2.getAddress()).to.equal(contractAddress);
        });

        it('TODO - Should not upgrade when storage is broken', async function () {});
    });
});
