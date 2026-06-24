import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
})

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const message = err.response?.data?.message || err.message || 'Request failed'
    return Promise.reject(new Error(message))
  }
)

export const auth = {
  signup: (body) => api.post('/auth/signup', body).then((r) => r.data),
  login: (body) => api.post('/auth/login', body).then((r) => r.data),
  logout: () => api.post('/auth/logout').then((r) => r.data),
  me: () => api.get('/auth/me').then((r) => r.data),
}

export const uploadResume = (file) => {
  const form = new FormData()
  form.append('resume', file)
  return api.post('/resumes/upload', form)
}

export default api
