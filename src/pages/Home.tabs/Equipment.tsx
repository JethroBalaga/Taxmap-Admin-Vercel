import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonGrid,
  IonRow,
  IonCol,
  IonIcon,
  IonSearchbar,
  IonToast,
  IonLoading,
  IonAlert,
  IonButtons,
  IonButton,
  useIonRouter
} from '@ionic/react';
import { add, arrowUpCircle, trash, arrowBack } from 'ionicons/icons';
import './../../CSS/Setup.css';
import { useLocation } from 'react-router-dom';
import DynamicTable from '../../components/Globalcomponents/DynamicTable';
import { supabase } from '../../utils/supaBaseClient';
import EquipmentCreateModal from '../../components/EquipmentModals/EquipmentCreateModal';
import EquipmentUpdateModal from '../../components/EquipmentModals/EquipmentUpdateModal';

interface Equipment {
  equipment_id: string;
  machine_type: string;
  created_at: string;
}

const Equipment: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [equipmentData, setEquipmentData] = useState<Equipment[]>([]);
  const [selectedRow, setSelectedRow] = useState<Equipment | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);

  const searchRef = useRef<HTMLIonSearchbarElement>(null);
  const location = useLocation();
  const router = useIonRouter();

  // Reset selected row and search on location change
  useEffect(() => {
    setSelectedRow(null);
    setSearchTerm('');
  }, [location.pathname]);

  // Fetch equipment data
  const fetchEquipmentData = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('equipment')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setEquipmentData(data || []);
    } catch {
      setToastMessage('Failed to load equipment data');
      setIsError(true);
      setShowToast(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEquipmentData();
  }, [fetchEquipmentData]);

  // Filter equipment by search term
  const filteredData = useMemo(() => {
    if (!searchTerm.trim()) return equipmentData;
    const term = searchTerm.toLowerCase();
    return equipmentData.filter(item =>
      item.equipment_id.toLowerCase().includes(term) ||
      item.machine_type.toLowerCase().includes(term)
    );
  }, [searchTerm, equipmentData]);

  const handleRowClick = (rowData: Equipment) => setSelectedRow(rowData);
  const handleCreateClick = () => setIsCreateModalOpen(true);
  const handleUpdateClick = () => selectedRow && setIsUpdateModalOpen(true);
  const handleDeleteClick = () => selectedRow && setShowDeleteAlert(true);

  const handleDeleteConfirm = async () => {
    if (!selectedRow) return;
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('equipment')
        .delete()
        .eq('equipment_id', selectedRow.equipment_id);

      if (error) throw error;
      await fetchEquipmentData();
      setSelectedRow(null);
      setToastMessage('Equipment deleted successfully!');
      setIsError(false);
      setShowToast(true);
    } catch {
      setToastMessage('Failed to delete equipment');
      setIsError(true);
      setShowToast(true);
    } finally {
      setIsLoading(false);
      setShowDeleteAlert(false);
    }
  };

  const handleEquipmentCreated = () => {
    fetchEquipmentData();
    setIsCreateModalOpen(false);
    setToastMessage('Equipment created successfully!');
    setIsError(false);
    setShowToast(true);
  };

  const handleEquipmentUpdated = () => {
    fetchEquipmentData();
    setSelectedRow(null);
    setIsUpdateModalOpen(false);
    setToastMessage('Equipment updated successfully!');
    setIsError(false);
    setShowToast(true);
  };

  const handleBackClick = () => router.push('/menu/home', 'back');

  const iconButtons = [
    { icon: add, onClick: handleCreateClick, title: "Add Equipment" },
    { icon: arrowUpCircle, onClick: handleUpdateClick, disabled: !selectedRow, title: "Edit Equipment" },
    { icon: trash, onClick: handleDeleteClick, disabled: !selectedRow, title: "Delete Equipment" }
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
          <IonTitle>Equipment Setup</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonGrid>
        <IonRow>
          <IonCol size="12" className="search-container">
            <IonSearchbar
              ref={searchRef}
              placeholder="Search equipment..."
              value={searchTerm}
              onIonInput={(e) => setSearchTerm(e.detail.value || '')}
              debounce={200}
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
              title="Equipment List"
              keyField="equipment_id"
              onRowClick={handleRowClick}
              selectedRow={selectedRow}
            />
          </IonCol>
        </IonRow>
      </IonGrid>

      <IonLoading isOpen={isLoading} message="Loading..." />

      <EquipmentCreateModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onEquipmentCreated={handleEquipmentCreated}
      />

      {selectedRow && (
        <EquipmentUpdateModal
          isOpen={isUpdateModalOpen}
          onClose={() => setIsUpdateModalOpen(false)}
          onEquipmentUpdated={handleEquipmentUpdated}
          equipmentData={selectedRow}
        />
      )}

      <IonAlert
        isOpen={showDeleteAlert}
        onDidDismiss={() => setShowDeleteAlert(false)}
        header={'Confirm Delete'}
        message={`Are you sure you want to delete equipment <strong>${selectedRow?.equipment_id}</strong>?`}
        buttons={[
          { text: 'Cancel', role: 'cancel', cssClass: 'secondary' },
          { text: 'Delete', handler: handleDeleteConfirm }
        ]}
      />

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

export default Equipment;