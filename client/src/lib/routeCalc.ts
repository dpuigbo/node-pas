/**
 * Route calculation utility using free APIs:
 * - Nominatim (OpenStreetMap) for geocoding addresses to coordinates
 * - OSRM (Open Source Routing Machine) for route distance and duration
 *
 * Results include +20% margin on km and hours.
 * Dias viaje = ceil(horasTrayecto / 8) (8-hour work days).
 */

// PAS Robotics origin address (update this if the office moves)
const PAS_ORIGIN_ADDRESS = 'Poligono Industrial La Borda, Castellbisbal, Barcelona, Spain';

// Fallback coordinates for PAS Robotics (Castellbisbal area)
const PAS_ORIGIN_COORDS = { lat: 41.4747, lon: 1.9836 };

const MARGIN = 1.20; // +20%

export interface RouteResult {
  distanceKm: number;    // distance with +20% margin
  durationHours: number; // one-way duration with +20% margin (in decimal hours)
  diasViaje: number;     // ceil(durationHours / 8) - counted in 8-hour work days
  rawDistanceKm: number; // original distance without margin
  rawDurationHours: number; // original duration without margin
}

interface NominatimResult {
  lat: string;
  lon: string;
  display_name: string;
}

/**
 * Geocode an address string to lat/lon using Nominatim.
 */
async function geocode(address: string): Promise<{ lat: number; lon: number } | null> {
  try {
    const url = new URL('https://nominatim.openstreetmap.org/search');
    url.searchParams.set('q', address);
    url.searchParams.set('format', 'json');
    url.searchParams.set('limit', '1');
    url.searchParams.set('countrycodes', 'es'); // Prioritize Spain

    const res = await fetch(url.toString(), {
      headers: {
        'User-Agent': 'PAS-Robotics-Manage/1.0', // Required by Nominatim ToS
      },
    });

    if (!res.ok) return null;

    const data: NominatimResult[] = await res.json();
    if (!data || data.length === 0) return null;

    return {
      lat: parseFloat(data[0].lat),
      lon: parseFloat(data[0].lon),
    };
  } catch {
    return null;
  }
}

/**
 * Get route between two coordinate pairs using OSRM.
 * Returns distance in km and duration in hours.
 */
async function getRoute(
  from: { lat: number; lon: number },
  to: { lat: number; lon: number },
): Promise<{ distanceKm: number; durationHours: number } | null> {
  try {
    // OSRM expects lon,lat order
    const coords = `${from.lon},${from.lat};${to.lon},${to.lat}`;
    const url = `https://router.project-osrm.org/route/v1/driving/${coords}?overview=false`;

    const res = await fetch(url);
    if (!res.ok) return null;

    const data = await res.json();
    if (data.code !== 'Ok' || !data.routes || data.routes.length === 0) return null;

    const route = data.routes[0];
    return {
      distanceKm: route.distance / 1000, // meters to km
      durationHours: route.duration / 3600, // seconds to hours
    };
  } catch {
    return null;
  }
}

/**
 * Compose a full address from client fields.
 */
export function composeAddress(fields: {
  direccion?: string | null;
  ciudad?: string | null;
  codigoPostal?: string | null;
  provincia?: string | null;
}): string {
  const parts = [
    fields.direccion,
    fields.codigoPostal,
    fields.ciudad,
    fields.provincia,
    'Spain',
  ].filter(Boolean);
  return parts.join(', ');
}

/**
 * Calculate route from PAS Robotics office to a client address.
 * Returns distance (km), duration (hours), and dias viaje.
 * All values include +20% margin.
 */
export async function calculateRoute(clientAddress: string): Promise<RouteResult> {
  // 1. Geocode origin (PAS office)
  let originCoords = await geocode(PAS_ORIGIN_ADDRESS);
  if (!originCoords) {
    // Use fallback coordinates if geocoding fails
    originCoords = PAS_ORIGIN_COORDS;
  }

  // 2. Geocode destination (client address)
  const destCoords = await geocode(clientAddress);
  if (!destCoords) {
    throw new Error(`No se pudo encontrar la direccion: "${clientAddress}". Verifica la direccion del cliente.`);
  }

  // 3. Get route
  const route = await getRoute(originCoords, destCoords);
  if (!route) {
    throw new Error('No se pudo calcular la ruta. Intenta de nuevo mas tarde.');
  }

  // 4. Apply +20% margin
  const distanceKm = Math.round(route.distanceKm * MARGIN * 10) / 10;
  const durationHours = Math.round(route.durationHours * MARGIN * 100) / 100;

  // 5. Dias viaje = ceil(durationHours / 8)
  const diasViaje = Math.ceil(durationHours / 8);

  return {
    distanceKm,
    durationHours,
    diasViaje,
    rawDistanceKm: Math.round(route.distanceKm * 10) / 10,
    rawDurationHours: Math.round(route.durationHours * 100) / 100,
  };
}
