import { useMutation } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { ENDPOINTS } from '@/lib/endpoints'
import type { DecisionRequest, DecisionResponse } from '@/lib/types'
import { runDecisionEngine } from '@/features/decision/decisionEngine'

export function useRunDecision() {
  return useMutation({
    mutationFn: async (payload: DecisionRequest) => {
      try {
        const { data } = await api.post<DecisionResponse>(ENDPOINTS.decision, payload)
        return data
      } catch (err) {
        return runDecisionEngine(payload)
      }
    },
  })
}