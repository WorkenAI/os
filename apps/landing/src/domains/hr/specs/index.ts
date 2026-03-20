import { createBoardSpec, createDashboardSpec, createTableSpec } from '@/domains/spec-templates'

export const hrSpecs: Record<string, unknown> = {
  dashboard: createDashboardSpec({
    boardTitle: 'Candidate pipeline',
    lanes: [
      { id: 'lane-screening', title: 'Screening' },
      { id: 'lane-interview', title: 'Interview' },
      { id: 'lane-offer', title: 'Offer' },
    ],
  }),
  'candidates-table': createTableSpec({
    title: 'Candidates',
    columns: [
      { key: 'name', label: 'Name', format: 'text' },
      { key: 'position', label: 'Role', format: 'text' },
      { key: 'status', label: 'Status', format: 'badge' },
      { key: 'source', label: 'Source', format: 'text' },
      { key: 'date', label: 'Date', format: 'date' },
    ],
  }),
  'pipeline-board': createBoardSpec({
    title: 'Hiring pipeline',
    lanes: [
      { id: 'screening', title: 'Screening' },
      { id: 'interview', title: 'Interview' },
      { id: 'offer', title: 'Offer' },
      { id: 'hired', title: 'Hired' },
    ],
  }),
}
