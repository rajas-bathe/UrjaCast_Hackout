import axios from 'axios'
import { useAuthStore } from '@/store/useAuthStore'

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error?.response?.data?.message || error?.message || 'Something went wrong while reaching the server.'
    return Promise.reject({ message, status: error?.response?.status })
  },
)

export const isMockEnabled = () => import.meta.env.VITE_USE_MOCK === 'true'