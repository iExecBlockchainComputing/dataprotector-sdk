import { readableSecondsToDays } from '@/utils/secondsToDays.ts';

export function getRemainingDays({ endDate }: { endDate: number }) {
  const now = Math.floor(new Date().getTime() / 1000);
  const remainingDays = readableSecondsToDays(endDate - now);
  if (typeof remainingDays !== 'number') {
    return remainingDays;
  }
  return Math.floor(remainingDays) > 1
    ? `${Math.floor(remainingDays)} remaining days`
    : `${Math.floor(remainingDays)} remaining day`;
}
