import React, { useEffect, useRef, useState, useCallback } from 'react';
import { MapContainer, TileLayer, useMap, Marker } from 'react-leaflet';
import { IonButton, IonIcon } from '@ionic/react';
import { refresh } from 'ionicons/icons';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { getMarkerIconByKind } from '../utils/markericons';
import MapMarkerPopup from './MapMarkerPopup';
import { supabase } from '../utils/supaBaseClient';

const SATELLITE_URL = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
const OPENSTREETMAP_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
const manoloFortichBounds = L.latLngBounds(
  L.latLng(8.25, 124.75),
  L.latLng(8.45, 124.95)
);

const DEFAULT_ZOOM = 14;
const MIN_ZOOM_LOCKED = 14;
const MIN_ZOOM_UNLOCKED = 12;
const MAX_ZOOM = 22;

// Import marker icons for filter panel
import buildingMarkerIconUrl from '../Images/Building.png';
import equipmentMarkerIconUrl from '../Images/Equipment.png';
import landMarkerIconUrl from '../Images/Land.png';

interface PropertyDetails {
  tag_id: string;
  latitude: number;
  longitude: number;
  date_taken: string;
  created_at: string;
  photo?: string;
  form_id?: string;
  kind_id?: string;
  class_id?: string;
  area?: number;
  status?: string;
  declarant?: string;
  district_id?: number;
  district_name?: string;
  value_info_id?: string;
}

interface MapConProps {
  searchQuery?: string;
  isAdmin?: boolean;
}

// Helper function to safely check if a value contains the query
const safeIncludes = (value: any, query: string): boolean => {
  if (value == null) return false;
  return String(value).toLowerCase().includes(query.toLowerCase());
};

// Satellite Toggle Control Component
const SatelliteToggleControl = ({ 
  isSatelliteView, 
  onToggle 
}: { 
  isSatelliteView: boolean;
  onToggle: () => void;
}) => {
  const map = useMap();
  const controlRef = useRef<any>(null);

  useEffect(() => {
    const CustomControl = L.Control.extend({
      options: { position: 'topleft' },
      onAdd: function () {
        const container = L.DomUtil.create('div', 'leaflet-control satellite-toggle-container');
        const button = L.DomUtil.create('button', 'satellite-toggle-btn', container);
        button.type = 'button';
        button.title = isSatelliteView ? 'Switch to Standard Map' : 'Switch to Satellite View';
        button.innerHTML = `
          <svg viewBox="0 0 24 24" width="20" height="20">
            <path fill="currentColor" d="${isSatelliteView ? 
              'M12,2C8.13,2,5,5.13,5,9c0,5.25,7,13,7,13s7-7.75,7-13C19,5.13,15.87,2,12,2z M12,11.5c-1.38,0-2.5-1.12-2.5-2.5s1.12-2.5,2.5-2.5s2.5,1.12,2.5,2.5S13.38,11.5,12,11.5z' :
              'M12,2C8.13,2,5,5.13,5,9c0,5.25,7,13,7,13s7-7.75,7-13C19,5.13,15.87,2,12,2z M12,11.5c-1.38,0-2.5-1.12-2.5-2.5s1.12-2.5,2.5-2.5s2.5,1.12,2.5,2.5S13.38,11.5,12,11.5z'
            }"/>
          </svg>
          <span>${isSatelliteView ? 'Map' : 'Satellite'}</span>
        `;
        
        L.DomEvent.on(button, 'click', (e) => {
          L.DomEvent.stop(e);
          onToggle();
        });
        
        return container;
      }
    });

    controlRef.current = new CustomControl();
    controlRef.current.addTo(map);
    
    return () => controlRef.current?.remove();
  }, [map, isSatelliteView, onToggle]);

  return null;
};

