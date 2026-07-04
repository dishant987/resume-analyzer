import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api, { uploadResume } from '../api'

// ── Query Keys ──────────────────────────────────────────
export const keys = {
  resumes: (filters) => ['resumes', filters],
  resume: (id) => ['resume', id],
  resumeStats: () => ['resume-stats'],
  analysis: (id) => ['analysis', id],
  versions: (id) => ['versions', id],
  matches: (id) => ['matches', id],
  coverLetters: (id) => ['cover-letters', id],
  interviewPrep: (id) => ['interview-prep', id],
  roadmaps: (id) => ['roadmaps', id],
  negotiations: (id) => ['negotiations', id],
}

// ── Resumes ─────────────────────────────────────────────
export function useResumeList({ page = 1, search = '', limit = 10 } = {}) {
  const params = new URLSearchParams({ page, limit: String(limit) })
  if (search.trim()) params.set('search', search.trim())

  return useQuery({
    queryKey: keys.resumes({ page, search }),
    queryFn: () => api.get(`/resumes?${params}`).then((r) => r.data),
  })
}

export function useResumeStats() {
  return useQuery({
    queryKey: keys.resumeStats(),
    queryFn: () => api.get('/resumes/analytics/stats').then((r) => r.data),
  })
}

export function useResume(id) {
  return useQuery({
    queryKey: keys.resume(id),
    queryFn: () => api.get(`/resumes/${id}`).then((r) => r.data),
    enabled: !!id,
  })
}

