import { PrismaClient } from '@prisma/client/wasm'
import { PrismaD1 } from '@prisma/adapter-d1'
import { getCloudflareContext } from '@opennextjs/cloudflare'

const d1ClientCache = new WeakMap<object, PrismaClient>()

export function getPrismaClient(): PrismaClient {
  try {
    const cf = getCloudflareContext()
    if (cf?.env?.DB) {
      const dbBinding = cf.env.DB as unknown as object
      const cached = d1ClientCache.get(dbBinding)
      if (cached) {
        return cached
      }
      const adapter = new PrismaD1(cf.env.DB)
      const client = new PrismaClient({ adapter })
      d1ClientCache.set(dbBinding, client)
      return client
    }
  } catch {
    // getCloudflareContext may throw outside Cloudflare worker or during SSG build
  }

  // Fallback with mock adapter for SSG / build-time evaluation
  const fallbackAdapter = new PrismaD1({
    prepare: () => ({
      bind: () => ({
        all: async () => ({ results: [] }),
        run: async () => ({ meta: { changes: 0 } }),
        raw: async () => [],
      }),
    }),
    batch: async () => [],
    exec: async () => ({ count: 0, duration: 0 }),
  } as any)

  return new PrismaClient({ adapter: fallbackAdapter })
}

export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    const client = getPrismaClient()
    const val = (client as any)[prop]
    return typeof val === 'function' ? val.bind(client) : val
  },
})
