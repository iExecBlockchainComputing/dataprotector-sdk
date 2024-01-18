import { Outlet } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { NavBar } from './components/NavBar/NavBar.tsx';
import { Footer } from './components/Footer.tsx';

const queryClient = new QueryClient();

export function App() {
  return (
    <>
      <NavBar />
      <div className="mt-12 xl:mt-20">
        <div className="relative z-10 mx-auto w-[93%] bg-background">
          <div className="mx-auto w-[84%] max-w-6xl">
            {/*<LoginGuard>*/}
            <QueryClientProvider client={queryClient}>
              <Outlet />
            </QueryClientProvider>
            {/*</LoginGuard>*/}
            <hr className="mt-24" />
          </div>
        </div>
        <Footer />
      </div>
      {/*<Toaster />*/}
    </>
  );
}
