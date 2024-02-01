import { FileRoute } from '@tanstack/react-router';
import { Button } from '../../components/ui/button.tsx';

export const Route = new FileRoute('/_profile/settings').createRoute({
  // loader: fetchSubscriptionOptions,
  component: Settings,
});

function Settings() {
  return (
    <>
      <h2 className="mb-2 font-anybody font-bold">My Subscription</h2>

      <form className="mt-8">
        <div>
          <label htmlFor="subscription" className="mr-2">
            Price (in RLC):
          </label>
          <input type="text" placeholder="5" className="w-20" />
        </div>
        <div className="mt-4">
          <label htmlFor="subscription" className="mr-2">
            Duration:
          </label>
          <input type="text" placeholder="1 month" className="w-28" />
        </div>
        <Button type="submit" className="mt-4">
          Submit
        </Button>
      </form>
    </>
  );
}
