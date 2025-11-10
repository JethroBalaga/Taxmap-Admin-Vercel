import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonGrid,
  IonRow,
  IonCol,
  IonIcon,
  IonLoading,
  IonSearchbar,
  IonAlert,
  IonToast,
  IonButtons,
  IonButton,
  useIonRouter
} from '@ionic/react';
import { add, arrowUpCircle, trash, arrowBack } from 'ionicons/icons';
import './../../CSS/Setup.css';
import DynamicTable from '../../components/Globalcomponents/DynamicTable';
import { useLocation } from 'react-router-dom';
import { supabase } from '../../utils/supaBaseClient';
import BarangayCreateModal from '../../components/BarangayModals/BarangayCreateModal';
import BarangayUpdateModal from '../../components/BarangayModals/BarangayUpdateModal';

interface BarangayItem {
  barangay_id: string;
  barangay: string;
  district_id: number;
  created_at?: string;
}

const Barangay: React.FC = () => {
  const location = useLocation();
  const router = useIonRouter();
  const [districtId, setDistrictId] = useState<number | null>(null);
  const [barangays, setBarangays] = useState<BarangayItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRow, setSelectedRow] = useState<BarangayItem | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const searchRef = useRef<HTMLIonSearchbarElement>(null);

  // Reset state when URL changes
  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const id = queryParams.get('district_id');
    
    setDistrictId(id ? Number(id) : null);
    setSelectedRow(null);
    setSearchTerm('');
    setBarangays([]);
  }, [location.search]);

  // Fetch barangays
  const fetchBarangays = useCallback(async () => {
    if (!districtId) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('barangaytbl')
        .select('*')
        .eq('district_id', districtId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBarangays(data || []);
    } catch (error) {
      console.error('Error fetching barangays:', error);
      setToastMessage('Failed to load barangays');
      setIsError(true);
      setShowToast(true);
    } finally {
      setIsLoading(false);
    }
  }, [districtId]);

  useEffect(() => {
    fetchBarangays();
  }, [fetchBarangays]);

  // Filter data
  const filteredData = useMemo(() => {
    if (!searchTerm.trim()) return barangays;

    const term = searchTerm.toLowerCase();
    return barangays.filter(item =>
      item.barangay_id.toLowerCase().includes(term) ||
      item.barangay.toLowerCase().includes(term)
    );
  }, [barangays, searchTerm]);

  const handleRowClick = (rowData: BarangayItem) => setSelectedRow(rowData);
  const handleCreateClick = () => setShowCreateModal(true);
  const handleEditClick = () => selectedRow && setShowUpdateModal(true);
  const handleDeleteClick = () => selectedRow && setShowDeleteAlert(true);

  const handleDeleteConfirm = async () => {
    if (!selectedRow) return;

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('barangaytbl')
        .delete()
        .eq('barangay_id', selectedRow.barangay_id);

      if (error) throw error;

      setToastMessage(`${selectedRow.barangay} deleted successfully!`);
      setSelectedRow(null);
      fetchBarangays();
    } catch (error) {
      console.error('Error deleting barangay:', error);
      setToastMessage('Failed to delete barangay');
      setIsError(true);
    } finally {
      setIsLoading(false);
      setShowDeleteAlert(false);
      setShowToast(true);
    }
  };

  const handleBarangayCreated = () => {
    fetchBarangays();
    setShowCreateModal(false);
    setToastMessage('Barangay created successfully!');
    setShowToast(true);
  };

  const handleBarangayUpdated = () => {
    fetchBarangays();
    setSelectedRow(null);
    setShowUpdateModal(false);
    setToastMessage('Barangay updated successfully!');
    setShowToast(true);
  };

  const handleBackClick = () => {
    router.push('/menu/home/district', 'back');
  };

  const iconButtons = [
    { icon: add, onClick: handleCreateClick, disabled: !districtId, title: "Add Barangay" },
    { icon: arrowUpCircle, onClick: handleEditClick, disabled: !selectedRow, title: "Edit Barangay" },
    { icon: trash, onClick: handleDeleteClick, disabled: !selectedRow, title: "Delete Barangay" }
  ];

  return (
    <IonContent fullscreen>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonButton onClick={handleBackClick}>
              <IonIcon icon={arrowBack} />
            </IonButton>
          </IonButtons>
          <IonTitle>
            {districtId ? `Barangays (District ID: ${districtId})` : 'Barangays'}
          </IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonGrid>
        <IonRow>
          <IonCol size="12" className="search-container">
            <IonSearchbar
              ref={searchRef}
              placeholder="Search barangays..."
              value={searchTerm}
              onIonInput={(e) => setSearchTerm(e.detail.value || '')}
              debounce={0}
            />
            <div className="icon-group">
              {iconButtons.map((btn, index) => (
                <IonIcon
                  key={index}
                  icon={btn.icon}
                  className={`icon-yellow ${btn.disabled ? 'icon-disabled' : ''}`}
                  onClick={btn.disabled ? undefined : btn.onClick}
                  title={btn.title}
                />
              ))}
            </div>
          </IonCol>
        </IonRow>

        <IonRow>
          <IonCol size="12">
            <DynamicTable
              data={filteredData}
              title="Barangays"
              keyField="barangay_id"
              onRowClick={handleRowClick}
              selectedRow={selectedRow}
            />
          </IonCol>
        </IonRow>
      </IonGrid>

      {/* Create Modal */}
      {districtId && (
        <BarangayCreateModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onBarangayCreated={handleBarangayCreated}
          district_id={districtId}
        />
      )}

      {/* Update Modal */}
      <BarangayUpdateModal
        isOpen={showUpdateModal}
        onClose={() => setShowUpdateModal(false)}
        barangayData={selectedRow ? {
          barangay_id: selectedRow.barangay_id,
          barangay_name: selectedRow.barangay,
          district_id: selectedRow.district_id
        } : null}
        onBarangayUpdated={handleBarangayUpdated}
      />

      {/* Delete Confirmation */}
      <IonAlert
        isOpen={showDeleteAlert}
        onDidDismiss={() => setShowDeleteAlert(false)}
        header="Confirm Delete"
        message={`Are you sure you want to delete ${selectedRow?.barangay}?`}
        buttons={[
          { text: 'Cancel', role: 'cancel', cssClass: 'secondary' },
          { text: 'Delete', handler: handleDeleteConfirm, cssClass: 'danger' }
        ]}
      />

      <IonLoading isOpen={isLoading} message="Loading..." />
      <IonToast
        isOpen={showToast}
        onDidDismiss={() => setShowToast(false)}
        message={toastMessage}
        duration={3000}
        color={isError ? 'danger' : 'success'}
      />
    </IonContent>
  );
};

export default Barangay;