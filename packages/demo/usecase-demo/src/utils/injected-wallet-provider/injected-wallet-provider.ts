import { EventEmitter } from 'eventemitter3';
import {
  EIP6963AnnounceProviderEvent,
  EIP6963ProviderDetail,
  EIP6963RequestProviderEvent,
} from './types';

// This class extends EventEmitter to be able to emit events and give our DApp an interface to subscribe to
export class InjectedWalletProvider extends EventEmitter {
  // This will hold the details of the providers received
  providerDetails: EIP6963ProviderDetail[];

  constructor() {
    super();
    this.providerDetails = [];
  }

  // This method processes the provider details announced and adds them to the providerDetails array
  private providerReceived(providerDetail: EIP6963ProviderDetail): void {
    this.providerDetails.push(providerDetail);
    this.emit('providerDetailsUpdated');
  }

  // This method listens for the 'announceProvider' event and processes the provider details announced
  subscribe(): void {
    window.addEventListener(
      'eip6963:announceProvider',
      (event: EIP6963AnnounceProviderEvent) => {
        this.providerReceived(event.detail);
      }
    );
  }

  // This method is used to request wallet providers by firing a 'EIP6963RequestProviderEvent'
  requestProviders(): void {
    this.providerDetails = [];
    window.dispatchEvent(new EIP6963RequestProviderEvent());
  }
}
