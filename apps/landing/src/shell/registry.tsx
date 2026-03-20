'use client'

import { defineRegistry } from '@json-render/react'
import { Fragment, type ReactNode } from 'react'
import { Badge } from '@/components/ui/badge'
import { DOMAIN_IDS } from '@/domains/registry'
import { cn } from '@/lib/utils'
import { shellUiTokens } from '@/shell/layout/ui-tokens'
import { resolveEntityTypeFromView } from '@/shell/runtime/domain/catalog'
import { useWorkenMockRuntime } from '@/shell/runtime/mock-os-runtime'
import { useShellSession } from '@/shell/session/context'
import {
  executeShellVerb,
  navigateShellPath,
  openShellInspector,
  selectShellEntities,
} from '@/shell/session/dispatch'
import { useShellTheme } from '@/shell/theme'
import { shellCatalog } from './catalog'

const gapMap = { xs: 'gap-1', sm: 'gap-2', md: 'gap-4', lg: 'gap-6', xl: 'gap-8' } as const

const trendColors = {
  up: 'text-emerald-400',
  down: 'text-red-400',
  neutral: 'text-zinc-400',
} as const

const statusColors = {
  green: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  yellow: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  red: 'bg-red-500/20 text-red-400 border-red-500/30',
  blue: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
  gray: 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30',
} as const

const defaultDomainId = DOMAIN_IDS[0] ?? ''

const codeKeywords = new Set([
  'as',
  'async',
  'await',
  'boolean',
  'break',
  'case',
  'catch',
  'class',
  'const',
  'continue',
  'default',
  'delete',
  'do',
  'else',
  'enum',
  'export',
  'extends',
  'false',
  'finally',
  'for',
  'from',
  'function',
  'if',
  'implements',
  'import',
  'in',
  'interface',
  'let',
  'new',
  'null',
  'number',
  'of',
  'private',
  'protected',
  'public',
  'return',
  'static',
  'string',
  'switch',
  'throw',
  'true',
  'try',
  'type',
  'typeof',
  'undefined',
  'var',
  'void',
  'while',
])

const inlineMarkdownPattern = /(`[^`]+`|\*\*[^*]+\*\*|__[^_]+__|\*[^*]+\*|_[^_]+_)/g
const codeTokenPattern =
  /(\/\/.*$|"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`|\b(?:as|async|await|boolean|break|case|catch|class|const|continue|default|delete|do|else|enum|export|extends|false|finally|for|from|function|if|implements|import|in|interface|let|new|null|number|of|private|protected|public|return|static|string|switch|throw|true|try|type|typeof|undefined|var|void|while)\b|\b[a-zA-Z_$][a-zA-Z0-9_$]*\b|\b\d+(?:\.\d+)?\b|[{}()[\].,:;=+\-*/%<>!&|^?]+)/g

type MarkdownBlock =
  | { kind: 'paragraph'; text: string }
  | { kind: 'heading'; level: 1 | 2 | 3 | 4; text: string }
  | { kind: 'bullet'; items: string[] }
  | { kind: 'ordered'; items: string[] }
  | { kind: 'quote'; text: string }

