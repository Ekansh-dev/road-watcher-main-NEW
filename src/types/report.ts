import type { Database } from "@/integrations/supabase/types";

export type Report = Database["public"]["Tables"]["reports"]["Row"];
export type ReportStatus = Database["public"]["Enums"]["report_status"];
export type DangerLevel = Database["public"]["Enums"]["danger_level"];
