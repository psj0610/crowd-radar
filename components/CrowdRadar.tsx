"use client";

import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import mapboxgl from 'mapbox-gl';
import { supabase } from '@/lib/supabaseClient';

const TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "";
mapboxgl.accessToken = TOKEN;

const DEFAULT_CENTER = { lat: 37.4979, lng: 127.0276 }; 

export default function CrowdRadar() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const userMarker = useRef<mapboxgl.Marker | null>(null); // 📍 NEW: Tracks the visual blue dot

  // ✅ FIX: Changed from useRef to useState so we can update it
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null); 
  
  const [status, setStatus] = useState("CONNECTING...");
  const [areaInfo, setAreaInfo] = useState<string>("");
  const [lastUpdateCoords, setLastUpdateCoords] = useState<{lat: number, lng: number} | null>(null);

  // 🗺️ 1. INITIALIZE MAP (This was missing!)
  useEffect(() => {
    if (map.current) return; // Initialize only once

    map.current = new mapboxgl.Map({
      container: mapContainer.current!,
      style: 'mapbox://styles/mapbox/dark-v11', // Professional Dark Mode
      center: [DEFAULT_CENTER.lng, DEFAULT_CENTER.lat],
      zoom: 15,
      pitch: 45, // Cool 3D angle
    });

    map.current.on('load', () => {
      setStatus("ONLINE");
      fetchAreaStatus();     // Get Seoul API data
      setupInteractions();   // Enable popup clicks
      
      // Fetch initial cafes at default center
      fetchCafes(DEFAULT_CENTER.lat, DEFAULT_CENTER.lng);
    });

    // Cleanup on unmount
    return () => map.current?.remove();
  }, []);

  // 🛰️ 2. GPS TRACKING (The "Follow Me" Logic)
  useEffect(() => {
    if (!navigator.geolocation) return;
  
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        
        // A. Update State
        setUserLocation({ lat: latitude, lng: longitude });

        // B. Update the Blue Dot on the Map (Visual)
        if (map.current) {
          if (!userMarker.current) {
            // Create the dot if it doesn't exist
            const el = document.createElement('div');
            el.className = 'user-marker'; // We will style this in CSS below
            el.style.width = '15px';
            el.style.height = '15px';
            el.style.backgroundColor = '#3b82f6'; // Blue
            el.style.borderRadius = '50%';
            el.style.border = '2px solid white';
            el.style.boxShadow = '0 0 10px rgba(59, 130, 246, 0.5)';

            userMarker.current = new mapboxgl.Marker(el)
              .setLngLat([longitude, latitude])
              .addTo(map.current);
          } else {
            // Move the dot if it already exists
            userMarker.current.setLngLat([longitude, latitude]);
          }
        }
  
        // C. The 100-Meter Fetch Logic
        // We check distance from the LAST update point
        if (lastUpdateCoords) {
           const dist = calculateDistance(latitude, longitude, lastUpdateCoords.lat, lastUpdateCoords.lng);
           
           if (dist > 100) {
             console.log(`User moved ${Math.round(dist)}m. Refreshing Data...`);
             fetchCafes(latitude, longitude);
             setLastUpdateCoords({ lat: latitude, lng: longitude });
           }
        } else {
           // First time running? Force a fetch.
           setLastUpdateCoords({ lat: latitude, lng: longitude });
           fetchCafes(latitude, longitude);
        }
      },
      (err) => console.error("GPS Error:", err),
      { enableHighAccuracy: true, maximumAge: 0, timeout: 5000 }
    );
  
    return () => navigator.geolocation.clearWatch(watchId);
  }, [lastUpdateCoords]); // Dependency ensures we have access to latest coords
  
  // 📡 The "Bridge" Function (Seoul Data)
  async function fetchAreaStatus() {
    try {
      const res = await fetch('/api/live-crowd');
      const data = await res.json();
      
      if (data.success) {
        setStatus(`LIVE: ${data.status} (${data.population.toLocaleString()} ppl)`);
        if (data.status === "BUSY" || data.status === "VERY_BUSY") {
          setAreaInfo("Warning: High congestion detected.");
        } else {
          setAreaInfo("Area status is normal.");
        }
      }
    } catch (e) {
      console.error("API Error", e);
      setStatus("OFFLINE");
    }
  }

  // 📡 Fetch Cafes from Supabase
  async function fetchCafes(lat: number, lng: number) {
    console.log("Searching for cafes near:", lat, lng);
    
    const { data, error } = await supabase
  .rpc('get_nearby_cafes', { 
    user_lat: lat,   // 👈 MATCHES the new SQL variable
    user_lng: lng    // 👈 MATCHES the new SQL variable
  });

    if (error) {
      console.error("Error fetching nearby cafes:", error);
    } else if (data) {
      console.log(`Found ${data.length} cafes.`);
      
      const now = new Date();
      const currentHour = now.getHours(); 

      const processedData = data.map((cafe: any) => {
        const lastUpdate = cafe.last_updated ? new Date(cafe.last_updated) : new Date(0);
        const diffInMinutes = (now.getTime() - lastUpdate.getTime()) / (1000 * 60);

        if (diffInMinutes < 60) {
           return cafe; // Trust User Report
        } else {
           const trendScore = cafe.busyness_trend ? cafe.busyness_trend[currentHour] : 3;
           return { ...cafe, busyness: trendScore }; // Use Trend
        }
      });

      updateMapData(processedData);
    }
  }

  // 🗺️ Draw Dots on Map
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
          'circle-radius': 8, // Made slightly bigger
          'circle-color': ['get', 'color'],
          'circle-stroke-width': 2,
          'circle-stroke-color': '#18181b', // Dark border for contrast
          'circle-opacity': 1
        }
      });
    }
  }

  // 🖱️ Popups
  function setupInteractions() {
    if (!map.current) return;
    
    map.current.on('click', 'cafe-dots', (e) => {
      if (!e.features?.[0]) return;
      const props = e.features[0].properties;
      if (!props) return;
      
      const coordinates = (e.features[0].geometry as any).coordinates.slice();
      const popupNode = document.createElement('div');
      
      const popup = new mapboxgl.Popup({ closeButton: true, className: 'pro-popup', maxWidth: '300px' })
        .setLngLat(coordinates)
        .setDOMContent(popupNode)
        .addTo(map.current!);

      const root = createRoot(popupNode);
      root.render(
        <PopupCard 
          id={props.id} 
          name={props.name} 
          busyness={props.busyness} 
          color={props.color}
          onClose={() => popup.remove()}
        />
      );
    });

    map.current.on('mouseenter', 'cafe-dots', () => map.current!.getCanvas().style.cursor = 'pointer');
    map.current.on('mouseleave', 'cafe-dots', () => map.current!.getCanvas().style.cursor = '');
  }

  // 📍 Handle "Locate Me" Button
  const handleLocateMe = () => {
    if (!navigator.geolocation) return;
    setStatus("LOCATING...");

    navigator.geolocation.getCurrentPosition(
      (p) => {
        const { latitude, longitude } = p.coords;
        // Fly to user
        map.current?.flyTo({ center: [longitude, latitude], zoom: 16, essential: true });
        // Update data
        fetchCafes(latitude, longitude);
        setStatus("ONLINE");
      },
      (error) => {
        console.warn("GPS Error:", error);
        setStatus("GPS FAILED");
      }
    );
  };

  return (
    <div style={{ width: '100vw', height: '100vh', background: '#09090b', position: 'relative' }}>
      <link href="https://api.mapbox.com/mapbox-gl-js/v3.1.2/mapbox-gl.css" rel="stylesheet" />
      <div ref={mapContainer} style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 }} />
      
      {/* Top Status Pill */}
      <div style={{ 
        position: 'absolute', top: 24, left: '50%', transform: 'translateX(-50%)',
        padding: '10px 20px', background: 'rgba(20,20,20,0.85)',
        backdropFilter: 'blur(12px)', borderRadius: '30px',
        color: '#fff', fontSize: '13px', fontWeight: 500,
        border: '1px solid rgba(255,255,255,0.1)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
        zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: status.includes('BUSY') ? '#ef4444' : '#22c55e', boxShadow: status.includes('BUSY') ? '0 0 10px #ef4444' : '0 0 10px #22c55e' }}></div>
          {status}
        </div>
        {areaInfo && <div style={{ fontSize: '11px', color: '#fbbf24', opacity: 0.9 }}>{areaInfo}</div>}
      </div>

      {/* Locate Me Button */}
      <button 
        onClick={handleLocateMe}
        style={{
          position: 'absolute', bottom: 32, right: 24,
          width: '50px', height: '50px',
          background: '#ffffff', color: 'black',
          border: 'none', borderRadius: '14px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '22px', zIndex: 10, transition: 'transform 0.2s'
        }}
        onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.95)'}
        onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
      >
        📍
      </button>
    </div>
  );
}