// Refresh Control Component
const RefreshControl = ({ 
  onRefresh 
}: { 
  onRefresh: () => void;
}) => {
  const map = useMap();
  const controlRef = useRef<any>(null);

  useEffect(() => {
    const CustomControl = L.Control.extend({
      options: { position: 'topright' },
      onAdd: function () {
        const container = L.DomUtil.create('div', 'leaflet-control refresh-control-container');
        
        const button = L.DomUtil.create('button', 'refresh-control-btn', container);
        button.type = 'button';
        button.title = 'Refresh Map Data';
        button.innerHTML = `
          <div style="display: flex; align-items: center; gap: 8px; padding: 8px 12px;">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
              <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/>
            </svg>
            <span style="font-size: 14px; font-weight: 500;">Refresh</span>
          </div>
        `;
        
        L.DomEvent.on(button, 'click', (e) => {
          L.DomEvent.stop(e);
          onRefresh();
        });
        
        return container;
      }
    });

    controlRef.current = new CustomControl();
    controlRef.current.addTo(map);
    
    return () => controlRef.current?.remove();
  }, [map, onRefresh]);

  return null;
};

// Filter Control Component
const FilterControl = ({ 
  onFilterChange,
  currentFilter,
  photoTags
}: { 
  onFilterChange: (filter: string) => void;
  currentFilter: string;
  photoTags: PropertyDetails[];
}) => {
  const map = useMap();
  const controlRef = useRef<any>(null);
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [markerCounts, setMarkerCounts] = useState({
    all: 0,
    land: 0,
    building: 0,
    equipment: 0,
    new: 0
  });

  // Count markers by type and status
  useEffect(() => {
    const loadCounts = async () => {
      console.log('Starting to count markers for filter...');
      console.log('Total photo tags available:', photoTags.length);
      
      const counts = {
        all: photoTags.length,
        land: 0,
        building: 0,
        equipment: 0,
        new: 0
      };

      if (photoTags.length === 0) {
        console.log('No photo tags to count');
        setMarkerCounts(counts);
        return;
      }

      for (const tag of photoTags) {
        try {
          // Count by status
          if (tag.status && tag.status.toLowerCase() === 'new') {
            counts.new++;
          }

          // Count by kind_id directly
          if (tag.kind_id) {
            const kindStr = String(tag.kind_id).trim();
            switch (kindStr) {
              case '1':
                counts.land++;
                break;
              case '2':
                counts.building++;
                break;
              case '3':
                counts.equipment++;
                break;
            }
          }
        } catch (error) {
          // Silent catch for individual tag errors
        }
      }

      console.log('Final marker counts:', counts);
      setMarkerCounts(counts);
    };

    loadCounts();
  }, [photoTags]);

  useEffect(() => {
    let closePanel: (e: MouseEvent) => void;

    const CustomControl = L.Control.extend({
      options: { position: 'topright' },
      onAdd: function () {
        const container = L.DomUtil.create('div', 'leaflet-control filter-toggle-container');
        
        // Filter button
        const button = L.DomUtil.create('button', 'filter-toggle-btn', container);
        button.type = 'button';
        button.title = 'Filter Markers';
        button.innerHTML = `
          <div style="display: flex; align-items: center; gap: 8px; padding: 8px 12px;">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z"/>
            </svg>
            <span style="font-size: 14px; font-weight: 500;">Filter</span>
          </div>
        `;
        
        L.DomEvent.on(button, 'click', (e) => {
          L.DomEvent.stop(e);
          setShowFilterPanel(!showFilterPanel);
        });

        // Filter panel
        const panel = L.DomUtil.create('div', 'filter-panel');
        panel.style.display = showFilterPanel ? 'block' : 'none';
        panel.innerHTML = `
          <div class="filter-options">
            <div class="filter-section">
              <div class="filter-section-title">Show Markers</div>
              <button class="filter-option ${currentFilter === 'all' ? 'active' : ''}" data-filter="all">
                <span class="filter-label">All Markers</span>
                <span class="filter-badge">${markerCounts.all}</span>
              </button>
              <button class="filter-option ${currentFilter === 'new' ? 'active' : ''}" data-filter="new">
                <span class="filter-label">Status: New</span>
                <span class="filter-badge">${markerCounts.new}</span>
              </button>
            </div>
            <div class="filter-section">
              <div class="filter-section-title">By Type</div>
              <div class="filter-fan">
                <button class="filter-option ${currentFilter === 'land' ? 'active' : ''}" data-filter="land">
                  <img src="${landMarkerIconUrl}" alt="Land" class="filter-icon">
                  <span class="filter-label">Land</span>
                  <span class="filter-badge">${markerCounts.land}</span>
                </button>
                <button class="filter-option ${currentFilter === 'building' ? 'active' : ''}" data-filter="building">
                  <img src="${buildingMarkerIconUrl}" alt="Building" class="filter-icon">
                  <span class="filter-label">Building</span>
                  <span class="filter-badge">${markerCounts.building}</span>
                </button>
                <button class="filter-option ${currentFilter === 'equipment' ? 'active' : ''}" data-filter="equipment">
                  <img src="${equipmentMarkerIconUrl}" alt="Equipment" class="filter-icon">
                  <span class="filter-label">Equipment</span>
                  <span class="filter-badge">${markerCounts.equipment}</span>
                </button>
              </div>
            </div>
          </div>
        `;

        // Add click handlers for filter options
        L.DomEvent.on(panel, 'click', (e) => {
          const target = e.target as HTMLElement;
          const filterOption = target.closest('.filter-option') as HTMLElement;
          if (filterOption && filterOption.dataset.filter) {
            L.DomEvent.stop(e);
            onFilterChange(filterOption.dataset.filter);
            setShowFilterPanel(false);
          }
        });

        container.appendChild(panel);
        
        // Close panel when clicking outside
        closePanel = (e: MouseEvent) => {
          if (!container.contains(e.target as Node)) {
            setShowFilterPanel(false);
          }
        };
        
        document.addEventListener('click', closePanel);
        
        return container;
      }
    });

    controlRef.current = new CustomControl();
    controlRef.current.addTo(map);
    
    return () => {
      document.removeEventListener('click', closePanel);
      controlRef.current?.remove();
    };
  }, [map, showFilterPanel, currentFilter, markerCounts, onFilterChange]);

  // Update panel visibility when state changes
  useEffect(() => {
    if (controlRef.current) {
      const container = controlRef.current.getContainer();
      const panel = container?.querySelector('.filter-panel');
      if (panel) {
        panel.style.display = showFilterPanel ? 'block' : 'none';
      }
    }
  }, [showFilterPanel]);

  return null;
};

