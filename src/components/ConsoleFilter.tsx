'use client'

import { useEffect } from 'react'

/**
 * Optional component to filter browser extension errors from console
 * These errors are completely harmless but can clutter the console
 */
export default function ConsoleFilter() {
  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') return

    // Store original console methods
    const originalError = console.error
    const originalWarn = console.warn

    // Check if message should be filtered
    const shouldFilter = (message: string): boolean => {
      if (typeof message !== 'string') return false
      return (
        message.includes('moz-extension://') ||
        message.includes('chrome-extension://') ||
        message.includes('RenderWithStyles') ||
        message.includes('dataControlPopup')
      )
    }

    // Override console.error
    console.error = (...args: any[]) => {
      const message = String(args[0] || '')
      if (!shouldFilter(message)) {
        originalError.apply(console, args)
      }
    }

    // Override console.warn
    console.warn = (...args: any[]) => {
      const message = String(args[0] || '')
      if (!shouldFilter(message)) {
        originalWarn.apply(console, args)
      }
    }

    // Cleanup on unmount
    return () => {
      console.error = originalError
      console.warn = originalWarn
    }
  }, [])

  return null // This component doesn't render anything
}

