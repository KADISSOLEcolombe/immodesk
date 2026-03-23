"use client";

import { MapContainer, TileLayer, CircleMarker, useMapEvents } from 'react-leaflet';
import { useEffect } from 'react';
import { useMap } from 'react-leaflet';

type Coordinates = {
  latitude: number;
  longitude: number;
};

type LocationPickerMapProps = {
  value: Coordinates | null;
  onChange: (coords: Coordinates) => void;
  center?: Coordinates;
};

const LOME_COORDS: Coordinates = {
  latitude: 6.1319,
  longitude: 1.2228,
};

function ClickHandler({ onChange }: { onChange: (coords: Coordinates) => void }) {
  useMapEvents({
    click(event) {
      onChange({
        latitude: event.latlng.lat,
        longitude: event.latlng.lng,
      });
    },
  });

  return null;
}

function ViewportSync({ value }: { value: Coordinates | null }) {
  const map = useMap();

  useEffect(() => {
    if (!value) {
      return;
    }

    map.setView([value.latitude, value.longitude], map.getZoom(), {
      animate: true,
    });
  }, [map, value]);

  return null;
}

export default function LocationPickerMap({ value, onChange, center }: LocationPickerMapProps) {
  const mapCenter = value ?? center ?? LOME_COORDS;

  return (
    <div className="overflow-hidden rounded-xl border border-zinc-200">
      <MapContainer
        center={[mapCenter.latitude, mapCenter.longitude]}
        zoom={13}
        className="h-72 w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <ViewportSync value={value} />
        <ClickHandler onChange={onChange} />
        {value ? (
          <CircleMarker
            center={[value.latitude, value.longitude]}
            radius={9}
            pathOptions={{ color: '#111827', fillColor: '#111827', fillOpacity: 0.9 }}
          />
        ) : null}
      </MapContainer>
    </div>
  );
}
