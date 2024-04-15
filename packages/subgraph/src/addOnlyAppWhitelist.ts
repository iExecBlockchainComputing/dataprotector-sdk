import { NewAppAddedToAddOnlyAppWhitelist as NewAppAddedToAddOnlyAppWhitelistEvent } from '../generated/templates/AddOnlyAppWhitelistTemplate/AddOnlyAppWhitelist';
import { App } from '../generated/schema';

export function handleNewAppAdded(
  event: NewAppAddedToAddOnlyAppWhitelistEvent
): void {
  let app = App.load(event.params.appAddress.toHex());
  if (!app) {
    app = new App(event.params.appAddress.toHex());
    app.addOnlyAppWhitelist = event.address.toHex();
    app.save();
  }
}
