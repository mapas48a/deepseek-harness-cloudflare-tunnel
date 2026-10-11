/** Shipped Web-profile dotenv setup, changing tunnel authorities, and local directory access. */

import { stat, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { expect, it } from 'vitest'
import { withDefaultWeb, webGet, webRequest } from './default-web-process.ts'

it('authenticates changing tunnel hosts from .env and browses and creates host directories', async (test) => {
  await withDefaultWeb(test, async ({ url, root, request }) => {
    const roster = await request('roster')
    expect(roster.entries.some(entry => entry.name === '@deepseek-ai/dsh-host-directory-picker-browse')).toBe(true)
    expect(roster.entries.some(entry => entry.name === '@deepseek-ai/dsh-host-directory-picker-native')).toBe(false)
    const cookies: string[] = []
    for (const host of ['first.trycloudflare.com', 'second.trycloudflare.com']) {
      const unauthenticated = await webGet(new URL('/api/not-found', url), test.signal, { host })
      expect(unauthenticated.status).toBe(401)
      const auth = await webGet(url, test.signal, { host })
      expect(auth.status).toBe(303)
      const cookie = auth.headers['set-cookie']?.[0]?.split(';', 1)[0]
      if (cookie === undefined) throw new Error('Tunnel login did not set a cookie')
      cookies.push(cookie)
      const page = await webGet(new URL('/', url), test.signal, { host, cookie })
      expect(page.status).toBe(200)
      const rpc = async (method: string, args: object): Promise<unknown> => {
        const response = await webRequest(new URL(`/api/${method}`, url), test.signal, {
          method: 'POST', headers: { host, cookie, origin: `https://${host}`, 'content-type': 'application/json' },
          body: JSON.stringify({ type: 'client-request', rpcId: 'tunnel-env', method, payload: { args } }),
        })
        expect(response.status).toBe(200)
        const body = JSON.parse(response.text) as { result: { ok: boolean; value: unknown } }
        expect(body.result.ok, response.text).toBe(true)
        return body.result.value
      }
      const created = join(root, host)
      expect(await rpc('directoryPicker/createDirectory', { path: root, name: host })).toBe(created)
      expect((await stat(created)).isDirectory()).toBe(true)
      const listing = await rpc('directoryPicker/list', { path: root }) as { entries: Array<{ path: string }> }
      expect(listing.entries.map(entry => entry.path)).toContain(created)
      expect(await rpc('workspace/create', { request: { path: created } })).toMatchObject({ workspace: { path: created } })
    }
    expect((await webGet(new URL('/api/not-found', url), test.signal, {
      host: 'second.trycloudflare.com', cookie: cookies[0]!,
    })).status).toBe(401)
    for (const host of ['trycloudflare.com', 'first.trycloudflare.com.evil.example']) {
      expect((await webGet(new URL('/api/not-found', url), test.signal, { host, cookie: cookies[0]! })).status).toBe(403)
    }
    expect((await webGet(new URL('/api/not-found', url), test.signal, {
      host: 'first.trycloudflare.com', cookie: cookies[0]!, origin: 'https://second.trycloudflare.com',
    })).status).toBe(403)
  }, {
    prepare: async (root) => {
      await writeFile(join(root, '.env'), 'DSH_WEB_TRUSTED_HOSTS=*.trycloudflare.com\nDSH_WEB_OPEN_BROWSER=false\n')
    },
  })
})