export function useDeleteResume() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id) => api.delete(`/resumes/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['resumes'] })
      qc.invalidateQueries({ queryKey: ['resume-stats'] })
    },
  })
}

// ── Analysis ────────────────────────────────────────────
export function useAnalysis(id) {
  return useQuery({
    queryKey: keys.analysis(id),
    queryFn: () => api.get(`/resumes/${id}/analysis`).then((r) => r.data),
    enabled: !!id,
  })
}

export function useAnalyzeResume() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id) => api.post(`/resumes/${id}/analyze`).then((r) => r.data),
    onSuccess: (data, id) => {
      qc.setQueryData(keys.analysis(id), data)
      qc.invalidateQueries({ queryKey: keys.resume(id) })
    },
  })
}

// ── Editor / Versions ───────────────────────────────────
export function useVersions(id) {
  return useQuery({
    queryKey: keys.versions(id),
    queryFn: () => api.get(`/resumes/${id}/versions`).then((r) => r.data),
    enabled: !!id,
  })
}

export function useFixResume() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id) => api.post(`/resumes/${id}/fix`).then((r) => r.data),
    onSuccess: (data, id) => {
      qc.setQueryData(keys.versions(id), (old) => {
        if (!old) return old
        return { ...old, versions: [data.version, ...(old.versions || [])] }
      })
    },
  })
}

export function useSaveVersion() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...body }) => api.post(`/resumes/${id}/versions`, body),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: keys.versions(id) })
      qc.invalidateQueries({ queryKey: keys.resume(id) })
    },
  })
}

// ── Job Matcher ─────────────────────────────────────────
export function useMatches(id) {
  return useQuery({
    queryKey: keys.matches(id),
    queryFn: () => api.get(`/resumes/${id}/matches`).then((r) => r.data),
    enabled: !!id,
  })
}

export function useMatchJob() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, jd }) => api.post(`/resumes/${id}/match-jd`, { jd }).then((r) => r.data),
    onSuccess: (data, { id }) => {
      qc.setQueryData(keys.matches(id), (old) => ({
        matches: [data.match, ...(old?.matches || [])],
      }))
    },
  })
}

export function useDeleteMatch() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ resumeId, matchId }) => api.delete(`/resumes/${resumeId}/matches/${matchId}`),
    onSuccess: (_, { resumeId }) => {
      qc.invalidateQueries({ queryKey: keys.matches(resumeId) })
    },
  })
}

// ── Cover Letters ───────────────────────────────────────
export function useCoverLetters(id) {
  return useQuery({
    queryKey: keys.coverLetters(id),
    queryFn: () => api.get(`/resumes/${id}/cover-letters`).then((r) => r.data),
    enabled: !!id,
  })
}

export function useGenerateCoverLetter() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, jd }) => api.post(`/resumes/${id}/cover-letter`, { jd }).then((r) => r.data),
    onSuccess: (data, { id }) => {
      qc.setQueryData(keys.coverLetters(id), (old) => ({
        coverLetters: [data.coverLetter, ...(old?.coverLetters || [])],
      }))
    },
  })
}

export function useDeleteCoverLetter() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ resumeId, letterId }) => api.delete(`/resumes/${resumeId}/cover-letters/${letterId}`),
    onSuccess: (_, { resumeId }) => {
      qc.invalidateQueries({ queryKey: keys.coverLetters(resumeId) })
    },
  })
}

// ── Networking Messages ─────────────────────────────────
export function useNetworkingMessages(id) {
  return useQuery({
    queryKey: ['networking', id],
    queryFn: () => api.get(`/resumes/${id}/networking`).then((r) => r.data),
    enabled: !!id,
  })
}

export function useGenerateNetworkingMessage() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...body }) => api.post(`/resumes/${id}/networking`, body).then((r) => r.data),
    onSuccess: (data, { id }) => {
      qc.setQueryData(['networking', id], (old) => ({
        messages: [data.networkingMessage, ...(old?.messages || [])],
      }))
    },
  })
}

export function useDeleteNetworkingMessage() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ resumeId, msgId }) => api.delete(`/resumes/${resumeId}/networking/${msgId}`),
    onSuccess: (_, { resumeId }) => {
      qc.invalidateQueries({ queryKey: ['networking', resumeId] })
    },
  })
}

// ── Mock Interview ──────────────────────────────────────
export function useMockInterviewSessions(id) {
  return useQuery({
    queryKey: ['mock-interview', id],
    queryFn: () => api.get(`/resumes/${id}/mock-interview`).then((r) => r.data),
    enabled: !!id,
  })
}

export function useStartMockInterview() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...body }) => api.post(`/resumes/${id}/mock-interview`, body).then((r) => r.data),
    onSuccess: (data, { id }) => {
      qc.setQueryData(['mock-interview', id], (old) => ({
        sessions: [data.session, ...(old?.sessions || [])],
      }))
    },
  })
}

export function useSubmitMockAnswer() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ resumeId, sessionId, answer }) =>
      api.post(`/resumes/${resumeId}/mock-interview/${sessionId}/answer`, { answer }).then((r) => r.data),
    onSuccess: (data, { resumeId }) => {
      qc.invalidateQueries({ queryKey: ['mock-interview', resumeId] })
    },
  })
}

export function useDeleteMockInterview() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ resumeId, sessionId }) => api.delete(`/resumes/${resumeId}/mock-interview/${sessionId}`),
    onSuccess: (_, { resumeId }) => {
      qc.invalidateQueries({ queryKey: ['mock-interview', resumeId] })
    },
  })
}

// ── Job Applications ───────────────────────────────────
export function useJobApplications(id) {
  return useQuery({
    queryKey: ['applications', id],
    queryFn: () => api.get(`/resumes/${id}/applications`).then((r) => r.data),
    enabled: !!id,
  })
}

export function useCreateJobApplication() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...body }) => api.post(`/resumes/${id}/applications`, body).then((r) => r.data),
    onSuccess: (data, { id }) => {
      qc.setQueryData(['applications', id], (old) => ({
        applications: [data.application, ...(old?.applications || [])],
      }))
    },
  })
}

export function useUpdateJobApplication() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ resumeId, appId, ...body }) => api.put(`/resumes/${resumeId}/applications/${appId}`, body).then((r) => r.data),
    onSuccess: (_, { resumeId }) => {
      qc.invalidateQueries({ queryKey: ['applications', resumeId] })
    },
  })
}

export function useDeleteJobApplication() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ resumeId, appId }) => api.delete(`/resumes/${resumeId}/applications/${appId}`),
    onSuccess: (_, { resumeId }) => {
      qc.invalidateQueries({ queryKey: ['applications', resumeId] })
    },
  })
}

// ── LinkedIn Profile ──────────────────────────────────
export function useLinkedInProfile(id) {
  return useQuery({
    queryKey: ['linkedin', id],
    queryFn: () => api.get(`/resumes/${id}/linkedin`).then((r) => r.data),
    enabled: !!id,
  })
}

export function useGenerateLinkedInProfile() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id) => api.post(`/resumes/${id}/linkedin`).then((r) => r.data),
    onSuccess: (data, id) => {
      qc.setQueryData(['linkedin', id], data)
    },
  })
}

// ── Interview Prep ──────────────────────────────────────
export function useInterviewPrep(id) {
  return useQuery({
    queryKey: keys.interviewPrep(id),
    queryFn: () => api.get(`/resumes/${id}/interview-prep`).then((r) => r.data),
    enabled: !!id,
  })
}

export function useGenerateInterviewPrep() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, isRegen }) => {
      const endpoint = isRegen
        ? `/resumes/${id}/interview-prep/regenerate`
        : `/resumes/${id}/interview-prep`
      return api.post(endpoint).then((r) => r.data)
    },
    onSuccess: (data, { id }) => {
      qc.setQueryData(keys.interviewPrep(id), data)
    },
  })
}

// ── Roadmaps ────────────────────────────────────────────
export function useRoadmaps(id) {
  return useQuery({
    queryKey: keys.roadmaps(id),
    queryFn: () => api.get(`/resumes/${id}/roadmap`).then((r) => r.data),
    enabled: !!id,
  })
}

export function useGenerateRoadmap() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, targetRole }) => api.post(`/resumes/${id}/roadmap`, { targetRole }).then((r) => r.data),
    onSuccess: (data, { id }) => {
      qc.setQueryData(keys.roadmaps(id), (old) => ({
        roadmaps: [data.roadmap, ...(old?.roadmaps || [])],
      }))
    },
  })
}

export function useDeleteRoadmap() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ resumeId, roadmapId }) => api.delete(`/resumes/${resumeId}/roadmap/${roadmapId}`),
    onSuccess: (_, { resumeId }) => {
      qc.invalidateQueries({ queryKey: keys.roadmaps(resumeId) })
    },
  })
}

// ── Salary Negotiation ──────────────────────────────────
export function useNegotiations(id) {
  return useQuery({
    queryKey: keys.negotiations(id),
    queryFn: () => api.get(`/resumes/${id}/salary-negotiations`).then((r) => r.data),
    enabled: !!id,
  })
}

export function useCreateNegotiation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...body }) => api.post(`/resumes/${id}/salary-negotiations`, body).then((r) => r.data),
    onSuccess: (data, { id }) => {
      qc.setQueryData(keys.negotiations(id), (old) => ({
        negotiations: [data.negotiation, ...(old?.negotiations || [])],
      }))
    },
  })
}

export function useSendChat() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ resumeId, sessionId, message }) =>
      api.post(`/resumes/${resumeId}/salary-negotiations/${sessionId}/chat`, { message }).then((r) => r.data),
    onSuccess: (data, { resumeId }) => {
      qc.invalidateQueries({ queryKey: keys.negotiations(resumeId) })
    },
  })
}

export function useDeleteNegotiation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ resumeId, negId }) => api.delete(`/resumes/${resumeId}/salary-negotiations/${negId}`),
    onSuccess: (_, { resumeId }) => {
      qc.invalidateQueries({ queryKey: keys.negotiations(resumeId) })
    },
  })
}

// ── Profile ─────────────────────────────────────────────
export function useUpdateProfile() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body) => api.put('/auth/profile', body).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['auth'] })
    },
  })
}

export function useChangePassword() {
  return useMutation({
    mutationFn: (body) => api.put('/auth/password', body).then((r) => r.data),
  })
}

export function useUploadAvatar() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (formData) => api.put('/auth/avatar', formData).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['auth'] })
    },
  })
}

// ── Upload Resume ───────────────────────────────────────
export function useUploadResume() {
  return useMutation({
    mutationFn: (file) => uploadResume(file).then((r) => r.data),
  })
}
