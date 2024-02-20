import {
  NewSubscription as NewSubscriptionEvent,
  NewSubscriptionParams as NewSubscriptionParamsEvent,
  ProtectedDataAddedForSubscription as ProtectedDataAddedForSubscriptionEvent,
  ProtectedDataRemovedFromSubscription as ProtectedDataRemovedFromSubscriptionEvent,
  Transfer as TransferEvent,
  ProtectedDataAddedToCollection as ProtectedDataAddedToCollectionEvent,
  ProtectedDataRemovedFromCollection as ProtectedDataRemovedFromCollectionEvent,
  ProtectedDataConsumed as ProtectedDataConsumedEvent,
  NewRental as NewRentalEvent,
  ProtectedDataAddedForRenting as ProtectedDataAddedForRentingEvent,
  ProtectedDataRemovedFromRenting as ProtectedDataRemovedFromRentingEvent,
  ProtectedDataSold as ProtectedDataSoldEvent,
  ProtectedDataAddedForSale as ProtectedDataAddedForSaleEvent,
  ProtectedDataRemovedFromSale as ProtectedDataRemovedFromSaleEvent,
  Whithdraw as WithdrawalEvent,
  Whithdraw,
} from '../generated/ProtectedDataSharing/ProtectedDataSharing';
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
  Account,
  Withdrawal,
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
    protectedData.collection = event.params.collectionTokenId.toHex();
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

export function handleProtectedDataConsumed(
  event: ProtectedDataConsumedEvent
): void {
  const protectedData = ProtectedData.load(event.params.protectedData);
  const consumption = new Consumption(
    event.transaction.hash.toHex() + event.logIndex.toString()
  );
  consumption.blockNumber = event.block.number;
  consumption.transactionHash = event.transaction.hash;
  consumption.dealId = event.params.dealId;
  consumption.mode = event.params.mode == 0 ? 'SUBSCRIPTION' : 'RENTING';
  if (protectedData) {
    consumption.protectedData = protectedData.id;
    const collection = Collection.load(protectedData.collection!);
    if (collection) {
      consumption.collection = collection.id;
    }
  }
  consumption.save();
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
  // if the new renter didn't have yet an account we create one for him
  let accountEntity = Account.load(event.params.renter.toHex());
  if (!accountEntity) {
    accountEntity = new Account(event.params.renter.toHex());
  }
  accountEntity.save();

  const rental = new Rental(
    event.transaction.hash.toHex() + event.logIndex.toString()
  );
  const protectedData = ProtectedData.load(event.params.protectedData);
  if (protectedData) {
    rental.protectedData = protectedData.id;
    const rentalParam = RentalParam.load(protectedData.id.toHex());
    if (rentalParam) {
      rental.rentalParams = rentalParam.id;
    }
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

export function handleProtectedDataAddedForRenting(
  event: ProtectedDataAddedForRentingEvent
): void {
  const protectedData = ProtectedData.load(event.params.protectedData);
  if (protectedData) {
    protectedData.isRentable = true;
    const rentalParam = new RentalParam(protectedData.id.toHex());
    rentalParam.duration = event.params.duration;
    rentalParam.price = event.params.price;
    rentalParam.save();
    protectedData.save();
  }
}

export function handleProtectedDataRemovedFromRenting(
  event: ProtectedDataRemovedFromRentingEvent
): void {
  const protectedData = ProtectedData.load(event.params.protectedData);
  if (protectedData) {
    protectedData.isRentable = false;
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
    protectedData.save();
  }
}

export function handleProtectedDataRemovedFromSale(
  event: ProtectedDataRemovedFromSaleEvent
): void {
  const protectedData = ProtectedData.load(event.params.protectedData);
  if (protectedData) {
    protectedData.isForSale = false;
    protectedData.save();
  }
}

export function handleProtectedDataSold(event: ProtectedDataSoldEvent): void {
  // if the new buyer doesn't have an account yet, we create one
  let accountEntity = Account.load(event.params.to.toHex());
  if (!accountEntity) {
    accountEntity = new Account(event.params.to.toHex());
  }
  accountEntity.save();

  const sale = new Sale(
    event.transaction.hash.toHex() + event.logIndex.toString()
  );

  const protectedData = ProtectedData.load(event.params.protectedData);
  if (protectedData) {
    sale.protectedData = protectedData.id;
    protectedData.isForSale = false;
    protectedData.save();
    const saleParam = SaleParam.load(protectedData.id.toHex());
    if (saleParam) {
      sale.saleParams = saleParam.id;
    }
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

export function handleWithdrawal(event: WithdrawalEvent): void {
  let accountEntity = Account.load(event.params.user.toHex());
  if (!accountEntity) {
    accountEntity = new Account(event.params.user.toHex());
  }
  accountEntity.save();

  const withdrawal = new Withdrawal(
    event.transaction.hash.toHex() + event.logIndex.toString()
  );
  withdrawal.account = accountEntity.id;
  withdrawal.amount = event.params.amount;
  withdrawal.save();
}
