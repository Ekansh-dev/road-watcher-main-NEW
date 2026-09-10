import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { MapPin, Calendar, Loader2, Trash2 } from "lucide-react";
import type { Report, ReportStatus } from "@/types/report";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface AdminReportCardProps {
  report: Report;
  onUpdate: () => void;
}

const AdminReportCard = ({ report, onUpdate }: AdminReportCardProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [adminNotes, setAdminNotes] = useState(report.admin_notes || "");

  const dangerColors = {
    moderate: "bg-warning text-warning-foreground",
    severe: "bg-destructive text-destructive-foreground",
  };

  const handleStatusUpdate = async (newStatus: ReportStatus) => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const updateData: Partial<Report> = {
        status: newStatus,
        admin_notes: adminNotes,
      };

      if (newStatus === "solved") {
        updateData.solved_at = new Date().toISOString();
        updateData.solved_by = user.id;
      }

      const { error } = await supabase
        .from("reports")
        .update(updateData)
        .eq("id", report.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Report marked as ${newStatus}`,
      });
      onUpdate();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to update report";
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.from("reports").delete().eq("id", report.id);

      if (error) throw error;

      toast({
        title: "Deleted",
        description: "Report has been deleted",
      });
      onUpdate();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to delete report";
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <img
            src={report.image_url}
            alt="Road damage"
            className="w-full md:w-48 h-48 object-cover rounded-lg"
          />
          <div className="flex-1 space-y-4">
            <div>
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-semibold text-lg text-foreground">
                  {report.description}
                </h3>
                <Badge
                  className={dangerColors[report.danger_level as keyof typeof dangerColors]}
                >
                  {report.danger_level}
                </Badge>
              </div>
              <div className="space-y-1 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  <span>
                    {report.latitude.toFixed(6)}, {report.longitude.toFixed(6)}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  <span>{new Date(report.created_at).toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor={`notes-${report.id}`}>Admin Notes</Label>
              <Textarea
                id={`notes-${report.id}`}
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Add notes about this report..."
                rows={2}
              />
            </div>

            <div className="flex flex-wrap gap-2">
              {report.status === "pending" && (
                <Button
                  onClick={() => handleStatusUpdate("in_progress")}
                  disabled={loading}
                  variant="default"
                  size="sm"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Mark In Progress"
                  )}
                </Button>
              )}
              {(report.status === "pending" || report.status === "in_progress") && (
                <Button
                  onClick={() => handleStatusUpdate("solved")}
                  disabled={loading}
                  variant="secondary"
                  size="sm"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Mark Solved"
                  )}
                </Button>
              )}
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm" disabled={loading}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Report</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete this report? This action cannot be
                      undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AdminReportCard;
