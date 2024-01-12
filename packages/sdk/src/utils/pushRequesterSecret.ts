import { IExec } from 'iexec';
import { generateSecureUniqueId } from './generateUniqueId.js';

export const pushRequesterSecret = async (
  iexec: IExec,
  secrets: Record<number, string>
): Promise<Record<number, string>> => {
  const secretsId: Record<number, string> = {};

  for (const key in secrets) {
    if (secrets.hasOwnProperty(key)) {
      const secret = secrets[key];
      const requesterSecretId = await generateSecureUniqueId(16);
      await iexec.secrets.pushRequesterSecret(requesterSecretId, secret);
      secretsId[key] = requesterSecretId;
    }
  }
  return secretsId;
};
