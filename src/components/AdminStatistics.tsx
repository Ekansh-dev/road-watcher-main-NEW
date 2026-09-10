import { Card } from "@/components/ui/card";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import type { Report } from "@/types/report";

interface AdminStatisticsProps {
  reports: Report[];
}

const AdminStatistics = ({ reports }: AdminStatisticsProps) => {
  // Calculate reports by time period (last 7 days)
  const getReportsByDay = () => {
    const days = 7;
    const today = new Date();
    const data = [];

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      const count = reports.filter(r => {
        const reportDate = new Date(r.created_at);
        return reportDate >= date && reportDate < nextDate;
      }).length;

      data.push({
        day: date.toLocaleDateString('en-US', { weekday: 'short' }),
        reports: count
      });
    }

    return data;
  };

  // Calculate status distribution
  const getStatusDistribution = () => {
    return [
      { name: "Pending", value: reports.filter(r => r.status === "pending").length },
      { name: "In Progress", value: reports.filter(r => r.status === "in_progress").length },
      { name: "Solved", value: reports.filter(r => r.status === "solved").length }
    ];
  };

  // Calculate danger level distribution
  const getDangerLevelDistribution = () => {
    return [
      { name: "Moderate", value: reports.filter(r => r.danger_level === "moderate").length },
      { name: "Severe", value: reports.filter(r => r.danger_level === "severe").length }
    ];
  };

  // Calculate average resolution time
  const getAverageResolutionTime = () => {
    const solvedReports = reports.filter(r => r.status === "solved" && r.solved_at);
    
    if (solvedReports.length === 0) return "N/A";

    const totalHours = solvedReports.reduce((acc, report) => {
      const created = new Date(report.created_at).getTime();
      const solved = new Date(report.solved_at).getTime();
      return acc + (solved - created);
    }, 0);

    const avgMilliseconds = totalHours / solvedReports.length;
    const avgHours = Math.round(avgMilliseconds / (1000 * 60 * 60));
    
    if (avgHours < 24) return `${avgHours}h`;
    const avgDays = Math.round(avgHours / 24);
    return `${avgDays}d`;
  };

  const COLORS = {
    pending: "hsl(var(--chart-1))",
    inProgress: "hsl(var(--chart-2))",
    solved: "hsl(var(--chart-3))",
    moderate: "hsl(var(--chart-4))",
    severe: "hsl(var(--chart-5))"
  };

  const timeData = getReportsByDay();
  const statusData = getStatusDistribution();
  const dangerData = getDangerLevelDistribution();

  return (
    <div className="space-y-6 mb-8">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="text-sm text-muted-foreground mb-1">Total Reports</div>
          <div className="text-3xl font-bold text-foreground">{reports.length}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-muted-foreground mb-1">Pending</div>
          <div className="text-3xl font-bold text-chart-1">
            {reports.filter(r => r.status === "pending").length}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-muted-foreground mb-1">Avg Resolution Time</div>
          <div className="text-3xl font-bold text-foreground">{getAverageResolutionTime()}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-muted-foreground mb-1">Severe Issues</div>
          <div className="text-3xl font-bold text-chart-5">
            {reports.filter(r => r.danger_level === "severe").length}
          </div>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Reports Over Time */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Reports by Day</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={timeData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" />
              <YAxis stroke="hsl(var(--muted-foreground))" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: "hsl(var(--card))", 
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px"
                }} 
              />
              <Line 
                type="monotone" 
                dataKey="reports" 
                stroke="hsl(var(--primary))" 
                strokeWidth={2}
                dot={{ fill: "hsl(var(--primary))" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        {/* Status Distribution */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Status Distribution</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={statusData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" />
              <YAxis stroke="hsl(var(--muted-foreground))" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: "hsl(var(--card))", 
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px"
                }} 
              />
              <Bar dataKey="value" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Danger Level Distribution */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Danger Level Distribution</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={dangerData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={(entry) => `${entry.name}: ${entry.value}`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {dangerData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.name === "Severe" ? COLORS.severe : COLORS.moderate} 
                  />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: "hsl(var(--card))", 
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px"
                }} 
              />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        {/* Monthly Trend */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Resolution Rate</h3>
          <div className="flex items-center justify-center h-[250px]">
            <div className="text-center">
              <div className="text-5xl font-bold text-primary mb-2">
                {reports.length > 0 
                  ? Math.round((reports.filter(r => r.status === "solved").length / reports.length) * 100)
                  : 0}%
              </div>
              <div className="text-muted-foreground">of reports resolved</div>
              <div className="text-sm text-muted-foreground mt-4">
                {reports.filter(r => r.status === "solved").length} out of {reports.length} reports
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default AdminStatistics;
