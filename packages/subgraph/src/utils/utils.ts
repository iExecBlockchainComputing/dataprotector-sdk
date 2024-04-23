import { Address, BigInt } from '@graphprotocol/graph-ts';
import { Account } from '../../generated/schema';

export function intToAddress(value: BigInt): Address {
  return Address.fromString(
    value.toHex().substring(2).padStart(40, '0')
  ) as Address;
}

export function checkAndCreateAccount(owner: string): void {
  let accountEntity = Account.load(owner);
  if (!accountEntity) {
    accountEntity = new Account(owner);
  }
  accountEntity.save();
}
