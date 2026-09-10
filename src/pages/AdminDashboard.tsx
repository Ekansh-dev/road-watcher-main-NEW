import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import AdminReportCard from "@/components/AdminReportCard";
import AdminStatistics from "@/components/AdminStatistics";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Report } from "@/types/report";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState<Report[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);

  const checkAdminAccess = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/auth");
      return;
    }

    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (!data) {
      toast({
        title: "Access Denied",
        description: "You do not have admin privileges",
        variant: "destructive",
      });
      navigate("/dashboard");
      return;
    }

    setIsAdmin(true);
    setLoading(false);
  }, [navigate, toast]);

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
    checkAdminAccess();
    fetchReports();
  }, [checkAdminAccess, fetchReports]);

  const handleUpdate = () => {
    fetchReports();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) return null;

  const pendingReports = reports.filter((r) => r.status === "pending");
  const inProgressReports = reports.filter((r) => r.status === "in_progress");
  const solvedReports = reports.filter((r) => r.status === "solved");

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Admin Dashboard
        </h1>
        <p className="text-muted-foreground">
          Manage and review all road damage reports
        </p>
      </div>

      <AdminStatistics reports={reports} />

      <Tabs defaultValue="pending" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="pending">
              Pending ({pendingReports.length})
            </TabsTrigger>
            <TabsTrigger value="in_progress">
              In Progress ({inProgressReports.length})
            </TabsTrigger>
            <TabsTrigger value="solved">
              Solved ({solvedReports.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="space-y-4 mt-6">
            {pendingReports.length === 0 ? (
              <div className="bg-card border rounded-lg p-8 text-center">
                <p className="text-muted-foreground">No pending reports</p>
              </div>
            ) : (
              pendingReports.map((report) => (
                <AdminReportCard
                  key={report.id}
                  report={report}
                  onUpdate={handleUpdate}
                />
              ))
            )}
          </TabsContent>

          <TabsContent value="in_progress" className="space-y-4 mt-6">
            {inProgressReports.length === 0 ? (
              <div className="bg-card border rounded-lg p-8 text-center">
                <p className="text-muted-foreground">No reports in progress</p>
              </div>
            ) : (
              inProgressReports.map((report) => (
                <AdminReportCard
                  key={report.id}
                  report={report}
                  onUpdate={handleUpdate}
                />
              ))
            )}
          </TabsContent>

          <TabsContent value="solved" className="space-y-4 mt-6">
            {solvedReports.length === 0 ? (
              <div className="bg-card border rounded-lg p-8 text-center">
                <p className="text-muted-foreground">No solved reports</p>
              </div>
            ) : (
              solvedReports.map((report) => (
                <AdminReportCard
                  key={report.id}
                  report={report}
                  onUpdate={handleUpdate}
                />
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;
