import { ethers, type Provider } from 'ethers';
import { ABI as collectionABI } from '../../../contracts/collectionAbi.js';
import { ABI as sharingABI } from '../../../contracts/sharingAbi.js';
import { AddressOrENS } from '../../types.js';

// TODO: Maybe memoize that function
export async function getCollectionContract({
  provider,
  sharingContractAddress,
}: {
  provider: Provider;
  sharingContractAddress: AddressOrENS;
}) {
  const sharingContract = new ethers.Contract(
    sharingContractAddress,
    sharingABI,
    provider
  );
  const collectionContractAddress = await sharingContract.m_collection();
  const collectionContract = new ethers.Contract(
    collectionContractAddress,
    collectionABI,
    provider
  );
  return {
    collectionContractAddress,
    collectionContract,
  };
}
