import {
  Transfer as TransferEvent,
  AddProtectedDataToCollection as AddProtectedDataToCollectionEvent,
  RemoveProtectedDataFromCollection as RemoveProtectedDataFromCollectionEvent,
} from "../generated/Collection/Collection";
import { Collection, ProtectedData } from "../generated/schema";

export function handleTransfer(event: TransferEvent): void {
  let collection = Collection.load(event.params.tokenId.toHex());
  if (!collection) {
    collection = new Collection(event.params.tokenId.toHex());
    collection.creationTimestamp = event.block.timestamp;
    collection.blockNumber = event.block.number;
    collection.transactionHash = event.transaction.hash;
  }
  collection.owner = event.params.to;
  collection.save();
}

export function handleAddProtectedDataToCollection(
  event: AddProtectedDataToCollectionEvent
): void {
  const protectedData = ProtectedData.load(event.params.protectedData);
  if (protectedData) {
    protectedData.collection = event.params.collectionId.toHex();
    protectedData.save();
  }
}

export function handleRemoveProtectedDataFromCollection(
  event: RemoveProtectedDataFromCollectionEvent
): void {
  const protectedData = ProtectedData.load(event.params.protectedData);
  if (protectedData) {
    protectedData.collection = null;
    protectedData.save();
  }
}
