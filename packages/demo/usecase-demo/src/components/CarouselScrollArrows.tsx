import { MutableRefObject } from 'react';
import { ArrowLeft, ArrowRight } from 'react-feather';
import { useCarouselLogic } from '@/utils/useCarouselLogic.ts';

export function CarouselScrollArrows({
  carousel,
}: {
  carousel: MutableRefObject<null>;
}) {
  const { scrollLeft, scrollRight } = useCarouselLogic();
  return (
    <div className="self-end">
      <button
        className="group p-1 transition-transform active:scale-[0.9]"
        onClick={() => scrollLeft(carousel)}
      >
        <div className="rounded-full bg-grey-700 p-2 transition-colors group-hover:bg-grey-500/40">
          <ArrowLeft size="18" />
        </div>
      </button>
      <button
        className="group ml-1 p-1 transition-transform active:scale-[0.9]"
        onClick={() => scrollRight(carousel)}
      >
        <div className="rounded-full bg-grey-700 p-2 transition-colors group-hover:bg-grey-500/40">
          <ArrowRight size="18" />
        </div>
      </button>
    </div>
  );
}
