import { useState } from 'react';
import { Button } from '../../components/ui/button.tsx';
import { toast } from '../../components/ui/use-toast.ts';
import { getDataProtectorClient } from '../../externals/dataProtectorClient.ts';
import { useUser } from '../../hooks/useUser.ts';

export function SubscriptionOptionsForm({
  collectionId,
}: {
  collectionId: number;
}) {
  const { connector } = useUser();

  const [priceInNrlc, setPriceInNrlc] = useState<string>('');
  const [durationInDays, setDurationInDays] = useState<string>('');

  const onSubmitSubscriptionOptions = async (event) => {
    event.preventDefault();

    if (!durationInDays.trim() || !priceInNrlc.trim()) {
      return;
    }

    if (isNaN(Number(durationInDays)) || isNaN(Number(priceInNrlc))) {
      return;
    }

    const dataProtector = await getDataProtectorClient({
      connector: connector!,
    });
    await dataProtector.setSubscriptionOptions({
      collectionTokenId: collectionId,
      priceInNrlc: Number(priceInNrlc),
      durationInDays: Number(durationInDays),
    });

    toast({
      variant: 'success',
      title: 'Subscription updated',
    });
  };

  return (
    <>
      <form noValidate className="mt-8" onSubmit={onSubmitSubscriptionOptions}>
        <div>
          <label htmlFor="subscription" className="mr-2">
            Price (in nRLC):
          </label>
          <input
            type="text"
            value={priceInNrlc}
            placeholder="5"
            className="w-20 text-black"
            onInput={(event) => setPriceInNrlc(event.target.value)}
          />
        </div>
        <div className="mt-4">
          <label htmlFor="subscription" className="mr-2">
            Duration (in days):
          </label>
          <input
            type="text"
            value={durationInDays}
            placeholder="30"
            className="w-28 text-black"
            onInput={(event) => setDurationInDays(event.target.value)}
          />
        </div>
        <Button type="submit" className="mt-4">
          Submit
        </Button>
      </form>
    </>
  );
}
