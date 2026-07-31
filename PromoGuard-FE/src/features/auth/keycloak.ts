import Keycloak from 'keycloak-js'

const keycloak = new Keycloak({
  url: import.meta.env.VITE_KEYCLOAK_URL || 'http://localhost:8082',
  realm: 'PromoGuard',
  clientId: 'promoguard-web',
})

let initPromise: Promise<boolean> | null = null

export function initKeycloak() {
  const supportsWebCrypto = typeof window !== 'undefined' && Boolean(window.crypto?.subtle)

  const token = localStorage.getItem('kc_token') || undefined
  const refreshToken = localStorage.getItem('kc_refreshToken') || undefined

  initPromise ??= keycloak.init({
    onLoad: 'check-sso',
    token,
    refreshToken,
    pkceMethod: supportsWebCrypto ? 'S256' : false,
    checkLoginIframe: false,
  })

  return initPromise
}

export default keycloak
