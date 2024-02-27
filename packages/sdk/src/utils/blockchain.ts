import { Contract } from 'ethers';

export const getCurrentTimestamp = async (
  contract: Contract
): Promise<number> => {
  const provider = contract.runner.provider;
  const currentBlockNumber = await provider.getBlockNumber();
  const currentBlock = await provider.getBlock(currentBlockNumber);
  return currentBlock.timestamp;
};
