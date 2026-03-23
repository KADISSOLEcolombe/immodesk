"use client";

import { CircleMarker, MapContainer, Popup, TileLayer } from 'react-leaflet';

type MapPropertyPoint = {
  id: string;
  label: string;
  address: string;
  latitude: number;
  longitude: number;
  isCurrent?: boolean;
};

type PropertyLocationMapProps = {
  points: MapPropertyPoint[];
};

export default function PropertyLocationMap({ points }: PropertyLocationMapProps) {
  if (points.length === 0) {
    return null;
  }

  const currentPoint = points.find((point) => point.isCurrent) ?? points[0];

  return (
    <div className="overflow-hidden rounded-xl border border-zinc-200">
      <MapContainer
        center={[currentPoint.latitude, currentPoint.longitude]}
        zoom={14}
        className="h-80 w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {points.map((point) => (
          <CircleMarker
            key={point.id}
            center={[point.latitude, point.longitude]}
            radius={point.isCurrent ? 10 : 7}
            pathOptions={{
              color: point.isCurrent ? '#dc2626' : '#2563eb',
              fillColor: point.isCurrent ? '#dc2626' : '#2563eb',
              fillOpacity: 0.85,
            }}
          >
            <Popup>
              <div className="text-sm">
                <p className="font-semibold text-zinc-900">{point.label}</p>
                <p className="text-zinc-600">{point.address}</p>
                {point.isCurrent ? <p className="mt-1 text-xs text-red-600">Bien actuel</p> : null}
              </div>
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>
    </div>
  );
}

export type { MapPropertyPoint };
