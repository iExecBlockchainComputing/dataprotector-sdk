
import {
    NewSubscription as NewSubscriptionEvent,
    NewSubscriptionParams as NewSubscriptionParamsEvent,
    AddProtectedDataForSubscription as AddProtectedDataForSubscriptionEvent,
  } from "../generated/CollectionSubscription/CollectionSubscription";
import { SubscriptionsParams, CollectionSubscription } from "../generated/schema";
  
  export function handleNewSubscription(event: NewSubscriptionEvent): void {
    const subscription = new CollectionSubscription(
        event.params._collectionId.toHex()
    );
    subscription.collection = event.params._collectionId.toHex();
    subscription.owner = event.params.subscriber.toHex();
    subscription.endDate = event.params.endDate;
    subscription.blockNumber = event.block.number;
    subscription.creationTimestamp = event.block.timestamp;
    subscription.transactionHash = event.transaction.hash;
    subscription.save();
  }

  export function handleNewSubscriptionParams(
    event: NewSubscriptionParamsEvent
  ): void {
    const subscriptionParams = new SubscriptionsParams(
        event.transaction.hash.concatI32(event.logIndex.toI32())
    );
    subscriptionParams.duration = event.params.subscriptionParams.duration;
    subscriptionParams.price = event.params.subscriptionParams.price;
  }

  export function handleAddProtectedDataForSubscription(
    event: AddProtectedDataForSubscriptionEvent
  ): void {
    const subscription = CollectionSubscription.load(
      event.params._collectionId.toHex()
    );
    if (subscription) {
      subscription.protectedData = event.params._protectedData;
      subscription.save();
    }
  }
  