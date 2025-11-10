// src/utils/markericons.ts
import L from 'leaflet';
import buildingMarkerIconUrl from '../Images/Building.png';
import equipmentMarkerIconUrl from '../Images/Equipment.png';
import landMarkerIconUrl from '../Images/Land.png';

export const createBuildingMarkerIcon = () => {
  return L.icon({
    iconUrl: buildingMarkerIconUrl,
    iconSize: [25, 21],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    shadowSize: [41, 41],
    shadowAnchor: [12, 41]
  });
};

export const createEquipmentMarkerIcon = () => {
  return L.icon({
    iconUrl: equipmentMarkerIconUrl,
    iconSize: [25, 21],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    shadowSize: [41, 41],
    shadowAnchor: [12, 41]
  });
};

export const createLandMarkerIcon = () => {
  return L.icon({
    iconUrl: landMarkerIconUrl,
    iconSize: [25, 21],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    shadowSize: [41, 41],
    shadowAnchor: [12, 41]
  });
};

// Helper function to get the appropriate icon based on kind
export const getMarkerIconByKind = (kind: string | number): L.Icon => {
  // Convert to string and trim any whitespace
  const kindStr = String(kind).trim();
  
  console.log(`getMarkerIconByKind received: "${kindStr}" (type: ${typeof kind})`);
  
  switch (kindStr) {
    case '1':
    case 'LAND':
    case 'land':
      console.log('Using Land icon');
      return createLandMarkerIcon();
    case '2':
    case 'BUILDING':
    case 'building':
      console.log('Using Building icon');
      return createBuildingMarkerIcon();
    case '3':
    case 'MACHINERY':
    case 'machinery':
    case 'EQUIPMENT':
    case 'equipment':
      console.log('Using Equipment icon');
      return createEquipmentMarkerIcon();
    default:
      console.log(`Unknown kind "${kindStr}", using default Land icon`);
      return createLandMarkerIcon(); // Default fallback
  }
};