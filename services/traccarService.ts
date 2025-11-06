import { trpc } from '@/lib/trpc';

export type TraccarDevice = {
  id: number;
  name: string;
  uniqueId: string | null;
  status: string;
  lastUpdate: string | null;
  position: { latitude: number; longitude: number; speed: number } | null;
};

export function useTraccarDevices() {
  return trpc.traccar.list.useQuery(
    { includePositions: true },
    {
      staleTime: 60_000,
      refetchInterval: 30_000,
      refetchOnMount: true,
      refetchOnWindowFocus: true,
    }
  );
}
