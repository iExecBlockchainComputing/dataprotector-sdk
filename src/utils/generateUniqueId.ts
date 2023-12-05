import { hexlify } from '@ethersproject/bytes';
import { randomBytes } from '@ethersproject/random';

export function generateSecureUniqueId(length: number): string {
  return hexlify(randomBytes(length));
}
