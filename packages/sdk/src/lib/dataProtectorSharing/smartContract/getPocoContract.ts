import type { IExecModule } from 'iexec';
import type { IPoCo } from '../../../../generated/typechain/sharing/interfaces/IPoCo.js';

export async function getPocoContract(
  iexec: IExecModule
): Promise<IPoCo> {
  const client = await iexec.config.resolveContractsClient();
  return client.getIExecContract() as unknown as IPoCo;
}
