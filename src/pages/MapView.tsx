import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import MapComponent from "@/components/MapComponent";
import { Loader2 } from "lucide-react";
import type { Report } from "@/types/report";

const MapView = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState<Report[]>([]);

  const checkAuth = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
      return;
    }
    setLoading(false);
  }, [navigate]);

  const fetchReports = useCallback(async () => {
    const { data, error } = await supabase
      .from("reports")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setReports(data);
    }
  }, []);

  useEffect(() => {
    checkAuth();
    fetchReports();

    // Subscribe to real-time updates
    const channel = supabase
      .channel("reports-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "reports",
        },
        () => {
          fetchReports();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [checkAuth, fetchReports]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground mb-2">Map View</h1>
          <p className="text-muted-foreground">
            View all reported road damage on the map
          </p>
        </div>

        <div className="bg-card rounded-lg shadow-lg overflow-hidden border">
          <MapComponent reports={reports} />
        </div>

        <div className="mt-6 grid grid-cols-3 gap-4">
          <div className="bg-card p-4 rounded-lg border">
            <div className="text-2xl font-bold text-foreground">
              {reports.filter((r) => r.status === "pending").length}
            </div>
            <div className="text-sm text-muted-foreground">Pending Reports</div>
          </div>
          <div className="bg-card p-4 rounded-lg border">
            <div className="text-2xl font-bold text-foreground">
              {reports.filter((r) => r.status === "in_progress").length}
            </div>
            <div className="text-sm text-muted-foreground">In Progress</div>
          </div>
          <div className="bg-card p-4 rounded-lg border">
            <div className="text-2xl font-bold text-foreground">
              {reports.filter((r) => r.status === "solved").length}
            </div>
            <div className="text-sm text-muted-foreground">Solved</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MapView;
