export async function setRentalParams({
  dataProtectorSharingContract,
  fromWallet,
  protectedDataAddress,
  rentingParams,
}) {
  const tx = await dataProtectorSharingContract
    .connect(fromWallet)
    .setProtectedDataToRenting(protectedDataAddress, rentingParams);
  tx.wait();
}

export async function setProtectedDataToRental({ dataProtectorSharingContract, fromWallet, protectedDataAddress }) {
  const tx = await dataProtectorSharingContract.connect(fromWallet).setProtectedDataToRenting(protectedDataAddress);
  tx.wait();
}
