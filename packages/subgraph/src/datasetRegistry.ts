import { Dataset as DatasetContract } from '../generated/DatasetRegistry/Dataset';
import { Transfer as TransferEvent } from '../generated/DatasetRegistry/DatasetRegistry';
import { ProtectedData } from '../generated/schema';
import { checkAndCreateAccount, intToAddress } from './utils/utils';

export function handleTransferDataset(event: TransferEvent): void {
  let contract = DatasetContract.bind(intToAddress(event.params.tokenId));

  // Create and save the protectedData entity
  let protectedData = ProtectedData.load(contract._address);
  if (protectedData) {
    // Create and save the account entity
    checkAndCreateAccount(contract.owner().toHex());

    protectedData.owner = contract.owner().toHex();
    protectedData.isIncludedInSubscription = false;
    protectedData.isRentable = false;
    protectedData.isForSale = false;

    protectedData.save();
  }
}
