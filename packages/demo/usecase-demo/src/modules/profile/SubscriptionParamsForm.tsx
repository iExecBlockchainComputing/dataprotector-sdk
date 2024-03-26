import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { CollectionWithProtectedDatas } from '@iexec/dataprotector';
import { Alert } from '@/components/Alert.tsx';
import { Input } from '@/components/ui/input.tsx';
import { Button } from '@/components/ui/button.tsx';
import { toast } from '@/components/ui/use-toast.ts';
import { getDataProtectorClient } from '@/externals/dataProtectorClient.ts';
import { readableSecondsToDays } from '@/utils/secondsToDays.ts';

export function SubscriptionParamsForm({
  collection,
}: {
  collection: CollectionWithProtectedDatas;
}) {
  const queryClient = useQueryClient();

  const [priceInNrlc, setPriceInNrlc] = useState<string>(
    collection.subscriptionParams
      ? String(collection.subscriptionParams.price)
      : ''
  );
  const [durationInDays, setDurationInDays] = useState<string>(
    collection.subscriptionParams
      ? String(readableSecondsToDays(collection.subscriptionParams.duration))
      : ''
  );

  const changeSubscriptionParamsMutation = useMutation({
    mutationFn: async () => {
      const { dataProtectorSharing } = await getDataProtectorClient();
      await dataProtectorSharing.setSubscriptionParams({
        collectionTokenId: Number(collection.id),
        priceInNRLC: Number(priceInNrlc),
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
      <form noValidate onSubmit={onSubmitSubscriptionParams}>
        <div>
          <label htmlFor="subscription" className="mr-2">
            Price (in nRLC):
          </label>
          <Input
            type="text"
            value={priceInNrlc}
            placeholder="5"
            className="inline-block w-28"
            onInput={(event: React.ChangeEvent<HTMLInputElement>) =>
              setPriceInNrlc(event.target.value)
            }
          />
        </div>
        <div className="mt-4">
          <label htmlFor="subscription" className="mr-2">
            Duration (in days):
          </label>
          <Input
            type="text"
            value={durationInDays}
            placeholder="30"
            className="inline-block w-28"
            onInput={(event: React.ChangeEvent<HTMLInputElement>) =>
              setDurationInDays(event.target.value)
            }
          />
        </div>

        <Button
          type="submit"
          isLoading={changeSubscriptionParamsMutation.isPending}
          className="mt-4"
        >
          Submit
        </Button>
      </form>

      {changeSubscriptionParamsMutation.isError && (
        <Alert variant="error" className="mt-4">
          {changeSubscriptionParamsMutation.error.toString()}
        </Alert>
      )}
    </>
  );
}
