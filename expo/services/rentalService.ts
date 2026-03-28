import { supabase } from '@/lib/supabaseClient';

export interface CreateRentalInput {
  courierId: string;
  vehicleId: string;
  totalAmount: number;
  paymentId: string;
}

export async function createRental(input: CreateRentalInput) {
  const { courierId, vehicleId, totalAmount, paymentId } = input;

  const { error: insertErr } = await supabase.from('rentals').insert({
    courier_id: courierId,
    vehicle_id: vehicleId,
    start_date: new Date().toISOString(),
    status: 'active',
    total_amount: totalAmount,
    payment_id: paymentId,
  });
  if (insertErr) throw insertErr;

  const { error: updateErr } = await supabase
    .from('vehicles')
    .update({ rental_status: 'rented' })
    .eq('id', vehicleId);
  if (updateErr) throw updateErr;

  return { success: true } as const;
}
