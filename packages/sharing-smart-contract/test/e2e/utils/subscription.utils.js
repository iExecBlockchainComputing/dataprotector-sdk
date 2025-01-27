export async function setSubscriptionParams({
  dataProtectorSharingContract,
  fromWallet,
  collectionTokenId,
  subscriptionParams,
}) {
  const tx = await dataProtectorSharingContract
    .connect(fromWallet)
    .setSubscriptionParams(collectionTokenId, subscriptionParams);
  tx.wait();
}

export async function setProtectedDataToSubscription({
  dataProtectorSharingContract,
  fromWallet,
  protectedDataAddress,
}) {
  const tx = await dataProtectorSharingContract
    .connect(fromWallet)
    .setProtectedDataToSubscription(protectedDataAddress);
  tx.wait();
}
