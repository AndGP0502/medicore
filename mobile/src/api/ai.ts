import { useMutation } from '@tanstack/react-query';
import { api } from './client';
import type { AIResponse } from '@/types/api';

export function useAIChat() {
  return useMutation({
    mutationFn: async ({ message, context }: { message: string; context?: string }) =>
      (await api.post<AIResponse>('/ai/chat', { message, context: context ?? '' })).data,
  });
}

export function useSuggestDiagnosis() {
  return useMutation({
    mutationFn: async ({
      symptoms,
      patientContext,
    }: {
      symptoms: string;
      patientContext?: string;
    }) =>
      (
        await api.post<AIResponse>('/ai/suggest-diagnosis', {
          symptoms,
          patient_context: patientContext ?? '',
        })
      ).data,
  });
}

export function useSuggestTreatment() {
  return useMutation({
    mutationFn: async ({
      diagnosis,
      patientContext,
    }: {
      diagnosis: string;
      patientContext?: string;
    }) =>
      (
        await api.post<AIResponse>('/ai/suggest-treatment', {
          diagnosis,
          patient_context: patientContext ?? '',
        })
      ).data,
  });
}

export function useSummarizeHistory() {
  return useMutation({
    mutationFn: async (records: unknown[]) =>
      (await api.post<AIResponse>('/ai/summarize-history', { records })).data,
  });
}
