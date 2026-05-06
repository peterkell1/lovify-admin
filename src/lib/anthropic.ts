import Anthropic from '@anthropic-ai/sdk'

const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY as string | undefined

let client: Anthropic | null = null

export function getAnthropicClient(): Anthropic {
  if (!apiKey) {
    throw new Error(
      'VITE_ANTHROPIC_API_KEY is not set. Add it to .env.local to enable AI features.'
    )
  }
  if (!client) {
    client = new Anthropic({
      apiKey,
      dangerouslyAllowBrowser: true,
    })
  }
  return client
}

export function isAiConfigured(): boolean {
  return !!apiKey
}
