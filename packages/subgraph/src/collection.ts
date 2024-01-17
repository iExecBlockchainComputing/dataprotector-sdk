import { Bytes } from "@graphprotocol/graph-ts";
import {
    Transfer as TransferEvent,
    AddProtectedDataToCollection as AddProtectedDataToCollectionEvent,
    RemoveProtectedDataFromCollection as RemoveProtectedDataFromCollectionEvent
  } from "../generated/Collection/Collection"
import { Collection } from "../generated/schema";
import { intToAddress } from "./utils"

export function handleTransfer(event: TransferEvent): void {
  let collection = Collection.load(intToAddress(event.params.tokenId))
  if (!collection) {
     collection = new Collection(intToAddress(event.params.tokenId))
     collection.creationTimestamp = event.block.timestamp
     collection.blockNumber = event.block.number
     collection.transactionHash = event.transaction.hash
     collection.protectedDatas = new Array<Bytes>()
  }
  collection.owner = event.params.to
  collection.save()
}

export function handleAddProtectedDataToCollection(event: AddProtectedDataToCollectionEvent): void {
  const collection = Collection.load(intToAddress(event.params.collectionId))
  if (collection) {
    const protectedData = event.params.protectedData.toHex()
    collection.protectedDatas!.push(Bytes.fromHexString(protectedData))
    collection.save()
  }
}

export function handleRemoveProtectedDataFromCollection(event: RemoveProtectedDataFromCollectionEvent): void {
  const collection = Collection.load(intToAddress(event.params.collectionId));
  if (collection) {
    const index = collection.protectedDatas!.indexOf(Bytes.fromHexString(event.params.protectedData.toHex()));
    if (index !== -1) {
      collection.protectedDatas!.splice(index, 1);
    }
    collection.save()
  }
}
