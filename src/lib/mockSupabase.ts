import type { Report } from "@/types/report";

const STORAGE_KEY_REPORTS = "road_watcher_reports_v1";
const STORAGE_KEY_SESSION = "road_watcher_session_v1";
const STORAGE_KEY_ROLES = "road_watcher_roles_v1";

interface MockUser {
  id: string;
  email: string;
  user_metadata?: {
    full_name?: string;
    phone?: string;
  };
}

interface MockSession {
  access_token: string;
  user: MockUser;
}

const INITIAL_REPORTS: Report[] = [
  {
    id: "rep-1",
    user_id: "user-admin-123",
    description: "Large deep pothole causing severe traffic slowdown and hazard near Outer Ring Road flyover.",
    image_url: "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=600&q=80",
    latitude: 28.6139,
    longitude: 77.209,
    location_address: "Outer Ring Road, New Delhi",
    danger_level: "severe",
    status: "pending",
    solved_at: null,
    solved_by: null,
    admin_notes: null,
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: "rep-2",
    user_id: "user-123",
    description: "Cracked road surface and damaged asphalt near Connaught Place inner circle.",
    image_url: "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=600&q=80",
    latitude: 28.6315,
    longitude: 77.2167,
    location_address: "Connaught Place, New Delhi",
    danger_level: "moderate",
    status: "in_progress",
    solved_at: null,
    solved_by: null,
    admin_notes: "Inspected by road maintenance crew. Repair scheduled.",
    created_at: new Date(Date.now() - 86400000 * 4).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 1).toISOString(),
  },
  {
    id: "rep-3",
    user_id: "user-456",
    description: "Damaged guardrail and loose road gravel near NH-48 bypass exit.",
    image_url: "https://images.unsplash.com/photo-1590674899484-d5640e854abe?auto=format&fit=crop&w=600&q=80",
    latitude: 28.5355,
    longitude: 77.1587,
    location_address: "NH-48 Highway, New Delhi",
    danger_level: "severe",
    status: "solved",
    solved_at: new Date(Date.now() - 86400000 * 1).toISOString(),
    solved_by: "user-admin-123",
    admin_notes: "Guardrail re-anchored and surface repaved.",
    created_at: new Date(Date.now() - 86400000 * 6).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 1).toISOString(),
  },
];

export const getStoredReports = (): Report[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_REPORTS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_REPORTS, JSON.stringify(INITIAL_REPORTS));
      return INITIAL_REPORTS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_REPORTS;
  }
};

export const saveStoredReports = (reports: Report[]) => {
  try {
    localStorage.setItem(STORAGE_KEY_REPORTS, JSON.stringify(reports));
    notifyListeners();
  } catch {
    // ignore
  }
};

export const getStoredSession = (): MockSession | null => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SESSION);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

export const saveStoredSession = (session: MockSession | null, role: "admin" | "user" = "user") => {
  try {
    if (!session) {
      localStorage.removeItem(STORAGE_KEY_SESSION);
    } else {
      localStorage.setItem(STORAGE_KEY_SESSION, JSON.stringify(session));
      const roles = getStoredRoles();
      roles[session.user.id] = role;
      localStorage.setItem(STORAGE_KEY_ROLES, JSON.stringify(roles));
    }
  } catch {
    // ignore
  }
};

export const getStoredRoles = (): Record<string, "admin" | "user"> => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_ROLES);
    if (!raw) return { "user-admin-123": "admin" };
    return JSON.parse(raw);
  } catch {
    return { "user-admin-123": "admin" };
  }
};

const listeners = new Set<() => void>();

export const subscribeToReportsChange = (callback: () => void) => {
  listeners.add(callback);
  return () => {
    listeners.delete(callback);
  };
};

const notifyListeners = () => {
  listeners.forEach((cb) => cb());
};
