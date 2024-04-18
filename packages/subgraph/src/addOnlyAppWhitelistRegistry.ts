import { Transfer as TransferEvent } from '../generated/AddOnlyAppWhitelistRegistry/AddOnlyAppWhitelistRegistry';
import { AddOnlyAppWhitelistTemplate } from '../generated/templates';
import { AddOnlyAppWhitelist } from '../generated/schema';
import { Address } from '@graphprotocol/graph-ts';
import { intToAddress } from './utils/utils';

export function handleNewAddOnlyAppWhitelist(event: TransferEvent): void {
  let appWhitelistAddress = intToAddress(event.params.tokenId).toHex();
  let appWhitelist = AddOnlyAppWhitelist.load(appWhitelistAddress);
  if (!appWhitelist) {
    appWhitelist = new AddOnlyAppWhitelist(appWhitelistAddress);
    appWhitelist.owner = event.params.to;
    appWhitelist.save();
  }
  AddOnlyAppWhitelistTemplate.create(Address.fromString(appWhitelistAddress));
}
