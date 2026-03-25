/**
 * Single entry point — one module describes workspace + process + UI + bridge + bindings.
 * Helpers (`objectPath`, `stateSlot`) keep semantic sources and Spec slots consistent.
 */
import {
  defineWorkenApp,
  objectPath,
  stateSlot,
} from '@worken/dsl-app'
import type { WorkenAppDefinition } from '@worken/dsl-app'

const appDefinition = {
  id: 'support-it',
  title: 'IT Support workspace',
  version: '1.0.0',
  processes: {
    /**
     * Namespace key === process.id (enforced by compiler).
     * States live in one tree — no duplicate ids between graph and UI.
     */
    'it-request': {
      id: 'it-request',
      version: '1.0.0',
      title: 'Заявка в IT',
      description: 'Открыта → в работе → ожидание ответа → решена',
      initial: 'open',
      actors: {
        requester: { label: 'Сотрудник', description: 'Автор заявки' },
        agent: { label: 'IT-специалист', description: 'Обработка' },
      },
      states: {
        open: {
          kind: 'task',
          label: 'Открыта',
          actor: 'requester',
          tag: 'intake',
        },
        in_progress: {
          kind: 'task',
          label: 'В работе',
          actor: 'agent',
        },
        waiting_customer: {
          kind: 'wait',
          label: 'Ожидаем ответ',
          actor: 'requester',
        },
        resolved: {
          kind: 'terminal',
          label: 'Решена',
        },
      },
      events: {
        start_work: { label: 'Взять в работу' },
        need_info: { label: 'Запросить информацию' },
        resume: { label: 'Продолжить после ответа' },
        resolve: { label: 'Закрыть заявку' },
      },
      transitions: [
        { id: 't1', from: 'open', to: 'in_progress', on: 'start_work', label: 'В работу' },
        { id: 't2', from: 'in_progress', to: 'waiting_customer', on: 'need_info', label: 'Запрос данных' },
        { id: 't3', from: 'waiting_customer', to: 'in_progress', on: 'resume', label: 'Снова в работу' },
        { id: 't4', from: 'in_progress', to: 'resolved', on: 'resolve', label: 'Решено' },
      ],
      ui: {
        surfaces: [
          {
            matchStateId: 'open',
            title: 'Новая заявка',
            view: { kind: 'detail', specId: 'support.ticketForm', entityId: 'ticket' },
            layoutId: 'split',
            widgets: [{ id: 'form', region: 'primary', order: 0 }],
          },
          {
            matchStateId: 'in_progress',
            title: 'В работе',
            view: { kind: 'board', specId: 'support.agentQueue', entityId: 'ticket' },
          },
          {
            matchStateId: 'waiting_customer',
            title: 'Нужен ответ',
            view: { kind: 'detail', specId: 'support.waitingReply', entityId: 'ticket' },
          },
          {
            matchStateId: '*',
            title: 'Заявка',
            view: { kind: 'detail', specId: 'support.ticketReadOnly', entityId: 'ticket' },
          },
        ],
        byRole: {
          requester: [
            {
              matchStateId: 'in_progress',
              title: 'В обработке (вид автора)',
              view: { kind: 'local', specId: 'support.ticketStatusOnly' },
            },
          ],
        },
      },
      bridge: {
        domainId: 'support',
        stateToViewId: {
          open: 'ticket-new',
          in_progress: 'ticket-work',
          waiting_customer: 'ticket-wait',
          resolved: 'ticket-done',
        },
        fallbackViewId: 'ticket',
      },
      bindings: {
        rules: [
          {
            from: objectPath('title'),
            to: stateSlot('surface', 'headerTitle'),
            ifUndefined: 'Заявка без темы',
          },
          {
            from: objectPath('priority'),
            to: stateSlot('surface', 'priority'),
          },
          {
            from: objectPath('requesterName'),
            to: stateSlot('surface', 'requester'),
          },
        ],
      },
    },
  },
} satisfies WorkenAppDefinition

export const app = defineWorkenApp(appDefinition)

/** Use in server: enrichShellSpec(spec, { ...input, bindings: app.bindings }) */
export const { bindings, compiled } = app