function parseMarkdownBlocks(raw: string): MarkdownBlock[] {
  const lines = raw.split('\n')
  const blocks: MarkdownBlock[] = []
  const paragraphBuffer: string[] = []

  const flushParagraph = () => {
    const text = paragraphBuffer.join(' ').trim()
    if (!text) return
    blocks.push({ kind: 'paragraph', text })
    paragraphBuffer.length = 0
  }

  let index = 0
  while (index < lines.length) {
    const line = lines[index]?.trimEnd() ?? ''
    const trimmed = line.trim()

    if (!trimmed) {
      flushParagraph()
      index += 1
      continue
    }

    const headingMatch = /^#{1,4}\s+(.*)$/.exec(trimmed)
    if (headingMatch) {
      flushParagraph()
      const headingMarker = headingMatch[0].split(' ')[0] ?? '#'
      blocks.push({
        kind: 'heading',
        level: Math.min(4, Math.max(1, headingMarker.length)) as 1 | 2 | 3 | 4,
        text: headingMatch[1]?.trim() ?? '',
      })
      index += 1
      continue
    }

    if (trimmed.startsWith('> ')) {
      flushParagraph()
      const quoteLines: string[] = []
      let quoteIndex = index
      while (quoteIndex < lines.length) {
        const quoteLine = (lines[quoteIndex] ?? '').trim()
        if (!quoteLine.startsWith('> ')) break
        quoteLines.push(quoteLine.slice(2))
        quoteIndex += 1
      }
      blocks.push({ kind: 'quote', text: quoteLines.join(' ') })
      index = quoteIndex
      continue
    }

    const bulletMatch = /^[-*]\s+(.+)$/.exec(trimmed)
    if (bulletMatch) {
      flushParagraph()
      const items: string[] = []
      let itemIndex = index
      while (itemIndex < lines.length) {
        const itemLine = (lines[itemIndex] ?? '').trim()
        const itemMatch = /^[-*]\s+(.+)$/.exec(itemLine)
        if (!itemMatch) break
        items.push(itemMatch[1] ?? '')
        itemIndex += 1
      }
      blocks.push({ kind: 'bullet', items })
      index = itemIndex
      continue
    }

    const orderedMatch = /^\d+\.\s+(.+)$/.exec(trimmed)
    if (orderedMatch) {
      flushParagraph()
      const items: string[] = []
      let itemIndex = index
      while (itemIndex < lines.length) {
        const itemLine = (lines[itemIndex] ?? '').trim()
        const itemMatch = /^\d+\.\s+(.+)$/.exec(itemLine)
        if (!itemMatch) break
        items.push(itemMatch[1] ?? '')
        itemIndex += 1
      }
      blocks.push({ kind: 'ordered', items })
      index = itemIndex
      continue
    }

    paragraphBuffer.push(trimmed)
    index += 1
  }

  flushParagraph()
  return blocks
}

function renderInlineMarkdown(text: string, isLight: boolean): ReactNode[] {
  const matches = [...text.matchAll(inlineMarkdownPattern)]
  if (matches.length === 0) return [text]

  const nodes: ReactNode[] = []
  let cursor = 0

  for (const [match] of matches) {
    const start = text.indexOf(match, cursor)
    if (start > cursor) nodes.push(text.slice(cursor, start))

    if (match.startsWith('`') && match.endsWith('`')) {
      nodes.push(
        <code
          key={`${start}-inline-code`}
          className={cn(
            'rounded px-1.5 py-0.5 font-mono text-[0.85em]',
            isLight ? 'bg-zinc-200 text-cyan-700' : 'bg-zinc-800 text-cyan-300',
          )}
        >
          {match.slice(1, -1)}
        </code>,
      )
    } else if (
      (match.startsWith('**') && match.endsWith('**')) ||
      (match.startsWith('__') && match.endsWith('__'))
    ) {
      nodes.push(<strong key={`${start}-inline-strong`}>{match.slice(2, -2)}</strong>)
    } else if (
      (match.startsWith('*') && match.endsWith('*')) ||
      (match.startsWith('_') && match.endsWith('_'))
    ) {
      nodes.push(<em key={`${start}-inline-em`}>{match.slice(1, -1)}</em>)
    } else {
      nodes.push(match)
    }

    cursor = start + match.length
  }

  if (cursor < text.length) nodes.push(text.slice(cursor))
  return nodes
}

