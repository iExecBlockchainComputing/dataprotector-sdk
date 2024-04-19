import { Dataset as DatasetContract } from '../generated/DatasetRegistry/Dataset';
import { Transfer as TransferEvent } from '../generated/DatasetRegistry/DatasetRegistry';
import { Account, ProtectedData } from '../generated/schema';
import { checkAndCreateAccount, intToAddress } from './utils';

export function handleTransferDataset(ev: TransferEvent): void {
  let contract = DatasetContract.bind(intToAddress(ev.params.tokenId));

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
