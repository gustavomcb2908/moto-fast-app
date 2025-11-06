import { z } from 'zod';
import { publicProcedure } from '../../create-context';

const TraccarDeviceSchema = z.object({
  id: z.number(),
  name: z.string(),
  uniqueId: z.string().nullable().optional(),
  status: z.string().optional(),
  lastUpdate: z.string().optional(),
  positionId: z.number().optional(),
});

const TraccarPositionSchema = z.object({
  id: z.number(),
  deviceId: z.number().optional(),
  latitude: z.number(),
  longitude: z.number(),
  speed: z.number().optional(),
  attributes: z.record(z.string(), z.any()).optional(),
  serverTime: z.string().optional(),
  deviceTime: z.string().optional(),
});

function getBasicAuthHeader(): string {
  const baseUrl = process.env.TRACCAR_API_URL;
  const username = process.env.TRACCAR_USERNAME;
  const password = process.env.TRACCAR_PASSWORD;
  if (!baseUrl || !username || !password) {
    throw new Error('TRACCAR env vars missing');
  }
  const token = Buffer.from(`${username}:${password}`).toString('base64');
  return `Basic ${token}`;
}

export const listTraccarVehiclesProcedure = publicProcedure
  .input(z.object({ includePositions: z.boolean().default(true) }))
  .query(async ({ input }: { input: { includePositions: boolean } }) => {
    try {
      const baseUrl = process.env.TRACCAR_API_URL;
      const username = process.env.TRACCAR_USERNAME;
      const password = process.env.TRACCAR_PASSWORD;

      if (!baseUrl || !username || !password) {
        console.warn('⚠️ Traccar credentials not configured, returning empty list');
        return { devices: [] };
      }

      const auth = getBasicAuthHeader();

      const [devicesRes, positionsRes] = await Promise.all([
        fetch(`${baseUrl}/devices`, { 
          headers: { 
            Authorization: auth,
            'Content-Type': 'application/json'
          } 
        }),
        input.includePositions ? fetch(`${baseUrl}/positions`, { 
          headers: { 
            Authorization: auth,
            'Content-Type': 'application/json'
          } 
        }) : Promise.resolve(null),
      ]);

      if (!devicesRes.ok) {
        const text = await devicesRes.text();
        console.error(`❌ Traccar devices error ${devicesRes.status}:`, text.slice(0, 200));
        return { devices: [] };
      }

      const devicesJson = (await devicesRes.json()) as unknown[];
      const devices = z.array(TraccarDeviceSchema).parse(devicesJson);

      let positions: z.infer<typeof TraccarPositionSchema>[] = [];
      if (positionsRes) {
        if (!positionsRes.ok) {
          const text = await positionsRes.text();
          console.error(`❌ Traccar positions error ${positionsRes.status}:`, text.slice(0, 200));
        } else {
          const posJson = (await positionsRes.json()) as unknown[];
          positions = z.array(TraccarPositionSchema).parse(posJson);
        }
      }

      const byId = new Map<number, z.infer<typeof TraccarPositionSchema>>();
      positions.forEach((p) => {
        byId.set(p.id, p);
      });

      const enriched = devices.map((d) => {
        const pos = d.positionId ? byId.get(d.positionId) : undefined;
        return {
          id: d.id,
          name: d.name,
          uniqueId: d.uniqueId ?? null,
          status: d.status ?? 'unknown',
          lastUpdate: d.lastUpdate ?? null,
          position: pos
            ? { latitude: pos.latitude, longitude: pos.longitude, speed: pos.speed ?? 0 }
            : null,
        };
      });

      console.log(`✅ Traccar: loaded ${enriched.length} devices`);
      return { devices: enriched };
    } catch (error: any) {
      console.error('❌ Traccar integration error:', error.message);
      return { devices: [] };
    }
  });
