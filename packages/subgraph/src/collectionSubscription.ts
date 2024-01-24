import {
    NewSubscription as NewSubscriptionEvent,
    NewSubscriptionParams as NewSubscriptionParamsEvent,
    AddProtectedDataForSubscription as AddProtectedDataForSubscriptionEvent,
  } from "../generated/ProtectedDataSharing/ProtectedDataSharing";
import { SubscriptionParam, ProtectedData, CollectionSubscription, Collection } from "../generated/schema";
  
  export function handleNewSubscription(event: NewSubscriptionEvent): void {
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
    let subscriptionParams = SubscriptionParam.load(event.params._collectionId.toHex());
    const collection = Collection.load(event.params._collectionId.toHex());
    if (!subscriptionParams) {
      subscriptionParams = new SubscriptionParam(
        event.params._collectionId.toHex()
      );
    }
    subscriptionParams.duration = event.params.subscriptionParams.duration;
    subscriptionParams.price = event.params.subscriptionParams.price;
    
    if (collection){
      collection.subscriptionParams = subscriptionParams.id;
      collection.save();
    }
    subscriptionParams.save();
  }

  export function handleAddProtectedDataForSubscription(
    event: AddProtectedDataForSubscriptionEvent
  ): void {
    const protectedData = ProtectedData.load(event.params._protectedData);
    if (protectedData) {
      protectedData.isIncludedInSubscription = true;
      protectedData.save();
    }
  }
