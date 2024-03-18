import { MyCollection } from '@/modules/profile/MyCollection.tsx';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/_explore/_profile/settings')({
  component: Settings,
});

export function Settings() {
  return (
    <>
      <div className="flex">
        <div className="max-w-[430px] flex-1">
          <div className="text-3xl">Total earnings</div>
        </div>
        <div className="max-w-[430px] flex-1">
          <div className="text-3xl">Total to claim</div>
        </div>
      </div>

      <hr className="mt-10 border-grey-700" />

      <div className="mt-12">
        <MyCollection />
      </div>
    </>
  );
}