// Component to set up the map logic and markers
const MapLogic = ({ 
  onMarkerClick,
  searchQuery = '',
  currentFilter = 'all',
  isSatelliteView = false,
  onPhotoTagsLoaded,
  onToggleSatellite,
  onRefresh
}: { 
  onMarkerClick: (tagId: string) => void;
  searchQuery?: string;
  currentFilter?: string;
  isSatelliteView?: boolean;
  onPhotoTagsLoaded?: (tags: PropertyDetails[]) => void;
  onToggleSatellite: () => void;
  onRefresh: () => void;
}) => {
  const map = useMap();
  const tileLayerRef = useRef<any>(null);
  const [allowZoomOut, setAllowZoomOut] = useState(false);
  const [photoTags, setPhotoTags] = useState<PropertyDetails[]>([]);
  const [filteredPhotoTags, setFilteredPhotoTags] = useState<PropertyDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [markerIcons, setMarkerIcons] = useState<{[tagId: string]: L.Icon}>({});

  // TILE LAYER SETUP
  useEffect(() => {
    // Remove existing tile layer
    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
    }

    // Add Tile Layer
    const currentTileUrl = isSatelliteView ? SATELLITE_URL : OPENSTREETMAP_URL;
    
    const tileLayer = L.tileLayer(currentTileUrl, {
      attribution: isSatelliteView 
        ? 'Tiles &copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics'
        : '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      noWrap: true,
      minZoom: MIN_ZOOM_LOCKED,
      maxZoom: MAX_ZOOM,
      maxNativeZoom: 18
    });

    tileLayer.addTo(map);
    tileLayerRef.current = tileLayer;

    // Initial map view and restriction
    map.setView([8.35985, 124.869077], DEFAULT_ZOOM);
    map.setMaxBounds(manoloFortichBounds);

    const enforceRestrictions = () => {
      const currentZoom = map.getZoom();

      if (currentZoom > DEFAULT_ZOOM) {
        setAllowZoomOut(true);
      }

      if (!allowZoomOut && currentZoom < DEFAULT_ZOOM) {
        map.setZoom(DEFAULT_ZOOM);
      } else if (allowZoomOut && currentZoom < MIN_ZOOM_UNLOCKED) {
        map.setZoom(MIN_ZOOM_UNLOCKED);
      }

      if (!manoloFortichBounds.contains(map.getCenter())) {
        map.panInsideBounds(manoloFortichBounds, { animate: false });
      }
    };

    map.on('zoomend', enforceRestrictions);
    map.on('move', enforceRestrictions);

    setTimeout(() => map.invalidateSize(), 100);

    return () => {
      map.off('zoomend', enforceRestrictions);
      map.off('move', enforceRestrictions);
      if (tileLayer) {
        tileLayer.remove();
      }
    };
  }, [map, allowZoomOut, isSatelliteView]);

  // Fetch photo tags from database using the view
  const fetchPhotoTags = useCallback(async () => {
    try {
      setLoading(true);
      console.log('Starting to fetch photo tags using property_details_view...');

      // Fetch with bounds using the view
      const { data, error } = await supabase
        .from('property_details_view')
        .select('*')
        .gte('latitude', manoloFortichBounds.getSouthWest().lat)
        .lte('latitude', manoloFortichBounds.getNorthEast().lat)
        .gte('longitude', manoloFortichBounds.getSouthWest().lng)
        .lte('longitude', manoloFortichBounds.getNorthEast().lng);

      if (error) {
        console.error('Error fetching photo tags from view:', error);
      } else if (data) {
        console.log('Fetched photo tags from view:', data.length);
        
        setPhotoTags(data);
        setFilteredPhotoTags(data);
        
        // Pass the photo tags back to parent component for filter counts
        if (onPhotoTagsLoaded) {
          onPhotoTagsLoaded(data);
        }
        
        // Set marker icons - FIXED: using kind_id directly
        const icons: {[tagId: string]: L.Icon} = {};
        data.forEach(tag => {
          if (tag.kind_id) {
            icons[tag.tag_id] = getMarkerIconByKind(tag.kind_id);
          } else {
            icons[tag.tag_id] = getMarkerIconByKind('1'); // Default to land
          }
        });
        setMarkerIcons(icons);
      }
    } catch (error) {
      console.error('Error loading photo tags:', error);
    } finally {
      setLoading(false);
    }
  }, [onPhotoTagsLoaded]);

  useEffect(() => {
    fetchPhotoTags();
  }, [fetchPhotoTags]);

  // Filter and search functionality
  useEffect(() => {
    const filterAndSearchTags = () => {
      console.log('Starting filter and search...');
      console.log('Current filter:', currentFilter);
      console.log('Search query:', searchQuery);
      console.log('Total tags to filter:', photoTags.length);

      if (!searchQuery.trim() && currentFilter === 'all') {
        console.log('No filter or search - showing all tags');
        setFilteredPhotoTags(photoTags);
        return;
      }

      const filtered = [];
      const query = searchQuery.toLowerCase().trim();

      for (const tag of photoTags) {
        try {
          let matchesFilter = true;
          let matchesSearch = !searchQuery.trim();

          if (currentFilter !== 'all') {
            matchesFilter = false;
            const kindId = String(tag.kind_id).trim();
            
            switch (currentFilter) {
              case 'land':
                matchesFilter = kindId === '1';
                break;
              case 'building':
                matchesFilter = kindId === '2';
                break;
              case 'equipment':
                matchesFilter = kindId === '3';
                break;
              case 'new':
                matchesFilter = tag.status?.toLowerCase() === 'new';
                break;
              default:
                matchesFilter = true;
            }
          }

          if (searchQuery.trim()) {
            matchesSearch = 
              safeIncludes(tag.tag_id, query) ||
              safeIncludes(tag.form_id, query) ||
              safeIncludes(tag.kind_id, query) ||
              safeIncludes(tag.class_id, query) ||
              safeIncludes(tag.area, query) ||
              safeIncludes(tag.status, query) ||
              safeIncludes(tag.declarant, query) ||
              safeIncludes(tag.district_name, query) ||
              safeIncludes(tag.latitude, query) ||
              safeIncludes(tag.longitude, query) ||
              safeIncludes(tag.value_info_id, query);
          }

          if (matchesFilter && matchesSearch) {
            filtered.push(tag);
          }
        } catch (error) {
          console.log(`Error filtering tag ${tag.tag_id}:`, error);
        }
      }

      console.log(`Filtered results: ${filtered.length} tags`);
      setFilteredPhotoTags(filtered);
    };

    if (photoTags.length > 0) {
      filterAndSearchTags();
    }
  }, [photoTags, searchQuery, currentFilter]);

  return (
    <>
      {/* Satellite Toggle Control */}
      <SatelliteToggleControl 
        isSatelliteView={isSatelliteView}
        onToggle={onToggleSatellite}
      />
      
      {/* Refresh Control - positioned below filter */}
      <RefreshControl onRefresh={onRefresh} />
      
      {!loading && filteredPhotoTags.map((tag) => (
        <Marker
          key={tag.tag_id}
          position={[tag.latitude, tag.longitude]}
          icon={markerIcons[tag.tag_id] || getMarkerIconByKind('1')}
          eventHandlers={{
            click: () => {
              console.log('Marker clicked:', tag.tag_id);
              onMarkerClick(tag.tag_id);
            }
          }}
        />
      ))}
    </>
  );
};

