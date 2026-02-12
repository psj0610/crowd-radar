"use client";

import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import mapboxgl from 'mapbox-gl';
import { supabase } from '@/lib/supabaseClient';

const TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "";
mapboxgl.accessToken = TOKEN;

const DEFAULT_CENTER = { lat: 37.4979, lng: 127.0276 }; // Gangnam Center

export default function CrowdRadar() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [status, setStatus] = useState("CONNECTING...");

  useEffect(() => {
    if (map.current) return;

    const initMap = (lng: number, lat: number) => {
      if (!mapContainer.current) return;
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/dark-v11',
        center: [lng, lat],
        zoom: 15,
        pitch: 0,
      });

      // Add "Me" Marker
      new mapboxgl.Marker({ color: '#3b82f6', scale: 1.2 })
        .setLngLat([lng, lat])
        .addTo(map.current);

      map.current.on('load', () => {
        setStatus("SYNCING...");
        fetchCafes();
        subscribeToUpdates();
      });

      setupInteractions();
    };

    // Robust Location Check
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (p) => {
          console.log("GPS Success:", p.coords);
          initMap(p.coords.longitude, p.coords.latitude);
        },
        (err) => {
          console.warn("GPS Failed (Using Gangnam):", err.message);
          initMap(DEFAULT_CENTER.lng, DEFAULT_CENTER.lat);
        }
      );
    } else {
      initMap(DEFAULT_CENTER.lng, DEFAULT_CENTER.lat);
    }
  }, []);

  async function fetchCafes() {
    const { data } = await supabase.from('cafes').select('*');
    if (data) {
      updateMapData(data);
      setStatus("ONLINE");
    }
  }

  function subscribeToUpdates() {
    supabase
      .channel('cafes-channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'cafes' }, () => {
        fetchCafes();
      })
      .subscribe();
  }

  function updateMapData(cafes: any[]) {
    if (!map.current) return;

    const features = cafes.map((cafe) => ({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [cafe.lng, cafe.lat] },
      properties: {
        id: cafe.id,
        name: cafe.name, 
        busyness: cafe.busyness,
        color: cafe.busyness > 7 ? '#ef4444' : cafe.busyness > 4 ? '#eab308' : '#22c55e'
      }
    }));

    const source = map.current.getSource('cafes') as mapboxgl.GeoJSONSource;

    if (source) {
      source.setData({ type: 'FeatureCollection', features: features as any });
    } else {
      map.current.addSource('cafes', { type: 'geojson', data: { type: 'FeatureCollection', features: features as any } });
      map.current.addLayer({
        id: 'cafe-dots',
        type: 'circle',
        source: 'cafes',
        paint: {
          'circle-radius': 6,
          'circle-color': ['get', 'color'], // Dynamic color
          'circle-stroke-width': 1,
          'circle-stroke-color': '#000000',
          'circle-opacity': 0.9
        }
      });
    }
  }

  function setupInteractions() {
    if (!map.current) return;
    
    map.current.on('click', 'cafe-dots', (e) => {
      if (!e.features?.[0]) return;
      const props = e.features[0].properties;
      if (!props) return;
      
      const coordinates = (e.features[0].geometry as any).coordinates.slice();
      
      // 1. Create container
      const popupNode = document.createElement('div');
      
      // 2. Create Popup Instance (Save to variable so we can close it later)
      const popup = new mapboxgl.Popup({ closeButton: true, className: 'pro-popup', maxWidth: '300px' })
        .setLngLat(coordinates)
        .setDOMContent(popupNode)
        .addTo(map.current!);

      // 3. Render React Component (Pass the 'close' function to it)
      const root = createRoot(popupNode);
      root.render(
        <PopupCard 
          id={props.id} 
          name={props.name} 
          busyness={props.busyness} 
          color={props.color}
          onClose={() => popup.remove()} // Pass the ability to close itself
        />
      );
    });

    map.current.on('mouseenter', 'cafe-dots', () => map.current!.getCanvas().style.cursor = 'pointer');
    map.current.on('mouseleave', 'cafe-dots', () => map.current!.getCanvas().style.cursor = '');
  }

  return (
    <div style={{ width: '100vw', height: '100vh', background: '#09090b', position: 'relative' }}>
      <link href="https://api.mapbox.com/mapbox-gl-js/v3.1.2/mapbox-gl.css" rel="stylesheet" />
      <div ref={mapContainer} style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 }} />
      
      <div style={{ 
        position: 'absolute', top: 24, left: '50%', transform: 'translateX(-50%)',
        padding: '8px 16px', background: 'rgba(20,20,20,0.8)', 
        backdropFilter: 'blur(8px)', borderRadius: '30px',
        color: '#fff', fontSize: '13px', fontWeight: 500,
        border: '1px solid rgba(255,255,255,0.1)',
        zIndex: 10, display: 'flex', alignItems: 'center', gap: '8px'
      }}>
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: status === 'ONLINE' ? '#22c55e' : '#eab308' }}></div>
        {status}
      </div>

      <button 
        onClick={() => {
          navigator.geolocation.getCurrentPosition(p => {
            map.current?.flyTo({ center: [p.coords.longitude, p.coords.latitude], zoom: 15 });
          });
        }}
        style={{
          position: 'absolute', bottom: 32, right: 24,
          width: '48px', height: '48px',
          background: '#ffffff', color: 'black',
          border: 'none', borderRadius: '12px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '20px', zIndex: 10
        }}
      >
        📍
      </button>
    </div>
  );
}

