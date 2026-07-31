import axios from 'axios'
import keycloak from '../../features/auth/keycloak'

const rawBaseURL = import.meta.env.VITE_API_URL || 'http://localhost:8080'
const cleanBaseURL = rawBaseURL.replace(/\/api\/?$/, '')

const api = axios.create({
  baseURL: cleanBaseURL,
})

api.interceptors.request.use(async (config) => {
  if (keycloak.authenticated) {
    await keycloak.updateToken(30)
    config.headers.Authorization = `Bearer ${keycloak.token}`
  }

  return config
})

export default api
