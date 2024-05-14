import { BigInt } from '@graphprotocol/graph-ts';
import {
  NewSubscription as NewSubscriptionEvent,
  NewSubscriptionParams as NewSubscriptionParamsEvent,
  ProtectedDataAddedForSubscription as ProtectedDataAddedForSubscriptionEvent,
  ProtectedDataRemovedFromSubscription as ProtectedDataRemovedFromSubscriptionEvent,
  Transfer as TransferEvent,
  ProtectedDataConsumed as ProtectedDataConsumedEvent,
  NewRental as NewRentalEvent,
  ProtectedDataAddedForRenting as ProtectedDataAddedForRentingEvent,
  ProtectedDataRemovedFromRenting as ProtectedDataRemovedFromRentingEvent,
  ProtectedDataSold as ProtectedDataSoldEvent,
  ProtectedDataAddedForSale as ProtectedDataAddedForSaleEvent,
  ProtectedDataRemovedFromSale as ProtectedDataRemovedFromSaleEvent,
  ProtectedDataTransfer as ProtectedDataTransferEvent,
} from '../generated/DataProtectorSharing/DataProtectorSharing';
import {
  SubscriptionParam,
  ProtectedData,
  CollectionSubscription,
  Consumption,
  Collection,
  Rental,
  RentalParam,
  Sale,
  SaleParam,
} from '../generated/schema';
import { checkAndCreateAccount } from './utils/utils';

//============================= Collection ==============================

export function handleTransfer(event: TransferEvent): void {
  // if the collection creator didn't have yet an account we create one for him
  checkAndCreateAccount(event.params.to.toHex());

  let collection = Collection.load(event.params.tokenId.toHex());
  if (!collection) {
    collection = new Collection(event.params.tokenId.toHex());
    collection.creationTimestamp = event.block.timestamp;
    collection.blockNumber = event.block.number;
    collection.transactionHash = event.transaction.hash;
  }
  collection.owner = event.params.to.toHex();
  collection.save();
}

export function handleProtectedDataTransfer(
  event: ProtectedDataTransferEvent
): void {
  const protectedData = ProtectedData.load(event.params.protectedData);
  if (protectedData) {
    if (event.params.newCollection.equals(BigInt.zero())) {
      protectedData.collection = null;
    } else {
      protectedData.collection = event.params.newCollection.toHex();
    }
    protectedData.save();
  }
}

export function handleProtectedDataConsumed(
  event: ProtectedDataConsumedEvent
): void {
  const protectedData = ProtectedData.load(event.params.protectedData);
  if (protectedData) {
    // Only deal with protectedData are indexed
    const consumption = new Consumption(
      event.transaction.hash.toHex() + event.logIndex.toString()
    );
    consumption.blockNumber = event.block.number;
    consumption.transactionHash = event.transaction.hash;
    consumption.dealId = event.params.dealId;
    consumption.mode = event.params.mode == 0 ? 'SUBSCRIPTION' : 'RENTING';
    consumption.protectedData = protectedData.id;
    const collection = Collection.load(protectedData.collection!);

    if (collection) {
      consumption.collection = collection.id;
    }
    consumption.save();
  }
}

// ============================= Subscription ==============================

export function handleNewSubscription(event: NewSubscriptionEvent): void {
  // if the new subscriber didn't have yet an account we create one for him
  checkAndCreateAccount(event.params.subscriber.toHex());

  const subscription = new CollectionSubscription(
    event.transaction.hash.toHex() + event.logIndex.toString()
  );
  subscription.collection = event.params.collectionTokenId.toHex();
  subscription.subscriber = event.params.subscriber.toHex();
  subscription.endDate = event.params.endDate;
  subscription.blockNumber = event.block.number;
  subscription.creationTimestamp = event.block.timestamp;
  subscription.transactionHash = event.transaction.hash;
  subscription.save();
}

export function handleNewSubscriptionParams(
  event: NewSubscriptionParamsEvent
): void {
  let subscriptionParams = SubscriptionParam.load(
    event.params.collectionTokenId.toHex()
  );
  const collection = Collection.load(event.params.collectionTokenId.toHex());
  if (!subscriptionParams) {
    subscriptionParams = new SubscriptionParam(
      event.params.collectionTokenId.toHex()
    );
  }
  subscriptionParams.duration = event.params.subscriptionParams.duration;
  subscriptionParams.price = event.params.subscriptionParams.price;

  if (collection) {
    collection.subscriptionParams = subscriptionParams.id;
    collection.save();
  }
  subscriptionParams.save();
}

