import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { RefreshCw } from "lucide-react";

export const AdminForceRefreshButton = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const isAdmin = (user?.email || "").toLowerCase() === "admin@dynamicaihub.com";

  const handleClick = async () => {
    if (!user) {
      toast({ 
        title: "Not signed in", 
        description: "Please sign in as admin.", 
        variant: "destructive" 
      });
      return;
    }

    try {
      setLoading(true);
      
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        toast({ 
          title: "Session expired", 
          description: "Please sign in again.", 
          variant: "destructive" 
        });
        return;
      }

      const { data, error } = await supabase.functions.invoke("trigger-refresh", {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) {
        console.error("Error triggering refresh:", error);
        toast({ 
          title: "Failed", 
          description: error.message || "Could not trigger refresh.", 
          variant: "destructive" 
        });
        return;
      }

      if (data?.ok) {
        toast({ 
          title: "Refresh started", 
          description: "Odds ingestion triggered successfully." 
        });
      } else {
        toast({ 
          title: "Failed", 
          description: data?.error || "Could not trigger refresh.", 
          variant: "destructive" 
        });
      }
    } catch (e: any) {
      console.error("Network error:", e);
      toast({ 
        title: "Error", 
        description: e?.message || "Network error", 
        variant: "destructive" 
      });
    } finally {
      setLoading(false);
    }
  };

  if (!isAdmin) return null;

  return (
    <Button 
      onClick={handleClick} 
      disabled={loading} 
      variant="outline" 
      size="sm"
      className="gap-2"
    >
      <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
      {loading ? "Refreshing..." : "Force Refresh Odds"}
    </Button>
  );
};
