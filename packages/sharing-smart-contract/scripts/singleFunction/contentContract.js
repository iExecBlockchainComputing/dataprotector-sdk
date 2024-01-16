const setAppAddress = async (contentCreator, appAddress) => {
  // set appAddress into the content Creator contract
  const tx = await contentCreator.setAppAddress(appAddress);
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

const createContent = async (
  contentCreator,
  datasetOwner,
  datasetName,
  datasetSchema,
  datasetMultiaddr,
  datasetChecksum,
) => {
  // call consume content into the content Creator contract
  const tx = await contentCreator.addContent(
    datasetOwner,
    datasetName,
    datasetSchema,
    datasetMultiaddr,
    datasetChecksum,
  );
  // Wait for the transaction receipt
  const transactionReceipt = await tx.wait();

  const protectedDataAddress = transactionReceipt.logs.find(
    ({ eventName }) => eventName === 'NewContent',
  )?.args[0];
  return { tx, protectedDataAddress };
};

export { consumeProtectedData, createContent, setAppAddress };
