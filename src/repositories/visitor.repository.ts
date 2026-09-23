/**
 * Visitor Repository
 * Synchronizes website visitor analytics with Supabase Cloud and local fallback.
 */

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://thgczdlokjrxzakncgwd.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRoZ2N6ZGxva2pyeHpha25jZ3dkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk0OTcwMTAsImV4cCI6MjEwNTA3MzAxMH0.dVg7vSUacM9vs8qn3XNC7fK9WaWQbEdlY0l95Arj1FY';

const HEADERS = {
  'apikey': SUPABASE_ANON_KEY,
  'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
  'Content-Type': 'application/json',
};

export interface VisitorLogInput {
  visitor_id: string;
  session_id?: string;
  page_path?: string;
  active_tab?: string;
  device_type?: string;
  user_agent?: string;
  referrer?: string;
}

export class VisitorRepository {
  /**
   * Log a new visitor event
   */
  static async logVisit(input: VisitorLogInput): Promise<any> {
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/visitor_logs`, {
        method: 'POST',
        headers: {
          ...HEADERS,
          'Prefer': 'return=representation',
        },
        body: JSON.stringify({
          visitor_id: input.visitor_id,
          session_id: input.session_id || null,
          page_path: input.page_path || '/',
          active_tab: input.active_tab || 'overview',
          device_type: input.device_type || 'Desktop',
          user_agent: input.user_agent || null,
          referrer: input.referrer || null,
        }),
      });

      if (!res.ok) {
        const errText = await res.text();
        console.error('Supabase visitor log error:', errText);
        return { success: false, error: errText };
      }

      const data = await res.json();
      return { success: true, data: Array.isArray(data) ? data[0] : data };
    } catch (err: any) {
      console.error('Failed to log visitor:', err.message);
      return { success: false, error: err.message };
    }
  }

  /**
   * Get visitor aggregate statistics
   */
  static async getStats(): Promise<any> {
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/get_visitor_summary`, {
        method: 'POST',
        headers: HEADERS,
      });

      if (res.ok) {
        return await res.json();
      }

      // Fallback to view
      const viewRes = await fetch(`${SUPABASE_URL}/rest/v1/visitor_stats`, {
        headers: HEADERS,
      });
      if (viewRes.ok) {
        const rows: any = await viewRes.json();
        return rows[0] || { total_visits: 0, unique_visitors: 0 };
      }
    } catch (err: any) {
      console.error('Failed to fetch visitor stats from Supabase:', err.message);
    }

    return { total_visits: 0, unique_visitors: 0, error: 'Unavailable' };
  }

  /**
   * Get recent visitor logs
   */
  static async getLogs(limit: number = 50): Promise<any[]> {
    try {
      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/visitor_logs?order=created_at.desc&limit=${limit}`,
        { headers: HEADERS }
      );
      if (res.ok) {
        return await res.json();
      }
    } catch (err: any) {
      console.error('Failed to fetch visitor logs from Supabase:', err.message);
    }
    return [];
  }
}