// --- SUB-COMPONENTS & HELPERS ---

function PopupCard({ id, name, busyness, color, onClose }: any) {
  const handleReport = async (level: number) => {
    onClose();
    // Optimistic UI update (optional) or just send to DB
    await supabase
      .from('cafes')
      .update({ busyness: level, last_updated: new Date().toISOString() })
      .eq('id', id);
  };

  return (
    <div style={{ fontFamily: 'Inter, sans-serif', minWidth: '220px', padding: '4px' }}>
      <div style={{ fontWeight: 600, fontSize: '16px', marginBottom: '8px', color: '#fff' }}>
        {name}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '13px', color: '#a1a1aa', marginBottom: '10px' }}>
        <span>Current Load</span>
        <span style={{ color: color, fontWeight: 600 }}>{busyness * 10}%</span>
      </div>
      
      {/* Progress Bar */}
      <div style={{ width: '100%', height: '6px', background: '#27272a', borderRadius: '10px', overflow: 'hidden', marginBottom: '16px' }}>
        <div style={{ width: `${busyness * 10}%`, height: '100%', background: color, transition: 'width 0.5s ease' }}></div>
      </div>

      {/* Reporting Buttons */}
      <div style={{ borderTop: '1px solid #3f3f46', paddingTop: '12px' }}>
        <div style={{ fontSize: '11px', color: '#71717a', marginBottom: '8px', fontWeight: 500 }}>IS THIS WRONG? REPORT LIVE:</div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={() => handleReport(2)} style={{ flex: 1, background: 'rgba(34, 197, 94, 0.1)', border: '1px solid #22c55e', color: '#22c55e', borderRadius: '6px', padding: '8px 0', cursor: 'pointer', fontSize: '12px', fontWeight: 600 }}>Quiet</button>
          <button onClick={() => handleReport(5)} style={{ flex: 1, background: 'rgba(234, 179, 8, 0.1)', border: '1px solid #eab308', color: '#eab308', borderRadius: '6px', padding: '8px 0', cursor: 'pointer', fontSize: '12px', fontWeight: 600 }}>Normal</button>
          <button onClick={() => handleReport(9)} style={{ flex: 1, background: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444', color: '#ef4444', borderRadius: '6px', padding: '8px 0', cursor: 'pointer', fontSize: '12px', fontWeight: 600 }}>Busy</button>
        </div>
      </div>
    </div>
  );
}

// 📏 The Distance Helper
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371000; 
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c; 
}