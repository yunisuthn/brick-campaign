import { Navigate, type RouteObject } from 'react-router';
import { CampaignsPage } from './campaigns/CampaignsPage.js';
import { NewCampaignPage } from './campaigns/NewCampaignPage.js';
import { LoginPage } from './pages/LoginPage.js';
import { AppShell } from './session/AppShell.js';
import { RequireSession } from './session/RequireSession.js';

/**
 * Declared apart from the browser router so tests can mount them in a memory router.
 * Everything but the login screen sits behind the session guard, inside the shell.
 * The root goes to the campaigns until the dashboard of the current campaign exists (step 10).
 */
export const routes: RouteObject[] = [
  { path: '/connexion', element: <LoginPage /> },
  {
    element: <RequireSession />,
    children: [
      {
        path: '/',
        element: <AppShell />,
        children: [
          { index: true, element: <Navigate to="/campagnes" replace /> },
          { path: 'campagnes', element: <CampaignsPage /> },
          { path: 'campagnes/nouvelle', element: <NewCampaignPage /> },
        ],
      },
    ],
  },
];
