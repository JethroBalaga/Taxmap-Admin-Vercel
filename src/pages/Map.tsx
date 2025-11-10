import { 
  IonContent, 
  IonHeader, 
  IonPage, 
  IonTitle, 
  IonToolbar, 
  IonCard,
  IonSearchbar,
  IonButton,
  IonIcon,
  IonGrid,
  IonRow,
  IonCol
} from '@ionic/react';
import { closeCircleOutline } from 'ionicons/icons';
import { useState, useEffect } from 'react';
import MapCon from '../components/MapCon';
import '../CSS/Map.css';
import { useLocation } from 'react-router-dom';

// Add interface for location state
interface LocationState {
  searchQuery?: string;
}

const Map: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const location = useLocation<LocationState>();

  // Handle navigation with search query
  useEffect(() => {
    if (location.state?.searchQuery) {
      setSearchQuery(location.state.searchQuery);
    }
  }, [location.state]);

  const handleSearch = (event: CustomEvent) => {
    setSearchQuery(event.detail.value || '');
  };

  const handleClearSearch = () => {
    setSearchQuery('');
  };

  const handleClearSearchClick = () => {
    setSearchQuery('');
    // Also clear any URL state
    window.history.replaceState({}, document.title);
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Admin Map</IonTitle>
        </IonToolbar>
        
        {/* Updated Search Bar Section - Only copying the STYLE layout */}
        <IonToolbar>
          <IonGrid>
            <IonRow>
              <IonCol size="12" className="search-container">
                <div style={{ display: 'flex', alignItems: 'center', width: '30%', gap: '10px' }}>
                  <IonSearchbar
                    value={searchQuery}
                    onIonInput={handleSearch}
                    onIonClear={handleClearSearch}
                    placeholder="Search properties by form ID, declarant, district, etc..."
                    className="map-searchbar"
                    animated
                    style={{ 
                      flex: '1',
                      '--background': '#ffffff',
                      '--border-radius': '8px',
                      '--box-shadow': '0 2px 4px rgba(0,0,0,0.1)'
                    } as any}
                  />
                  
                  {/* Icon Group - Only Clear button (matching the style layout) */}
                  <div className="icon-group">
                    {/* Only keep the Clear Search Button */}
                    {searchQuery && (
                      <IonButton
                        fill="clear"
                        onClick={handleClearSearchClick}
                        title="Clear Search"
                      >
                        <IonIcon 
                          icon={closeCircleOutline} 
                          className="icon-blue"
                        />
                      </IonButton>
                    )}
                  </div>
                </div>
              </IonCol>
            </IonRow>
          </IonGrid>
        </IonToolbar>
      </IonHeader>
      
      <IonContent fullscreen className="map-content">
        <IonCard className="map-card">
          <MapCon searchQuery={searchQuery} isAdmin={true} />
        </IonCard>
      </IonContent>
    </IonPage>
  );
};

export default Map;