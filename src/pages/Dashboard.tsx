import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import UploadForm from "@/components/UploadForm";
import ReportCard from "@/components/ReportCard";
import { Loader2 } from "lucide-react";
import type { Report } from "@/types/report";

const Dashboard = () => {
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

  const fetchUserReports = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("reports")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setReports(data);
    }
  }, []);

  useEffect(() => {
    checkAuth();
    fetchUserReports();
  }, [checkAuth, fetchUserReports]);

  const handleReportSubmitted = () => {
    fetchUserReports();
  };

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
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Dashboard</h1>
          <p className="text-muted-foreground">Report road damage and track your submissions</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          <div>
            <UploadForm onReportSubmitted={handleReportSubmitted} />
          </div>
          
          <div>
            <h2 className="text-xl font-semibold mb-4 text-foreground">Your Reports</h2>
            <div className="space-y-4">
              {reports.length === 0 ? (
                <div className="bg-card border rounded-lg p-8 text-center">
                  <p className="text-muted-foreground">No reports yet. Submit your first report!</p>
                </div>
              ) : (
                reports.map((report) => (
                  <ReportCard key={report.id} report={report} onUpdate={fetchUserReports} />
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
