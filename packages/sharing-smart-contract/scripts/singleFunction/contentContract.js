const setAppAddress = async (protectedDataSharingContract, appAddress) => {
  // set appAddress into the content Creator contract
  const tx = await protectedDataSharingContract.setAppAddress(appAddress);
  await tx.wait();
};

const consumeProtectedData = async (
  protectedDataSharingContract,
  datasetAddress,
  workerpoolOrder,
  path,
) => {
  // call consume content into the content Creator contract
  const tx = await protectedDataSharingContract.consumeProtectedData(
    datasetAddress,
    workerpoolOrder,
    path,
    {
      gasLimit: 900_000,
    },
  );
  // Wait for the transaction receipt
  const transactionReceipt = await tx.wait();

  const dealId = transactionReceipt.logs.find(({ eventName }) => eventName === 'DealId')?.args[0];
  return { tx, dealId };
};

export { consumeProtectedData, setAppAddress };
