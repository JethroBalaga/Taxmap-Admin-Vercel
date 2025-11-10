// src/components/MapMarkerPopup.tsx
import React from 'react';
import {
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonImg,
  IonText,
  IonButton,
  IonIcon,
  IonSpinner
} from '@ionic/react';
import { close, document } from 'ionicons/icons';
import { supabase } from '../utils/supaBaseClient';
import { useHistory } from 'react-router-dom';
import '../CSS/MapMarkerPopup.css';

interface MapMarkerPopupProps {
  photoTagId: string;
  onClose: () => void;
}

interface PropertyDetails {
  tag_id: string; // FIXED: Changed from 'id' to 'tag_id'
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
  // For compatibility
  address?: string;
  property_type?: string;
  description?: string;
  kind_description?: string;
}

const MapMarkerPopup: React.FC<MapMarkerPopupProps> = ({ photoTagId, onClose }) => {
  const [photoData, setPhotoData] = React.useState<string | null>(null);
  const [propertyDetails, setPropertyDetails] = React.useState<PropertyDetails | null>(null);
  const [loading, setLoading] = React.useState(true);
  const history = useHistory();

  React.useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        console.log('MapMarkerPopup: Loading data for tag_id:', photoTagId);
        
        // FIXED: Query using tag_id instead of id
        const { data: propertyData, error: propertyError } = await supabase
          .from('property_details_view')
          .select('*')
          .eq('tag_id', photoTagId) // FIXED: Changed from 'id' to 'tag_id'
          .single();

        if (propertyError) {
          console.error('Error fetching property details:', propertyError);
          setLoading(false);
          return;
        }

        if (!propertyData) {
          console.log('No property data found for tag_id:', photoTagId);
          setLoading(false);
          return;
        }

        console.log('MapMarkerPopup: Loaded property data:', propertyData);
        setPropertyDetails(propertyData);

        // Fetch photo from storage
        if (propertyData.photo) {
          try {
            const photoPath = `${photoTagId}/${propertyData.photo}`;
            console.log('Trying to load photo from path:', photoPath);
            
            const { data: signedUrlData, error: signedUrlError } = await supabase
              .storage
              .from('tag-photos')
              .createSignedUrl(photoPath, 60);

            if (signedUrlError) {
              console.error('Error generating signed URL:', signedUrlError);
              await tryAlternativePhotoPaths(propertyData, photoTagId);
            } else if (signedUrlData) {
              console.log('Successfully loaded photo');
              setPhotoData(signedUrlData.signedUrl);
            }
          } catch (photoError) {
            console.warn('Error loading photo:', photoError);
            await tryAlternativePhotoPaths(propertyData, photoTagId);
          }
        } else {
          console.warn('No photo filename found for tag_id:', photoTagId);
        }

      } catch (error) {
        console.error('Error loading marker data:', error);
      } finally {
        setLoading(false);
      }
    };

    const tryAlternativePhotoPaths = async (propertyData: PropertyDetails, tagId: string) => {
      if (!propertyData.photo) return;
      
      const alternativePaths = [
        `${tagId}/${propertyData.photo}`,
        `${tagId}/photo.jpg`,
        `${tagId}/image.jpg`,
        `${tagId}/${propertyData.photo}.jpg`,
        `${tagId}/photo.png`,
        `${tagId}/image.png`,
        propertyData.photo
      ];

      for (const path of alternativePaths) {
        try {
          console.log('Trying alternative photo path:', path);
          const { data: signedUrlData, error } = await supabase
            .storage
            .from('tag-photos')
            .createSignedUrl(path, 60);

          if (!error && signedUrlData) {
            console.log('Found photo at alternative path:', path);
            setPhotoData(signedUrlData.signedUrl);
            break;
          }
        } catch (error) {
          continue;
        }
      }
    };

    if (photoTagId) {
      loadData();
    }
  }, [photoTagId]);

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleViewForm = () => {
    if (propertyDetails && propertyDetails.form_id) {
      history.push('/menu/forms', { 
        selectedFormId: propertyDetails.form_id 
      });
      onClose();
    }
  };

  if (loading) {
    return (
      <div className="map-marker-popup-container">
        <IonCard className="map-marker-popup-card">
          <IonCardContent>
            <div className="popup-loading">
              <IonSpinner name="crescent" />
              <p>Loading property details...</p>
            </div>
          </IonCardContent>
        </IonCard>
      </div>
    );
  }

  if (!propertyDetails) {
    return (
      <div className="map-marker-popup-container">
        <IonCard className="map-marker-popup-card">
          <IonCardContent>
            <div className="popup-error">
              <p>No data found for this marker</p>
            </div>
          </IonCardContent>
        </IonCard>
      </div>
    );
  }

  const hasFormData = propertyDetails.form_id;

  return (
    <div className="map-marker-popup-container">
      <IonCard className="map-marker-popup-card">
        <IonCardHeader className="popup-header">
          <div className="popup-header-content">
            <IonCardTitle className="popup-title">
              {hasFormData ? 'Property Details' : 'Location Details'}
            </IonCardTitle>
            <IonButton
              fill="clear"
              size="small"
              onClick={onClose}
              className="popup-close-btn"
            >
              <IonIcon icon={close} slot="icon-only" />
            </IonButton>
          </div>
        </IonCardHeader>

        <IonCardContent className="popup-content">
          {/* Photo */}
          {photoData ? (
            <div className="popup-photo-container">
              <IonImg
                src={photoData}
                alt="Property photo"
                className="popup-photo"
              />
            </div>
          ) : (
            <div className="popup-photo-placeholder">
              <span>Photo not available</span>
            </div>
          )}

          {/* Property Data */}
          {hasFormData ? (
            <div className="popup-form-data">
              <IonText>
                <p className="popup-data-item">
                  <strong>Form ID:</strong> {propertyDetails.form_id?.substring(0, 8)}...
                </p>
                
                {propertyDetails.declarant && (
                  <p className="popup-data-item">
                    <strong>Declarant:</strong> {propertyDetails.declarant}
                  </p>
                )}
                
                {propertyDetails.district_name && (
                  <p className="popup-data-item">
                    <strong>District:</strong> {propertyDetails.district_name}
                  </p>
                )}
                
                {propertyDetails.kind_id && (
                  <p className="popup-data-item">
                    <strong>Type:</strong> {propertyDetails.kind_id === '1' ? 'Land' : propertyDetails.kind_id === '2' ? 'Building' : 'Equipment'}
                  </p>
                )}
                
                {propertyDetails.class_id && (
                  <p className="popup-data-item">
                    <strong>Class:</strong> {propertyDetails.class_id}
                  </p>
                )}
                
                {propertyDetails.area && (
                  <p className="popup-data-item">
                    <strong>Area:</strong> {propertyDetails.area} m²
                  </p>
                )}
                
                {propertyDetails.status && (
                  <p className="popup-data-item">
                    <strong>Status:</strong> {propertyDetails.status}
                  </p>
                )}
              </IonText>

              <IonButton
                expand="block"
                fill="solid"
                color="primary"
                onClick={handleViewForm}
                className="view-form-button"
              >
                <IonIcon icon={document} slot="start" />
                View Form
              </IonButton>
            </div>
          ) : (
            <div className="popup-no-data">
              <IonText>
                <p className="popup-data-item">
                  <strong>Type:</strong> {propertyDetails.kind_id === '1' ? 'Land' : propertyDetails.kind_id === '2' ? 'Building' : 'Equipment'}
                </p>
                <p className="popup-no-data-text">
                  No form data associated with this location
                </p>
              </IonText>
            </div>
          )}

          {/* Location Info */}
          <div className="popup-meta-data">
            <IonText>
              <p className="popup-data-item meta">
                <strong>Date Taken:</strong> {formatDate(propertyDetails.date_taken || propertyDetails.created_at)}
              </p>
              <p className="popup-data-item meta">
                <strong>Coordinates:</strong> {propertyDetails.latitude.toFixed(6)}, {propertyDetails.longitude.toFixed(6)}
              </p>
              <p className="popup-data-item meta">
                <strong>Tag ID:</strong> {propertyDetails.tag_id.substring(0, 8)}...
              </p>
            </IonText>
          </div>
        </IonCardContent>
      </IonCard>
    </div>
  );
};

export default MapMarkerPopup;