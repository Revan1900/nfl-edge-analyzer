import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from './use-toast';

export const useUserSettings = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['user-settings', user?.id],
    queryFn: async () => {
      if (!user) return null;

      const { data, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
};

export const useUpdateUserSettings = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (settings: any) => {
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('user_settings')
        .update(settings)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-settings'] });
      toast({
        title: 'Settings updated',
        description: 'Your preferences have been saved.',
      });
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: 'Update failed',
        description: error instanceof Error ? error.message : 'Failed to update settings',
      });
    },
  });
};

export const useUserSelections = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['user-selections', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('user_selections')
        .select('*')
        .eq('user_id', user.id)
        .order('saved_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
};

export const useSaveSelection = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (selection: {
      game_id: string;
      market_type: string;
      selected_side: string;
      note?: string;
    }) => {
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('user_selections')
        .insert({
          user_id: user.id,
          ...selection,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-selections'] });
      toast({
        title: 'Selection saved',
        description: 'Your pick has been saved to your selections.',
      });
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: 'Save failed',
        description: error instanceof Error ? error.message : 'Failed to save selection',
      });
    },
  });
};

export const useDeleteSelection = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (selectionId: string) => {
      const { error } = await supabase
        .from('user_selections')
        .delete()
        .eq('id', selectionId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-selections'] });
      toast({
        title: 'Selection deleted',
        description: 'Your pick has been removed.',
      });
    },
  });
};

export const useUserShares = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['user-shares', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('user_shares')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
};

export const useSubmitShare = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (share: { url: string; tags?: string[] }) => {
      if (!user) throw new Error('Not authenticated');

      // Extract domain for validation
      const url = new URL(share.url);
      const domain = url.hostname.replace('www.', '');

      const { data, error } = await supabase
        .from('user_shares')
        .insert({
          user_id: user.id,
          url: share.url,
          source_domain: domain,
          tags: share.tags || [],
          status: 'pending',
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-shares'] });
      toast({
        title: 'Source submitted',
        description: 'Your submission is pending review by moderators.',
      });
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: 'Submission failed',
        description: error instanceof Error ? error.message : 'Failed to submit source',
      });
    },
  });
};