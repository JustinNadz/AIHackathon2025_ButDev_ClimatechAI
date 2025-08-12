declare module "@ai-sdk/react" {
  // Legacy helper shape expected by the app's chat panel
  export interface LegacyUseChatHelpers {
    id?: string
    messages: any[]
    input: string
    handleInputChange: (event: any) => void
    handleSubmit: (event?: any) => void
    isLoading: boolean
    // Keep common helpers loosely typed to allow current usage
    sendMessage?: (content: any) => Promise<void> | void
    regenerate?: () => Promise<void> | void
    stop?: () => void
    status?: string
    error?: Error | undefined
  }

  // Overload that returns the legacy-friendly helpers and accepts any options (so `api` is allowed)
  export function useChat(options?: any): LegacyUseChatHelpers
} 