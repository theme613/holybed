import React, { useEffect, useMemo, useRef, useState } from 'react';
import Head from 'next/head';
import Script from 'next/script';
import { useRouter } from 'next/router';

// Haversine distance in km
function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371; // km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI/180) * Math.cos(lat2 * Math.PI/180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

// Sample hospital dataset around KL
const ALL_HOSPITALS = [
  {
    name: 'KL General Hospital',
    lat: 3.1598, lng: 101.6980,
    availableBeds: 25, totalBeds: 50, waitTime: 5,
    busyLevel: 'Low',
    address: 'Jalan Pahang, 50586 Kuala Lumpur'
  },
  {
    name: 'Subang Jaya Medical Center',
    lat: 3.0738, lng: 101.5810,
    availableBeds: 8, totalBeds: 40, waitTime: 25,
    busyLevel: 'High',
    address: 'Jalan SS 12/1, Subang Jaya'
  },
  {
    name: 'Gleneagles Kuala Lumpur',
    lat: 3.1478, lng: 101.7183,
    availableBeds: 18, totalBeds: 35, waitTime: 12,
    busyLevel: 'Medium',
    address: 'Jalan Ampang, 50450 Kuala Lumpur'
  },
  {
    name: 'Pantai Hospital KL',
    lat: 3.1147, lng: 101.6680,
    availableBeds: 22, totalBeds: 45, waitTime: 8,
    busyLevel: 'Low',
    address: '8, Jalan Bukit Pantai, Bangsar'
  },
  {
    name: 'Prince Court Medical Centre',
    lat: 3.1534, lng: 101.7175,
    availableBeds: 15, totalBeds: 30, waitTime: 15,
    busyLevel: 'Medium',
    address: '39, Jalan Kia Peng, 50450 KL'
  },
  {
    name: 'Tung Shin Hospital',
    lat: 3.1463, lng: 101.7042,
    availableBeds: 12, totalBeds: 25, waitTime: 18,
    busyLevel: 'Medium',
    address: '102, Jalan Pudu, 55100 KL'
  }
];

const busyToScore = (busy) => busy === 'Low' ? 1 : busy === 'Medium' ? 2 : 3;

