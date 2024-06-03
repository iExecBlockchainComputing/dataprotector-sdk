export function getAvatarVisualNumber({
  address,
}: {
  address: string | undefined;
}) {
  if (!address) {
    return 'profile-avatar-bg-1';
  }
  const slicedAddress = address.slice(2);
  // Get all groups of digits
  const groups = slicedAddress.match(/\d+/g);
  if (!groups) {
    return 'profile-avatar-bg-1';
  }
  // Sum each group
  const sum = groups.reduce((acc, group) => acc + parseInt(group, 10), 0);
  const chosenImageIndex = sum % 13;
  if (chosenImageIndex < 1 || chosenImageIndex > 13) {
    return 'profile-avatar-bg-1';
  }
  return `profile-avatar-bg-${chosenImageIndex}`;
}
