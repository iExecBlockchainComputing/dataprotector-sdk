import { Outlet } from 'react-router-dom';
import { NavBar } from './components/NavBar/NavBar.tsx';
import { Footer } from './components/Footer.tsx';

export function App() {
  return (
    <>
      <NavBar />
      <div className="mx-auto mt-12 w-[80%] max-w-6xl xl:mt-20">
        {/*<LoginGuard>*/}
        {/*  <QueryClientProvider client={queryClient}>*/}
        <Outlet />
        {/*</QueryClientProvider>*/}
        {/*</LoginGuard>*/}
        <Footer />
      </div>
      {/*<Toaster />*/}
    </>
  );
}
