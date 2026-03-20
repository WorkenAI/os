import type { Spec } from '@json-render/core'

type TemplateLane = {
  id: string
  title: string
}

type TemplateColumn = {
  key: string
  label: string
  format: string
}

export function createDashboardSpec({
  boardTitle,
  lanes,
  activityTitle = 'Latest activity',
}: {
  boardTitle: string
  lanes: TemplateLane[]
  activityTitle?: string
}): Spec {
  return {
    root: 'home',
    elements: {
      home: {
        type: 'Stack',
        props: { direction: 'vertical', gap: 'lg' },
        children: ['metrics', 'board-section', 'activity'],
      },
      metrics: {
        type: 'MetricStrip',
        props: { metrics: [] },
        children: [],
      },
      'board-section': {
        type: 'Board',
        props: { title: boardTitle },
        children: lanes.map((lane) => lane.id),
      },
      activity: {
        type: 'ActivityFeed',
        props: { title: activityTitle, items: [] },
        children: [],
      },
      ...Object.fromEntries(
        lanes.map((lane) => [
          lane.id,
          {
            type: 'BoardLane',
            props: {
              title: lane.title,
              count: 0,
              items: [],
            },
            children: [],
          },
        ]),
      ),
    },
  }
}

export function createTableSpec({
  title,
  columns,
}: {
  title: string
  columns: TemplateColumn[]
}): Spec {
  return {
    root: 'container',
    elements: {
      container: {
        type: 'Stack',
        props: { direction: 'vertical', gap: 'md' },
        children: ['table'],
      },
      table: {
        type: 'EntityTable',
        props: {
          title,
          columns,
          rows: [],
          selectable: true,
        },
        children: [],
      },
    },
  }
}

export function createBoardSpec({ title, lanes }: { title: string; lanes: TemplateLane[] }): Spec {
  return {
    root: 'container',
    elements: {
      container: {
        type: 'Stack',
        props: { direction: 'vertical', gap: 'md' },
        children: ['board'],
      },
      board: {
        type: 'Board',
        props: { title },
        children: lanes.map((lane) => lane.id),
      },
      ...Object.fromEntries(
        lanes.map((lane) => [
          lane.id,
          {
            type: 'BoardLane',
            props: {
              title: lane.title,
              count: 0,
              items: [],
            },
            children: [],
          },
        ]),
      ),
    },
  }
}
