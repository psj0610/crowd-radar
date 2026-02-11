"use client";

import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';

const TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "";
mapboxgl.accessToken = TOKEN;

const GANGNAM_STATION = { lat: 37.498095, lng: 127.027610 };

// 🛑 MANUAL DATA (Our 10 Cafes)
const REAL_CAFES = [
  { name: "Starbucks Gangnam R", lat: 37.4978, lng: 127.0286, busyness: 9 },
  { name: "Blue Bottle Coffee", lat: 37.4971, lng: 127.0282, busyness: 5 },
  { name: "Starbucks Yeoksam", lat: 37.4992, lng: 127.0295, busyness: 7 },
  { name: "Twosome Place", lat: 37.4985, lng: 127.0260, busyness: 3 },
  { name: "Ediya Coffee", lat: 37.4965, lng: 127.0255, busyness: 2 },
  { name: "Coffee Bean & Tea Leaf", lat: 37.4988, lng: 127.0278, busyness: 6 },
  { name: "Mega Coffee", lat: 37.4975, lng: 127.0290, busyness: 8 },
  { name: "Paul Bassett", lat: 37.4995, lng: 127.0265, busyness: 4 },
  { name: "Dunkin' Gangnam", lat: 37.4968, lng: 127.0270, busyness: 5 },
  { name: "Hollys Coffee", lat: 37.4982, lng: 127.0250, busyness: 3 },
];

export default function CrowdRadar() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [status, setStatus] = useState("SYSTEM ONLINE");

  useEffect(() => {
    if (map.current) return;
    if (!mapContainer.current) return;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: [GANGNAM_STATION.lng, GANGNAM_STATION.lat],
      zoom: 16,
      pitch: 45,
    });

    map.current.on('load', () => loadManualData(map.current!));

    // CLICK INTERACTION
    map.current.on('click', 'cafe-dots', (e) => {
      if (!e.features?.[0]) return;
      const feature = e.features[0];
      if (feature.geometry.type !== 'Point') return;
      
      const coordinates = feature.geometry.coordinates.slice() as [number, number];
      const props = feature.properties;
      if (!props) return;

      // Create the popup (Styles are in globals.css)
      new mapboxgl.Popup({ closeButton: true })
        .setLngLat(coordinates)
        .setHTML(`
          <div style="text-align: center;">
            <h3 style="margin: 0; font-size: 16px; color: #33ff33;">${props.name}</h3>
            <div style="margin-top: 5px; font-size: 12px; color: #ccc;">
              CROWD LEVEL: <span style="color: white; font-weight: bold;">${props.busyness}/10</span>
            </div>
            <div style="margin-top: 8px; width: 100%; height: 4px; background: #333;">
              <div style="width: ${props.busyness * 10}%; height: 100%; background: ${props.color}; box-shadow: 0 0 5px ${props.color};"></div>
            </div>
          </div>
        `)
        .addTo(map.current!);
    });

    map.current.on('mouseenter', 'cafe-dots', () => map.current!.getCanvas().style.cursor = 'pointer');
    map.current.on('mouseleave', 'cafe-dots', () => map.current!.getCanvas().style.cursor = '');
  }, []);

// 🚁 TELEPORT FUNCTION (SMARTER VERSION)
const flyToMe = () => {
  if (!navigator.geolocation) {
    alert("Geolocation is not supported by your browser");
    return;
  }
  
  setStatus("LOCATING USER...");

  // Options: Be accurate, but give up after 5 seconds
  const options = {
    enableHighAccuracy: true,
    timeout: 5000,
    maximumAge: 0
  };

  navigator.geolocation.getCurrentPosition(
    (position) => {
      const { latitude, longitude } = position.coords;
      map.current?.flyTo({
        center: [longitude, latitude],
        zoom: 14,
        essential: true
      });
      
      // Blue Marker for YOU
      new mapboxgl.Marker({ color: '#3b82f6', scale: 1.2 })
        .setLngLat([longitude, latitude])
        .addTo(map.current!);

      setStatus("USER LOCATED");
    },
    (error) => {
      console.error(error);
      // If it fails, fallback to Seoul City Hall just to show movement
      setStatus("GPS ERROR. TELEPORTING TO CITY HALL...");
      map.current?.flyTo({ center: [126.9780, 37.5665], zoom: 14 }); 
    },
    options
  );
};

  return (
    <div style={{ width: '100vw', height: '100vh', backgroundColor: '#000', position: 'relative' }}>
      <link href="https://api.mapbox.com/mapbox-gl-js/v3.1.2/mapbox-gl.css" rel="stylesheet" />
      <div ref={mapContainer} style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 }} />
      
      {/* STATUS HUD */}
      <div style={{ 
        position: 'absolute', top: 20, left: 20, 
        padding: '10px 15px', background: 'rgba(0,0,0,0.8)', 
        color: '#33ff33', fontFamily: 'monospace', 
        border: '1px solid #33ff33', borderRadius: '4px',
        boxShadow: '0 0 10px rgba(51, 255, 51, 0.2)',
        zIndex: 10
      }}>
        ⚡ {status}
      </div>

      {/* TELEPORT BUTTON */}
      <button 
        onClick={flyToMe}
        style={{
          position: 'absolute', bottom: 30, right: 30,
          background: '#33ff33', color: 'black',
          border: 'none', padding: '15px 25px',
          fontWeight: 'bold', fontFamily: 'monospace', fontSize: '16px',
          cursor: 'pointer', borderRadius: '50px',
          boxShadow: '0 0 20px rgba(51, 255, 51, 0.6)',
          zIndex: 10
        }}
      >
        📍 LOCATE ME
      </button>
    </div>
  );

  function loadManualData(map: mapboxgl.Map) {
    const features = REAL_CAFES.map((cafe) => ({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [cafe.lng, cafe.lat] },
      properties: {
        name: cafe.name, busyness: cafe.busyness,
        color: cafe.busyness > 7 ? '#ef4444' : cafe.busyness > 4 ? '#eab308' : '#22c55e'
      }
    }));

    map.addSource('cafes', { type: 'geojson', data: { type: 'FeatureCollection', features: features as any } });

    map.addLayer({
      id: 'cafe-dots',
      type: 'circle',
      source: 'cafes',
      paint: {
        'circle-radius': 8,
        'circle-color': ['get', 'color'],
        'circle-stroke-width': 2,
        'circle-stroke-color': '#fff',
        'circle-blur': 0.2
      }
    });
    setStatus(`ONLINE: ${features.length} NODES ACTIVE`);
  }
}