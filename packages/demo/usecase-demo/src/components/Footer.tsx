import { SocialMediaLinks } from './SocialMediaLinks.tsx';

export function Footer() {
  return (
    <div className="relative overflow-hidden pb-16">
      <div className="relative z-10 mx-auto w-[93%] overflow-hidden rounded-3xl bg-gradient-to-r from-background via-[#2E2E3A] to-background px-0.5 pt-0.5 shadow-lg">
        <div className="rounded-[23px] bg-background">
          <div className="mx-auto grid w-[84%] max-w-6xl grid-cols-2 gap-8 gap-x-5 py-16 md:flex md:items-center">
            <div className="-order-1 text-xs xl:flex-1">
              © 2024 iExec. All rights reserved.
            </div>
            <SocialMediaLinks />
            <div className="-order-1 text-right text-xs md:order-none xl:flex-1">
              <a href="#" target="_blank" className="underline">
                Privacy Policy
              </a>
            </div>
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
