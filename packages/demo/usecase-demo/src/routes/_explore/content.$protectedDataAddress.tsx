import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/_explore/content/$protectedDataAddress')(
  {
    component: ProtectedDataPreview,
  }
);

export function ProtectedDataPreview() {
  const { protectedDataAddress } = Route.useParams();

  return (
    <div>
      <h1>Protected Data Preview</h1>
      <p>Protected Data Address: {protectedDataAddress}</p>
    </div>
  );
}
