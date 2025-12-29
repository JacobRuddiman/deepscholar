'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  scheduleBriefPublication,
  cancelScheduledPublication,
  getScheduledPublications,
  reschedulePublication,
} from '@/server/actions/scheduling/scheduling';
import { toast } from 'sonner';

export function useScheduleBrief() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { briefId: string; scheduledFor: Date }) => {
      const result = await scheduleBriefPublication(params.briefId, params.scheduledFor);
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['scheduled-publications'] });
      queryClient.invalidateQueries({ queryKey: ['drafts'] });
      toast.success('Brief scheduled', {
        description: `Will publish ${new Date(data!.scheduledFor).toLocaleString()}`,
      });
    },
    onError: (error: Error) => {
      toast.error('Failed to schedule', { description: error.message });
    },
  });
}

export function useCancelScheduled() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (briefId: string) => {
      const result = await cancelScheduledPublication(briefId);
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduled-publications'] });
      queryClient.invalidateQueries({ queryKey: ['drafts'] });
      toast.success('Schedule cancelled');
    },
  });
}

export function useScheduledPublications(status?: 'pending' | 'published' | 'failed' | 'cancelled') {
  return useQuery({
    queryKey: ['scheduled-publications', status],
    queryFn: async () => {
      const result = await getScheduledPublications({ status });
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
    staleTime: 1000 * 60, // 1 minute
  });
}

export function useReschedule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { briefId: string; newScheduledTime: Date }) => {
      const result = await reschedulePublication(params.briefId, params.newScheduledTime);
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['scheduled-publications'] });
      toast.success('Rescheduled', {
        description: `New time: ${new Date(data!.scheduledFor).toLocaleString()}`,
      });
    },
  });
}
