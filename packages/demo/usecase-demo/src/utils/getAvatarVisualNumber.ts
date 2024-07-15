export function getAvatarVisualNumber({
  address,
}: {
  address: string | undefined;
}) {
  if (!address) {
    return 'profile-avatar-bg-1';
  }
  const slicedAddress = address.slice(2);
  const digitGroups = [...slicedAddress.matchAll(/\d+/g)];
  const sum = digitGroups.reduce((accu, current) => {
    return accu + Number(current);
  }, 0);
  const chosenImageIndex = sum % 14;
  if (chosenImageIndex === 0) {
    return 'profile-avatar-bg-1';
  }
  return `profile-avatar-bg-${chosenImageIndex}`;
}
