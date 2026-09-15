import axios from 'axios'

const BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
})

// Surface API errors cleanly to the UI
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const status = err?.response?.status
    if (status === 503) {
      err.userMessage =
        err.response?.data?.detail ||
        'Weather service is busy. Please retry in a few seconds.'
    } else if (status === 429) {
      err.userMessage = 'Rate limited. Please wait a moment and retry.'
    } else if (!err.response) {
      err.userMessage =
        'Cannot reach the backend. Is it running on port 8000?'
    }
    return Promise.reject(err)
  }
)

/**
 * Legacy compatibility shim.
 *
 * The app no longer supports a mock backend — all data comes from the
 * live FastAPI service. This stub exists only so legacy components
 * (e.g. Header.tsx) that still check isMockEnabled() continue to compile.
 * Always returns false.
 */
export const isMockEnabled = (): boolean => false