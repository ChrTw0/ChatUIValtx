import { createHashRouter } from 'react-router-dom';
import { AppShell } from '../components/layout/AppShell';
import { ChatPage } from '../pages/ChatPage';
import { NotFoundPage } from '../pages/NotFoundPage';
import { DashboardMockup } from '../pages/DashboardMockup';

export const router = createHashRouter([
  {
    path: '/',
    element: <AppShell />,
    children: [
      { index: true, element: <ChatPage /> },
      { path: 'mockup', element: <DashboardMockup /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]);
