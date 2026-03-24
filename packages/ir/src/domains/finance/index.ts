import { defineDomain } from '../manifest'
import { financeSpecs } from './specs'

const finance = defineDomain({
  id: 'finance',
  title: 'Finance',
  icon: '💰',
  accent: {
    color: '#f59e0b',
    gradient: 'linear-gradient(135deg, rgba(245, 158, 11, 0.15), rgba(245, 158, 11, 0.05))',
  },
  vocabulary: {
    domainTitle: 'Finance',
    entities: {
      invoice: { singular: 'Invoice', plural: 'Invoices' },
      payment: { singular: 'Payment', plural: 'Payments' },
      budget: { singular: 'Budget', plural: 'Budgets' },
    },
    verbs: {
      create: { label: 'Create' },
      reconcile: { label: 'Reconcile' },
      approve: { label: 'Approve' },
      allocate: { label: 'Allocate' },
      forecast: { label: 'Forecast' },
      reject: { label: 'Reject' },
    },
  },
  entities: {
    invoice: {
      id: 'invoice',
      label: 'Invoice',
      pluralLabel: 'Invoices',
      actions: ['create', 'edit', 'delete', 'approve'],
      inspector: { enabled: true },
    },
    payment: {
      id: 'payment',
      label: 'Payment',
      pluralLabel: 'Payments',
      actions: ['create', 'edit', 'delete', 'approve'],
      inspector: { enabled: true },
    },
    budget: {
      id: 'budget',
      label: 'Budget',
      pluralLabel: 'Budgets',
      actions: ['create', 'edit', 'delete', 'approve'],
      inspector: { enabled: true },
    },
  },
  verbs: {
    create: {
      id: 'create',
      label: 'Create',
      scope: 'entity',
      entityIds: ['invoice', 'payment', 'budget'],
    },
    reconcile: { id: 'reconcile', label: 'Reconcile', scope: 'domain' },
    approve: { id: 'approve', label: 'Approve', scope: 'domain' },
    allocate: { id: 'allocate', label: 'Allocate', scope: 'domain' },
    forecast: { id: 'forecast', label: 'Forecast', scope: 'domain' },
    reject: { id: 'reject', label: 'Reject', scope: 'domain' },
  },
  views: {
    dashboard: {
      id: 'dashboard',
      title: 'Dashboard',
      kind: 'dashboard',
      entityId: 'invoice',
      specId: 'dashboard',
    },
    invoices: {
      id: 'invoices',
      title: 'Invoices',
      kind: 'table',
      entityId: 'invoice',
      specId: 'invoices',
    },
    payments: {
      id: 'payments',
      title: 'Payments',
      kind: 'board',
      entityId: 'payment',
      specId: 'payments',
      execution: {
        signalType: 'lead.created',
        autoStart: false,
      },
    },
    budgets: {
      id: 'budgets',
      title: 'Budgets',
      kind: 'list',
      entityId: 'budget',
      specId: 'budgets',
    },
    analytics: {
      id: 'analytics',
      title: 'Analytics',
      kind: 'analytics',
      entityId: 'invoice',
      specId: 'analytics',
    },
  },
  surfaces: {
    defaultViewId: 'dashboard',
    localOnlyViewIds: [],
    actions: [
      {
        id: 'create-invoice',
        label: 'Invoice',
        icon: 'FileText',
        verbId: 'create',
        entityId: 'invoice',
      },
      {
        id: 'approve-payment',
        label: 'Approve payment',
        icon: 'CheckCircle',
        verbId: 'approve',
        entityId: 'payment',
      },
    ],
    navigation: [
      { id: 'dashboard', label: 'Dashboard', icon: 'LayoutDashboard', viewId: 'dashboard' },
      { id: 'invoices', label: 'Invoices', icon: 'FileText', viewId: 'invoices' },
      { id: 'payments', label: 'Payments', icon: 'CreditCard', viewId: 'payments' },
      { id: 'budgets', label: 'Budgets', icon: 'PiggyBank', viewId: 'budgets' },
      { id: 'analytics', label: 'Analytics', icon: 'BarChart3', viewId: 'analytics' },
    ],
  },
  specs: financeSpecs,
})

export default finance
