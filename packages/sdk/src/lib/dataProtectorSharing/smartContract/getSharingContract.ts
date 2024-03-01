import { Contract, type Transaction } from 'ethers';
import type { IExec } from 'iexec';
import { ABI as sharingABI } from '../../../contracts/sharingAbi.js';
import type { Address, AddressOrENS } from '../../types/commonTypes.js';

type CollectionTokenId = number;
type AppAddress = Address;
type CollectionSize = number;
type MostRecentSubscriptionExpiration = number;
type CollectionSubscriptionPrice = number;
type CollectionSubscriptionDuration = number;
type SubscriptionParams =
  | [CollectionSubscriptionPrice, CollectionSubscriptionDuration]
  | undefined;

export type SharingContract = {
  protectedDataDetails: (
    protectedDataAddress: Address
  ) => Promise<[CollectionTokenId, AppAddress] | undefined>;

  collectionDetails: (
    collectionTokenId: number
  ) => Promise<
    | [CollectionSize, MostRecentSubscriptionExpiration, SubscriptionParams]
    | undefined
  >;

  ownerOf: (collectionTokenId: number) => Promise<Address>;

  subscribeTo: (
    collectionTokenId: number,
    { value }: { value: CollectionSubscriptionPrice }
  ) => Promise<Transaction>;

  removeCollection: (
    collectionTokenId: number
  ) => Promise<Transaction & { wait: () => Promise<void> }>;
};

export async function getSharingContract(
  iexec: IExec,
  sharingContractAddress: AddressOrENS
): Promise<SharingContract> {
  const { provider, signer } = await iexec.config.resolveContractsClient();
  const sharingContract = new Contract(
    sharingContractAddress,
    sharingABI,
    provider
  );
  return sharingContract.connect(signer) as unknown as SharingContract;
}
