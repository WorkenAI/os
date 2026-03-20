import { createBoardSpec, createDashboardSpec, createTableSpec } from '@/domains/spec-templates'

export const salesSpecs: Record<string, unknown> = {
  dashboard: createDashboardSpec({
    boardTitle: 'Sales funnel',
    lanes: [
      { id: 'lane-qualification', title: 'Qualification' },
      { id: 'lane-proposal', title: 'Proposal' },
      { id: 'lane-closing', title: 'Closing' },
    ],
  }),
  'leads-table': createTableSpec({
    title: 'Leads',
    columns: [
      { key: 'name', label: 'Name', format: 'text' },
      { key: 'company', label: 'Company', format: 'text' },
      { key: 'position', label: 'Title', format: 'text' },
      { key: 'status', label: 'Status', format: 'badge' },
      { key: 'source', label: 'Source', format: 'text' },
      { key: 'date', label: 'Date', format: 'date' },
    ],
  }),
  'pipeline-board': createBoardSpec({
    title: 'Sales pipeline',
    lanes: [
      { id: 'lane-new', title: 'New lead' },
      { id: 'lane-qualification', title: 'Qualification' },
      { id: 'lane-proposal', title: 'Proposal' },
      { id: 'lane-closing', title: 'Closing' },
    ],
  }),
}
