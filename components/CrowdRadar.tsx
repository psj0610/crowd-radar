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
  // We track the user's location so we can re-fetch if they move
  const userLocation = useRef<{lat: number, lng: number} | null>(null); 
  const [status, setStatus] = useState("CONNECTING...");
  const [areaInfo, setAreaInfo] = useState<string>("");

  useEffect(() => {
    if (map.current) return;

    const initMap = (lng: number, lat: number) => {
      if (!mapContainer.current) return;
      
      // Save initial location
      userLocation.current = { lat, lng };

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
        fetchAreaStatus(); //
        setStatus("SCANNING AREA...");
        fetchCafes(lat, lng); // <--- NOW WE PASS LOCATION!
        subscribeToUpdates();
      });

      setupInteractions();
    };

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (p) => initMap(p.coords.longitude, p.coords.latitude),
        () => initMap(DEFAULT_CENTER.lng, DEFAULT_CENTER.lat)
      );
    } else {
      initMap(DEFAULT_CENTER.lng, DEFAULT_CENTER.lat);
    }
  }, []);
  
  // 📡 The "Bridge" Function
  async function fetchAreaStatus() {
    try {
      setStatus("CHECKING..."); // 1. Tell user we are working
      
      // 2. Call your API route
      const res = await fetch('/api/live-crowd');
      const data = await res.json();
      
      if (data.success) {
        // 3. Update the UI with Real Data
        // Format: "LIVE: BUSY (82,500 ppl)"
        setStatus(`LIVE: ${data.status} (${data.population.toLocaleString()} ppl)`);
        
        // 4. Set the formal warning message if needed
        if (data.status === "BUSY" || data.status === "VERY_BUSY") {
          setAreaInfo("Warning: High congestion detected in this area.");
        } else {
          setAreaInfo("Area status is currently normal.");
        }
      }
    } catch (e) {
      console.error("API Error", e);
      setStatus("OFFLINE"); // Fallback if server is dead
    }
  }

  // 📡 NEW: Fetch ONLY nearby cafes using your SQL function
  async function fetchCafes(lat: number, lng: number) {
    console.log("Searching for cafes near:", lat, lng);
    
    // ✅ CORRECT: Call rpc directly (not .from().rpc())
    const { data, error } = await supabase
      .rpc('get_nearby_cafes', { lat, lng });

    if (error) {
      console.error("Error fetching nearby cafes:", error);
      setStatus("ERROR");
    } else if (data) {
      console.log(`Found ${data.length} cafes nearby.`);
      
      const now = new Date();
      const currentHour = now.getHours(); // e.g., 11 AM

      const processedData = data.map((cafe: any) => {
        const lastUpdate = cafe.last_updated ? new Date(cafe.last_updated) : new Date(0);
        const diffInMinutes = (now.getTime() - lastUpdate.getTime()) / (1000 * 60);

        // 🧠 THE SMART LOGIC:
        // 1. If we have a FRESH user report (< 60 mins), trust it.
        // 2. If not, look at the "Personality" trend for this hour.
        if (diffInMinutes < 60) {
           return cafe; // Use real-time report
        } else {
           // If 'busyness_trend' exists, grab the score for this hour. 
           // If it's null (no data), default to 3 (Quiet).
           const trendScore = cafe.busyness_trend ? cafe.busyness_trend[currentHour] : 3;
           return { ...cafe, busyness: trendScore };
        }
      });

      updateMapData(processedData);
      // We removed the setStatus("ONLINE") here so it doesn't overwrite the Seoul API status
    }
  }

  function subscribeToUpdates() {
    supabase
      .channel('cafes-channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'cafes' }, () => {
        // If data changes, re-fetch based on where the user IS right now
        if (userLocation.current) {
          fetchCafes(userLocation.current.lat, userLocation.current.lng);
        }
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
          'circle-color': ['get', 'color'],
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

  // Handle "Locate Me" button click
  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      setStatus("GPS NOT SUPPORTED");
      return;
    }

    setStatus("LOCATING...");

    navigator.geolocation.getCurrentPosition(
      // ✅ Success Callback
      (p) => {
        const { latitude, longitude } = p.coords;
        userLocation.current = { lat: latitude, lng: longitude };
        map.current?.flyTo({ center: [longitude, latitude], zoom: 15 });
        fetchCafes(latitude, longitude);
      },
      // ❌ Error Callback (This fixes your issue)
      (error) => {
        console.warn("GPS Error:", error);
        setStatus("GPS FAILED ❌");
        
        // Reset status back to "ONLINE" after 2 seconds so it doesn't look broken forever
        setTimeout(() => {
          setStatus("ONLINE");
        }, 2500);
      },
      // ⏱️ Options: Give up after 5 seconds
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
    );
  };

  return (
    <div style={{ width: '100vw', height: '100vh', background: '#09090b', position: 'relative' }}>
      <link href="https://api.mapbox.com/mapbox-gl-js/v3.1.2/mapbox-gl.css" rel="stylesheet" />
      <div ref={mapContainer} style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 }} />
      
      <div style={{ 
        position: 'absolute', top: 24, left: '50%', transform: 'translateX(-50%)',
        padding: '10px 20px', background: 'rgba(20,20,20,0.9)', // Made slightly darker/taller
        backdropFilter: 'blur(8px)', borderRadius: '30px',
        color: '#fff', fontSize: '13px', fontWeight: 500,
        border: '1px solid rgba(255,255,255,0.2)',
        zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' // Stack items vertically
      }}>
        {/* Row 1: The Status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: status.includes('BUSY') ? '#ef4444' : '#22c55e' }}></div>
          {status}
        </div>

        {/* Row 2: The Warning (Only shows if there is info) */}
        {areaInfo && (
          <div style={{ fontSize: '11px', color: '#fbbf24', fontWeight: 400 }}>
            {areaInfo}
          </div>
        )}
      </div>

      <button 
        onClick={handleLocateMe}
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

function PopupCard({ id, name, busyness, color, onClose }: any) {
  const handleReport = async (level: number) => {
    onClose();
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
        <div style={{ fontSize: '11px', color: '#888', marginBottom: '6px' }}>Incorrect? Fix it:</div>
        <div style={{ display: 'flex', gap: '6px' }}>
          <button onClick={() => handleReport(2)} style={{ flex: 1, background: '#142914', border: '1px solid #22c55e', color: '#22c55e', borderRadius: '4px', padding: '6px 0', cursor: 'pointer', fontSize: '11px', fontWeight: 500 }}>Quiet</button>
          <button onClick={() => handleReport(5)} style={{ flex: 1, background: '#2e2614', border: '1px solid #eab308', color: '#eab308', borderRadius: '4px', padding: '6px 0', cursor: 'pointer', fontSize: '11px', fontWeight: 500 }}>Normal</button>
          <button onClick={() => handleReport(9)} style={{ flex: 1, background: '#2e1414', border: '1px solid #ef4444', color: '#ef4444', borderRadius: '4px', padding: '6px 0', cursor: 'pointer', fontSize: '11px', fontWeight: 500 }}>Busy</button>
        </div>
      </div>
    </div>
  );
}