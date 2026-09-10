import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Calendar } from "lucide-react";
import type { Report } from "@/types/report";

interface ReportCardProps {
  report: Report;
  onUpdate?: () => void;
}

const ReportCard = ({ report }: ReportCardProps) => {
  const statusColors = {
    pending: "bg-warning text-warning-foreground",
    in_progress: "bg-primary text-primary-foreground",
    solved: "bg-secondary text-secondary-foreground",
  };

  const dangerColors = {
    moderate: "bg-warning text-warning-foreground",
    severe: "bg-destructive text-destructive-foreground",
  };

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex gap-4">
          <img
            src={report.image_url}
            alt="Road damage"
            className="w-24 h-24 object-cover rounded-lg"
          />
          <div className="flex-1">
            <div className="flex items-start justify-between mb-2">
              <h3 className="font-semibold text-foreground line-clamp-2">
                {report.description}
              </h3>
              <Badge className={statusColors[report.status as keyof typeof statusColors]}>
                {report.status}
              </Badge>
            </div>
            <div className="space-y-1 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                <span>
                  {report.latitude.toFixed(6)}, {report.longitude.toFixed(6)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-3 w-3" />
                <span>{new Date(report.created_at).toLocaleDateString()}</span>
                <Badge
                  variant="outline"
                  className={dangerColors[report.danger_level as keyof typeof dangerColors]}
                >
                  {report.danger_level}
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ReportCard;
