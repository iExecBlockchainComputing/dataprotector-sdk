import { useEffect, useRef } from 'react';
import { ArrowLeft, ArrowRight } from 'react-feather';
import type { ProtectedData } from '../../../../../sdk/src';
import { OneContentCard } from '../OneContentCard.tsx';

export function ContentOfTheWeek({ data }: { data: ProtectedData[] }) {
  const contentOfTheWeek = useRef(null);

  let isDown = false;
  let startX: number;
  let startY: number;
  let scrollLeft: number;
  let scrollTop: number;

  useEffect(() => {
    contentOfTheWeek?.current?.addEventListener('mousedown', (e) => {
      isDown = true;
      startX = e.pageX - contentOfTheWeek.current.offsetLeft;
      startY = e.pageY - contentOfTheWeek.current.offsetTop;
      scrollLeft = contentOfTheWeek.current.scrollLeft;
      scrollTop = contentOfTheWeek.current.scrollTop;
    });

    contentOfTheWeek?.current?.addEventListener('mouseleave', () => {
      isDown = false;
    });

    contentOfTheWeek?.current?.addEventListener('mouseup', () => {
      isDown = false;
    });

    document.addEventListener('mousemove', (e) => {
      if (!isDown) return;
      e.preventDefault();
      const x = e.pageX - contentOfTheWeek.current.offsetLeft;
      const y = e.pageY - contentOfTheWeek.current.offsetTop;
      const walkX = (x - startX) * 1;
      const walkY = (y - startY) * 1;
      contentOfTheWeek.current.scrollLeft = scrollLeft - walkX;
      contentOfTheWeek.current.scrollTop = scrollTop - walkY;
    });
  });

  return (
    <>
      <div className="flex items-center">
        <h3 className="flex-1 text-2xl font-bold">Content of the week</h3>
        <div>
          <button
            className="group p-1 transition-transform active:scale-[0.9]"
            onClick={() => {
              contentOfTheWeek.current.scrollBy({
                top: 0,
                left: -contentOfTheWeek.current.clientWidth,
                behavior: 'smooth',
              });
            }}
          >
            <div className="rounded-full bg-grey-700 p-2 transition-colors group-hover:bg-grey-500/40">
              <ArrowLeft size="18" />
            </div>
          </button>
          <button
            className="group ml-1 p-1 transition-transform active:scale-[0.9]"
            onClick={() => {
              contentOfTheWeek.current.scrollBy({
                top: 0,
                left: contentOfTheWeek.current.clientWidth,
                behavior: 'smooth',
              });
            }}
          >
            <div className="rounded-full bg-grey-700 p-2 transition-colors group-hover:bg-grey-500/40">
              <ArrowRight size="18" />
            </div>
          </button>
        </div>
      </div>
      <div
        ref={contentOfTheWeek}
        className="mt-8 inline-flex max-w-full gap-x-4 overflow-auto"
      >
        {data?.map((content) => (
          <div key={content.address} className="w-[400px] shrink-0">
            <OneContentCard content={content} />
          </div>
        ))}
      </div>
    </>
  );
}
