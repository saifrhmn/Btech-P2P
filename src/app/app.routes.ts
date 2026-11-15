import { inject } from '@angular/core';
import { Routes } from '@angular/router';
import { AuthService, authGuard, guestGuard, roleGuard } from './core/auth.service';
import { Role } from './core/models';

const internal: Role[] = [
  'requester', 'rfq-creator', 'tech-approver', 'dept-approver', 'vat-approver', 'accounts',
];

export const routes: Routes = [
  {
    path: 'login',
    canActivate: [guestGuard],
    title: 'Sign in · P2P',
    loadComponent: () => import('./pages/login/login').then((m) => m.LoginPage),
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./layout/shell').then((m) => m.Shell),
    children: [
      { path: '', pathMatch: 'full', redirectTo: () => inject(AuthService).homePath() },
      {
        path: 'dashboard',
        title: 'Overview · P2P',
        canActivate: [roleGuard],
        data: { roles: internal, crumb: 'Overview' },
        loadComponent: () => import('./pages/dashboard/dashboard').then((m) => m.DashboardPage),
      },
      {
        path: 'requisitions',
        title: 'Requisitions · P2P',
        canActivate: [roleGuard],
        data: { roles: internal, crumb: 'Purchase requisitions' },
        loadComponent: () => import('./pages/requisitions/requisitions').then((m) => m.RequisitionsPage),
      },
      {
        path: 'rfqs',
        title: 'RFQs · P2P',
        canActivate: [roleGuard],
        data: { roles: internal, crumb: 'Sourcing & RFQs' },
        loadComponent: () => import('./pages/rfq-list/rfq-list').then((m) => m.RfqListPage),
      },
      {
        path: 'rfqs/new',
        title: 'Create RFQ · P2P',
        canActivate: [roleGuard],
        data: { roles: ['rfq-creator'], crumb: 'Create RFQ' },
        loadComponent: () => import('./pages/rfq-create/rfq-create').then((m) => m.RfqCreatePage),
      },
      {
        path: 'rfqs/:id',
        title: 'RFQ · P2P',
        canActivate: [roleGuard],
        data: { roles: internal, crumb: 'RFQ detail' },
        loadComponent: () => import('./pages/rfq-detail/rfq-detail').then((m) => m.RfqDetailPage),
      },
      {
        path: 'setup',
        title: 'Setup · P2P',
        canActivate: [roleGuard],
        data: { roles: ['rfq-creator'], crumb: 'Setup' },
        loadComponent: () => import('./pages/setup/setup').then((m) => m.SetupPage),
      },
      {
        path: 'purchase-orders',
        title: 'Purchase orders · P2P',
        canActivate: [roleGuard],
        data: { roles: internal, crumb: 'Purchase orders & GRN' },
        loadComponent: () => import('./pages/purchase-orders/purchase-orders').then((m) => m.PurchaseOrdersPage),
      },
      {
        path: 'invoices',
        title: 'Invoices · P2P',
        canActivate: [roleGuard],
        data: { roles: internal, crumb: 'Invoice workflow' },
        loadComponent: () => import('./pages/invoices/invoices').then((m) => m.InvoicesPage),
      },
      {
        path: 'vendor-portal',
        title: 'Vendor Portal · P2P',
        canActivate: [roleGuard],
        data: { roles: ['vendor'], crumb: 'Vendor Portal' },
        loadComponent: () => import('./pages/vendor-portal/vendor-portal').then((m) => m.VendorPortalPage),
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