// --- POPUP COMPONENT (Now with Auto-Close) ---
function PopupCard({ id, name, busyness, color, onClose }: any) {
  
  const handleReport = async (level: number) => {
    // 1. INSTANTLY Close Popup (Feels snappy)
    onClose();

    // 2. Send to Supabase (Happens in background)
    await supabase
      .from('cafes')
      .update({ busyness: level, last_updated: new Date().toISOString() })
      .eq('id', id);
  };

  return (
    <div style={{ fontFamily: 'sans-serif', minWidth: '220px' }}>
      <div style={{ fontWeight: 600, fontSize: '15px', marginBottom: '6px', color: '#fff' }}>
        {name}
      </div>
      
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '13px', color: '#a1a1aa', marginBottom: '8px' }}>
        <span>Live Capacity</span>
        <span style={{ color: 'white', fontWeight: 500 }}>{busyness * 10}%</span>
      </div>
      
      <div style={{ width: '100%', height: '6px', background: '#333', borderRadius: '4px', overflow: 'hidden', marginBottom: '12px' }}>
        <div style={{ width: `${busyness * 10}%`, height: '100%', background: color }}></div>
      </div>

      <div style={{ borderTop: '1px solid #333', paddingTop: '10px' }}>
        <div style={{ fontSize: '11px', color: '#888', marginBottom: '6px' }}>
          Incorrect? Fix it:
        </div>
        <div style={{ display: 'flex', gap: '6px' }}>
          <button onClick={() => handleReport(2)} style={{ flex: 1, background: '#142914', border: '1px solid #22c55e', color: '#22c55e', borderRadius: '4px', padding: '6px 0', cursor: 'pointer', fontSize: '11px', fontWeight: 500 }}>Quiet</button>
          <button onClick={() => handleReport(5)} style={{ flex: 1, background: '#2e2614', border: '1px solid #eab308', color: '#eab308', borderRadius: '4px', padding: '6px 0', cursor: 'pointer', fontSize: '11px', fontWeight: 500 }}>Normal</button>
          <button onClick={() => handleReport(9)} style={{ flex: 1, background: '#2e1414', border: '1px solid #ef4444', color: '#ef4444', borderRadius: '4px', padding: '6px 0', cursor: 'pointer', fontSize: '11px', fontWeight: 500 }}>Busy</button>
        </div>
      </div>
    </div>
  );
}