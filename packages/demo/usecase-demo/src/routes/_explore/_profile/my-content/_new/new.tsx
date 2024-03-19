import { createFileRoute } from '@tanstack/react-router';
import { CreateNewContent } from '@/modules/createNew/CreateNewContent.tsx';

export const Route = createFileRoute('/_explore/_profile/my-content/_new/new')({
  component: NewContent,
});

export function NewContent() {
  return (
    <>
      <div className="rounded-3xl border border-grey-800">Plop</div>

      <div className="mt-6">
        <CreateNewContent />
      </div>
    </>
  );
}
