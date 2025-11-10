import React, { useState, useRef, useEffect } from 'react';
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonGrid,
  IonRow,
  IonCol,
  IonSearchbar,
  IonIcon,
  IonLoading,
  IonButton,
  IonToast
} from '@ionic/react';
import { informationCircleOutline, mapOutline } from 'ionicons/icons';
import DynamicTable from '../components/Globalcomponents/DynamicTable';
import { supabase } from '../utils/supaBaseClient';
import '../CSS/Setup.css';
import { useHistory, useLocation } from 'react-router-dom';

// Add interface for location state
interface LocationState {
  selectedFormId?: string;
}

const Forms: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [forms, setForms] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRow, setSelectedRow] = useState<any>(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const searchRef = useRef<HTMLIonSearchbarElement>(null);
  const history = useHistory();
  const location = useLocation<LocationState>();

  // Fetch forms from the view
  useEffect(() => {
    loadForms();
  }, []);

  // Handle navigation state to auto-select row
  useEffect(() => {
    if (location.state?.selectedFormId && forms.length > 0) {
      const formToSelect = forms.find(form => form.form_id === location.state.selectedFormId);
      if (formToSelect) {
        setSelectedRow(formToSelect);
        setTimeout(() => {
          const selectedElement = document.querySelector('.data-row.selected');
          if (selectedElement) {
            selectedElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 100);
      }
    }
  }, [forms, location.state]);

  const loadForms = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('form_view')
        .select('*')
        .order('form_id', { ascending: false });

      if (error) {
        console.error('Error fetching forms:', error);
        return;
      }

      setForms(data || []);
    } catch (error) {
      console.error('Failed to load forms:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = async (term: string) => {
    if (term.trim() === '') {
      loadForms();
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('form_view')
        .select('*')
        .or(`declarant_name.ilike.%${term}%,district_name.ilike.%${term}%,classification.ilike.%${term}%,status.ilike.%${term}%`)
        .order('form_id', { ascending: false });

      if (error) {
        console.error('Search error:', error);
        return;
      }

      setForms(data || []);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRowClick = (rowData: any) => {
    console.log('Row Clicked:', rowData);
    setSelectedRow(rowData);
  };

  // Update status to "Inspected" and navigate
  const handleInfoClick = async () => {
    if (!selectedRow) return;

    try {
      setIsLoading(true);
      
      // Update the status in formtbl to "Inspected"
      const { error } = await supabase
        .from('formtbl')
        .update({ status: 'Inspected' })
        .eq('form_id', selectedRow.form_id);

      if (error) throw error;

      // Update local state
      const updatedForms = forms.map(form => 
        form.form_id === selectedRow.form_id 
          ? { ...form, status: 'Inspected' }
          : form
      );
      
      setForms(updatedForms);
      setSelectedRow({ ...selectedRow, status: 'Inspected' });
      
      setToastMessage('Status updated to Inspected');
      setShowToast(true);

      // Navigate based on kind and class - USE URL PARAMETERS FOR ALL
      const kindDescription = selectedRow.kind_description?.toUpperCase();
      const classId = selectedRow.class_id?.toUpperCase();
      
      if (kindDescription === 'MACHINERY') {
        history.push(`/menu/machinerytable/${selectedRow.form_id}`);
      } else if (kindDescription === 'BUILDING') {
        // FIXED: Use URL parameter instead of location state
        history.push(`/menu/buildingtable/${selectedRow.form_id}`);
      } else if (kindDescription === 'LAND' && classId === 'A') {
        history.push(`/menu/agriculturalland/${selectedRow.form_id}`);
      } else if (kindDescription === 'LAND' && classId !== 'A') {
        history.push(`/menu/nonagriculturalland/${selectedRow.form_id}`);
      } else {
        console.log(`Navigation not configured for kind: ${kindDescription} with class: ${classId}`);
      }

    } catch (error) {
      console.error('Failed to update status:', error);
      setToastMessage('Failed to update status');
      setShowToast(true);
    } finally {
      setIsLoading(false);
    }
  };

  // Navigate to map with form_id in search
  const handleMapClick = () => {
    if (!selectedRow) return;
    
    // Navigate to map and pass the form_id as search query
    history.push('/menu/map', { 
      searchQuery: selectedRow.form_id 
    });
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Forms</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen>
        <IonLoading isOpen={isLoading} message="Loading forms..." />
        
        <IonGrid>
          <IonRow>
            <IonCol size="12" className="search-container">
              <IonSearchbar
                ref={searchRef}
                placeholder="Search by name, district, class, or status..."
                onIonInput={(e) => {
                  const term = e.detail.value || '';
                  setSearchTerm(term);
                  handleSearch(term);
                }}
                debounce={300}
              />

              <div className="icon-group">
                {/* Map Button */}
                <IonButton
                  fill="clear"
                  onClick={handleMapClick}
                  disabled={!selectedRow}
                  title="View on Map"
                >
                  <IonIcon
                    icon={mapOutline}
                    className={`icon-blue ${!selectedRow ? 'icon-disabled' : ''}`}
                  />
                </IonButton>

                {/* Info Button */}
                <IonButton
                  fill="clear"
                  onClick={handleInfoClick}
                  disabled={!selectedRow}
                  title="View Details"
                >
                  <IonIcon
                    icon={informationCircleOutline}
                    className={`icon-yellow ${!selectedRow ? 'icon-disabled' : ''}`}
                  />
                </IonButton>
              </div>
            </IonCol>
          </IonRow>

          <IonRow>
            <IonCol size="12">
              <DynamicTable
                data={forms}
                title="Forms Overview"
                keyField="form_id"
                onRowClick={handleRowClick}
                selectedRow={selectedRow}
              />
            </IonCol>
          </IonRow>
        </IonGrid>

        <IonToast
          isOpen={showToast}
          onDidDismiss={() => setShowToast(false)}
          message={toastMessage}
          duration={2000}
          position="top"
        />
      </IonContent>
    </IonPage>
  );
};

export default Forms;