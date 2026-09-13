import React, { useState, useEffect, useRef } from 'react';
import { 
  MapPin, 
  Navigation, 
  Check, 
  X, 
  Search, 
  Store, 
  Building2, 
  Loader2, 
  AlertCircle,
  Crosshair,
  Layers,
  Compass,
  Home,
  Sparkles,
  Eye,
  CheckCircle2,
  ChevronRight,
  ChevronLeft
} from 'lucide-react';
import L from 'leaflet';
import { Branch, AppLanguage } from '../types';
import { BRANCHES } from '../data/initialCatalog';
import { offlineDB } from '../lib/offlineDb';

interface LocationPickerModalProps {
  isOpen: boolean;
  currentBranch: Branch;
  language?: AppLanguage;
  onSelectBranch: (branch: Branch, customAddress?: string, coordinates?: { lat: number; lng: number }) => void;
  onClose: () => void;
}

// Default Al-Aqqad coordinates (located between Al-Qatn and Shibam in Wadi Hadhramaut)
export const AL_AQQAD_COORDS = { lat: 15.9135, lng: 48.5775 };

export interface AlAqqadLandmark {
  id: string;
  name: string;
  nameEn: string;
  type: 'house' | 'mosque' | 'market' | 'school' | 'hospital' | 'farm' | 'route';
  categoryAr: string;
  lat: number;
  lng: number;
  desc: string;
  houseNumber?: string;
  iconBg: string;
}

// High-detail Landmarks & Houses in Al-Aqqad (between Al-Qatn and Shibam)
export const AL_AQQAD_LANDMARKS: AlAqqadLandmark[] = [
  {
    id: 'aqqad-center',
    name: 'منطقة العقاد - الشارع العام (بين القطن وشبام)',
    nameEn: 'Al-Aqqad Center - Main Road',
    type: 'market',
    categoryAr: 'سوق ومحلات العقاد',
    lat: 15.9135,
    lng: 48.5775,
    desc: 'الشارع العام بين القطن وشبام - قلب منطقة العقاد',
    houseNumber: '1',
    iconBg: '#0E8A5E',
  },
  {
    id: 'house-banharhara',
    name: 'مجموعة بيوت ومنازل آل بن هرهره',
    nameEn: 'Al-Banharhara Family Houses',
    type: 'house',
    categoryAr: 'مباني وبيوت سكنية',
    lat: 15.9142,
    lng: 48.5788,
    desc: 'الحي السكني - بيوت آل بن هرهره بمنطقة العقاد',
    houseNumber: '12-A',
    iconBg: '#2563EB',
  },
  {
    id: 'house-rawdah',
    name: 'بيوت ومنازل حي الروضة - العقاد',
    nameEn: 'Al-Rawdah District Houses',
    type: 'house',
    categoryAr: 'فلل ومنازل سكنية',
    lat: 15.9158,
    lng: 48.5765,
    desc: 'مجموعة بيوت وفلل سكنية - شمال منطقة العقاد',
    houseNumber: '24',
    iconBg: '#2563EB',
  },
  {
    id: 'house-salam',
    name: 'بيوت حي السلام والمخطط السكني',
    nameEn: 'Al-Salam Quarter Houses',
    type: 'house',
    categoryAr: 'منازل سكنية',
    lat: 15.9120,
    lng: 48.5795,
    desc: 'مخطط المنازل والبيوت الحديثة - العقاد',
    houseNumber: '8',
    iconBg: '#2563EB',
  },
  {
    id: 'mosque-aqqad',
    name: 'جامع العقاد الكبير ومحيط البيوت',
    nameEn: 'Al-Aqqad Grand Mosque & Houses',
    type: 'mosque',
    categoryAr: 'جامع ومسجد',
    lat: 15.9128,
    lng: 48.5762,
    desc: 'جامع منطقة العقاد ومحيط بيوت ومحلات الحي',
    houseNumber: '3',
    iconBg: '#10B981',
  },
  {
    id: 'school-aqqad',
    name: 'مدرسة العقاد للتعليم ومنازل الجوار',
    nameEn: 'Al-Aqqad School Neighborhood',
    type: 'school',
    categoryAr: 'مجمع مدارس',
    lat: 15.9165,
    lng: 48.5745,
    desc: 'مجمع المدارس والبيوت المحيطة - العقاد',
    houseNumber: '5',
    iconBg: '#F59E0B',
  },
  {
    id: 'health-aqqad',
    name: 'المركز الصحي بمنطقة العقاد',
    nameEn: 'Al-Aqqad Health Center',
    type: 'hospital',
    categoryAr: 'مركز صحي',
    lat: 15.9115,
    lng: 48.5750,
    desc: 'المركز الصحي والخدمات الطبية - العقاد',
    houseNumber: '2',
    iconBg: '#EF4444',
  },
  {
    id: 'farms-aqqad',
    name: 'نخيل وبساتين وادي العقاد ومنازل المزارعين',
    nameEn: 'Al-Aqqad Groves & Farm Houses',
    type: 'farm',
    categoryAr: 'مزارع وبيوت ريفية',
    lat: 15.9185,
    lng: 48.5820,
    desc: 'مزارع النخيل ومنازل المزارعين - وادي العقاد',
    houseNumber: '17',
    iconBg: '#059669',
  },
  {
    id: 'road-shibam',
    name: 'مفرق طريق العقاد المتجه إلى شبام',
    nameEn: 'Highway towards Shibam',
    type: 'route',
    categoryAr: 'طريق رئيسي',
    lat: 15.9220,
    lng: 48.6100,
    desc: 'الطريق العام الرابط بين العقاد ومدينة شبام التاريخية',
    houseNumber: '50',
    iconBg: '#6366F1',
  },
  {
    id: 'road-qatn',
    name: 'مفرق طريق العقاد المتجه إلى القطن',
    nameEn: 'Highway towards Al-Qatn',
    type: 'route',
    categoryAr: 'طريق رئيسي',
    lat: 15.8750,
    lng: 48.5300,
    desc: 'الطريق العام الرابط بين العقاد ومدينة القطن',
    houseNumber: '55',
    iconBg: '#6366F1',
  },
  {
    id: 'shibam-old',
    name: 'بيوت وقصور مدينة شبام التاريخية',
    nameEn: 'Historical Shibam Mud Houses',
    type: 'house',
    categoryAr: 'بيوت تاريخية',
    lat: 15.9269,
    lng: 48.6267,
    desc: 'ناطحات السحاب الطينية وبيوت شبام الشهيرة - شرق العقاد',
    houseNumber: '100',
    iconBg: '#D97706',
  },
  {
    id: 'qatn-center',
    name: 'سوق وأحياء وبيوت مدينة القطن',
    nameEn: 'Al-Qatn Town & Houses',
    type: 'house',
    categoryAr: 'أحياء ومنازل القطن',
    lat: 15.8409,
    lng: 48.4837,
    desc: 'مركز مديرية القطن، الأحياء السكنية والبيوت - غرب العقاد',
    houseNumber: '200',
    iconBg: '#0284C7',
  },
];

