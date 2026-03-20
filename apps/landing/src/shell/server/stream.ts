import type { JsonPatch, Spec } from '@json-render/core'

const encoder = new TextEncoder()

type StreamedSpecOptions = {
  stageRootChildren?: boolean
  stepDelayMs?: number
}

type SpecElement = {
  children?: string[]
} & Record<string, unknown>

function toPatchLines(spec: Spec) {
  const patches: JsonPatch[] = [{ op: 'add', path: '/root', value: spec.root }]

  if (spec.state) {
    patches.push({ op: 'add', path: '/state', value: spec.state })
  }

  for (const [key, element] of Object.entries(spec.elements)) {
    patches.push({
      op: 'add',
      path: `/elements/${key}`,
      value: element,
    })
  }

  return patches
}

function collectSubtreeKeys(
  elements: Spec['elements'],
  elementKey: string,
  seen: Set<string>,
  result: string[],
) {
  if (seen.has(elementKey)) return

  const element = elements[elementKey] as unknown as SpecElement | undefined
  if (!element) return

  seen.add(elementKey)
  result.push(elementKey)

  for (const childKey of Array.isArray(element.children) ? element.children : []) {
    collectSubtreeKeys(elements, childKey, seen, result)
  }
}

function toStagedRootChildPatchBatches(spec: Spec) {
  const rootElement = spec.elements[spec.root] as unknown as SpecElement | undefined
  if (!rootElement) {
    return [toPatchLines(spec)]
  }

  const rootChildren = Array.isArray(rootElement.children) ? rootElement.children : []
  if (rootChildren.length <= 1) {
    return [toPatchLines(spec)]
  }

  const batches: JsonPatch[][] = [
    [
      { op: 'add', path: '/root', value: spec.root },
      ...(spec.state
        ? ([{ op: 'add', path: '/state', value: spec.state }] satisfies JsonPatch[])
        : []),
      {
        op: 'add',
        path: `/elements/${spec.root}`,
        value: {
          ...rootElement,
          children: [],
        },
      },
    ],
  ]
  const seen = new Set<string>([spec.root])
  const visibleChildren: string[] = []

  for (const childKey of rootChildren) {
    const subtreeKeys: string[] = []
    collectSubtreeKeys(spec.elements, childKey, seen, subtreeKeys)
    visibleChildren.push(childKey)

    batches.push([
      ...subtreeKeys.map((key) => ({
        op: 'add' as const,
        path: `/elements/${key}`,
        value: spec.elements[key],
      })),
      {
        op: 'replace',
        path: `/elements/${spec.root}/children`,
        value: [...visibleChildren],
      },
    ])
  }

  return batches
}

export function createShellStream(
  producer: (writer: {
    text: (value: string) => Promise<void>
    spec: (value: Spec, options?: StreamedSpecOptions) => Promise<void>
    pause: (ms: number) => Promise<void>
  }) => Promise<void>,
) {
  return new ReadableStream<Uint8Array>({
    async start(controller) {
      const writeLine = async (line: string) => {
        controller.enqueue(encoder.encode(`${line}\n`))
      }

      try {
        await producer({
          text: async (value) => {
            const lines = value.split('\n')
            for (const line of lines) {
              await writeLine(line)
            }
          },
          spec: async (value, options) => {
            const batches = options?.stageRootChildren
              ? toStagedRootChildPatchBatches(value)
              : [toPatchLines(value)]

            for (const [batchIndex, batch] of batches.entries()) {
              for (const patch of batch) {
                await writeLine(JSON.stringify(patch))
              }

              if (options?.stageRootChildren && batchIndex < batches.length - 1) {
                await new Promise((resolve) => setTimeout(resolve, options.stepDelayMs ?? 260))
              }
            }
          },
          pause: async (ms) => {
            await new Promise((resolve) => setTimeout(resolve, ms))
          },
        })
      } catch (error) {
        controller.error(error)
        return
      }

      controller.close()
    },
  })
}
