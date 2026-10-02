import type { RouteObject } from 'react-router';
import { BalancesPage } from './balances/BalancesPage.js';
import { DashboardPage } from './dashboard/DashboardPage.js';
import { CampaignPage } from './campaigns/CampaignPage.js';
import { CampaignsPage } from './campaigns/CampaignsPage.js';
import { ClientPage } from './clients/ClientPage.js';
import { ClientsPage } from './clients/ClientsPage.js';
import { NewClientPage } from './clients/NewClientPage.js';
import { NewCampaignPage } from './campaigns/NewCampaignPage.js';
import { MorePage } from './more/MorePage.js';
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
import { NewSalePaymentPage } from './sale-payments/NewSalePaymentPage.js';
import { SalePaymentPage } from './sale-payments/SalePaymentPage.js';
import { NewSalePage } from './sales/NewSalePage.js';
import { SalePage } from './sales/SalePage.js';
import { SalesPage } from './sales/SalesPage.js';
import { AppShell } from './session/AppShell.js';
import { RequireSession } from './session/RequireSession.js';

/**
 * Declared apart from the browser router so tests can mount them in a memory router.
 * Everything but the login screen sits behind the session guard, inside the shell.
 * The root is the dashboard of the current campaign (reference document, section 9.4).
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
          { index: true, element: <DashboardPage /> },
          { path: 'campagnes', element: <CampaignsPage /> },
          { path: 'campagnes/nouvelle', element: <NewCampaignPage /> },
          { path: 'campagnes/:id', element: <CampaignPage /> },
          {
            path: 'mouleurs',
            element: <MouldersPage />,
            children: [{ path: 'nouveau', element: <NewMoulderPage /> }],
          },
          { path: 'mouleurs/:id', element: <MoulderPage /> },
          {
            path: 'rizieres',
            element: <RiceFieldsPage />,
            children: [{ path: 'nouvelle', element: <NewRiceFieldPage /> }],
          },
          { path: 'rizieres/:id', element: <RiceFieldPage /> },
          {
            path: 'clients',
            element: <ClientsPage />,
            children: [
              { path: 'nouveau', element: <NewClientPage /> },
              { path: ':id', element: <ClientPage /> },
            ],
          },
          {
            path: 'productions',
            element: <ProductionsPage />,
            children: [
              { path: 'nouvelle', element: <NewProductionPage /> },
              { path: ':id', element: <ProductionPage /> },
            ],
          },
          {
            path: 'versements',
            element: <PaymentsPage />,
            children: [
              { path: 'nouveau', element: <NewPaymentPage /> },
              { path: ':id', element: <PaymentPage /> },
            ],
          },
          {
            path: 'lots',
            element: <KilnBatchesPage />,
            children: [{ path: 'nouveau', element: <NewKilnBatchPage /> }],
          },
          {
            path: 'lots/:id',
            element: <KilnBatchPage />,
            children: [
              { path: 'prestations/nouvelle', element: <NewContractorWorkPage /> },
              { path: 'prestations/:workId', element: <ContractorWorkPage /> },
            ],
          },
          { path: 'prestations/:id', element: <ContractorWorkPage /> },
          {
            path: 'ventes',
            element: <SalesPage />,
            children: [{ path: 'nouvelle', element: <NewSalePage /> }],
          },
          {
            path: 'ventes/:id',
            element: <SalePage />,
            children: [
              { path: 'encaissements/nouveau', element: <NewSalePaymentPage /> },
              { path: 'encaissements/:paymentId', element: <SalePaymentPage /> },
              { path: 'livraisons/nouvelle', element: <NewDeliveryPage /> },
              { path: 'livraisons/:deliveryId', element: <DeliveryPage /> },
            ],
          },
          {
            path: 'depenses',
            element: <ExpensesPage />,
            children: [
              { path: 'nouvelle', element: <NewExpensePage /> },
              { path: ':id', element: <ExpensePage /> },
            ],
          },
          { path: 'soldes', element: <BalancesPage /> },
          { path: 'plus', element: <MorePage /> },
        ],
      },
    ],
  },
];
