import { defineCatalog } from '@json-render/core'
import { schema } from '@json-render/react/schema'
import { z } from 'zod'

export const shellCatalog = defineCatalog(schema, {
  components: {
    Stack: {
      props: z.object({
        direction: z.enum(['horizontal', 'vertical']).nullable(),
        gap: z.enum(['xs', 'sm', 'md', 'lg', 'xl']).nullable(),
        align: z.enum(['start', 'center', 'end', 'stretch']).nullable(),
        justify: z.enum(['start', 'center', 'end', 'between']).nullable(),
      }),
      slots: ['default'],
      description: 'Flex container for layouts',
    },
    Heading: {
      props: z.object({
        text: z.string(),
        level: z.enum(['1', '2', '3', '4']).nullable(),
      }),
      description: 'Section heading',
    },
    Text: {
      props: z.object({
        text: z.string(),
        variant: z.enum(['default', 'muted', 'accent']).nullable(),
        style: z
          .object({
            fontWeight: z.number().optional(),
            fontSize: z.union([z.number(), z.string()]).optional(),
            color: z.string().optional(),
          })
          .passthrough()
          .optional(),
      }),
      description: 'Paragraph text',
    },
    CodeBlock: {
      props: z.object({
        code: z.string(),
        language: z.string().nullable(),
      }),
      description: 'Preformatted code block with readable styling',
    },
    MetricCard: {
      props: z.object({
        label: z.string(),
        value: z.union([z.string(), z.number()]),
        change: z.string().nullable(),
        trend: z.enum(['up', 'down', 'neutral']).nullable(),
      }),
      description: 'Single KPI metric with optional trend',
    },
    MetricStrip: {
      props: z.object({
        metrics: z.array(
          z.object({
            label: z.string(),
            value: z.union([z.string(), z.number()]),
            change: z.string().nullable(),
            trend: z.enum(['up', 'down', 'neutral']).nullable(),
          }),
        ),
      }),
      description: 'Horizontal strip of KPI metrics',
    },
    EntityTable: {
      props: z.object({
        title: z.string().nullable(),
        columns: z.array(
          z.object({
            key: z.string(),
            label: z.string(),
            format: z.enum(['text', 'date', 'currency', 'badge', 'avatar']).nullable(),
          }),
        ),
        rows: z.array(z.record(z.string(), z.unknown())),
        selectable: z.boolean().nullable(),
      }),
      description: 'Data table for any entity type',
    },
    BoardLane: {
      props: z.object({
        title: z.string(),
        count: z.number().nullable(),
        accent: z.string().nullable(),
        items: z.array(
          z.object({
            id: z.string(),
            title: z.string(),
            subtitle: z.string().nullable(),
            badge: z.string().nullable(),
          }),
        ),
      }),
      description: 'Single kanban board lane with cards',
    },
    Board: {
      props: z.object({
        title: z.string().nullable(),
      }),
      slots: ['default'],
      description: 'Kanban board container for BoardLane components',
    },
    ActivityItem: {
      props: z.object({
        actor: z.string(),
        action: z.string(),
        target: z.string().nullable(),
        time: z.string(),
      }),
      description: 'Single activity feed entry',
    },
    ActivityFeed: {
      props: z.object({
        title: z.string().nullable(),
        items: z.array(
          z.object({
            actor: z.string(),
            action: z.string(),
            target: z.string().nullable(),
            time: z.string(),
          }),
        ),
      }),
      description: 'Activity timeline feed',
    },
    EmptyState: {
      props: z.object({
        title: z.string(),
        description: z.string().nullable(),
        icon: z.string().nullable(),
      }),
      description: 'Placeholder for empty content areas',
    },
    StatusBadge: {
      props: z.object({
        label: z.string(),
        color: z.enum(['green', 'yellow', 'red', 'blue', 'gray']).nullable(),
      }),
      description: 'Colored status indicator badge',
    },
  },

  actions: {
    navigate: {
      params: z.object({ path: z.string() }),
      description: 'Navigate to a route',
    },
    select: {
      params: z.object({ entityType: z.string(), ids: z.array(z.string()) }),
      description: 'Select entities',
    },
    openInspector: {
      params: z.object({ entityType: z.string(), id: z.string() }),
      description: 'Open entity in the inspector panel',
    },
    executeVerb: {
      params: z.object({
        verb: z.string(),
        target: z.object({ entityType: z.string(), ids: z.array(z.string()) }),
      }),
      description: 'Execute a domain action',
    },
  },
})
