// In-memory rate limiting map: key -> { count, resetAt }
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()

// Periodically clean up expired entries every 10 minutes to prevent memory leaks
if (typeof setInterval !== 'undefined') {
  const cleanupInterval = setInterval(() => {
    const now = Date.now()
    for (const [key, entry] of rateLimitMap.entries()) {
      if (now > entry.resetAt) {
        rateLimitMap.delete(key)
      }
    }
  }, 10 * 60 * 1000)

  // Unref interval if running in Node.js so it doesn't prevent process exit
  if (cleanupInterval && typeof cleanupInterval === 'object' && 'unref' in cleanupInterval) {
    (cleanupInterval as any).unref()
  }
}

/**
 * Checks if a given key has exceeded the maximum attempts within the time window.
 */
export function isRateLimited(key: string, maxAttempts = 5): boolean {
  const now = Date.now()
  const entry = rateLimitMap.get(key)

  if (!entry || now > entry.resetAt) {
    return false
  }

  return entry.count >= maxAttempts
}

/**
 * Increments the attempt counter for a given key.
 */
export function incrementRateLimit(key: string, windowMs = 15 * 60 * 1000) {
  const now = Date.now()
  const entry = rateLimitMap.get(key)

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + windowMs })
  } else {
    entry.count += 1
  }
}

/**
 * Clears the rate limit counter for a given key (used upon successful authentication).
 */
export function resetRateLimit(key: string) {
  rateLimitMap.delete(key)
}
