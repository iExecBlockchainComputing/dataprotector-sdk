import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import type { OneCollectionByOwnerResponse } from '@iexec/dataprotector';
import { Loader } from 'react-feather';
import { Button } from '../../components/ui/button.tsx';
import { toast } from '../../components/ui/use-toast.ts';
import { getDataProtectorClient } from '../../externals/dataProtectorClient.ts';
import { secondsToDays } from '../../utils/secondsToDays.ts';

export function SubscriptionParamsForm({
  collection,
}: {
  collection: OneCollectionByOwnerResponse;
}) {
  const queryClient = useQueryClient();

  const [priceInNrlc, setPriceInNrlc] = useState<string>(
    collection.subscriptionParams
      ? String(collection.subscriptionParams.price)
      : ''
  );
  const [durationInDays, setDurationInDays] = useState<string>(
    collection.subscriptionParams
      ? String(secondsToDays(collection.subscriptionParams.duration))
      : ''
  );

  const changeSubscriptionParamsMutation = useMutation({
    mutationFn: async () => {
      const dataProtector = await getDataProtectorClient();
      await dataProtector.setSubscriptionParams({
        collectionId: Number(collection.id),
        priceInNRLC: BigInt(priceInNrlc),
        durationInSeconds: Number(durationInDays) * 60 * 60 * 24,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myCollections'] });
    },
  });

  const onSubmitSubscriptionParams = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (!durationInDays.trim() || !priceInNrlc.trim()) {
      return;
    }

    if (isNaN(Number(durationInDays)) || isNaN(Number(priceInNrlc))) {
      return;
    }

    await changeSubscriptionParamsMutation.mutateAsync();

    toast({
      variant: 'success',
      title: 'Subscription updated',
    });
  };

  return (
    <>
      <form noValidate className="mt-8" onSubmit={onSubmitSubscriptionParams}>
        <div>
          <label htmlFor="subscription" className="mr-2">
            Price (in nRLC):
          </label>
          <input
            type="text"
            value={priceInNrlc}
            placeholder="5"
            className="mt-1 w-20 rounded px-1 py-0.5 text-black"
            onInput={(event: React.ChangeEvent<HTMLInputElement>) =>
              setPriceInNrlc(event.target.value)
            }
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
            className="mt-1 w-28 rounded px-1 py-0.5 text-black"
            onInput={(event: React.ChangeEvent<HTMLInputElement>) =>
              setDurationInDays(event.target.value)
            }
          />
        </div>
        <Button
          type="submit"
          disabled={changeSubscriptionParamsMutation.isPending}
          className="mt-4"
        >
          {changeSubscriptionParamsMutation.isPending && (
            <Loader size="16" className="mr-2 animate-spin-slow" />
          )}
          <span>Submit</span>
        </Button>
      </form>
    </>
  );
}
