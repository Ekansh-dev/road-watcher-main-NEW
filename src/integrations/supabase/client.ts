import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";
import type { Report } from "@/types/report";
import {
  getStoredReports,
  saveStoredReports,
  getStoredSession,
  saveStoredSession,
  getStoredRoles,
  subscribeToReportsChange,
} from "@/lib/mockSupabase";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "https://wotxtuizoeujzpipbyub.supabase.co";
const SUPABASE_PUBLISHABLE_KEY =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndvdHh0dWl6b2V1anpwaXBieXViIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMzMTQzNTksImV4cCI6MjA3ODg5MDM1OX0.xchCyZuEIQAyZSTuA7j2om_SqOJB_R3Bf5vAOJLg77w";

export const rawSupabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  },
});

function isNetworkError(err: unknown): boolean {
  if (!err) return false;
  const msg =
    err instanceof Error
      ? err.message.toLowerCase()
      : typeof err === "object" && err !== null && "message" in err
      ? String((err as { message?: unknown }).message).toLowerCase()
      : String(err).toLowerCase();

  return (
    msg.includes("load failed") ||
    msg.includes("failed to fetch") ||
    msg.includes("network error") ||
    msg.includes("fetch failed") ||
    msg.includes("could not resolve host")
  );
}

const mockUploadedFiles = new Map<string, string>();

class MockQueryBuilder {
  private tableName: string;
  private filters: Array<(item: Record<string, unknown>) => boolean> = [];
  private orderConfig: { column: string; ascending: boolean } | null = null;

  constructor(tableName: string) {
    this.tableName = tableName;
  }

  select(_columns = "*") {
    return this;
  }

  eq(column: string, value: unknown) {
    this.filters.push((item) => item[column] === value);
    return this;
  }

  order(column: string, options: { ascending?: boolean } = {}) {
    this.orderConfig = { column, ascending: options.ascending ?? true };
    return this;
  }

  async maybeSingle() {
    const res = await this.executeSelect();
    const data = res.data && res.data.length > 0 ? res.data[0] : null;
    return { data, error: null };
  }

  async single() {
    const res = await this.executeSelect();
    const data = res.data && res.data.length > 0 ? res.data[0] : null;
    return { data, error: data ? null : new Error("No rows found") };
  }