// Calculate distance in km between two lat/lng points using Haversine formula
function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radius of Earth in KM
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

export const LocationPickerModal: React.FC<LocationPickerModalProps> = ({
  isOpen,
  currentBranch,
  language = 'ar',
  onSelectBranch,
  onClose,
}) => {
  const isRtl = language === 'ar';

  const [selectedBranch, setSelectedBranch] = useState<Branch>(currentBranch || BRANCHES[0]);
  const [pinCoordinates, setPinCoordinates] = useState<{ lat: number; lng: number }>({
    lat: currentBranch?.lat || AL_AQQAD_COORDS.lat,
    lng: currentBranch?.lng || AL_AQQAD_COORDS.lng,
  });

  const [mapLayer, setMapLayer] = useState<'satellite' | 'hybrid' | 'streets'>('satellite');
  const [detectedAddress, setDetectedAddress] = useState<string>(
    currentBranch?.address || 'الشارع العام، منطقة العقاد (بين القطن وشبام)، وادي حضرموت'
  );
  const [buildingNumber, setBuildingNumber] = useState('14');
  const [apartmentNumber, setApartmentNumber] = useState('1');
  const [deliveryNotes, setDeliveryNotes] = useState(isRtl ? 'اترك الطلب عند باب المنزل' : 'Please leave at the house door');
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [gpsAccuracy, setGpsAccuracy] = useState<number | null>(null);
  const [selectedLandmarkId, setSelectedLandmarkId] = useState<string | null>('aqqad-center');
  const [showHousesList, setShowHousesList] = useState(false);

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const overlayLayerRef = useRef<L.TileLayer | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);
  const branchMarkersRef = useRef<L.Marker[]>([]);
  const landmarkMarkersRef = useRef<L.Marker[]>([]);

  // Find the closest branch dynamically based on coordinates
  const findClosestBranch = (lat: number, lng: number): Branch => {
    let closest = BRANCHES[0];
    let minDistance = Infinity;

    for (const b of BRANCHES) {
      const dist = calculateDistanceKm(lat, lng, b.lat, b.lng);
      if (dist < minDistance) {
        minDistance = dist;
        closest = { ...b, distanceKm: dist };
      }
    }
    return closest;
  };

  // Reverse geocode lat/lng to readable address with smart Al-Aqqad detection
  const fetchAddressForCoordinates = async (lat: number, lng: number) => {
    // Check if near Al-Aqqad (within ~4 km)
    const distToAqqad = calculateDistanceKm(lat, lng, AL_AQQAD_COORDS.lat, AL_AQQAD_COORDS.lng);
    if (distToAqqad < 3.5) {
      // Find nearest Al-Aqqad landmark or house
      let nearestL = AL_AQQAD_LANDMARKS[0];
      let minL = Infinity;
      for (const l of AL_AQQAD_LANDMARKS) {
        const d = calculateDistanceKm(lat, lng, l.lat, l.lng);
        if (d < minL) {
          minL = d;
          nearestL = l;
        }
      }
      setDetectedAddress(`منطقة العقاد (القطن - شبام) • بالقرب من ${nearestL.name}`);
      return;
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);

      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1&accept-language=${isRtl ? 'ar' : 'en'}`,
        { signal: controller.signal }
      );
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        if (data && data.display_name) {
          const parts = data.display_name.split(',');
          const shortAddress = parts.slice(0, 3).join(', ');
          setDetectedAddress(shortAddress);
          return;
        }
      }
    } catch (e) {
      // Fallback
    }

    const nearest = findClosestBranch(lat, lng);
    setDetectedAddress(`${nearest.city} - بالقرب من ${nearest.name} (${lat.toFixed(4)}, ${lng.toFixed(4)})`);
  };

  // Helper to switch Leaflet tile layers cleanly
  const applyTileLayer = (map: L.Map, layerType: 'satellite' | 'hybrid' | 'streets') => {
    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
      tileLayerRef.current = null;
    }
    if (overlayLayerRef.current) {
      map.removeLayer(overlayLayerRef.current);
      overlayLayerRef.current = null;
    }

    if (layerType === 'satellite' || layerType === 'hybrid') {
      // High-resolution satellite imagery showing real roofs, houses, courtyards, trees
      tileLayerRef.current = L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        {
          maxZoom: 19,
          attribution: 'Esri Satellite',
        }
      ).addTo(map);

      if (layerType === 'hybrid') {
        // Overlay streets and building/city labels
        overlayLayerRef.current = L.tileLayer(
          'https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',
          {
            maxZoom: 19,
          }
        ).addTo(map);
      }
    } else {
      // OpenStreetMap street map with building outlines
      tileLayerRef.current = L.tileLayer(
        'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        {
          maxZoom: 19,
          subdomains: ['a', 'b', 'c'],
        }
      ).addTo(map);
    }
  };

  const handleLayerChange = (type: 'satellite' | 'hybrid' | 'streets') => {
    setMapLayer(type);
    if (mapInstanceRef.current) {
      applyTileLayer(mapInstanceRef.current, type);
    }
  };

  // Center on a specific landmark / house
  const handleSelectLandmark = (landmark: AlAqqadLandmark) => {
    setSelectedLandmarkId(landmark.id);
    setPinCoordinates({ lat: landmark.lat, lng: landmark.lng });
    if (landmark.houseNumber) {
      setBuildingNumber(landmark.houseNumber);
    }

    if (userMarkerRef.current) {
      userMarkerRef.current.setLatLng([landmark.lat, landmark.lng]);
    }

    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([landmark.lat, landmark.lng], 17, { duration: 0.9 });
    }

    setDetectedAddress(`منطقة العقاد (القطن - شبام) - ${landmark.name}`);
    const nearest = findClosestBranch(landmark.lat, landmark.lng);
    setSelectedBranch(nearest);
  };

  // Initialize Leaflet Map
  useEffect(() => {
    if (!isOpen || !mapContainerRef.current) return;

    const timer = setTimeout(() => {
      if (!mapContainerRef.current) return;

      if (!mapInstanceRef.current) {
        const initialLat = pinCoordinates.lat;
        const initialLng = pinCoordinates.lng;

        // Initialize at high zoom (16) so houses and rooftops are immediately visible
        const map = L.map(mapContainerRef.current, {
          center: [initialLat, initialLng],
          zoom: 16,
          zoomControl: false,
          attributionControl: false,
        });

        // Apply default layer (satellite to show houses directly)
        applyTileLayer(map, mapLayer);

        // Custom delivery pin icon
        const deliveryPinIcon = L.divIcon({
          className: 'delivery-map-pin',
          html: `
            <div style="transform: translate(-50%, -100%); display: flex; flex-direction: column; align-items: center; cursor: grab;">
              <div style="background-color: #0B253A; color: #F5A623; font-size: 10px; font-weight: 800; padding: 3px 8px; border-radius: 9999px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.4); border: 1.5px solid white; white-space: nowrap; margin-bottom: 2px;">
                📍 ${isRtl ? 'بيت وموقع التوصيل' : 'Delivery House'}
              </div>
              <div style="width: 40px; height: 40px; border-radius: 9999px; background-color: #0E8A5E; color: white; display: flex; align-items: center; justify-content: center; box-shadow: 0 10px 20px -3px rgba(0,0,0,0.4); border: 3px solid white;">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
              </div>
              <div style="width: 8px; height: 8px; border-radius: 9999px; background-color: #0E8A5E; margin-top: -2px; box-shadow: 0 2px 4px rgba(0,0,0,0.5);"></div>
            </div>
          `,
          iconSize: [40, 52],
          iconAnchor: [20, 52],
        });

        const userMarker = L.marker([initialLat, initialLng], {
          icon: deliveryPinIcon,
          draggable: true,
        }).addTo(map);

        userMarker.on('dragend', (e) => {
          const newPos = (e.target as L.Marker).getLatLng();
          setPinCoordinates({ lat: newPos.lat, lng: newPos.lng });
          const nearest = findClosestBranch(newPos.lat, newPos.lng);
          setSelectedBranch(nearest);
          fetchAddressForCoordinates(newPos.lat, newPos.lng);
        });

        userMarkerRef.current = userMarker;

        // Map Click Listener to position delivery pin directly onto any house or rooftop
        map.on('click', (e: L.LeafletMouseEvent) => {
          const { lat, lng } = e.latlng;
          setPinCoordinates({ lat, lng });
          userMarker.setLatLng([lat, lng]);
          const nearest = findClosestBranch(lat, lng);
          setSelectedBranch(nearest);
          fetchAddressForCoordinates(lat, lng);
        });

        // Add Al-Aqqad Landmarks & Houses Markers
        AL_AQQAD_LANDMARKS.forEach((landmark) => {
          const emoji = landmark.type === 'house' ? '🏠' : landmark.type === 'mosque' ? '🕌' : landmark.type === 'market' ? '🏬' : landmark.type === 'school' ? '🏫' : landmark.type === 'hospital' ? '🏥' : landmark.type === 'farm' ? '🌴' : '🛣️';

          const markerIcon = L.divIcon({
            className: 'landmark-house-marker',
            html: `
              <div style="transform: translate(-50%, -50%); display: flex; flex-direction: column; align-items: center; cursor: pointer;">
                <div style="background-color: ${landmark.iconBg}; color: white; width: 32px; height: 32px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 16px; border: 2.5px solid white; box-shadow: 0 4px 8px rgba(0,0,0,0.4);">
                  ${emoji}
                </div>
                <div style="background-color: rgba(11, 37, 58, 0.92); color: #F5A623; font-size: 9px; font-weight: 800; padding: 1.5px 6px; border-radius: 6px; white-space: nowrap; margin-top: 2px; border: 1px solid rgba(255,255,255,0.25); box-shadow: 0 2px 4px rgba(0,0,0,0.3);">
                  ${landmark.name.length > 20 ? landmark.name.slice(0, 18) + '..' : landmark.name}
                </div>
              </div>
            `,
            iconSize: [32, 50],
            iconAnchor: [16, 16],
          });

          const m = L.marker([landmark.lat, landmark.lng], { icon: markerIcon })
            .addTo(map)
            .bindTooltip(
              `<b>${landmark.name}</b><br/><span style="color:#0E8A5E">${landmark.categoryAr}</span><br/>${landmark.desc}`,
              { direction: 'top', offset: [0, -18] }
            );

          m.on('click', () => {
            handleSelectLandmark(landmark);
          });

          landmarkMarkersRef.current.push(m);
        });

        // Add Branch Store Markers
        BRANCHES.forEach((b) => {
          const branchIcon = L.divIcon({
            className: 'branch-marker',
            html: `
              <div style="transform: translate(-50%, -50%); display: flex; align-items: center; justify-content: center; width: 32px; height: 32px; border-radius: 10px; background-color: #0B253A; color: #F5A623; border: 2.5px solid white; box-shadow: 0 4px 10px rgba(0,0,0,0.4);">
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7"/><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4"/><path d="M2 7h20"/><path d="M22 7v3a2 2 0 0 1-2 2v0a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 16 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 12 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 8 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 4 12v0a2 2 0 0 1-2-2V7"/></svg>
              </div>
            `,
            iconSize: [32, 32],
            iconAnchor: [16, 16],
          });

          const branchMarker = L.marker([b.lat, b.lng], { icon: branchIcon })
            .addTo(map)
            .bindTooltip(`🏪 ${b.name}`, { direction: 'top', offset: [0, -16] });

          branchMarker.on('click', () => {
            setSelectedBranch(b);
            setPinCoordinates({ lat: b.lat, lng: b.lng });
            userMarker.setLatLng([b.lat, b.lng]);
            setDetectedAddress(b.address);
          });

          branchMarkersRef.current.push(branchMarker);
        });

        mapInstanceRef.current = map;
      } else {
        mapInstanceRef.current.invalidateSize();
      }
    }, 150);

    return () => {
      clearTimeout(timer);
    };
  }, [isOpen]);

  // Clean up map instance when modal unmounts
  useEffect(() => {
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Handle GPS / Current Location Request
  const handleUseCurrentLocation = () => {
    setIsLocating(true);
    setLocationError(null);

    if (!('geolocation' in navigator)) {
      setLocationError(isRtl ? 'خدمة تحديد الموقع الجغرافي غير مدعومة في جهازك' : 'Geolocation is not supported by your device');
      setIsLocating(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        setGpsAccuracy(Math.round(accuracy));
        setPinCoordinates({ lat: latitude, lng: longitude });

        if (mapInstanceRef.current && userMarkerRef.current) {
          mapInstanceRef.current.flyTo([latitude, longitude], 17, { duration: 1.2 });
          userMarkerRef.current.setLatLng([latitude, longitude]);
        }

        const nearest = findClosestBranch(latitude, longitude);
        setSelectedBranch(nearest);
        fetchAddressForCoordinates(latitude, longitude);
        setIsLocating(false);
      },
      (error) => {
        setIsLocating(false);
        if (error.code === error.PERMISSION_DENIED) {
          setLocationError(
            isRtl
              ? 'يرجى تفعيل صلاحية الموقع أو النقر مباشرة على بيوت منطقة العقاد الموضحة بالخريطة'
              : 'Please enable location permission or tap any house on the Al-Aqqad map'
          );
        } else {
          setLocationError(
            isRtl
              ? 'تعذر قراءة الـ GPS، يمكنك النقر مباشرة على أي بيت أو شارع في منطقة العقاد'
              : 'Unable to get GPS. Tap directly on any house in Al-Aqqad'
          );
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  // Zoom controls helper
  const handleZoomIn = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.zoomIn();
    }
  };

  const handleZoomOut = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.zoomOut();
    }
  };

  // Quick jump to Al-Aqqad center
  const handleJumpToAqqad = () => {
    const aqqadLandmark = AL_AQQAD_LANDMARKS[0];
    handleSelectLandmark(aqqadLandmark);
  };

  // Handle branch card click
  const handleBranchClick = (branch: Branch) => {
    setSelectedBranch(branch);
    setPinCoordinates({ lat: branch.lat, lng: branch.lng });
    setDetectedAddress(branch.address);

    if (mapInstanceRef.current && userMarkerRef.current) {
      mapInstanceRef.current.flyTo([branch.lat, branch.lng], 16, { duration: 0.8 });
      userMarkerRef.current.setLatLng([branch.lat, branch.lng]);
    }
  };

  // Confirm location and save to offline DB
  const handleConfirm = async () => {
    const formattedAddress = `${detectedAddress} - مبنى ${buildingNumber}، شقة ${apartmentNumber}`;

    try {
      await offlineDB.saveDeliveryAddressOffline({
        id: `addr-${Date.now()}`,
        label: isRtl ? 'عنوان التوصيل - العقاد' : 'Delivery Address - Al-Aqqad',
        city: selectedBranch.city,
        district: selectedBranch.name,
        address: formattedAddress,
        buildingNumber,
        apartmentNumber,
        deliveryNotes,
        lat: pinCoordinates.lat,
        lng: pinCoordinates.lng,
        branchId: selectedBranch.id,
        isDefault: true,
        updatedAt: Date.now(),
      });
    } catch (e) {
      console.warn('Offline address save notice:', e);
    }

    onSelectBranch(selectedBranch, formattedAddress, pinCoordinates);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-2.5 sm:p-4 animate-in fade-in">
      <div 
        className="w-full max-w-lg bg-white rounded-3xl overflow-hidden shadow-2xl border border-gray-100 flex flex-col max-h-[96vh]"
        dir={isRtl ? 'rtl' : 'ltr'}
      >
        {/* Modal Header */}
        <div className="bg-[#0E8A5E] text-white p-3.5 sm:p-4 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-white/15 flex items-center justify-center text-[#F5A623] shadow-inner">
              <Compass className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-black tracking-tight flex items-center gap-1.5">
                <span>{isRtl ? 'خريطة وبيوت منطقة العقاد بالقطن' : 'Al-Aqqad Houses & Map'}</span>
                <span className="text-[10px] bg-[#F5A623] text-[#0B253A] font-extrabold px-2 py-0.5 rounded-full">
                  {isRtl ? 'بين القطن وشبام' : 'Qatn-Shibam'}
                </span>
              </h3>
              <p className="text-[11px] text-emerald-100">
                {isRtl ? 'عرض دقيق للبيوت والأسطح والأحياء عبر الأقمار الصناعية' : 'High-res satellite view showing houses & rooftops'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 flex items-center justify-center text-white cursor-pointer transition-all"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-3.5 sm:p-4 overflow-y-auto space-y-3 flex-1 custom-scrollbar">

          {/* Offline Loaded Notification Badge */}
          <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 border border-emerald-200/90 rounded-2xl p-2.5 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
              <div>
                <span className="font-black text-[#0B253A] block text-[11px]">
                  {isRtl ? 'خريطة منطقة العقاد محملة داخل التطبيق ⚡' : 'Al-Aqqad Map Loaded In-App ⚡'}
                </span>
                <span className="text-[10px] text-gray-500 font-medium">
                  {isRtl ? 'البيوت والمباني ظاهرة بدقة ووضوح عالي' : 'Houses & buildings rendered in high clarity'}
                </span>
              </div>
            </div>
            <button
              onClick={handleJumpToAqqad}
              className="px-2.5 py-1 rounded-xl bg-[#0E8A5E] hover:bg-[#095B3E] active:scale-95 text-white font-bold text-[10px] flex items-center gap-1 shadow-xs cursor-pointer transition-all"
            >
              <Home className="w-3 h-3 text-[#F5A623]" />
              <span>{isRtl ? 'وسط العقاد' : 'Center'}</span>
            </button>
          </div>

          {/* Quick Preset Location Chips (Houses, Quarters & Roads in Al-Aqqad) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black text-gray-700 flex items-center gap-1">
                <Home className="w-3.5 h-3.5 text-[#0E8A5E]" />
                <span>{isRtl ? 'بيوت ومعالم منطقة العقاد (انقر للانتقال):' : 'Al-Aqqad Houses & Landmarks:'}</span>
              </span>
              <button
                onClick={() => setShowHousesList(!showHousesList)}
                className="text-[10px] text-[#0E8A5E] font-bold hover:underline cursor-pointer"
              >
                {showHousesList ? (isRtl ? 'إخفاء القائمة' : 'Hide') : (isRtl ? 'عرض الكل' : 'View all')}
              </button>
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
              {AL_AQQAD_LANDMARKS.slice(0, 7).map((landmark) => {
                const isSelected = selectedLandmarkId === landmark.id;
                return (
                  <button
                    key={landmark.id}
                    onClick={() => handleSelectLandmark(landmark)}
                    className={`whitespace-nowrap px-2.5 py-1.5 rounded-xl font-bold text-[10px] transition-all cursor-pointer flex items-center gap-1.5 border flex-shrink-0 ${
                      isSelected
                        ? 'bg-[#0E8A5E] text-white border-[#0E8A5E] shadow-sm'
                        : 'bg-white hover:bg-gray-50 text-gray-700 border-gray-200'
                    }`}
                  >
                    <span>{landmark.type === 'house' ? '🏠' : landmark.type === 'mosque' ? '🕌' : landmark.type === 'farm' ? '🌴' : landmark.type === 'school' ? '🏫' : '📍'}</span>
                    <span>{landmark.name.split('-')[0].trim()}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Interactive Leaflet Map Box with Layer Toggles */}
          <div className="relative w-full h-64 sm:h-72 rounded-2xl overflow-hidden border-2 border-emerald-500/40 shadow-md">
            {/* Map Canvas */}
            <div ref={mapContainerRef} className="w-full h-full z-0 bg-gray-900" />

            {/* Layer Switcher Controls (Satellite / Hybrid / Streets) */}
            <div className="absolute top-2.5 right-2.5 z-10 flex items-center gap-1 bg-black/60 backdrop-blur-md p-1 rounded-xl border border-white/20 shadow-lg">
              <button
                type="button"
                onClick={() => handleLayerChange('satellite')}
                className={`px-2 py-1 rounded-lg text-[10px] font-black transition-all cursor-pointer flex items-center gap-1 ${
                  mapLayer === 'satellite'
                    ? 'bg-[#0E8A5E] text-white shadow'
                    : 'text-white/80 hover:text-white hover:bg-white/10'
                }`}
                title={isRtl ? 'قمر صناعي لرؤية البيوت والأسطح' : 'Satellite view showing houses'}
              >
                <span>🛰️</span>
                <span>{isRtl ? 'البيوت (أقمار)' : 'Houses'}</span>
              </button>

              <button
                type="button"
                onClick={() => handleLayerChange('hybrid')}
                className={`px-2 py-1 rounded-lg text-[10px] font-black transition-all cursor-pointer flex items-center gap-1 ${
                  mapLayer === 'hybrid'
                    ? 'bg-[#0E8A5E] text-white shadow'
                    : 'text-white/80 hover:text-white hover:bg-white/10'
                }`}
                title={isRtl ? 'أقمار صناعية مع أسماء الشوارع' : 'Satellite with streets'}
              >
                <span>🏷️</span>
                <span>{isRtl ? 'هجين' : 'Hybrid'}</span>
              </button>

              <button
                type="button"
                onClick={() => handleLayerChange('streets')}
                className={`px-2 py-1 rounded-lg text-[10px] font-black transition-all cursor-pointer flex items-center gap-1 ${
                  mapLayer === 'streets'
                    ? 'bg-[#0E8A5E] text-white shadow'
                    : 'text-white/80 hover:text-white hover:bg-white/10'
                }`}
                title={isRtl ? 'خريطة الشوارع العادية' : 'Streets map'}
              >
                <span>🗺️</span>
                <span>{isRtl ? 'شوارع' : 'Streets'}</span>
              </button>
            </div>

            {/* Hint Overlay */}
            <div className="absolute bottom-2.5 left-2.5 z-10 pointer-events-none">
              <div className="bg-[#0B253A]/90 text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-lg backdrop-blur-sm border border-white/20 flex items-center gap-1.5">
                <Crosshair className="w-3 h-3 text-[#F5A623]" />
                <span>{isRtl ? 'انقر على أي بيت أو سطح لتثبيت الدبوس' : 'Tap on any house to place pin'}</span>
              </div>
            </div>

            {/* Zoom Controls Overlay */}
            <div className="absolute top-2.5 left-2.5 z-10 flex flex-col gap-1">
              <button
                onClick={handleZoomIn}
                className="w-7 h-7 bg-white/95 hover:bg-white text-gray-800 rounded-lg shadow-md flex items-center justify-center font-bold text-sm border border-gray-200 cursor-pointer"
                title="Zoom In"
              >
                +
              </button>
              <button
                onClick={handleZoomOut}
                className="w-7 h-7 bg-white/95 hover:bg-white text-gray-800 rounded-lg shadow-md flex items-center justify-center font-bold text-sm border border-gray-200 cursor-pointer"
                title="Zoom Out"
              >
                -
              </button>
            </div>

            {/* Current Location GPS Action Button */}
            <button
              onClick={handleUseCurrentLocation}
              disabled={isLocating}
              className="absolute bottom-2.5 right-2.5 z-10 bg-white hover:bg-gray-50 active:scale-95 text-[#0E8A5E] font-black text-[11px] px-3 py-1.5 rounded-xl shadow-xl border border-emerald-200 flex items-center gap-1.5 cursor-pointer transition-all"
            >
              {isLocating ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-[#0E8A5E]" />
                  <span>{isRtl ? 'جاري التحديد...' : 'Locating...'}</span>
                </>
              ) : (
                <>
                  <Navigation className="w-3.5 h-3.5 text-[#0E8A5E] fill-[#0E8A5E]" />
                  <span>{isRtl ? 'موقعي (GPS)' : 'GPS'}</span>
                </>
              )}
            </button>
          </div>

          {/* Location Error Warning */}
          {locationError && (
            <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2 text-amber-800 text-xs animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <span>{locationError}</span>
            </div>
          )}

          {/* Full Houses List Accordion (if opened) */}
          {showHousesList && (
            <div className="p-3 bg-gray-50 rounded-2xl border border-gray-200 space-y-2 animate-in fade-in">
              <h5 className="text-xs font-black text-gray-800 flex items-center justify-between">
                <span>{isRtl ? 'دليل منازل وبيوت منطقة العقاد وما حولها:' : 'Al-Aqqad Houses Directory:'}</span>
                <span className="text-[10px] text-gray-400 font-medium">
                  {isRtl ? 'بين القطن وشبام' : 'Between Al-Qatn & Shibam'}
                </span>
              </h5>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-44 overflow-y-auto custom-scrollbar">
                {AL_AQQAD_LANDMARKS.map((landmark) => (
                  <div
                    key={landmark.id}
                    onClick={() => handleSelectLandmark(landmark)}
                    className="p-2 rounded-xl bg-white border border-gray-200 hover:border-[#0E8A5E] hover:bg-emerald-50/50 cursor-pointer transition-all flex items-center gap-2"
                  >
                    <span className="text-base">{landmark.type === 'house' ? '🏠' : landmark.type === 'mosque' ? '🕌' : landmark.type === 'farm' ? '🌴' : landmark.type === 'school' ? '🏫' : '📍'}</span>
                    <div className="min-w-0 flex-1">
                      <div className="text-[11px] font-bold text-gray-900 truncate">{landmark.name}</div>
                      <div className="text-[9px] text-gray-500 truncate">{landmark.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Selected Address Display Card */}
          <div className="bg-emerald-50/80 border border-emerald-200 rounded-2xl p-3 flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#0E8A5E] text-white flex items-center justify-center flex-shrink-0 shadow-sm mt-0.5">
              <Home className="w-5 h-5 text-[#F5A623]" />
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-[10px] font-extrabold text-[#0E8A5E] uppercase tracking-wider block">
                {isRtl ? 'البيت / العنوان المحدد على الخريطة' : 'Selected House / Address'}
              </span>
              <p className="text-xs font-black text-gray-900 truncate mt-0.5">{detectedAddress}</p>
              <div className="flex items-center gap-2 text-[10px] text-gray-500 font-mono mt-1">
                <span>{pinCoordinates.lat.toFixed(5)}°N, {pinCoordinates.lng.toFixed(5)}°E</span>
                <span>•</span>
                <span className="text-[#0E8A5E] font-semibold">
                  {selectedBranch.name} ({calculateDistanceKm(pinCoordinates.lat, pinCoordinates.lng, selectedBranch.lat, selectedBranch.lng)} كم)
                </span>
              </div>
            </div>
          </div>

          {/* Hypermarket Branch Distribution Card */}
          <div>
            <h4 className="text-xs font-black text-gray-700 mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Store className="w-3.5 h-3.5 text-[#0E8A5E]" />
                <span>{isRtl ? 'فرع ومركز التوزيع لتوصيل الطلبات' : 'Fulfillment Hub'}</span>
              </span>
              <span className="text-[10px] text-emerald-700 font-bold bg-emerald-100 px-2 py-0.5 rounded-full">
                {isRtl ? 'يغطي العقاد والقطن وشبام' : 'Covers Al-Aqqad, Qatn & Shibam'}
              </span>
            </h4>
            <div className="grid grid-cols-1 gap-2">
              {BRANCHES.slice(0, 2).map((branch) => {
                const isSelected = selectedBranch.id === branch.id;
                const distance = calculateDistanceKm(pinCoordinates.lat, pinCoordinates.lng, branch.lat, branch.lng);

                return (
                  <div
                    key={branch.id}
                    onClick={() => handleBranchClick({ ...branch, distanceKm: distance })}
                    className={`p-2.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? 'border-[#0E8A5E] bg-emerald-50/90 shadow-sm ring-2 ring-[#0E8A5E]/40'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${
                          isSelected
                            ? 'bg-[#0E8A5E] text-white'
                            : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        <Store className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-black text-gray-900 truncate">
                          {isRtl ? branch.name : (branch.nameEn || branch.name)}
                        </div>
                        <div className="text-[10px] text-gray-500 truncate">{branch.address}</div>
                      </div>
                    </div>

                    <div className="text-right flex-shrink-0">
                      <span className="text-[10px] bg-emerald-100 text-[#0E8A5E] font-bold px-2 py-0.5 rounded-full block">
                        {distance} {isRtl ? 'كم' : 'km'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Building & House Details Inputs */}
          <div className="bg-gray-50 p-3 rounded-2xl border border-gray-200 space-y-2">
            <h4 className="text-xs font-black text-gray-800 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-[#0E8A5E]" />
              <span>{isRtl ? 'بيانات المنزل ورقم المبنى' : 'House & Building Details'}</span>
            </h4>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] text-gray-500 font-bold mb-1">
                  {isRtl ? 'رقم البيت / المبنى' : 'House / Building No.'}
                </label>
                <input
                  type="text"
                  value={buildingNumber}
                  onChange={(e) => setBuildingNumber(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-xl px-2.5 py-1.5 text-xs text-gray-800 outline-none focus:border-[#0E8A5E] focus:ring-1 focus:ring-[#0E8A5E]"
                  placeholder="مثال: 14-A"
                />
              </div>
              <div>
                <label className="block text-[10px] text-gray-500 font-bold mb-1">
                  {isRtl ? 'الدور / الشقة' : 'Floor / Apartment'}
                </label>
                <input
                  type="text"
                  value={apartmentNumber}
                  onChange={(e) => setApartmentNumber(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-xl px-2.5 py-1.5 text-xs text-gray-800 outline-none focus:border-[#0E8A5E] focus:ring-1 focus:ring-[#0E8A5E]"
                  placeholder="الدور الأرضي"
                />
              </div>
            </div>
            <div>
              <label className="block text-[10px] text-gray-500 font-bold mb-1">
                {isRtl ? 'توجيهات تسليم الطلب للمندوب' : 'Delivery Notes'}
              </label>
              <input
                type="text"
                value={deliveryNotes}
                onChange={(e) => setDeliveryNotes(e.target.value)}
                placeholder={isRtl ? 'مثال: البيت المجاور للمسجد، رنين الجرس...' : 'e.g. Next to the mosque, ring bell'}
                className="w-full bg-white border border-gray-200 rounded-xl px-2.5 py-1.5 text-xs text-gray-800 outline-none focus:border-[#0E8A5E] focus:ring-1 focus:ring-[#0E8A5E]"
              />
            </div>
          </div>
        </div>

        {/* Modal Action Footer */}
        <div className="p-3 sm:p-4 bg-gray-50 border-t border-gray-200">
          <button
            onClick={handleConfirm}
            className="w-full py-3 px-4 rounded-2xl bg-[#0E8A5E] hover:bg-[#095B3E] active:scale-[0.98] text-white font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-800/25 transition-all cursor-pointer"
          >
            <Check className="w-5 h-5" />
            <span>{isRtl ? 'تأكيد موقع البيت في منطقة العقاد' : 'Confirm House Location in Al-Aqqad'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
