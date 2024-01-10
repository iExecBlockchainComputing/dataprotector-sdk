import headerMotionUrl from '../assets/header-motion.mp4';

export function Home() {
  return (
    <>
      <div className="relative flex h-[300px] max-w-7xl items-center justify-center rounded-3xl text-center xl:h-[360px]">
        <video
          autoPlay
          muted
          loop
          className="absolute z-0 h-full w-full rounded-3xl object-cover"
        >
          <source src={headerMotionUrl} type="video/mp4" />
        </video>
        <div className="z-[1] scale-y-[.8] px-10 font-anybody text-[36px] font-bold">
          Share your content to earn crypto!
        </div>
      </div>
    </>
  );
}
