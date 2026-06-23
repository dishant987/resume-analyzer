const BASE = '/api'

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.message || 'Request failed')
  return data
}

export const auth = {
  signup: (body) => request('/auth/signup', { method: 'POST', body: JSON.stringify(body) }),
  login: (body) => request('/auth/login', { method: 'POST', body: JSON.stringify(body) }),
  logout: () => request('/auth/logout', { method: 'POST' }),
  me: () => request('/auth/me'),
}

export const resumes = {
  upload: (file) => {
    const form = new FormData()
    form.append('resume', file)
    return fetch(`${BASE}/resumes/upload`, {
      method: 'POST',
      credentials: 'include',
      body: form,
    }).then((r) => r.json())
  },
  list: () => request('/resumes'),
  get: (id) => request(`/resumes/${id}`),
  analyze: (id) => request(`/resumes/${id}/analyze`, { method: 'POST' }),
  fix: (id) => request(`/resumes/${id}/fix`, { method: 'POST' }),
}
