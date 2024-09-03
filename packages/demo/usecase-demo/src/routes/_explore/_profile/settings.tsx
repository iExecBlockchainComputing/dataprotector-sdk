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
      <div className="grid gap-10 md:flex">
        <div className="relative max-w-[430px] flex-1 overflow-hidden rounded-20 px-10 py-8 lg:px-14 lg:py-11">
          <div className="relative z-above-blurry-colours">
            <div className="text-3xl font-bold">Total earnings</div>
            <div className="mt-2 font-medium text-text2">
              Last update • {timestampToReadableDate(Date.now() / 1000)}
            </div>
            <div className="mt-6 text-4xl font-bold">0 RLC</div>
          </div>
          <div
            className="absolute -bottom-[40px] -right-[10px] z-0 h-[200px] w-[200px] -rotate-90 blur-[75px]"
            style={{
              background:
                'conic-gradient(from 161deg at 50% 44.04%, rgba(252, 209, 90, 0.90) 82.50000178813934deg, rgba(238, 72, 130, 0.90) 148.1250035762787deg, rgba(159, 2, 173, 0.90) 234.37500715255737deg)',
            }}
          >
            &nbsp;
          </div>
        </div>
        <div className="relative max-w-[430px] flex-1 overflow-hidden rounded-20 px-10 py-8 lg:px-14 lg:py-11">
          <div className="relative z-above-blurry-colours">
            <div className="text-3xl font-bold">Total to Withdraw</div>
            <div className="mt-2 font-medium text-text2">
              RLC available since last claim
            </div>
            <div className="mt-6 text-4xl font-bold">0 RLC</div>
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
            className="absolute -bottom-[300px] -left-[100px] z-0 h-[400px] w-[400px] blur-[65px]"
            style={{
              background:
                'conic-gradient(from 161deg at 50% 44.04%, rgba(252, 209, 90, 0.60) 82.50000178813934deg, rgba(238, 72, 130, 0.60) 148.1250035762787deg, rgba(159, 2, 173, 0.60) 234.37500715255737deg)',
            }}
          >
            &nbsp;
          </div>
          <div
            className="absolute -bottom-[35px] -right-[40px] z-0 h-[200px] w-[200px] blur-[80px]"
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
