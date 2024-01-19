import { createBrowserRouter, Navigate } from 'react-router-dom';
import { App } from './App.tsx';
import { Home } from './pages/Home.tsx';
import { MyProfile } from './pages/MyProfile.tsx';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      {
        path: '',
        element: <Home />,
      },
      {
        path: 'my-profile',
        element: <MyProfile />,
      },
      {
        path: '*',
        element: <Navigate to="/" />,
      },
    ],
  },
]);