// Main Map Component
const MapCon: React.FC<MapConProps> = ({ searchQuery = '', isAdmin = false }) => {
  const [isMounted, setIsMounted] = useState(false);
  const [selectedTagId, setSelectedTagId] = useState<string | null>(null);
  const [showPopup, setShowPopup] = useState(false);
  const [currentFilter, setCurrentFilter] = useState<string>('all');
  const [photoTags, setPhotoTags] = useState<PropertyDetails[]>([]);
  const [isSatelliteView, setIsSatelliteView] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);

  const handleMarkerClick = (tagId: string) => {
    console.log('MapCon: Marker clicked with tag_id:', tagId);
    setSelectedTagId(tagId);
    setShowPopup(true);
  };

  const handleClosePopup = () => {
    setShowPopup(false);
    setSelectedTagId(null);
  };

  const handleFilterChange = (filter: string) => {
    console.log('Changing filter to:', filter);
    setCurrentFilter(filter);
  };

  const handleToggleSatellite = () => {
    setIsSatelliteView(!isSatelliteView);
  };

  const handlePhotoTagsLoaded = useCallback((tags: PropertyDetails[]) => {
    console.log('Received photo tags in parent:', tags.length);
    setPhotoTags(tags);
  }, []);

  const handleRefresh = () => {
    console.log('Refreshing map data...');
    window.location.reload();
  };

  return (
    <div className="map-content" style={{ height: '100vh', width: '100%', overflow: 'hidden', position: 'relative' }}>
      {isMounted && (
        <MapContainer
          center={[8.35985, 124.869077]}
          zoom={DEFAULT_ZOOM}
          style={{ height: '100%', width: '100%' }}
          minZoom={MIN_ZOOM_LOCKED}
          maxZoom={MAX_ZOOM}
          maxBounds={manoloFortichBounds}
          maxBoundsViscosity={1.0}
        >
          <MapLogic 
            onMarkerClick={handleMarkerClick} 
            searchQuery={searchQuery}
            currentFilter={currentFilter}
            isSatelliteView={isSatelliteView}
            onPhotoTagsLoaded={handlePhotoTagsLoaded}
            onToggleSatellite={handleToggleSatellite}
            onRefresh={handleRefresh}
          />

          {/* Filter Control */}
          <FilterControl 
            onFilterChange={handleFilterChange}
            currentFilter={currentFilter}
            photoTags={photoTags}
          />
        </MapContainer>
      )}

      {/* Custom Popup Overlay */}
      {showPopup && selectedTagId && (
        <>
          <div 
            className="popup-overlay" 
            onClick={handleClosePopup}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              zIndex: 999
            }}
          />
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 1000,
            width: '90%',
            maxWidth: '400px',
            maxHeight: '80vh',
            overflow: 'auto'
          }}>
            <MapMarkerPopup 
              photoTagId={selectedTagId} 
              onClose={handleClosePopup} 
            />
          </div>
        </>
      )}
    </div>
  );
};

export default MapCon;