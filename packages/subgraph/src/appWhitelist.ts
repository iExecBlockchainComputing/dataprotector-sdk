import { NewAppAddedToAppWhitelist as NewAppAddedToAppWhitelistEvent } from '../generated/templates/AppWhitelistTemplate/AppWhitelist';
import { App } from '../generated/schema';

export function handleNewAppAdded(event: NewAppAddedToAppWhitelistEvent): void {
  let app = App.load(event.params.appAddress);
  if (!app) {
    app = new App(event.params.appAddress);
    app.appWhitelist = event.address.toHex();
    app.save();
  }
}
