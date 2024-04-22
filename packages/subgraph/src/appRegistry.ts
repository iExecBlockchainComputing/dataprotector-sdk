import { App as AppContract } from '../generated/AppRegistry/App';
import { Transfer as TransferEvent } from '../generated/AppRegistry/AppRegistry';
import { App } from '../generated/schema';
import { checkAndCreateAccount, intToAddress } from './utils/utils';

export function handleTransferApp(event: TransferEvent): void {
  let contract = AppContract.bind(intToAddress(event.params.tokenId));
  // Create and save the account entity
  checkAndCreateAccount(contract.owner().toHex());

  // Create and save the protectedData entity
  let app = App.load(contract._address.toHex());
  if (app) {
    app.owner = contract.owner().toHex();
    app.save();
  }
}
