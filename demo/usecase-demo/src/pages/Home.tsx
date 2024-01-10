import headerMotionUrl from '../assets/header-motion.mp4';

export function Home() {
  return (
    <>
      <div className="max-w-7xl h-[300px] xl:h-[360px] rounded-3xl relative flex items-center text-center">
        <video
          autoPlay
          muted
          loop
          className="w-full h-full object-cover absolute z-0 rounded-3xl"
        >
          <source src={headerMotionUrl} type="video/mp4" />
        </video>
        <div className="px-10 text-[36px] font-bold font-anybody z-[1] scale-y-[.8]">
          Share your content to earn crypto!
        </div>
      </div>
    </>
  );
}
