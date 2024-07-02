import type { IExecModule } from 'iexec';
import type { IExecPocoDelegate } from '../../../../generated/typechain/sharing/interfaces/IExecPocoDelegate.js';

export async function getPocoContract(
  iexec: IExecModule
): Promise<IExecPocoDelegate> {
  const client = await iexec.config.resolveContractsClient();
  return client.getIExecContract() as unknown as IExecPocoDelegate;
}
