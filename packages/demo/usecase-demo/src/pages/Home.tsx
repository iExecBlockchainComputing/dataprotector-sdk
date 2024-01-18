import { ArrowUpRight } from 'react-feather';
import headerMotionUrl from '../assets/header-motion.mp4';
import { Button } from '../components/ui/button.tsx';
import { AllContent } from './AllContent.tsx';
import { ContentCreatorSection } from './ContentCreatorSection.tsx';

export function Home() {
  return (
    <>
      <div className="relative flex h-[300px] max-w-7xl items-center justify-center text-center xl:h-[360px]">
        <video
          autoPlay
          muted
          loop
          className="absolute z-0 h-full w-full rounded-3xl object-cover"
        >
          <source src={headerMotionUrl} type="video/mp4" />
        </video>
        <div className="px-10 text-white">
          <div className="scale-y-100 text-balance font-anybody text-[36px] font-bold leading-[3rem]">
            Share your content to earn crypto!
          </div>
          <div className="mt-6 flex scale-y-100 items-center justify-center">
            Let's go
            <ArrowUpRight size="20" className="-mr-1 ml-1.5" />
          </div>
        </div>
      </div>

      <div className="mt-6 text-center">
        <span>Powered by</span>
        <a
          href="https://tools.docs.iex.ec/tools/dataprotector"
          target="_blank"
          rel="noopener"
          className="text-md ml-4 h-[34px] rounded-30 border border-yellow-200 px-4 py-2 font-grotesk font-bold text-primary"
        >
          Data Protector
        </a>
      </div>

      <div className="mt-20 xl:mt-32">
        <div className="text-[#D9D9D9]">Welcome to Content Creator 👋</div>
        <h1 className="mt-1 font-anybody text-5xl font-[750]">
          Discover all the new
          <br /> content you need.
        </h1>
        <AllContent />
      </div>

      <ContentCreatorSection className="mt-32 xl:mt-48" />
    </>
  );
}
