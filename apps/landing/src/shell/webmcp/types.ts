export type JsonSchema =
  | JsonSchemaString
  | JsonSchemaBoolean
  | JsonSchemaNumber
  | JsonSchemaArray
  | JsonSchemaObject

type JsonSchemaBase = {
  description?: string
}

type JsonSchemaString = JsonSchemaBase & {
  type: 'string'
  enum?: string[]
}

type JsonSchemaBoolean = JsonSchemaBase & {
  type: 'boolean'
}

type JsonSchemaNumber = JsonSchemaBase & {
  type: 'number' | 'integer'
}

type JsonSchemaArray = JsonSchemaBase & {
  type: 'array'
  items: JsonSchema
}

export type JsonSchemaObject = JsonSchemaBase & {
  type: 'object'
  properties?: Record<string, JsonSchema>
  required?: string[]
  additionalProperties?: boolean
}

export type WebMcpToolAnnotations = {
  readOnlyHint?: boolean
}

export type WebMcpToolResult = {
  content: Array<{
    type: 'text'
    text: string
  }>
  structuredContent?: unknown
}

export type WebMcpModelContextClient = {
  requestUserInteraction?: (callback: () => Promise<unknown>) => Promise<unknown>
}

export type RegisteredWebMcpTool = {
  name: string
  description: string
  inputSchema?: JsonSchemaObject
  execute: (
    input: Record<string, unknown>,
    client: WebMcpModelContextClient,
  ) => Promise<unknown> | unknown
  annotations?: WebMcpToolAnnotations
}

export type WebMcpModelContext = {
  registerTool: (tool: RegisteredWebMcpTool) => void
  unregisterTool: (name: string) => void
}

export function getBrowserModelContext(): WebMcpModelContext | null {
  if (typeof window === 'undefined') return null

  const maybeNavigator = window.navigator as Navigator & {
    modelContext?: WebMcpModelContext
  }

  return maybeNavigator.modelContext ?? null
}
