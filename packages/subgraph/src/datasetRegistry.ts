import { Dataset as DatasetContract } from '../generated/DatasetRegistry/Dataset';
import { Transfer as TransferEvent } from '../generated/DatasetRegistry/DatasetRegistry';
import { Account, ProtectedData } from '../generated/schema';
import { intToAddress } from './utils';

export function handleTransferDataset(ev: TransferEvent): void {
  let contract = DatasetContract.bind(intToAddress(ev.params.tokenId));
  let id = contract._address;

  // Create and save the account entity
  let accountEntity = Account.load(contract.owner().toHex());
  if (!accountEntity) {
    accountEntity = new Account(contract.owner().toHex());
  }
  accountEntity.save();

  // Create and save the protectedData entity
  let protectedData = ProtectedData.load(id);
  if (protectedData) {
    protectedData.owner = contract.owner().toHex();
    protectedData.name = contract.m_datasetName();
    protectedData.isIncludedInSubscription = false;
    protectedData.isRentable = false;
    protectedData.isForSale = false;
    protectedData.multiaddr = contract.m_datasetMultiaddr();
    protectedData.checksum = contract.m_datasetChecksum();

    protectedData.save();
  }
}
