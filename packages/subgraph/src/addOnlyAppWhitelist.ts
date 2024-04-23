import { NewAppAddedToAddOnlyAppWhitelist as NewAppAddedToAddOnlyAppWhitelistEvent } from '../generated/templates/AddOnlyAppWhitelistTemplate/AddOnlyAppWhitelist';
import { App } from '../generated/schema';
import { App as AppContract } from '../generated/AppRegistry/App';
import { checkAndCreateAccount } from './utils/utils';

export function handleNewAppAdded(
  event: NewAppAddedToAddOnlyAppWhitelistEvent
): void {
  let contract = AppContract.bind(event.params.appAddress);
  checkAndCreateAccount(contract.owner().toHex());

  let app = App.load(event.params.appAddress.toHex());
  let addOnlyAppWhitelists: Array<string>;
  if (!app) {
    app = new App(event.params.appAddress.toHex());
    app.owner = contract.owner().toHex();
    addOnlyAppWhitelists = new Array<string>();
  } else {
    addOnlyAppWhitelists = app.addOnlyAppWhitelists;
  }
  addOnlyAppWhitelists.push(event.address.toHex());
  app.addOnlyAppWhitelists = addOnlyAppWhitelists;
  app.save();
}
