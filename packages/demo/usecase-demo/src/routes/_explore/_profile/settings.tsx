import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/_explore/_profile/settings')({
  component: Settings,
});

export function Settings() {
  return <div>My Settings</div>;
}