export default function EmergencyPage() {
  const [symptoms, setSymptoms] = useState('');
  const [userLoc, setUserLoc] = useState(null); // {lat, lng}
  const [apiReady, setApiReady] = useState(false);
  const [locationError, setLocationError] = useState('');
  const [sorted, setSorted] = useState([]);
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);
  const router = useRouter();

  const apiKey = useMemo(() => {
    return process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || 'AIzaSyBtdPEJoBPdXbumkdrLWO4nmgT63JmP9Kg';
  }, []);

  // Load map once API and user location available
  useEffect(() => {
    if (!apiReady || !userLoc || !mapRef.current) return;

    // Initialize Google Map
    const map = new window.google.maps.Map(mapRef.current, {
      center: userLoc,
      zoom: 12,
      mapId: 'DEMO_MAP_ID'
    });
    mapInstanceRef.current = map;

    // Clear old markers
    markersRef.current.forEach(m => m.setMap(null));
    markersRef.current = [];

    // Add user marker
    const youMarker = new window.google.maps.Marker({
      position: userLoc,
      map,
      title: 'Your location',
      icon: {
        path: window.google.maps.SymbolPath.CIRCLE,
        scale: 8,
        fillColor: '#2563eb',
        fillOpacity: 1,
        strokeWeight: 2,
        strokeColor: '#ffffff'
      }
    });
    markersRef.current.push(youMarker);

    // Add hospital markers
    sorted.forEach(h => {
      const m = new window.google.maps.Marker({
        position: { lat: h.lat, lng: h.lng },
        map,
        title: `${h.name} (${h.distance.toFixed(1)} km)`
      });
      const infowindow = new window.google.maps.InfoWindow({
        content: `<div style="font-size:14px"><strong>${h.name}</strong><br/>${h.address}<br/>Distance: ${h.distance.toFixed(1)} km<br/>Beds: ${h.availableBeds}/${h.totalBeds}<br/>Wait: ${h.waitTime} min</div>`
      });
      m.addListener('click', () => infowindow.open({ anchor: m, map }));
      markersRef.current.push(m);
    });

    // Fit bounds to show user + top hospitals
    const bounds = new window.google.maps.LatLngBounds();
    bounds.extend(userLoc);
    sorted.slice(0, 3).forEach(h => bounds.extend({ lat: h.lat, lng: h.lng }));
    map.fitBounds(bounds);
  }, [apiReady, userLoc, sorted]);

  // Prefill symptoms from query string if available
  useEffect(() => {
    if (!router.isReady) return;
    const q = router.query?.symptoms;
    if (typeof q === 'string' && q.trim()) {
      setSymptoms(q);
    }
  }, [router.isReady, router.query]);


  const requestLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported on this device. Using KL center.');
      const fallback = { lat: 3.1390, lng: 101.6869 };
      setUserLoc(fallback);
      rankHospitals(fallback);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setLocationError('');
        setUserLoc(loc);
        rankHospitals(loc);
      },
      () => {
        setLocationError('Location permission denied. Using KL center.');
        const fallback = { lat: 3.1390, lng: 101.6869 };
        setUserLoc(fallback);
        rankHospitals(fallback);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const rankHospitals = (loc) => {
    const enriched = ALL_HOSPITALS.map(h => {
      const distance = haversine(loc.lat, loc.lng, h.lat, h.lng); // km
      const availabilityRatio = h.availableBeds / h.totalBeds; // 0..1
      const priorityScore = (distance * 0.45) + // nearer is better
                            ((1 - availabilityRatio) * 10 * 0.35) + // more beds is better
                            (h.waitTime * 0.15) + // lower wait
                            (busyToScore(h.busyLevel) * 0.05); // less busy 
      return { ...h, distance, availabilityRatio, priorityScore };
    });
    enriched.sort((a, b) => a.priorityScore - b.priorityScore);
    setSorted(enriched);
  };

  const onFindHelp = (e) => {
    e.preventDefault();
    if (!symptoms.trim()) {
      alert('Please enter your emergency symptoms first.');
      return;
    }
    requestLocation();
  };

  return (
    <>
      <Head>
        <title>Holy bed - Emergency</title>
      </Head>

      {/* Load Google Maps JS API */}
      {apiKey && (
        <Script
          id="gmaps"
          src={`https://maps.googleapis.com/maps/api/js?key=${apiKey}&v=weekly`}
          strategy="afterInteractive"
          onLoad={() => setApiReady(true)}
        />
      )}

      <div className="container" style={{ padding: '24px 20px' }}>
        {/* Go Back Button */}
        <button 
          onClick={() => router.push('/')}
          style={{
            position: 'absolute',
            top: '20px',
            left: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 16px',
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            color: '#475569',
            fontSize: '14px',
            fontWeight: '500',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            zIndex: 10
          }}
          onMouseEnter={(e) => {
            e.target.style.background = '#f1f5f9';
            e.target.style.borderColor = '#cbd5e1';
          }}
          onMouseLeave={(e) => {
            e.target.style.background = '#f8fafc';
            e.target.style.borderColor = '#e2e8f0';
          }}
        >
          <i className="fas fa-arrow-left" style={{ fontSize: '12px' }}></i>
          Go Back
        </button>

        <h1 style={{ fontSize: 32, color: '#dc2626', marginBottom: 8 }}>Emergency mode</h1>
        <p style={{ color: '#991b1b', marginBottom: 16, fontWeight: 600 }}>
          URGENT: Describe your symptoms. We will find the closest and most available hospitals.
        </p>

        <form onSubmit={onFindHelp} style={{ display: 'flex', gap: 12, alignItems: 'stretch', marginBottom: 16 }}>
          <textarea
            value={symptoms}
            onChange={(e) => setSymptoms(e.target.value)}
            placeholder="Chest pain for 2 hours, difficulty breathing, etc."
            style={{
              flex: 1,
              height: 56,
              minHeight: 56,
              resize: 'none',
              padding: '14px 16px',
              border: '2px solid #fca5a5',
              borderRadius: 12,
              outline: 'none',
              fontSize: 16,
              lineHeight: 1.5
            }}
          />
          <button type="submit" style={{
            minWidth: 120,
            height: 56,
            alignSelf: 'stretch',
            background: '#ef4444',
            color: 'white',
            border: 'none',
            borderRadius: 10,
            fontWeight: 700,
            cursor: 'pointer',
            padding: '0 16px'
          }}>
            Find Help
          </button>
        </form>

        {locationError && (
          <div style={{ marginBottom: 12, color: '#b45309' }}>{locationError}</div>
        )}

        {/* Map */}
        <div style={{ height: 400, borderRadius: 12, overflow: 'hidden', border: '1px solid #fee2e2', marginBottom: 16 }}>
          <div ref={mapRef} style={{ height: '100%', width: '100%' }} />
        </div>

        {/* Ranked hospitals */}
        {sorted.length > 0 && (
          <div>
            <h2 style={{ marginBottom: 12 }}>Recommended hospitals (closest and most available first)</h2>
            <div style={{ display: 'grid', gap: 12 }}>
              {sorted.map((h, idx) => (
                <div key={h.name} style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr auto auto',
                  gap: 12,
                  alignItems: 'center',
                  padding: 12,
                  border: '1px solid #e5e7eb',
                  borderRadius: 10,
                  background: '#fff'
                }}>
                  <div>
                    <div style={{ fontWeight: 700 }}>{idx + 1}. {h.name}</div>
                    <div style={{ color: '#64748b', fontSize: 14 }}>{h.address}</div>
                  </div>
                  <div style={{ textAlign: 'right', minWidth: 140 }}>
                    <div><strong>{h.distance.toFixed(1)} km</strong> away</div>
                    <div style={{ fontSize: 12, color: '#64748b' }}>Wait ~ {h.waitTime} min</div>
                  </div>
                  <div style={{ textAlign: 'right', minWidth: 160 }}>
                    <div><strong>{h.availableBeds}/{h.totalBeds}</strong> beds</div>
                    <div style={{ fontSize: 12, color: '#64748b' }}>Busy: {h.busyLevel}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
