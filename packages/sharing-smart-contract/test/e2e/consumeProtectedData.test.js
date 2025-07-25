import { loadFixture, time } from '@nomicfoundation/hardhat-toolbox/network-helpers.js';
import { assert, expect } from 'chai';
import pkg from 'hardhat';
import { createCollectionWithProtectedDataRatableAndSubscribable } from './utils/loadFixture.test.js';

const { ethers } = pkg;

describe('ConsumeProtectedData', () => {
    describe('consumeProtectedData()', () => {
        it('should create a deal on chain if an end user subscribe to the collection', async () => {
            const {
                dataProtectorSharingContract,
                pocoContract,
                protectedDataAddress,
                appAddress,
                workerpoolOrder,
                collectionTokenId,
                subscriptionParams,
                addr2,
            } = await loadFixture(createCollectionWithProtectedDataRatableAndSubscribable);

            await pocoContract
                .connect(addr2)
                .approve(await dataProtectorSharingContract.getAddress(), subscriptionParams.price);
            await pocoContract.connect(addr2).deposit({
                value: ethers.parseUnits(subscriptionParams.price.toString(), 'gwei'),
            }); // value sent should be in wei
            await dataProtectorSharingContract
                .connect(addr2)
                .subscribeToCollection(collectionTokenId, subscriptionParams);

            const tx = await dataProtectorSharingContract
                .connect(addr2)
                .consumeProtectedData(protectedDataAddress, workerpoolOrder, appAddress);
            await tx.wait();

            expect(tx)
                .to.emit(dataProtectorSharingContract, 'ProtectedDataConsumed')
                .withArgs((_dealId, _protectedDataAddress, _mode) => {
                    assert.equal(
                        _dealId.constructor,
                        ethers.Bytes32,
                        'DealId should be of type bytes32',
                    );
                    assert.equal(
                        _protectedDataAddress,
                        protectedDataAddress,
                        'DealId should be of type bytes32',
                    );
                    assert.equal(_mode, 0, 'Mode should be SUBSCRIPTION (0)');
                });
        });

        it('should create a deal on chain if an end user rent a protectedData inside a collection', async () => {
            const {
                dataProtectorSharingContract,
                pocoContract,
                protectedDataAddress,
                appAddress,
                workerpoolOrder,
                rentingParams,
                addr2,
            } = await loadFixture(createCollectionWithProtectedDataRatableAndSubscribable);

            await pocoContract
                .connect(addr2)
                .approve(await dataProtectorSharingContract.getAddress(), rentingParams.price);
            await pocoContract.connect(addr2).deposit({
                value: ethers.parseUnits(rentingParams.price.toString(), 'gwei'),
            }); // value sent should be in wei
            await dataProtectorSharingContract
                .connect(addr2)
                .rentProtectedData(protectedDataAddress, rentingParams);

            const tx = await dataProtectorSharingContract
                .connect(addr2)
                .consumeProtectedData(protectedDataAddress, workerpoolOrder, appAddress);
            await tx.wait();
            expect(tx)
                .to.emit(dataProtectorSharingContract, 'ProtectedDataConsumed')
                .withArgs((_dealId, _protectedDataAddress, _mode) => {
                    assert.equal(
                        _dealId.constructor,
                        ethers.Bytes32,
                        'DealId should be of type bytes32',
                    );
                    assert.equal(
                        _protectedDataAddress,
                        protectedDataAddress,
                        'DealId should be of type bytes32',
                    );
                    assert.equal(_mode, 1, 'Mode should be RENTING (1)');
                });
        });

        it('should revert if the user does not have an ongoing subscription or rental', async () => {
            const {
                dataProtectorSharingContract,
                protectedDataAddress,
                appAddress,
                workerpoolOrder,
                addr2,
            } = await loadFixture(createCollectionWithProtectedDataRatableAndSubscribable);

            await expect(
                dataProtectorSharingContract
                    .connect(addr2)
                    .consumeProtectedData(protectedDataAddress, workerpoolOrder, appAddress),
            ).to.be.revertedWithCustomError(
                dataProtectorSharingContract,
                'NoValidRentalOrSubscription',
            );
        });

        it('should revert if the user subscription is expired', async () => {
            const {
                dataProtectorSharingContract,
                pocoContract,
                protectedDataAddress,
                appAddress,
                workerpoolOrder,
                collectionTokenId,
                subscriptionParams,
                addr2,
            } = await loadFixture(createCollectionWithProtectedDataRatableAndSubscribable);

            await pocoContract
                .connect(addr2)
                .approve(await dataProtectorSharingContract.getAddress(), subscriptionParams.price);
            await pocoContract.connect(addr2).deposit({
                value: ethers.parseUnits(subscriptionParams.price.toString(), 'gwei'),
            }); // value sent should be in wei
            await dataProtectorSharingContract
                .connect(addr2)
                .subscribeToCollection(collectionTokenId, subscriptionParams);
            // advance time to reach end of subscription and mine a new block
            await time.increase(subscriptionParams.duration + 1);

            await expect(
                dataProtectorSharingContract
                    .connect(addr2)
                    .consumeProtectedData(protectedDataAddress, workerpoolOrder, appAddress),
            ).to.be.revertedWithCustomError(
                dataProtectorSharingContract,
                'NoValidRentalOrSubscription',
            );
        });

        it('should revert if the user rental is expired', async () => {
            const {
                dataProtectorSharingContract,
                pocoContract,
                protectedDataAddress,
                appAddress,
                workerpoolOrder,
                rentingParams,
                addr2,
            } = await loadFixture(createCollectionWithProtectedDataRatableAndSubscribable);

            await pocoContract
                .connect(addr2)
                .approve(await dataProtectorSharingContract.getAddress(), rentingParams.price);
            await pocoContract.connect(addr2).deposit({
                value: ethers.parseUnits(rentingParams.price.toString(), 'gwei'),
            }); // value sent should be in wei
            await dataProtectorSharingContract
                .connect(addr2)
                .rentProtectedData(protectedDataAddress, rentingParams);
            // advance time to reach end of renting and mine a new block
            await time.increase(rentingParams.duration + 1);

            await expect(
                dataProtectorSharingContract
                    .connect(addr2)
                    .consumeProtectedData(protectedDataAddress, workerpoolOrder, appAddress),
            ).to.be.revertedWithCustomError(
                dataProtectorSharingContract,
                'NoValidRentalOrSubscription',
            );
        });
    });
});
