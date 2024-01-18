import { createBrowserRouter, Navigate } from 'react-router-dom';
import { App } from './App.tsx';
import { Home } from './pages/Home.tsx';

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
        path: '*',
        element: <Navigate to="/" />,
      },
    ],
  },
]);
