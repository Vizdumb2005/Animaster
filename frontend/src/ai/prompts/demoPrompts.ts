/**
 * ai/prompts/demoPrompts.ts
 *
 * 10 demonstration prompts showcasing the full range of the AI Director:
 * emotions, speeds, complex action sequences, multi-character, editing.
 */

export interface DemoPrompt {
  id: string
  label: string
  prompt: string
  description: string
  category: 'emotion' | 'action' | 'complex' | 'edit' | 'multi'
  emoji: string
}

export const DEMO_PROMPTS: DemoPrompt[] = [
  {
    id: 'sad-walk-sit',
    label: 'Sad Walk & Sit',
    prompt: 'A sad stickman slowly walks to the center and sits down',
    description: 'Demonstrates emotion modifiers: slower walk, heavy sit',
    category: 'emotion',
    emoji: '😔',
  },
  {
    id: 'excited-wave',
    label: 'Excited Wave',
    prompt: 'Make bob wave excitedly',
    description: 'Excited emotion: faster, more energetic wave gesture',
    category: 'emotion',
    emoji: '🎉',
  },
  {
    id: 'tired-collapse',
    label: 'Tired Collapse',
    prompt: 'The tired character hesitates, then collapses onto the ground',
    description: 'Hesitation + collapse decomposition with tired emotion',
    category: 'complex',
    emoji: '😴',
  },
  {
    id: 'angry-run',
    label: 'Angry Run',
    prompt: 'Make him angry and run',
    description: 'Emotion edit + context: applies angry modifier to running',
    category: 'edit',
    emoji: '😡',
  },
  {
    id: 'nervous-look',
    label: 'Nervous & Walk Away',
    prompt: 'A nervous stickman hesitates, looks around, then walks away quickly',
    description: 'Multi-action sequence with nervous modifiers',
    category: 'complex',
    emoji: '😰',
  },
  {
    id: 'happy-sequence',
    label: 'Happy Full Sequence',
    prompt: 'A happy stickman runs right, jumps, and then waves',
    description: 'Full 3-action decomposition: run→jump→fall→wave',
    category: 'action',
    emoji: '🏃',
  },
  {
    id: 'make-slower',
    label: 'Make It Slower',
    prompt: 'Make the walk slower and more tired',
    description: 'Intent edit: applies speed scaling + emotion change to existing plan',
    category: 'edit',
    emoji: '🐌',
  },
  {
    id: 'anticipation',
    label: 'Anticipation Before Jump',
    prompt: 'Add anticipation before the jump',
    description: 'Intent edit: inserts hesitation idle step before jump clip',
    category: 'edit',
    emoji: '⏱️',
  },
  {
    id: 'multi-character',
    label: 'Two Characters',
    prompt: 'Bob walks right and waves, then ava runs to meet him and they both sit',
    description: 'Multi-character scene with sequential actions',
    category: 'multi',
    emoji: '👫',
  },
  {
    id: 'reset-idle',
    label: 'Reset to Idle',
    prompt: 'Reset everything to idle',
    description: 'Reset: clears all generated plans, returns to example scene',
    category: 'edit',
    emoji: '🔄',
  },
]

export const CATEGORY_LABELS: Record<DemoPrompt['category'], string> = {
  emotion: 'Emotion',
  action: 'Action',
  complex: 'Complex',
  edit: 'Edit',
  multi: 'Multi-Character',
}
