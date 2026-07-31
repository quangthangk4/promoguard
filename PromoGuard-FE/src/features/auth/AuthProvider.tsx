/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import keycloak, { initKeycloak } from './keycloak'

export type Role = 'guest' | 'user' | 'admin'

type AuthContextValue = {
  authenticated: boolean
  initialized: boolean
  role: Role
  token?: string
  username?: string
  login: () => Promise<void>
  register: () => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

function getRole(): Role {
  const roles = keycloak.tokenParsed?.realm_access?.roles ?? []

  if (roles.includes('ADMIN') || roles.includes('admin')) {
    return 'admin'
  }

  if (roles.includes('USER') || roles.includes('user')) {
    return 'user'
  }

  return keycloak.authenticated ? 'user' : 'guest'
}

function getUsername() {
  return (
    keycloak.tokenParsed?.preferred_username ??
    keycloak.tokenParsed?.email ??
    keycloak.tokenParsed?.name
  )
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [initialized, setInitialized] = useState(false)
  const [authenticated, setAuthenticated] = useState(false)
  const [role, setRole] = useState<Role>('guest')
  const [token, setToken] = useState<string | undefined>()
  const [username, setUsername] = useState<string | undefined>()

  const syncAuthState = useCallback(() => {
    const isAuth = Boolean(keycloak.authenticated)
    setAuthenticated(isAuth)
    setRole(getRole())
    setToken(keycloak.token)
    setUsername(getUsername())

    if (isAuth && keycloak.token && keycloak.refreshToken) {
      localStorage.setItem('kc_token', keycloak.token)
      localStorage.setItem('kc_refreshToken', keycloak.refreshToken)
    } else if (!isAuth) {
      localStorage.removeItem('kc_token')
      localStorage.removeItem('kc_refreshToken')
    }
  }, [])

  useEffect(() => {
    let active = true

    initKeycloak()
      .then(() => {
        if (!active) {
          return
        }

        syncAuthState()
        setInitialized(true)
      })
      .catch((error: unknown) => {
        console.error('Failed to initialize Keycloak', error)
        if (active) {
          localStorage.removeItem('kc_token')
          localStorage.removeItem('kc_refreshToken')
          setInitialized(true)
        }
      })

    keycloak.onAuthSuccess = syncAuthState
    keycloak.onAuthRefreshSuccess = syncAuthState
    keycloak.onAuthLogout = () => {
      localStorage.removeItem('kc_token')
      localStorage.removeItem('kc_refreshToken')
      syncAuthState()
    }
    keycloak.onTokenExpired = () => {
      keycloak
        .updateToken(30)
        .then(syncAuthState)
        .catch(() => {
          localStorage.removeItem('kc_token')
          localStorage.removeItem('kc_refreshToken')
          keycloak.login()
        })
    }

    return () => {
      active = false
    }
  }, [syncAuthState])

  const value = useMemo<AuthContextValue>(
    () => ({
      authenticated,
      initialized,
      role,
      token,
      username,
      login: () => keycloak.login({ redirectUri: window.location.origin + '/login' }),
      register: () => keycloak.register({ redirectUri: window.location.origin + '/login' }),
      logout: async () => {
        localStorage.removeItem('kc_token')
        localStorage.removeItem('kc_refreshToken')
        await keycloak.logout({ redirectUri: window.location.origin })
      },
    }),
    [authenticated, initialized, role, token, username],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }

  return context
}
