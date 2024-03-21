import { JsonRpcProvider, toBeHex } from 'ethers';
import { Address } from 'iexec';

export async function anvilSetBalance(
  provider: JsonRpcProvider,
  address: Address,
  value: number
) {
  try {
    await provider.send('anvil_setBalance', [address, toBeHex(value)]);
  } catch (error) {
    console.error('Error anvil_setBalance :', error);
  }
}