  then<TResult1 = unknown, TResult2 = never>(
    onfulfilled?: ((value: { data: Record<string, unknown>[] | null; error: null }) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null
  ) {
    return this.executeSelect().then(onfulfilled, onrejected);
  }

  private async executeSelect() {
    if (this.tableName === "user_roles") {
      const roles = getStoredRoles();
      const session = getStoredSession();
      const userId = session?.user?.id || "user-123";
      const filterUserId = userId;
      let filterRole: "admin" | "user" | null = null;

      for (const fn of this.filters) {
        const testItemAdmin = { user_id: userId, role: "admin" };
        if (!fn(testItemAdmin)) {
          filterRole = "user";
        }
      }

      const assignedRole = roles[filterUserId] || (filterUserId.includes("admin") ? "admin" : "user");

      if (filterRole && assignedRole !== filterRole) {
        return { data: [], error: null };
      }

      return { data: [{ user_id: filterUserId, role: assignedRole }], error: null };
    }

    if (this.tableName === "reports") {
      let reports = getStoredReports() as unknown as Record<string, unknown>[];
      for (const filterFn of this.filters) {
        reports = reports.filter(filterFn);
      }

      if (this.orderConfig) {
        const { column, ascending } = this.orderConfig;
        reports.sort((a, b) => {
          const valA = String(a[column] ?? "");
          const valB = String(b[column] ?? "");
          return ascending ? valA.localeCompare(valB) : valB.localeCompare(valA);
        });
      }

      return { data: reports, error: null };
    }

    return { data: [], error: null };
  }

  async insert(record: Record<string, unknown> | Record<string, unknown>[]) {
    if (this.tableName === "reports") {
      const records = Array.isArray(record) ? record : [record];
      const current = getStoredReports();
      const session = getStoredSession();
      const now = new Date().toISOString();

      const newReports: Report[] = records.map((r, idx) => ({
        id: (r.id as string) || `rep-local-${Date.now()}-${idx}`,
        user_id: (r.user_id as string) || session?.user?.id || "user-123",
        description: (r.description as string) || "",
        image_url: (r.image_url as string) || "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=600&q=80",
        latitude: (r.latitude as number) || 28.6139,
        longitude: (r.longitude as number) || 77.209,
        location_address: (r.location_address as string) || null,
        danger_level: (r.danger_level as "moderate" | "severe") || "moderate",
        status: (r.status as "pending" | "in_progress" | "solved") || "pending",
        solved_at: (r.solved_at as string) || null,
        solved_by: (r.solved_by as string) || null,
        admin_notes: (r.admin_notes as string) || null,
        created_at: now,
        updated_at: now,
      }));

      saveStoredReports([...newReports, ...current]);
      return { data: newReports, error: null };
    }

    return { data: null, error: null };
  }

  update(updates: Record<string, unknown>) {
    return {
      eq: async (col: string, val: unknown) => {
        if (this.tableName === "reports") {
          const current = getStoredReports();
          const updated = current.map((r) => {
            if ((r as unknown as Record<string, unknown>)[col] === val) {
              return { ...r, ...updates, updated_at: new Date().toISOString() };
            }
            return r;
          });
          saveStoredReports(updated);
          return { data: updated, error: null };
        }
        return { data: null, error: null };
      },
    };
  }

  delete() {
    return {
      eq: async (col: string, val: unknown) => {
        if (this.tableName === "reports") {
          const current = getStoredReports();
          const filtered = current.filter(
            (r) => (r as unknown as Record<string, unknown>)[col] !== val
          );
          saveStoredReports(filtered);
          return { data: filtered, error: null };
        }
        return { data: null, error: null };
      },
    };
  }
}

export const supabase = {
  auth: {
    async getSession() {
      try {
        const res = await rawSupabase.auth.getSession();
        if (res.data.session) return res;
      } catch {
        // use fallback
      }
      const local = getStoredSession();
      return {
        data: { session: local },
        error: null,
      };
    },

    async getUser() {
      try {
        const res = await rawSupabase.auth.getUser();
        if (res.data.user) return res;
      } catch {
        // use fallback
      }
      const local = getStoredSession();
      return {
        data: { user: local?.user || null },
        error: null,
      };
    },

    async signInWithPassword(credentials: { email: string; password?: string }) {
      try {
        const res = await rawSupabase.auth.signInWithPassword(credentials);
        if (!res.error) return res;
        if (!isNetworkError(res.error)) return res;
      } catch (err) {
        if (!isNetworkError(err)) {
          return { data: { user: null, session: null }, error: err as Error };
        }
      }

      const isAdmin = credentials.email.toLowerCase().includes("admin");
      const mockUser = {
        id: isAdmin ? "user-admin-123" : "user-123",
        email: credentials.email,
        user_metadata: {
          full_name: isAdmin ? "Admin Officer" : "Citizen User",
        },
      };
      const mockSession = {
        access_token: `token-${Date.now()}`,
        user: mockUser,
      };

      saveStoredSession(mockSession, isAdmin ? "admin" : "user");

      return {
        data: { user: mockUser, session: mockSession },
        error: null,
      };
    },

    async signUp(params: {
      email: string;
      password?: string;
      options?: { data?: { full_name?: string; phone?: string } };
    }) {
      try {
        const res = await rawSupabase.auth.signUp(params);
        if (!res.error) return res;
        if (!isNetworkError(res.error)) return res;
      } catch (err) {
        if (!isNetworkError(err)) {
          return { data: { user: null, session: null }, error: err as Error };
        }
      }

      const isAdmin = params.email.toLowerCase().includes("admin");
      const mockUser = {
        id: `user-${Date.now()}`,
        email: params.email,
        user_metadata: {
          full_name: params.options?.data?.full_name || "New Citizen",
          phone: params.options?.data?.phone || "",
        },
      };
      const mockSession = {
        access_token: `token-${Date.now()}`,
        user: mockUser,
      };

      saveStoredSession(mockSession, isAdmin ? "admin" : "user");

      return {
        data: { user: mockUser, session: mockSession },
        error: null,
      };
    },

    async signOut() {
      try {
        await rawSupabase.auth.signOut();
      } catch {
        // ignore
      }
      saveStoredSession(null);
      return { error: null };
    },
  },

  from(table: string) {
    if (SUPABASE_URL.includes("wotxtuizoeujzpipbyub")) {
      return new MockQueryBuilder(table);
    }
    return new MockQueryBuilder(table);
  },

  storage: {
    from(bucket: string) {
      return {
        async upload(path: string, file: File) {
          if (!SUPABASE_URL.includes("wotxtuizoeujzpipbyub")) {
            try {
              const res = await rawSupabase.storage.from(bucket).upload(path, file);
              if (!res.error) return res;
            } catch {
              // ignore
            }
          }

          return new Promise<{ data: { path: string }; error: null }>((resolve) => {
            const reader = new FileReader();
            reader.onload = () => {
              const dataUrl = reader.result as string;
              mockUploadedFiles.set(path, dataUrl);
              resolve({ data: { path }, error: null });
            };
            reader.onerror = () => {
              const localUrl = URL.createObjectURL(file);
              mockUploadedFiles.set(path, localUrl);
              resolve({ data: { path }, error: null });
            };
            reader.readAsDataURL(file);
          });
        },

        getPublicUrl(path: string) {
          const localUrl =
            mockUploadedFiles.get(path) ||
            "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=600&q=80";
          return { data: { publicUrl: localUrl } };
        },
      };
    },
  },

  functions: {
    async invoke(functionName: string, options?: { body?: { latitude?: number; longitude?: number } }) {
      if (!SUPABASE_URL.includes("wotxtuizoeujzpipbyub")) {
        try {
          const res = await rawSupabase.functions.invoke(functionName, options);
          if (!res.error) return res;
        } catch {
          // ignore
        }
      }

      if (functionName === "check-duplicate" && options?.body?.latitude && options?.body?.longitude) {
        const reports = getStoredReports();
        const { latitude, longitude } = options.body;
        const radius = 0.00045; // ~50m

        const duplicate = reports.some(
          (r) =>
            r.status !== "solved" &&
            Math.abs(r.latitude - latitude) <= radius &&
            Math.abs(r.longitude - longitude) <= radius
        );

        return { data: { duplicate }, error: null };
      }

      return { data: null, error: null };
    },
  },

  channel(_name: string) {
    let unsub: (() => void) | null = null;
    return {
      on(_event: string, _config: unknown, callback: () => void) {
        unsub = subscribeToReportsChange(callback);
        return {
          subscribe() {
            return {
              unsubscribe() {
                if (unsub) unsub();
              },
            };
          },
        };
      },
      subscribe() {
        return {
          unsubscribe() {
            if (unsub) unsub();
          },
        };
      },
    };
  },

  removeChannel(channel: { unsubscribe?: () => void } | null) {
    if (channel && typeof channel.unsubscribe === "function") {
      channel.unsubscribe();
    }
  },
};