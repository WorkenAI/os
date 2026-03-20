'use client'

import BusinessFlowScene from '@/components/BusinessFlowScene'
import type { LandingSceneDefinition } from './types'

const DEFAULT_LANDING_SCENE_ID = 'business-flow'

const LANDING_SCENES: Record<string, LandingSceneDefinition> = {
  'business-flow': {
    id: 'business-flow',
    title: 'Business Flow',
    Component: BusinessFlowScene,
  },
}

export function getLandingScene(sceneId = DEFAULT_LANDING_SCENE_ID): LandingSceneDefinition {
  return LANDING_SCENES[sceneId] ?? LANDING_SCENES[DEFAULT_LANDING_SCENE_ID]
}

export function listLandingScenes(): LandingSceneDefinition[] {
  return Object.values(LANDING_SCENES)
}
