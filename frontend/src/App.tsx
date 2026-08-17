// /frontend/src/App.tsx
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import CampaignCanvasPage from './pages/CampaignCanvasPage';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import ProtectedRoute from './components/ui/ProtectedRoute';
import DashboardPage from './pages/DashboardPage';
import StrategyPage from './pages/StrategyPage';
import ImagesPage from './pages/ImagesPage';
import AutopostPage from './pages/AutopostPage';

const router = createBrowserRouter([
  {
    path: '/',
    element: <LandingPage/>,
  },
  {
    path: '/login',
    element: <LoginPage/>,
  },
  // Protected Routes are nested under the ProtectedRoute element
  {
    element: <ProtectedRoute />,
    children: [
      {
        path: '/dashboard',
        element: <DashboardPage />,
      },
      {
        path: '/strategy',
        element: <StrategyPage />,
      },
      {
        path: '/strategy/:campaignId',
        element: <StrategyPage />,
      },
      {
        path: '/campaign/:id',
        element: <CampaignCanvasPage />,
      },
      {
        path: '/images/:campaignId',
        element: <ImagesPage />,
      },
      {
        path: '/autopost/:campaignId',
        element: <AutopostPage />,
      },
    ],
  },
]);

function App() {
  return <RouterProvider router={router} />;
}

export default App;
