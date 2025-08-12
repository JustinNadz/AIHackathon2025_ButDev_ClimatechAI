/* Runtime shim: adapts @ai-sdk/react useChat signature to older helpers shape. */
import { useState, useMemo, useCallback } from "react"
// Import the actual implementation directly from the built file to avoid path alias recursion
import { useChat as baseUseChat } from "@ai-sdk/react/dist/index.mjs"

export function useChat(options?: any) {
  // create local input state to emulate legacy API
  const [input, setInput] = useState<string>("")

  const helpers = baseUseChat(options)

  const handleInputChange = useCallback((e: any) => {
    setInput(e?.target?.value ?? "")
  }, [])

  const handleSubmit = useCallback(
    (e?: any) => {
      e?.preventDefault?.()
      const content = input.trim()
      if (!content) return
      // If sendMessage exists, use it; else no-op keeps UI working
      ;(helpers as any).sendMessage?.({
        role: "user",
        content,
      })
      setInput("")
    },
    [input, helpers]
  )

  const isLoading = useMemo(() => (helpers as any).status === "in_progress" || (helpers as any).status === "generating", [helpers])

  return {
    ...(helpers as any),
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
  }
} 