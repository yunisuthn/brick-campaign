import { Navigate, type RouteObject } from 'react-router';
import { BalancesPage } from './balances/BalancesPage.js';
import { CampaignPage } from './campaigns/CampaignPage.js';
import { CampaignsPage } from './campaigns/CampaignsPage.js';
import { ClientPage } from './clients/ClientPage.js';
import { ClientsPage } from './clients/ClientsPage.js';
import { NewClientPage } from './clients/NewClientPage.js';
import { NewCampaignPage } from './campaigns/NewCampaignPage.js';
import { MoulderPage } from './moulders/MoulderPage.js';
import { MouldersPage } from './moulders/MouldersPage.js';
import { NewMoulderPage } from './moulders/NewMoulderPage.js';
import { ContractorWorkPage } from './contractor-works/ContractorWorkPage.js';
import { NewContractorWorkPage } from './contractor-works/NewContractorWorkPage.js';
import { DeliveryPage } from './deliveries/DeliveryPage.js';
import { NewDeliveryPage } from './deliveries/NewDeliveryPage.js';
import { ExpensePage } from './expenses/ExpensePage.js';
import { ExpensesPage } from './expenses/ExpensesPage.js';
import { NewExpensePage } from './expenses/NewExpensePage.js';
import { KilnBatchPage } from './kiln-batches/KilnBatchPage.js';
import { KilnBatchesPage } from './kiln-batches/KilnBatchesPage.js';
import { NewKilnBatchPage } from './kiln-batches/NewKilnBatchPage.js';
import { LoginPage } from './pages/LoginPage.js';
import { NewProductionPage } from './productions/NewProductionPage.js';
import { NewPaymentPage } from './payments/NewPaymentPage.js';
import { PaymentPage } from './payments/PaymentPage.js';
import { PaymentsPage } from './payments/PaymentsPage.js';
import { ProductionPage } from './productions/ProductionPage.js';
import { ProductionsPage } from './productions/ProductionsPage.js';
import { NewRiceFieldPage } from './rice-fields/NewRiceFieldPage.js';
import { RiceFieldPage } from './rice-fields/RiceFieldPage.js';
import { RiceFieldsPage } from './rice-fields/RiceFieldsPage.js';
import { NewSalePage } from './sales/NewSalePage.js';
import { SalePage } from './sales/SalePage.js';
import { SalesPage } from './sales/SalesPage.js';
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
          { path: 'campagnes/:id', element: <CampaignPage /> },
          { path: 'mouleurs', element: <MouldersPage /> },
          { path: 'mouleurs/nouveau', element: <NewMoulderPage /> },
          { path: 'mouleurs/:id', element: <MoulderPage /> },
          { path: 'rizieres', element: <RiceFieldsPage /> },
          { path: 'rizieres/nouvelle', element: <NewRiceFieldPage /> },
          { path: 'rizieres/:id', element: <RiceFieldPage /> },
          { path: 'clients', element: <ClientsPage /> },
          { path: 'clients/nouveau', element: <NewClientPage /> },
          { path: 'clients/:id', element: <ClientPage /> },
          { path: 'productions', element: <ProductionsPage /> },
          { path: 'productions/nouvelle', element: <NewProductionPage /> },
          { path: 'productions/:id', element: <ProductionPage /> },
          { path: 'versements', element: <PaymentsPage /> },
          { path: 'versements/nouveau', element: <NewPaymentPage /> },
          { path: 'versements/:id', element: <PaymentPage /> },
          { path: 'lots', element: <KilnBatchesPage /> },
          { path: 'lots/nouveau', element: <NewKilnBatchPage /> },
          { path: 'lots/:id', element: <KilnBatchPage /> },
          { path: 'lots/:id/prestations/nouvelle', element: <NewContractorWorkPage /> },
          { path: 'prestations/:id', element: <ContractorWorkPage /> },
          { path: 'ventes', element: <SalesPage /> },
          { path: 'ventes/nouvelle', element: <NewSalePage /> },
          { path: 'ventes/:id', element: <SalePage /> },
          { path: 'ventes/:id/livraisons/nouvelle', element: <NewDeliveryPage /> },
          { path: 'ventes/:id/livraisons/:deliveryId', element: <DeliveryPage /> },
          { path: 'depenses', element: <ExpensesPage /> },
          { path: 'depenses/nouvelle', element: <NewExpensePage /> },
          { path: 'depenses/:id', element: <ExpensePage /> },
          { path: 'soldes', element: <BalancesPage /> },
        ],
      },
    ],
  },
];
