import { NewAppAddedToAppWhitelist as NewAppAddedToAppWhitelistEvent } from '../generated/templates/AppWhitelistTemplate/AppWhitelist';
import { App } from '../generated/schema';

export function handleNewAppAdded(event: NewAppAddedToAppWhitelistEvent): void {
  let app = App.load(event.params.appAddress.toHex());
  if (!app) {
    app = new App(event.params.appAddress.toHex());
    app.appWhitelist = event.address.toHex();
    app.save();
  }
}
