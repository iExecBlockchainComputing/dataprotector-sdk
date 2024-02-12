import { SocialMediaLinks } from './SocialMediaLinks.tsx';

export function Footer() {
  return (
    <div className="relative overflow-hidden pb-16">
      <div className="relative z-10 mx-auto w-[93%] rounded-b-3xl bg-background shadow-lg">
        <div className="mx-auto flex w-[84%] max-w-6xl items-center gap-x-5 pb-16 pt-7">
          <div className="flex-1 text-xs">
            © 2024 iExec. All rights reserved.
          </div>
          <SocialMediaLinks />
          <div className="flex-1 text-right text-xs">
            <a href="#" target="_blank" className="underline">
              Privacy Policy
            </a>
          </div>
        </div>
      </div>
      <div className="absolute -left-[200px] h-[40px] w-[400px] bg-[#1027CF] blur-[70px]">
        &nbsp;
      </div>
      <div className="absolute -bottom-[20px] left-[10%] h-[70px] w-2/3 bg-[#1027CF] blur-[70px]">
        &nbsp;
      </div>
      <div className="absolute -right-[75px] h-[80px] w-[30%] bg-[#643991] blur-[70px]">
        &nbsp;
      </div>
    </div>
  );
}
