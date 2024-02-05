import {
  NewSubscription as NewSubscriptionEvent,
  NewSubscriptionParams as NewSubscriptionParamsEvent,
  ProtectedDataAddedForSubscription as ProtectedDataAddedForSubscriptionEvent,
  ProtectedDataRemovedFromSubscription as ProtectedDataRemovedFromSubscriptionEvent,
  Transfer as TransferEvent,
  ProtectedDataAddedToCollection as ProtectedDataAddedToCollectionEvent,
  ProtectedDataRemovedFromCollection as ProtectedDataRemovedFromCollectionEvent,
  NewRental as NewRentalEvent,
  ProtectedDataAddedForRenting as ProtectedDataAddedForRentingEvent,
  ProtectedDataRemovedFromRenting as ProtectedDataRemovedFromRentingEvent,
} from '../generated/ProtectedDataSharing/ProtectedDataSharing';
import {
  SubscriptionParam,
  ProtectedData,
  CollectionSubscription,
  Collection,
  Rental,
  RentalParam,
  Account,
} from '../generated/schema';

//============================= Collection ==============================

export function handleTransfer(event: TransferEvent): void {
  // if the collection creator didn't have yet an account we create one for him
  let accountEntity = Account.load(event.params.to.toHex());
  if (!accountEntity) {
    accountEntity = new Account(event.params.to.toHex());
  }
  accountEntity.save();

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

export function handleProtectedDataAddedToCollection(
  event: ProtectedDataAddedToCollectionEvent
): void {
  const protectedData = ProtectedData.load(event.params.protectedData);
  if (protectedData) {
    protectedData.collection = event.params.collectionId.toHex();
    protectedData.save();
  }
}

export function handleProtectedDataRemovedFromCollection(
  event: ProtectedDataRemovedFromCollectionEvent
): void {
  const protectedData = ProtectedData.load(event.params.protectedData);
  if (protectedData) {
    protectedData.collection = null;
    protectedData.save();
  }
}

// ============================= Subscription ==============================

export function handleNewSubscription(event: NewSubscriptionEvent): void {
  // if the new subscriber didn't have yet an account we create one for him
  let accountEntity = Account.load(event.params.subscriber.toHex());
  if (!accountEntity) {
    accountEntity = new Account(event.params.subscriber.toHex());
  }
  accountEntity.save();

  const subscription = new CollectionSubscription(
    event.params._collectionId.toHex()
  );
  subscription.collection = event.params._collectionId.toHex();
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
    event.params._collectionId.toHex()
  );
  const collection = Collection.load(event.params._collectionId.toHex());
  if (!subscriptionParams) {
    subscriptionParams = new SubscriptionParam(
      event.params._collectionId.toHex()
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
  const protectedData = ProtectedData.load(event.params._protectedData);
  if (protectedData) {
    protectedData.isIncludedInSubscription = true;
    protectedData.save();
  }
}

export function handleProtectedDataRemovedFromSubscription(
  event: ProtectedDataRemovedFromSubscriptionEvent
): void {
  const protectedData = ProtectedData.load(event.params._protectedData);
  if (protectedData) {
    protectedData.isIncludedInSubscription = false;
    protectedData.save();
  }
}

// ============================= Renting ==============================

export function handleNewRental(event: NewRentalEvent): void {
  // if the new renter didn't have yet an account we create one for him
  let accountEntity = Account.load(event.params.renter.toHex());
  if (!accountEntity) {
    accountEntity = new Account(event.params.renter.toHex());
  }
  accountEntity.save();

  const rental = new Rental(
    event.transaction.hash.toHex() + event.logIndex.toString()
  );
  const protectedData = ProtectedData.load(event.params._protectedData);
  if (protectedData) {
    rental.protectedData = protectedData.id;
    const rentalParam = RentalParam.load(protectedData.id.toHex());
    if (rentalParam) {
      rental.rentalParams = rentalParam.id;
    }
  }
  const collection = Collection.load(event.params._collectionId.toHex());
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

export function handleProtectedDataAddedForRenting(
  event: ProtectedDataAddedForRentingEvent
): void {
  const protectedData = ProtectedData.load(event.params._protectedData);
  if (protectedData) {
    protectedData.isRentable = true;
    const rentalParam = new RentalParam(protectedData.id.toHex());
    rentalParam.duration = event.params._duration;
    rentalParam.price = event.params._price;
    rentalParam.save();
    protectedData.save();
  }
}

export function handleProtectedDataRemovedFromRenting(
  event: ProtectedDataRemovedFromRentingEvent
): void {
  const protectedData = ProtectedData.load(event.params._protectedData);
  if (protectedData) {
    protectedData.isRentable = false;
    protectedData.save();
  }
}
