'use client'

import type { SemanticIR } from '@worken/semantic-ir'
import { createContext, useContext, type ReactNode } from 'react'

const SemanticIrContext = createContext<SemanticIR | null>(null)

export function SemanticIrProvider({
  ir,
  children,
}: {
  ir: SemanticIR
  children: ReactNode
}) {
  return <SemanticIrContext.Provider value={ir}>{children}</SemanticIrContext.Provider>
}

export function useSemanticIr(): SemanticIR | null {
  return useContext(SemanticIrContext)
}
