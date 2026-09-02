import { describe, it, expect } from 'vitest'
import { findAuthUserByEmail } from './find-user'

type StubUser = { id: string; email: string }

function makeClient({
  profile = null,
  authUsers = [],
}: {
  profile?: { id: string; email: string } | null
  authUsers?: StubUser[]
}) {
  const calls = { pages: [] as number[], perPage: [] as number[], byId: [] as string[] }

  const client = {
    calls,
    from: () => ({
      select: () => ({
        eq: (_col: string, value: string) => ({
          maybeSingle: async () => ({
            data: profile && profile.email === value ? { id: profile.id } : null,
            error: null,
          }),
        }),
      }),
    }),
    auth: {
      admin: {
        getUserById: async (id: string) => {
          calls.byId.push(id)
          const user = authUsers.find((u) => u.id === id)
          return { data: { user: user ?? null }, error: user ? null : new Error('not found') }
        },
        listUsers: async ({ page, perPage }: { page: number; perPage: number }) => {
          calls.pages.push(page)
          calls.perPage.push(perPage)
          const start = (page - 1) * perPage
          return { data: { users: authUsers.slice(start, start + perPage) }, error: null }
        },
      },
    },
  }

  return client as any
}

const users = (n: number, prefix = 'u'): StubUser[] =>
  Array.from({ length: n }, (_, i) => ({ id: `${prefix}${i}`, email: `${prefix}${i}@example.com` }))

describe('findAuthUserByEmail', () => {
  it('resolves through the profile row without scanning auth.users', async () => {
    const client = makeClient({
      profile: { id: 'u7', email: 'u7@example.com' },
      authUsers: users(10),
    })

    const found = await findAuthUserByEmail(client, 'u7@example.com')

    expect(found?.id).toBe('u7')
    expect(client.calls.byId).toEqual(['u7'])
    expect(client.calls.pages).toEqual([]) // never fell back to listing
  })

  it('finds a user positioned beyond the old 50-record first page', async () => {
    // The bug: listUsers() defaults to perPage 50, so #120 was invisible.
    const all = users(200)
    const client = makeClient({ profile: null, authUsers: all })

    const found = await findAuthUserByEmail(client, 'u120@example.com')

    expect(found?.id).toBe('u120')
    expect(client.calls.perPage.every((p) => p > 50)).toBe(true)
  })

  it('pages past the first full page when the match is deeper', async () => {
    const all = users(1500)
    const client = makeClient({ profile: null, authUsers: all })

    const found = await findAuthUserByEmail(client, 'u1400@example.com')

    expect(found?.id).toBe('u1400')
    expect(client.calls.pages).toEqual([1, 2])
  })

  it('normalises case and surrounding whitespace', async () => {
    const client = makeClient({
      profile: { id: 'u3', email: 'u3@example.com' },
      authUsers: users(5),
    })

    expect((await findAuthUserByEmail(client, '  U3@Example.COM '))?.id).toBe('u3')
  })

  it('returns null for an unknown address and stops on a short page', async () => {
    const client = makeClient({ profile: null, authUsers: users(10) })

    expect(await findAuthUserByEmail(client, 'nobody@example.com')).toBeNull()
    expect(client.calls.pages).toEqual([1]) // did not keep paging into the void
  })

  it('falls back to the paged scan when the profile row has no auth record', async () => {
    const client = makeClient({
      profile: { id: 'stale-id', email: 'u2@example.com' },
      authUsers: users(5),
    })

    const found = await findAuthUserByEmail(client, 'u2@example.com')

    expect(client.calls.byId).toEqual(['stale-id']) // tried the fast path first
    expect(found?.id).toBe('u2') // then recovered via the scan
  })
})