function renderCodeLine(line: string, isLight: boolean): ReactNode[] {
  if (!line) return [' ']
  const nodes: ReactNode[] = []
  let cursor = 0
  const matches = [...line.matchAll(codeTokenPattern)]

  for (const match of matches) {
    const token = match[0]
    const start = match.index ?? 0

    if (start > cursor) {
      nodes.push(<span key={`${cursor}-raw`}>{line.slice(cursor, start)}</span>)
    }

    let tokenClass = ''
    if (token.startsWith('//')) {
      tokenClass = isLight ? 'text-zinc-500' : 'text-zinc-500'
    } else if (
      (token.startsWith('"') && token.endsWith('"')) ||
      (token.startsWith("'") && token.endsWith("'")) ||
      (token.startsWith('`') && token.endsWith('`'))
    ) {
      tokenClass = isLight ? 'text-emerald-700' : 'text-emerald-300'
    } else if (/^\d+(\.\d+)?$/.test(token)) {
      tokenClass = isLight ? 'text-orange-700' : 'text-orange-300'
    } else if (codeKeywords.has(token)) {
      tokenClass = isLight ? 'text-blue-700' : 'text-blue-300'
    } else if (/^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(token)) {
      // identifiers (variables) — light theme: darker, dark theme: lighter
      tokenClass = isLight ? 'text-amber-950' : 'text-white'
    } else if (/^[{}()[\].,:;=+\-*/%<>!&|^?]+$/.test(token)) {
      tokenClass = isLight ? 'text-zinc-600' : 'text-zinc-400'
    }

    nodes.push(
      <span key={`${start}-${token}`} className={tokenClass}>
        {token}
      </span>,
    )
    cursor = start + token.length
  }

  if (cursor < line.length) {
    nodes.push(<span key={`${cursor}-tail`}>{line.slice(cursor)}</span>)
  }

  return nodes
}

function resolveDefaultEntityType(entityMap: Record<string, unknown> | undefined) {
  if (!entityMap) return null
  const [firstEntityId] = Object.keys(entityMap)
  return firstEntityId ?? null
}

function useRuntimeViewData() {
  const { activeView, domain } = useShellSession()
  const { getViewData } = useWorkenMockRuntime()

  return getViewData(domain?.id ?? defaultDomainId, activeView)
}

