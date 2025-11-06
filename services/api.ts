import { supabase } from '@/lib/supabaseClient';

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
  list: (courierId: string) =>
    supabase.from('orders').select('*').eq('courier_id', courierId),
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
  getFinancialSummary: (courierId: string) =>
    supabase.rpc('get_financial_summary', { p_courier_id: courierId }),
};

export const RealtimeAPI = {
  subscribeOrders: (handler: (payload: any) => void) =>
    supabase
      .channel('orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, handler)
      .subscribe(),
};
