import '@fontsource/space-grotesk/700.css';
import { createFileRoute } from '@tanstack/react-router';
import headerMotionUrl from '../../assets/header-motion.mp4';
import { AllContent } from '../../modules/home/AllContent.tsx';
import { ContentCreatorSection } from '../../modules/home/ContentCreatorSection.tsx';

export const Route = createFileRoute('/_index/')({
  component: Home,
});

function Home() {
  return (
    <>
      <div className="relative flex h-[300px] max-w-7xl items-center justify-center text-center lg:h-[330px] xl:h-[360px]">
        <video
          autoPlay
          muted
          loop
          className="absolute z-0 h-full w-full rounded-3xl object-cover"
        >
          <source src={headerMotionUrl} type="video/mp4" />
        </video>
        <div className="px-10 text-white">
          <div className="scale-y-100 text-balance font-anybody text-2xl font-bold sm:text-5xl sm:leading-[3rem]">
            Share your content
            <br />
            Earn crypto
          </div>
          <div className="mt-6 grid scale-y-100 items-center justify-center gap-4 sm:mt-10 sm:flex lg:absolute lg:left-1/2 lg:-translate-x-1/2">
            <span className="text-grey-50">Powered by</span>
            <a
              href="https://documentation-tools.vercel.app/tools/dataProtector.html"
              target="_blank"
              rel="noopener"
              className="text-md flex items-center rounded-30 border border-yellow-200 px-6 py-3 font-grotesk font-bold text-primary"
            >
              Data Protector
            </a>
          </div>
        </div>
      </div>

      <div className="mt-10 sm:mt-20">
        <div className="text-[#D9D9D9]">Welcome to Content Creator 👋</div>
        <h1 className="mt-1 text-balance font-anybody text-2xl font-[750] sm:text-5xl">
          Discover all the new
          <br /> content you need
        </h1>
        <AllContent />
      </div>

      <ContentCreatorSection className="mt-16 sm:mt-32 xl:mt-36" />
    </>
  );
}
