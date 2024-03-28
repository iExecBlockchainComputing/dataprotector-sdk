import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus } from 'react-feather';
import { Alert } from '@/components/Alert.tsx';
import { CircularLoader } from '@/components/CircularLoader.tsx';
import { Button } from '@/components/ui/button.tsx';
import { getDataProtectorClient } from '@/externals/dataProtectorClient.ts';
import { OneCollection } from '@/modules/profile/OneCollection.tsx';
import { myCollectionsQuery } from '@/modules/profile/myCollections.query.ts';
import { useUserStore } from '@/stores/user.store.ts';

export function MyCollection() {
  const { address } = useUserStore();
  const queryClient = useQueryClient();

  const {
    isLoading,
    isSuccess,
    data: collections,
    isError,
    error,
  } = useQuery(myCollectionsQuery({ address: address! }));

  const createCollectionMutation = useMutation({
    mutationFn: async () => {
      const { dataProtectorSharing } = await getDataProtectorClient();
      return dataProtectorSharing.createCollection();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myCollections'] });
    },
  });

  return (
    <div className="w-full">
      {isLoading && (
        <div className="mt-4 flex flex-col items-center gap-y-4">
          <CircularLoader />
        </div>
      )}

      {isError && (
        <Alert variant="error">
          <p>Oops, something went wrong while fetching your collections.</p>
          <p className="mt-1 text-sm text-orange-300">{error.toString()}</p>
        </Alert>
      )}

      {isSuccess && collections[0] && (
        <div className="flex flex-col gap-y-6">
          <div className="rounded-2xl border border-grey-700 p-6">
            <OneCollection collection={collections[0]} />
          </div>
        </div>
      )}

      {isSuccess && collections[1] && (
        <div className="mt-4 italic">
          You have other collections that are not displayed in this
          usecase-demo. (
          {collections
            .slice(1)
            .map((c) => c.id)
            .join(', ')}
          )
        </div>
      )}

      {isSuccess && !collections[0] && (
        <>
          <Button
            isLoading={createCollectionMutation.isPending}
            className="flex items-center"
            onClick={() => createCollectionMutation.mutate()}
          >
            {!createCollectionMutation.isPending && (
              <Plus size="20" className="-ml-0.5 mr-1.5" />
            )}
            Add new collection
          </Button>
          {createCollectionMutation.error && (
            <Alert variant="error" className="mt-8">
              <p>Oops, something went wrong while creating your collection.</p>
              <p className="mt-1 text-sm text-orange-300">
                {createCollectionMutation.error.toString()}
              </p>
            </Alert>
          )}
        </>
      )}
    </div>
  );
}
