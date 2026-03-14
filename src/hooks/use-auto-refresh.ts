import { useEffect, useRef } from "react"

/**
 * Polls `callback` every `intervalMs` milliseconds.
 * The callback is also called immediately on mount (initial load is handled
 * by the caller, so we skip the immediate call here to avoid double-fetch).
 *
 * Cleans up the interval on component unmount.
 */
export function useAutoRefresh(callback: () => void, intervalMs = 30000) {
  const savedCallback = useRef(callback)

  // Always use the latest version of callback
  useEffect(() => {
    savedCallback.current = callback
  }, [callback])

  useEffect(() => {
    const id = setInterval(() => {
      savedCallback.current()
    }, intervalMs)

    return () => clearInterval(id)
  }, [intervalMs])
}