export const { registry, handlers, executeAction } = defineRegistry(shellCatalog, {
  components: {
    Stack: ({ props, children }) => (
      <div
        className={cn(
          'flex',
          props.direction === 'horizontal' ? 'flex-row' : 'flex-col',
          gapMap[props.gap ?? 'md'],
          props.align && `items-${props.align}`,
          props.justify === 'between'
            ? 'justify-between'
            : props.justify && `justify-${props.justify}`,
        )}
      >
        {children}
      </div>
    ),

    Heading: ({ props }) => {
      const { theme } = useShellTheme()
      const Tag = `h${props.level ?? '2'}` as 'h1' | 'h2' | 'h3' | 'h4'
      const sizes = { '1': 'text-2xl', '2': 'text-xl', '3': 'text-lg', '4': 'text-base' }
      const colorClass = theme === 'light' ? 'text-[rgb(91,67,51)]' : 'text-zinc-50'
      const weight = props.level === '1' ? 'font-bold' : 'font-semibold'
      return (
        <Tag className={cn(weight, 'tracking-tight', colorClass, sizes[props.level ?? '2'])}>
          {props.text}
        </Tag>
      )
    },

    Text: ({ props }) => {
      const { theme } = useShellTheme()
      const isLight = theme === 'light'
      const baseTone = cn(
        props.variant === 'muted' && (isLight ? 'text-zinc-600' : 'text-zinc-400'),
        (!props.variant || props.variant === 'default') &&
          (isLight ? 'text-zinc-700' : 'text-zinc-300'),
      )
      const style = {
        ...(props.variant === 'accent' ? { color: 'var(--shell-accent)' } : {}),
        ...props.style,
      }
      const hasStyle = Object.keys(style).length > 0
      const blocks = parseMarkdownBlocks(props.text)

      if (blocks.length === 0) {
        return (
          <p
            className={cn('text-sm leading-relaxed', baseTone)}
            style={hasStyle ? style : undefined}
          >
            {props.text}
          </p>
        )
      }

      return (
        <div
          className={cn('text-sm leading-relaxed', baseTone)}
          style={hasStyle ? style : undefined}
        >
          {blocks.map((block, blockIndex) => {
            if (block.kind === 'heading') {
              const headingClassByLevel: Record<1 | 2 | 3 | 4, string> = {
                1: isLight ? 'text-zinc-900 text-lg' : 'text-zinc-100 text-lg',
                2: isLight ? 'text-zinc-900 text-base' : 'text-zinc-100 text-base',
                3: isLight ? 'text-zinc-900 text-sm' : 'text-zinc-100 text-sm',
                4: isLight ? 'text-zinc-800 text-sm' : 'text-zinc-200 text-sm',
              }
              return (
                <p
                  key={`${block.kind}-${blockIndex}`}
                  className={cn(
                    'mt-3 mb-1 font-semibold first:mt-0',
                    headingClassByLevel[block.level],
                  )}
                >
                  {renderInlineMarkdown(block.text, isLight)}
                </p>
              )
            }

            if (block.kind === 'quote') {
              return (
                <blockquote
                  key={`${block.kind}-${blockIndex}`}
                  className={cn(
                    'my-2 border-l-2 pl-3 italic',
                    isLight ? 'border-zinc-300 text-zinc-600' : 'border-zinc-700 text-zinc-400',
                  )}
                >
                  {renderInlineMarkdown(block.text, isLight)}
                </blockquote>
              )
            }

            if (block.kind === 'bullet' || block.kind === 'ordered') {
              const ListTag = block.kind === 'ordered' ? 'ol' : 'ul'
              return (
                <ListTag
                  key={`${block.kind}-${blockIndex}`}
                  className={cn(
                    'my-2 space-y-1.5 pl-5 marker:text-zinc-500',
                    block.kind === 'ordered' ? 'list-decimal' : 'list-disc',
                  )}
                >
                  {block.items.map((item, itemIndex) => (
                    <li key={`${block.kind}-${blockIndex}-${itemIndex}`}>
                      {renderInlineMarkdown(item, isLight)}
                    </li>
                  ))}
                </ListTag>
              )
            }

            return (
              <p
                key={`${block.kind}-${blockIndex}`}
                className={cn('my-1.5', isLight && 'text-[#a18877]')}
              >
                {renderInlineMarkdown(block.text, isLight)}
              </p>
            )
          })}
        </div>
      )
    },

    CodeBlock: ({ props }) => {
      const { theme } = useShellTheme()
      const isLight = theme === 'light'
      const lines = props.code.split('\n')

      return (
        <div
          className={cn(
            'overflow-hidden rounded-xl border',
            isLight ? 'border-zinc-300/80 bg-[#f8f2ec]' : 'border-zinc-800 bg-zinc-950/80',
          )}
        >
          <div
            className={cn(
              'border-b px-3 py-1.5 text-[10px] uppercase tracking-[0.2em]',
              isLight ? 'border-zinc-300 text-zinc-600' : 'border-zinc-700/70 text-zinc-500',
            )}
          >
            {props.language ?? 'typescript'}
          </div>
          <div className="overflow-x-auto px-0.5 py-2">
            <pre className="m-0 font-mono text-xs leading-relaxed">
              {lines.map((line, index) => (
                <div key={`${index}-${line}`} className="flex">
                  <span
                    className={cn(
                      'w-10 shrink-0 pr-3 text-right select-none',
                      isLight ? 'text-zinc-400' : 'text-zinc-600',
                    )}
                  >
                    {index + 1}
                  </span>
                  <code
                    className={cn(
                      'block flex-1 pr-3 whitespace-pre',
                      isLight ? 'text-zinc-800' : 'text-zinc-200',
                    )}
                  >
                    {renderCodeLine(line, isLight).map((node, tokenIndex) => (
                      <Fragment key={`${index}-${tokenIndex}`}>{node}</Fragment>
                    ))}
                  </code>
                </div>
              ))}
            </pre>
          </div>
        </div>
      )
    },

    MetricCard: ({ props }) => (
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
        <p className="text-xs font-medium text-zinc-400">{props.label}</p>
        <p className="mt-1 text-2xl font-bold text-zinc-50">{props.value}</p>
        {props.change && (
          <p className={cn('mt-1 text-xs font-medium', trendColors[props.trend ?? 'neutral'])}>
            {props.trend === 'up' && '↑ '}
            {props.trend === 'down' && '↓ '}
            {props.change}
          </p>
        )}
      </div>
    ),

    MetricStrip: ({ props }) => {
      const runtimeViewData = useRuntimeViewData()
      const metrics = runtimeViewData?.metrics ?? props.metrics

      return (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {metrics.map((m, i) => (
            <div key={i} className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
              <p className="text-xs font-medium text-zinc-400">{m.label}</p>
              <p className="mt-1 text-2xl font-bold text-zinc-50">{m.value}</p>
              {m.change && (
                <p className={cn('mt-1 text-xs font-medium', trendColors[m.trend ?? 'neutral'])}>
                  {m.trend === 'up' && '↑ '}
                  {m.trend === 'down' && '↓ '}
                  {m.change}
                </p>
              )}
            </div>
          ))}
        </div>
      )
    },

    EntityTable: ({ props }) => {
      const { activeView, domain } = useShellSession()
      const runtimeViewData = useRuntimeViewData()
      const entityType =
        resolveEntityTypeFromView(domain?.id ?? defaultDomainId, activeView) ??
        resolveDefaultEntityType(domain?.entities)
      if (!entityType) return null
      const rows = runtimeViewData?.tableRows ?? props.rows

      return (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 overflow-hidden">
          {props.title && (
            <div className="border-b border-zinc-800 px-4 py-3">
              <h3 className="text-sm font-semibold text-zinc-200">{props.title}</h3>
            </div>
          )}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800">
                  {props.columns.map((col) => (
                    <th
                      key={col.key}
                      className="px-4 py-2.5 text-left text-xs font-medium text-zinc-400"
                    >
                      {col.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => {
                  const rowId = String(row.id ?? `row-${i}`)
                  return (
                    <tr
                      key={rowId}
                      className="cursor-pointer border-b border-zinc-800/50 transition-colors hover:bg-[rgba(var(--shell-accent-rgb),0.05)]"
                      onClick={() => openShellInspector({ entityType, id: rowId })}
                    >
                      {props.columns.map((col) => (
                        <td key={col.key} className="px-4 py-2.5 text-zinc-300">
                          {col.format === 'badge' ? (
                            <Badge variant="secondary" className="text-xs">
                              {String(row[col.key] ?? '')}
                            </Badge>
                          ) : (
                            String(row[col.key] ?? '')
                          )}
                        </td>
                      ))}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )
    },

    BoardLane: ({ props }) => {
      const { activeView, domain } = useShellSession()
      const runtimeViewData = useRuntimeViewData()
      const entityType =
        resolveEntityTypeFromView(domain?.id ?? defaultDomainId, activeView) ??
        resolveDefaultEntityType(domain?.entities)
      if (!entityType) return null
      const laneData = runtimeViewData?.boardLanes?.[props.title]
      const items = laneData?.items ?? props.items
      const count = laneData?.count ?? props.count

      return (
        <div
          className={cn(
            'flex shrink-0 flex-col rounded-xl border border-zinc-800 bg-zinc-900/30',
            shellUiTokens.sidebarDesktopWidthClass,
          )}
        >
          <div className="flex items-center justify-between border-b border-zinc-800 px-3 py-2.5">
            <span className="text-sm font-medium text-zinc-200">{props.title}</span>
            {count != null && (
              <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-xs text-zinc-400">
                {count}
              </span>
            )}
          </div>
          <div className="flex flex-col gap-2 p-2">
            {items.map((item) => (
              <div
                key={item.id}
                className="cursor-pointer rounded-lg border border-zinc-800/50 bg-zinc-900/50 p-3 transition-colors hover:border-[rgba(var(--shell-accent-rgb),0.2)] hover:bg-[rgba(var(--shell-accent-rgb),0.05)]"
                onClick={() => openShellInspector({ entityType, id: item.id })}
              >
                <p className="text-sm font-medium text-zinc-200">{item.title}</p>
                {item.subtitle && <p className="mt-0.5 text-xs text-zinc-400">{item.subtitle}</p>}
                {item.badge && (
                  <Badge variant="secondary" className="mt-2 text-xs">
                    {item.badge}
                  </Badge>
                )}
              </div>
            ))}
          </div>
        </div>
      )
    },

    Board: ({ props, children }) => {
      const runtimeViewData = useRuntimeViewData()
      const title = runtimeViewData?.boardTitle ?? props.title

      return (
        <div>
          {title && <h3 className="mb-3 text-sm font-semibold text-zinc-200">{title}</h3>}
          <div className="flex gap-3 overflow-x-auto pb-2">{children}</div>
        </div>
      )
    },

    ActivityItem: ({ props }) => (
      <div className="flex items-start gap-3 py-2">
        <div className="shell-accent-dot mt-1.5 h-2 w-2 shrink-0 rounded-full" />
        <div className="min-w-0 flex-1">
          <p className="text-sm text-zinc-300">
            <span className="font-medium text-zinc-200">{props.actor}</span> {props.action}
            {props.target && <span className="font-medium text-zinc-200"> {props.target}</span>}
          </p>
          <p className="text-xs text-zinc-500">{props.time}</p>
        </div>
      </div>
    ),

    ActivityFeed: ({ props }) => {
      const runtimeViewData = useRuntimeViewData()
      const items = runtimeViewData?.activity ?? props.items

      return (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/30">
          {props.title && (
            <div className="border-b border-zinc-800 px-4 py-3">
              <h3 className="text-sm font-semibold text-zinc-200">{props.title}</h3>
            </div>
          )}
          <div className="divide-y divide-zinc-800/50 px-4">
            {items.map((item, i) => (
              <div key={i} className="flex items-start gap-3 py-3">
                <div className="shell-accent-dot mt-1.5 h-2 w-2 shrink-0 rounded-full" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-zinc-300">
                    <span className="font-medium text-zinc-200">{item.actor}</span> {item.action}
                    {item.target && (
                      <span className="font-medium text-zinc-200"> {item.target}</span>
                    )}
                  </p>
                  <p className="text-xs text-zinc-500">{item.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )
    },

    EmptyState: ({ props }) => (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-zinc-800 py-12 text-center">
        {props.icon && <span className="mb-3 text-3xl opacity-40">{props.icon}</span>}
        <p className="text-sm font-medium text-zinc-300">{props.title}</p>
        {props.description && <p className="mt-1 text-xs text-zinc-500">{props.description}</p>}
      </div>
    ),

    StatusBadge: ({ props }) => (
      <span
        className={cn(
          'inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium',
          statusColors[props.color ?? 'gray'],
        )}
      >
        {props.label}
      </span>
    ),
  },

  actions: {
    navigate: async (params) => {
      if (params) navigateShellPath(params.path)
    },
    select: async (params) => {
      if (params) selectShellEntities(params)
    },
    openInspector: async (params) => {
      if (params) openShellInspector(params)
    },
    executeVerb: async (params) => {
      if (params) {
        executeShellVerb({
          verb: params.verb,
          entityType: params.target.entityType,
          ids: params.target.ids,
        })
      }
    },
  },
})
