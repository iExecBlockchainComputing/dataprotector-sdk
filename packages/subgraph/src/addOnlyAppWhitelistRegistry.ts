import { Transfer as TransferEvent } from '../generated/AddOnlyAppWhitelistRegistry/AddOnlyAppWhitelistRegistry';
import { AddOnlyAppWhitelistTemplate } from '../generated/templates';
import { AddOnlyAppWhitelist } from '../generated/schema';
import { Address } from '@graphprotocol/graph-ts';
import { intToAddress } from './utils/utils';
import { checkAndCreateAccount } from './utils';

export function handleNewAddOnlyAppWhitelist(event: TransferEvent): void {
  checkAndCreateAccount(event.params.to.toHex());

  let addOnlyAppWhitelistAddress = intToAddress(event.params.tokenId).toHex();
  let addOnlyAppWhitelist = AddOnlyAppWhitelist.load(
    addOnlyAppWhitelistAddress
  );
  if (!addOnlyAppWhitelist) {
    addOnlyAppWhitelist = new AddOnlyAppWhitelist(addOnlyAppWhitelistAddress);
    addOnlyAppWhitelist.owner = event.params.to.toHex();
    addOnlyAppWhitelist.save();
  }
  AddOnlyAppWhitelistTemplate.create(
    Address.fromString(addOnlyAppWhitelistAddress)
  );
}
