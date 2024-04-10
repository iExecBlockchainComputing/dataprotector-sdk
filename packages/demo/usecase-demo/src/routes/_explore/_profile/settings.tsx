import { createFileRoute } from '@tanstack/react-router';
import { Button } from '@/components/ui/button.tsx';
import { toast } from '@/components/ui/use-toast.ts';
import { MyCollection } from '@/modules/profile/MyCollection.tsx';
import { timestampToReadableDate } from '@/utils/timestampToReadableDate.ts';

export const Route = createFileRoute('/_explore/_profile/settings')({
  component: Settings,
});

export function Settings() {
  return (
    <div className="mt-11">
      <div className="flex">
        <div className="overflow-hidden relative max-w-[430px] flex-1 py-11 px-14 rounded-20">
          <div className="relative z-above-blurry-colours">
            <div className="text-3xl font-bold">Total earnings</div>
            <div className="font-medium text-text2 mt-2">
              Last update • {timestampToReadableDate(Date.now() / 1000)}
            </div>
            <div className="text-4xl font-bold mt-6">- RLC</div>
          </div>
          <div
            className="absolute z-0 -rotate-90 -right-[10px] -bottom-[40px] h-[200px] w-[200px] blur-[75px]"
            style={{
              background:
                'conic-gradient(from 161deg at 50% 44.04%, rgba(252, 209, 90, 0.90) 82.50000178813934deg, rgba(238, 72, 130, 0.90) 148.1250035762787deg, rgba(159, 2, 173, 0.90) 234.37500715255737deg)',
            }}
          >
            &nbsp;
          </div>
        </div>
        <div className="ml-10 overflow-hidden relative max-w-[430px] flex-1 py-11 px-14 rounded-20">
          <div className="relative z-above-blurry-colours">
            <div className="text-3xl font-bold">Total to claim</div>
            <div className="font-medium text-text2 mt-2">
              RLC available since last claim
            </div>
            <div className="text-4xl font-bold mt-6">- RLC</div>
            <Button
              variant="outline"
              onClick={() => {
                toast({
                  variant: 'info',
                  title: 'Not yet implemented',
                });
              }}
              className="mt-3 w-[134px] bg-transparent hover:bg-grey-800/25"
            >
              Claim
            </Button>
          </div>
          <div
            className="z-0 absolute -left-[100px] -bottom-[300px] h-[400px] w-[400px] blur-[65px]"
            style={{
              background:
                'conic-gradient(from 161deg at 50% 44.04%, rgba(252, 209, 90, 0.60) 82.50000178813934deg, rgba(238, 72, 130, 0.60) 148.1250035762787deg, rgba(159, 2, 173, 0.60) 234.37500715255737deg)',
            }}
          >
            &nbsp;
          </div>
          <div
            className="z-0 absolute -right-[40px] -bottom-[35px] h-[200px] w-[200px] blur-[80px]"
            style={{
              background:
                'conic-gradient(from 161deg at 50% 44.04%, rgba(109, 199, 255, 0.50) 144.3749964237213deg, rgba(63, 13, 63, 0.50) 275.625deg)',
            }}
          >
            &nbsp;
          </div>
        </div>
      </div>

      <hr className="mt-10 border-grey-700" />

      <div className="mt-12">
        <MyCollection />
      </div>
    </div>
  );
}
