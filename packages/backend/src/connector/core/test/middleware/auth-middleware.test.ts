/* eslint-disable @typescript-eslint/no-empty-function */
import Faker from 'faker'
import { createContext } from '../../utils'
import {
  createTokenAuthMiddleware,
  createAdminAuthMiddleware
} from '../../middleware'
import { MockAccountsService } from '../mocks/accounts-service'
import { RafikiContext } from '../../rafiki'
import { PeerAccountFactory, RafikiServicesFactory } from '../../factories'

describe('Token Auth Middleware', function () {
  describe('default behaviour', function () {
    test('returns 401 if there is no authorization header', async () => {
      const ctx = createContext<unknown, RafikiContext>({
        req: { headers: { 'content-type': 'application/octet-stream' } }
      })

      const authMiddleware = createTokenAuthMiddleware()

      await expect(authMiddleware(ctx, async () => {})).rejects.toThrow(
        'Bearer token required in Authorization header'
      )
    })

    test('returns 401 if bearer token is malformed', async () => {
      const ctx = createContext<unknown, RafikiContext>({
        req: {
          headers: {
            'content-type': 'application/octet-stream',
            authorization: 'Bearer'
          }
        }
      })

      const authMiddleware = createTokenAuthMiddleware()

      await expect(authMiddleware(ctx, async () => {})).rejects.toThrow(
        'Bearer token required in Authorization header'
      )
    })

    test('succeeds for valid token and binds data to context', async () => {
      const accounts = new MockAccountsService('test.rafiki')
      const ctx = createContext<unknown, RafikiContext>({
        req: {
          headers: {
            'content-type': 'application/octet-stream',
            authorization: 'Bearer asd123'
          }
        },
        services: RafikiServicesFactory.build({ accounts })
      })
      const account = PeerAccountFactory.build({
        id: 'alice',
        stream: {
          enabled: true
        },
        http: {
          incoming: {
            authTokens: ['asd123']
          },
          outgoing: {
            authToken: Faker.datatype.string(32),
            endpoint: Faker.internet.url()
          }
        }
      })
      await accounts.create(account)

      await createTokenAuthMiddleware()(ctx, async () => {})
      expect(ctx.state.account).toBe(account)
    })
  })
})

describe('Admin Auth Middleware', function () {
  test('returns 401 if there is no authorization header', async () => {
    const ctx = createContext<unknown, RafikiContext>({
      req: { headers: { 'content-type': 'application/octet-stream' } }
    })

    const authMiddleware = createAdminAuthMiddleware()

    await expect(authMiddleware(ctx, async () => {})).rejects.toThrow(
      'Bearer token required in Authorization header'
    )
  })

  test('returns 401 if bearer token is malformed', async () => {
    const ctx = createContext<unknown, RafikiContext>({
      req: {
        headers: {
          'content-type': 'application/octet-stream',
          authorization: 'Bearer'
        }
      }
    })

    const authMiddleware = createAdminAuthMiddleware()

    await expect(authMiddleware(ctx, async () => {})).rejects.toThrow(
      'Bearer token required in Authorization header'
    )
  })

  test('succeeds for valid token and binds data to context', async () => {
    const accounts = new MockAccountsService('test.rafiki')
    const account = PeerAccountFactory.build({
      id: 'alice',
      http: {
        outgoing: {
          authToken: Faker.datatype.string(32),
          endpoint: Faker.internet.url()
        }
      }
    })
    const ctx = createContext<unknown, RafikiContext>({
      req: {
        headers: {
          'content-type': 'application/octet-stream',
          authorization: `Bearer ${account.id}`
        }
      },
      services: RafikiServicesFactory.build({ accounts })
    })
    await accounts.create(account)

    await createAdminAuthMiddleware()(ctx, async () => {})
    expect(ctx.state.account).toBe(account)
  })
})