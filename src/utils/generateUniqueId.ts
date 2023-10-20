import { randomBytes } from '@ethersproject/random';
import { hexlify } from '@ethersproject/bytes';

export function generateSecureUniqueId(length: number): string {
  return hexlify(randomBytes(length));
}
