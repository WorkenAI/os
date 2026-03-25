import type { Spec } from '@json-render/core'

type LegacyNode = {
  type?: unknown
  children?: unknown
  direction?: unknown
  gap?: unknown
  align?: unknown
  justify?: unknown
  text?: unknown
  level?: unknown
  style?: unknown
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function asString(value: unknown): string | null {
  return typeof value === 'string' ? value : null
}

function asNumber(value: unknown): number | null {
  return typeof value === 'number' ? value : null
}

function mapDirection(value: unknown): 'horizontal' | 'vertical' | null {
  if (value === 'row') return 'horizontal'
  if (value === 'column') return 'vertical'
  return null
}

function mapGap(value: unknown): 'xs' | 'sm' | 'md' | 'lg' | 'xl' | null {
  if (typeof value === 'string') {
    if (value === 'xs' || value === 'sm' || value === 'md' || value === 'lg' || value === 'xl') {
      return value
    }
    return null
  }

  const numeric = asNumber(value)
  if (numeric == null) return null
  if (numeric <= 2) return 'xs'
  if (numeric <= 6) return 'sm'
  if (numeric <= 12) return 'md'
  if (numeric <= 20) return 'lg'
  return 'xl'
}

function mapAlign(value: unknown): 'start' | 'center' | 'end' | 'stretch' | null {
  if (value === 'start' || value === 'center' || value === 'end' || value === 'stretch')
    return value
  if (value === 'flex-start') return 'start'
  if (value === 'flex-end') return 'end'
  return null
}

function mapJustify(value: unknown): 'start' | 'center' | 'end' | 'between' | null {
  if (value === 'start' || value === 'center' || value === 'end' || value === 'between')
    return value
  if (value === 'flex-start') return 'start'
  if (value === 'flex-end') return 'end'
  if (value === 'space-between') return 'between'
  return null
}

function mapHeadingLevel(value: unknown): '1' | '2' | '3' | '4' | null {
  const asText = typeof value === 'number' ? String(value) : asString(value)
  if (asText === '1' || asText === '2' || asText === '3' || asText === '4') return asText
  return null
}

function inferTextVariant(style: unknown): 'default' | 'muted' | 'accent' | null {
  if (!isRecord(style)) return null
  const color = asString(style.color)
  if (!color) return null

  if (color.includes('a1a1aa') || color.includes('71717a') || color.includes('zinc')) {
    return 'muted'
  }
  return null
}

function isCodeLikeText(node: LegacyNode) {
  if (!isRecord(node.style)) return false
  const fontFamily = asString(node.style.fontFamily)
  const text = asString(node.text) ?? ''
  return fontFamily === 'monospace' && text.includes('\n')
}

function getCodeTextFromLegacyContainer(node: LegacyNode): string | null {
  if (!Array.isArray(node.children)) return null

  const chunks = node.children
    .filter(isLegacyNode)
    .filter((child) => child.type === 'text')
    .map((child) => asString(child.text) ?? '')
    .filter((text) => text.length > 0)

  if (chunks.length === 0) return null
  return chunks.join('\n')
}

function isCodeLikeContainer(node: LegacyNode) {
  if (node.type !== 'flex') return false
  if (!isRecord(node.style)) return false
  const fontFamily = asString(node.style.fontFamily)
  if (fontFamily !== 'monospace') return false
  return getCodeTextFromLegacyContainer(node) != null
}

function isSpec(value: unknown): value is Spec {
  if (!isRecord(value)) return false
  return typeof value.root === 'string' && isRecord(value.elements)
}

function isLegacyNode(value: unknown): value is LegacyNode {
  return isRecord(value) && typeof value.type === 'string'
}

export function normalizeDomainSpec(value: unknown): Spec | null {
  if (isSpec(value)) return value
  if (!isLegacyNode(value)) return null

  let nextId = 0
  const elements: Spec['elements'] = {}

  const visit = (node: LegacyNode): string => {
    nextId += 1
    const id = `node-${nextId}`
    const children = Array.isArray(node.children)
      ? node.children.filter(isLegacyNode).map((child) => visit(child))
      : []
    const type = asString(node.type)

    if (isCodeLikeContainer(node)) {
      elements[id] = {
        type: 'CodeBlock',
        props: {
          code: getCodeTextFromLegacyContainer(node) ?? '',
          language: 'typescript',
        },
        children: [],
      }
      return id
    }

    if (type === 'heading') {
      elements[id] = {
        type: 'Heading',
        props: {
          text: asString(node.text) ?? '',
          level: mapHeadingLevel(node.level),
        },
        children: [],
      }
      return id
    }

    if (type === 'text') {
      if (isCodeLikeText(node)) {
        elements[id] = {
          type: 'CodeBlock',
          props: {
            code: asString(node.text) ?? '',
            language: 'typescript',
          },
          children: [],
        }
        return id
      }

      elements[id] = {
        type: 'Text',
        props: {
          text: asString(node.text) ?? '',
          variant: inferTextVariant(node.style),
        },
        children: [],
      }
      return id
    }

    if (type === 'grid') {
      // Fallback for legacy grid blocks: keep child order in a vertical stack.
      elements[id] = {
        type: 'Stack',
        props: {
          direction: 'vertical',
          gap: mapGap(node.gap),
          align: null,
          justify: null,
        },
        children,
      }
      return id
    }

    elements[id] = {
      type: 'Stack',
      props: {
        direction: mapDirection(node.direction),
        gap: mapGap(node.gap),
        align: mapAlign(node.align),
        justify: mapJustify(node.justify),
      },
      children,
    }
    return id
  }

  const root = visit(value)
  return { root, elements }
}