export function handleProtectedDataAddedForSubscription(
  event: ProtectedDataAddedForSubscriptionEvent
): void {
  const protectedData = ProtectedData.load(event.params.protectedData);
  if (protectedData) {
    protectedData.isIncludedInSubscription = true;
    protectedData.save();
  }
}

export function handleProtectedDataRemovedFromSubscription(
  event: ProtectedDataRemovedFromSubscriptionEvent
): void {
  const protectedData = ProtectedData.load(event.params.protectedData);
  if (protectedData) {
    protectedData.isIncludedInSubscription = false;
    protectedData.save();
  }
}

// ============================= Renting ==============================

export function handleNewRental(event: NewRentalEvent): void {
  const protectedData = ProtectedData.load(event.params.protectedData);
  if (protectedData) {
    // if the new renter didn't have yet an account we create one for him
    checkAndCreateAccount(event.params.renter.toHex());

    const rental = new Rental(
      event.transaction.hash.toHex() + event.logIndex.toString()
    );

    rental.protectedData = protectedData.id;
    const rentalParam = RentalParam.load(protectedData.id.toHex());
    if (rentalParam) {
      rental.rentalParams = rentalParam.id;
    }
    const collection = Collection.load(event.params.collectionTokenId.toHex());
    if (collection) {
      rental.collection = collection.id;
    }
    rental.creationTimestamp = event.block.timestamp;
    rental.endDate = event.params.endDate;
    rental.renter = event.params.renter;
    rental.blockNumber = event.block.number;
    rental.transactionHash = event.transaction.hash;
    rental.save();
  }
}

export function handleProtectedDataAddedForRenting(
  event: ProtectedDataAddedForRentingEvent
): void {
  const protectedData = ProtectedData.load(event.params.protectedData);
  if (protectedData) {
    protectedData.isRentable = true;
    const rentalParam = new RentalParam(protectedData.id.toHex());
    rentalParam.duration = event.params.rentingParams.duration;
    rentalParam.price = event.params.rentingParams.price;
    rentalParam.save();
    protectedData.rentalParams = rentalParam.id;
    protectedData.save();
  }
}

export function handleProtectedDataRemovedFromRenting(
  event: ProtectedDataRemovedFromRentingEvent
): void {
  const protectedData = ProtectedData.load(event.params.protectedData);
  if (protectedData) {
    protectedData.isRentable = false;
    protectedData.rentalParams = null;
    protectedData.save();
  }
}

// ============================= Sale ==============================

export function handleProtectedDataAddedForSale(
  event: ProtectedDataAddedForSaleEvent
): void {
  const protectedData = ProtectedData.load(event.params.protectedData);
  if (protectedData) {
    protectedData.isForSale = true;
    const saleParam = new SaleParam(protectedData.id.toHex());
    saleParam.price = event.params.price;
    saleParam.save();
    protectedData.saleParams = saleParam.id;
    protectedData.save();
  }
}

export function handleProtectedDataRemovedFromSale(
  event: ProtectedDataRemovedFromSaleEvent
): void {
  const protectedData = ProtectedData.load(event.params.protectedData);
  if (protectedData) {
    protectedData.isForSale = false;
    protectedData.saleParams = null;
    protectedData.save();
  }
}

export function handleProtectedDataSold(event: ProtectedDataSoldEvent): void {
  const protectedData = ProtectedData.load(event.params.protectedData);
  if (protectedData) {
    // if the new buyer doesn't have an account yet, we create one
    checkAndCreateAccount(event.params.to.toHex());
    protectedData.isForSale = false;
    protectedData.save();

    const sale = new Sale(
      event.transaction.hash.toHex() + event.logIndex.toString()
    );
    sale.protectedData = protectedData.id;
    const saleParam = SaleParam.load(protectedData.id.toHex());
    if (saleParam) {
      sale.saleParams = saleParam.id;
    }
    const collection = Collection.load(
      event.params.collectionTokenIdFrom.toHex()
    );
    if (collection) {
      sale.collection = collection.id;
    }
    sale.creationTimestamp = event.block.timestamp;
    sale.buyer = event.params.to;
    sale.blockNumber = event.block.number;
    sale.transactionHash = event.transaction.hash;
    sale.save();
  }
}
