import { loadFixture } from '@nomicfoundation/hardhat-toolbox/network-helpers.js';
import { setRentalParams } from '../utils/rental.utils.js';
import { setProtectedDataToSubscription, setSubscriptionParams } from '../utils/subscription.utils.js';
import { addProtectedDataToCollection } from './globalFixture.js';

export async function createCollectionWithProtectedDataRentableAndSubscribableForFree() {
  const {
    dataProtectorSharingContract,
    pocoContract,
    collectionTokenId,
    protectedDataAddress,
    appAddress,
    workerpoolOrder,
    addr1,
    addr2,
  } = await loadFixture(addProtectedDataToCollection);

  const subscriptionParams = {
    price: 0, // in nRLC
    duration: 2_592_000, // 30 days
  };
  await setSubscriptionParams({
    dataProtectorSharingContract,
    fromWallet: addr1,
    collectionTokenId,
    subscriptionParams,
  });
  await setProtectedDataToSubscription({
    dataProtectorSharingContract,
    fromWallet: addr1,
    protectedDataAddress,
  });

  const rentingParams = {
    price: 0, // in nRLC
    duration: 172_800, // 2 days
  };
  await setRentalParams({
    dataProtectorSharingContract,
    fromWallet: addr1,
    protectedDataAddress,
    rentingParams,
  });

  return {
    dataProtectorSharingContract,
    pocoContract,
    protectedDataAddress,
    appAddress,
    workerpoolOrder,
    collectionTokenId,
    subscriptionParams,
    rentingParams,
    addr1,
    addr2,
  };
}
