import { configs } from '@/configs'

export class WhitelistOrigin {
  public static check(origin?: string) {
    if (!origin) throw new OriginNotProvidedError()
    const allowed = configs.allowedExternalHosts.includes(origin)
    if (!allowed) throw new OriginNotAuthorizedError()
  }
}

export class OriginNotAuthorizedError extends Error {
  constructor(message?: string) {
    super(message || 'Origin not authorized')
    this.name = 'OriginNotAuthorizedError'
  }
}

export class OriginNotProvidedError extends Error {
  constructor(message?: string) {
    super(message || 'Origin not provided')
    this.name = 'OriginNotProvidedError'
  }
}
