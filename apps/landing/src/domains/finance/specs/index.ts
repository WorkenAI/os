import { createBoardSpec, createDashboardSpec, createTableSpec } from '@/domains/spec-templates'

export const financeSpecs: Record<string, unknown> = {
  dashboard: createDashboardSpec({
    boardTitle: 'Invoices & payments',
    lanes: [
      { id: 'lane-pending', title: 'Awaiting payment' },
      { id: 'lane-approval', title: 'In approval' },
      { id: 'lane-paid', title: 'Paid' },
    ],
  }),
  'invoices-table': createTableSpec({
    title: 'Invoices',
    columns: [
      { key: 'number', label: 'Number', format: 'text' },
      { key: 'counterparty', label: 'Counterparty', format: 'text' },
      { key: 'amount', label: 'Amount', format: 'currency' },
      { key: 'status', label: 'Status', format: 'badge' },
      { key: 'dueDate', label: 'Due date', format: 'date' },
      { key: 'category', label: 'Category', format: 'text' },
    ],
  }),
  invoices: createTableSpec({
    title: 'Invoices',
    columns: [
      { key: 'number', label: 'Number', format: 'text' },
      { key: 'counterparty', label: 'Counterparty', format: 'text' },
      { key: 'amount', label: 'Amount', format: 'currency' },
      { key: 'status', label: 'Status', format: 'badge' },
      { key: 'dueDate', label: 'Due date', format: 'date' },
      { key: 'category', label: 'Category', format: 'text' },
    ],
  }),
  'approvals-board': createBoardSpec({
    title: 'Payment approvals',
    lanes: [
      { id: 'lane-new', title: 'New' },
      { id: 'lane-in-progress', title: 'In progress' },
      { id: 'lane-approved', title: 'Approved' },
    ],
  }),
  payments: createBoardSpec({
    title: 'Payment approvals',
    lanes: [
      { id: 'lane-new', title: 'New' },
      { id: 'lane-in-progress', title: 'In progress' },
      { id: 'lane-approved', title: 'Approved' },
    ],
  }),
}
