export function getAvatarVisualNumber({ address }: { address: string }) {
  return `profile-avatar-bg-${Number(address) % 13}`;
}
