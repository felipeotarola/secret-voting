// Simple in-memory cache for responses
interface CacheEntry<T> {
  data: T
  timestamp: number
}

const responseCache: Record<string, CacheEntry<any>> = {}

// Cache response data with a TTL (time to live)
export function cacheResponse<T>(key: string, data: T, ttlMs = 60000): T {
  responseCache[key] = {
    data,
    timestamp: Date.now(),
  }
  return data
}

// Get cached response if it exists and is not expired
export function getCachedResponse<T>(key: string): T | null {
  const entry = responseCache[key]
  if (!entry) return null

  const now = Date.now()
  if (now - entry.timestamp > 60000) {
    // Cache expired
    delete responseCache[key]
    return null
  }

  return entry.data
}

// Request tracking for rate limiting
const requestTimestamps: Record<string, number[]> = {}

// Rate limiting function to prevent too many requests
export function checkRateLimit(key: string, limit: number, timeWindow: number): boolean {
  const now = Date.now()

  // Initialize if not exists
  if (!requestTimestamps[key]) {
    requestTimestamps[key] = []
  }

  // Remove timestamps outside the time window
  requestTimestamps[key] = requestTimestamps[key].filter((timestamp) => now - timestamp < timeWindow)

  // Check if under the limit
  if (requestTimestamps[key].length < limit) {
    requestTimestamps[key].push(now)
    return true
  }

  return false
}

// Exponential backoff retry function
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: {
    retries?: number
    initialDelay?: number
    maxDelay?: number
    key?: string
    cacheKey?: string
    cacheTtl?: number
  } = {},
): Promise<T> {
  const { retries = 3, initialDelay = 500, maxDelay = 10000, key, cacheKey, cacheTtl } = options

  // Check cache first if cacheKey is provided
  if (cacheKey) {
    const cachedData = getCachedResponse<T>(cacheKey)
    if (cachedData) return cachedData
  }

  // Check rate limit if key is provided
  if (key) {
    const isUnderLimit = checkRateLimit(key, 5, 10000) // 5 requests per 10 seconds
    if (!isUnderLimit) {
      console.warn(`Rate limit exceeded for ${key}`)

      // If we have a cache key but no cached data, throw a rate limit error
      if (cacheKey) {
        throw new Error("Rate limit exceeded. Please try again later.")
      }
    }
  }

  let lastError: any
  let delay = initialDelay

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const result = await fn()

      // Cache the result if cacheKey is provided
      if (cacheKey) {
        cacheResponse(cacheKey, result, cacheTtl)
      }

      return result
    } catch (error) {
      lastError = error

      // Check if it's a rate limit error
      const errorMessage = error instanceof Error ? error.message : String(error)
      if (errorMessage.includes("Too Many Requests") || errorMessage.includes("429")) {
        console.warn(`Rate limit hit on attempt ${attempt + 1}/${retries + 1}. Retrying in ${delay}ms...`)

        // Wait before retrying
        await new Promise((resolve) => setTimeout(resolve, delay))

        // Exponential backoff with jitter
        delay = Math.min(delay * 2, maxDelay) * (0.8 + Math.random() * 0.4)
      } else {
        // If it's not a rate limit error, don't retry
        throw error
      }
    }
  }

  throw lastError
}
