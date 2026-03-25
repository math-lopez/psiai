import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { APPROACH_FEATURES, AppFeatures } from "@/config/approachFeatures";
import { TherapeuticApproach } from "@/types";

export function useAppFeatures() {
  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile-features'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data } = await supabase
        .from('profiles')
        .select('therapeutic_approach')
        .eq('id', user.id)
        .single();
      
      return data;
    }
  });

  const approach = (profile?.therapeutic_approach as TherapeuticApproach) || 'TCC';
  const features: AppFeatures = APPROACH_FEATURES[approach];

  return { features, isLoading, approach };
}