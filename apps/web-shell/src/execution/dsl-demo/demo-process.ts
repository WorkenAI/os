import { defineProcess } from '@worken/dsl'

/**
 * Minimal demo process for DSL → workflow step mapping (not production).
 * draft → pending → done | rejected
 */
export const demoApprovalProcess = defineProcess({
  id: 'demo-approval',
  version: '1.0.0',
  title: 'Demo approval',
  initial: 'draft',
  actors: {
    author: { label: 'Author', description: '' },
    approver: { label: 'Approver', description: '' },
  },
  nodes: {
    draft: { id: 'draft', kind: 'task', label: 'Draft', actor: 'author' },
    pending: { id: 'pending', kind: 'wait', label: 'Pending', actor: 'approver' },
    done: { id: 'done', kind: 'terminal', label: 'Done' },
    rejected: { id: 'rejected', kind: 'terminal', label: 'Rejected' },
  },
  events: {
    submit: { id: 'submit', label: 'Submit' },
    approve: { id: 'approve', label: 'Approve' },
    reject: { id: 'reject', label: 'Reject' },
  },
  transitions: [
    { id: 't1', from: 'draft', to: 'pending', on: 'submit', label: 'Submit' },
    { id: 't2', from: 'pending', to: 'done', on: 'approve', label: 'Approve' },
    { id: 't3', from: 'pending', to: 'rejected', on: 'reject', label: 'Reject' },
  ],
})
