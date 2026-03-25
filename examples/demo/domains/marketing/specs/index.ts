import { createBoardSpec, createDashboardSpec, createTableSpec } from '../../spec-templates'

export const marketingSpecs: Record<string, unknown> = {
  dashboard: createDashboardSpec({
    boardTitle: 'Campaigns by status',
    lanes: [
      { id: 'lane-prep', title: 'Preparing' },
      { id: 'lane-active', title: 'Active' },
      { id: 'lane-completed', title: 'Completed' },
    ],
  }),
  campaigns: createTableSpec({
    title: 'Campaigns',
    columns: [
      { key: 'name', label: 'Name', format: 'text' },
      { key: 'channel', label: 'Channel', format: 'text' },
      { key: 'status', label: 'Status', format: 'badge' },
      { key: 'budget', label: 'Budget', format: 'currency' },
      { key: 'reach', label: 'Reach', format: 'text' },
      { key: 'startDate', label: 'Start date', format: 'date' },
    ],
  }),
  creatives: createBoardSpec({
    title: 'Creatives',
    lanes: [
      { id: 'lane-in-progress', title: 'In progress' },
      { id: 'lane-review', title: 'In review' },
      { id: 'lane-approved', title: 'Approved' },
    ],
  }),
}
