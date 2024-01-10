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
        <div className="text-white z-[1] scale-y-[.8] px-10 font-anybody text-[36px] font-bold">
          Share your content to earn crypto!
        </div>
      </div>

      <div className="mt-20 xl:mt-32">
        <div className="text-[#D9D9D9] text-sm">
          Welcome to Content Creator 👋
        </div>
        <h1 className="font-anybody text-5xl scale-y-[.8] font-[750]">
          Discover all the new<br /> content you need.
        </h1>
      </div>
    </>
  );
}
