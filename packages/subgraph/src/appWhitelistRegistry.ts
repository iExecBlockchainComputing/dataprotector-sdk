import { Transfer as TransferEvent } from '../generated/AppWhitelistRegistry/AppWhitelistRegistry';
import { AppWhitelistTemplate } from '../generated/templates';
import { AppWhitelist } from '../generated/schema';
import { Address } from '@graphprotocol/graph-ts';
import { intToAddress } from './utils/utils';

export function handleNewAppWhitelist(event: TransferEvent): void {
  let appWhitelistAddress = intToAddress(event.params.tokenId).toHex();
  let appWhitelist = AppWhitelist.load(appWhitelistAddress);
  if (!appWhitelist) {
    appWhitelist = new AppWhitelist(appWhitelistAddress);
    appWhitelist.owner = event.params.to;
    appWhitelist.save();
  }
  AppWhitelistTemplate.create(Address.fromString(appWhitelistAddress));
}
