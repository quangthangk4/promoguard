import Keycloak from 'keycloak-js'

const keycloak = new Keycloak({
  url: 'http://localhost:8082',
  realm: 'PromoGuard',
  clientId: 'promoguard-web',
})

let initPromise: Promise<boolean> | null = null

export function initKeycloak() {
  initPromise ??= keycloak.init({
    onLoad: 'check-sso',
    pkceMethod: 'S256',
    checkLoginIframe: false,
  })

  return initPromise
}

export default keycloak
