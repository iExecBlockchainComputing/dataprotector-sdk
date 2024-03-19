import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute(
  '/_explore/_profile/my-content/_new/$protectedDataAddress/monetization'
)({
  component: ChooseMonetization,
});

function ChooseMonetization() {
  return (
    <>
      <div className="rounded-3xl border border-grey-800">Plop</div>
      monetization
    </>
  );
}
