import { supabase } from '@/lib/supabaseClient';
import { Platform } from 'react-native';

const isUuid = (v: string): boolean =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);

export const AuthAPI = {
  login: (email: string, password: string) =>
    supabase.auth.signInWithPassword({ email, password }),
  signup: (email: string, password: string, name?: string) =>
    supabase.auth.signUp({
      email,
      password,
      options: { data: name ? { full_name: name } : undefined },
    }),
  logout: () => supabase.auth.signOut(),
  resetPassword: (email: string, redirectTo?: string) =>
    supabase.auth.resetPasswordForEmail(email, { redirectTo }),
  updatePassword: (newPassword: string) =>
    supabase.auth.updateUser({ password: newPassword }),
  getUser: () => supabase.auth.getUser(),
  onAuthStateChange: (cb: Parameters<typeof supabase.auth.onAuthStateChange>[0]) =>
    supabase.auth.onAuthStateChange(cb),
};

export const ProfilesAPI = {
  getCourierByUserId: async (userId: string) => {
    if (!isUuid(userId)) {
      console.log('ProfilesAPI.getCourierByUserId: non-uuid userId, returning null');
      return null as unknown as Record<string, unknown> | null;
    }
    const { data, error } = await supabase
      .from('couriers')
      .select('*')
      .eq('user_id', userId)
      .single();
    if (error) throw error;
    return data;
  },
  updateCourier: async (
    userId: string,
    updates: Partial<{ full_name: string; phone: string; address: string; theme: 'light' | 'dark' }>
  ) => {
    if (!isUuid(userId)) {
      console.log('ProfilesAPI.updateCourier: non-uuid userId in demo, skipping update');
      return { ...updates } as unknown as Record<string, unknown>;
    }
    const { data, error } = await supabase
      .from('couriers')
      .update(updates)
      .eq('user_id', userId)
      .select()
      .single();
    if (error) throw error;
    return data;
  },
};

export const OrdersAPI = {
  list: (courierId: string) => {
    if (!isUuid(courierId)) {
      console.log('OrdersAPI.list: non-uuid courierId, returning empty list');
      return {
        data: [] as unknown[],
        error: null,
      } as unknown as Promise<{ data: unknown[]; error: null }>;
    }
    return supabase.from('orders').select('*').eq('courier_id', courierId);
  },
  updateStatus: (id: string, status: string) =>
    supabase.from('orders').update({ status }).eq('id', id),
};

export const StorageAPI = {
  uploadDocument: async (userId: string, file: Blob, fileName: string) => {
    const filePath = `${userId}/${Date.now()}-${fileName}`;
    const { data, error } = await supabase.storage
      .from('motofast-documents')
      .upload(filePath, file);
    if (error) throw error;
    const pub = supabase.storage.from('motofast-documents').getPublicUrl(filePath);
    return { path: filePath, publicUrl: pub.data.publicUrl };
  },
};

export const RpcAPI = {
  markInvoicePaid: (invoiceId: string, receipt: string) =>
    supabase.rpc('mark_invoice_paid', { invoice_id: invoiceId, receipt }),
  getFinancialSummary: (courierId: string) => {
    if (!isUuid(courierId)) {
      console.log('RpcAPI.getFinancialSummary: non-uuid, returning zeros');
      return Promise.resolve({
        data: { total_due: 0, total_paid: 0, pending_invoices: 0 },
        error: null,
      }) as unknown as Promise<{ data: { total_due: number; total_paid: number; pending_invoices: number }; error: null }>;
    }
    return supabase.rpc('get_financial_summary', { p_courier_id: courierId });
  },
};

export const RealtimeAPI = {
  subscribeOrders: (handler: (payload: any) => void) =>
    supabase
      .channel('orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, handler)
      .subscribe(),
};
