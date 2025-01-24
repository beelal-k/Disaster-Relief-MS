'use client';
import { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { cn } from '@/lib/utils';
import { Need, Resource } from '@/types';

// Custom icons for different marker types
const NeedIcon = new L.Icon({
  iconUrl: '/markers/need-marker.png',
  iconRetinaUrl: '/markers/need-marker-2x.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowUrl: '/markers/marker-shadow.png',
  shadowSize: [41, 41],
});

const ResourceIcon = new L.Icon({
  iconUrl: '/markers/resource-marker.png',
  iconRetinaUrl: '/markers/resource-marker-2x.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowUrl: '/markers/marker-shadow.png',
  shadowSize: [41, 41],
});

const DefaultIcon = new L.Icon({
  iconUrl: '/markers/marker-icon.png',
  iconRetinaUrl: '/markers/marker-icon-2x.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowUrl: '/markers/marker-shadow.png',
  shadowSize: [41, 41],
});

// Fix for default markers
L.Marker.prototype.options.icon = DefaultIcon;

interface MapProps {
  className?: string;
  center?: [number, number];
  zoom?: number;
  markers?: Array<{
    position: [number, number];
    popup?: React.ReactNode;
    type?: 'need' | 'resource';
    onClick?: () => void;
  }>;
  onLocationSelect?: (lat: number, lng: number) => void;
  interactive?: boolean;
}

function LocationMarker({ onLocationSelect }: { onLocationSelect?: (lat: number, lng: number) => void }) {
  const [position, setPosition] = useState<[number, number] | null>(null);

  const map = useMapEvents({
    click(e) {
      if (onLocationSelect) {
        setPosition([e.latlng.lat, e.latlng.lng]);
        onLocationSelect(e.latlng.lat, e.latlng.lng);
      }
    },
  });

  return position === null ? null : (
    <Marker position={position} icon={DefaultIcon}>
      <Popup>Selected Location</Popup>
    </Marker>
  );
}

function MarkerComponent({
  position,
  popup,
  type,
  onClick
}: {
  position: [number, number];
  popup?: React.ReactNode;
  type?: 'need' | 'resource';
  onClick?: () => void;
}) {
  const map = useMap();
  const [isOpen, setIsOpen] = useState(false);
  const previousZoom = useRef(map.getZoom());

  const handlePopupOpen = () => {
    previousZoom.current = map.getZoom();
    map.setView(position, Math.max(map.getZoom(), 12));
    setIsOpen(true);
    onClick?.();
  };

  const handlePopupClose = () => {
    map.setView(map.getCenter(), previousZoom.current);
    setIsOpen(false);
  };

  return (
    <Marker
      position={position}
      icon={type === 'need' ? NeedIcon : type === 'resource' ? ResourceIcon : DefaultIcon}
      eventHandlers={{
        click: handlePopupOpen,
      }}
    >
      {popup && (
        <Popup eventHandlers={{ popupclose: handlePopupClose }}>
          {popup}
        </Popup>
      )}
    </Marker>
  );
}

function MapController({ center, zoom }: { center?: [number, number]; zoom?: number }) {
  const map = useMap();

  useEffect(() => {
    if (center && zoom) {
      map.setView(center, zoom);
    }
  }, [center, zoom, map]);

  return null;
}

export default function Map({
  className,
  center = [30.3753, 69.3451], // Default to Pakistan's center
  zoom = 5,
  markers = [],
  onLocationSelect,
  interactive = true,
}: MapProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <MapContainer
      center={center}
      zoom={zoom}
      className={cn("h-[400px] w-full", className)}
      scrollWheelZoom={interactive}
      dragging={interactive}
    >
      <MapController center={center} zoom={zoom} />
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {markers.map((marker, idx) => (
        <MarkerComponent
          key={idx}
          position={marker.position}
          popup={marker.popup}
          type={marker.type}
          onClick={marker.onClick}
        />
      ))}
      {onLocationSelect && <LocationMarker onLocationSelect={onLocationSelect} />}
    </MapContainer>
  );
}