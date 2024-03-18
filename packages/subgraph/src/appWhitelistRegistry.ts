import { Transfer as TransferEvent } from '../generated/AppWhitelistRegistry/AppWhitelistRegistry';
import { AppWhitelistTemplate } from '../generated/templates';
import { AppWhitelist } from '../generated/schema';
import { Address } from '@graphprotocol/graph-ts';

export function handleNewAppContract(event: TransferEvent): void {
  let appWhitelistAddress = event.params.tokenId.toHex();
  let appWhitelist = AppWhitelist.load(appWhitelistAddress);
  if (!appWhitelist) {
    appWhitelist = new AppWhitelist(appWhitelistAddress);
    // appWhitelist.owner = event.params.to;
    appWhitelist.save();
  }
  // AppWhitelistTemplate.create(Address.fromString(appWhitelistAddress));
}
