import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import {
  IonContent,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonGrid,
  IonRow,
  IonCol,
  IonIcon,
  IonSearchbar,
  IonLoading,
  IonAlert,
  IonToast,
  IonButtons,
  IonButton,
  useIonRouter
} from '@ionic/react';
import { add, arrowUpCircle, trash, arrowBack } from 'ionicons/icons';
import './../../CSS/Setup2.css';
import { supabase } from './../../utils/supaBaseClient';
import DynamicTable from '../../components/Globalcomponents/DynamicTable';
import LandAdjustmentCreateModal from '../../components/LandAdjustmentModals/LandAdjustmentCreateModal';
import LandAdjustmentUpdateModal from '../../components/LandAdjustmentModals/LandAdjustmentUpdateModal';
import { useLocation } from 'react-router-dom';

interface LandAdjustmentItem {
  adjustment_id: string;
  description: string;
  adjustment_factor: string;
  adjustment_type: string;
  created_at?: string;
}

const LandAdjustment: React.FC = () => {
  const [landAdjustments, setLandAdjustments] = useState<LandAdjustmentItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRow, setSelectedRow] = useState<LandAdjustmentItem | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const searchRef = useRef<HTMLIonSearchbarElement>(null);
  const router = useIonRouter();
  const location = useLocation();

  useEffect(() => {
    setSelectedRow(null);
    setSearchTerm('');
  }, [location.pathname]);

  const fetchLandAdjustments = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('landadjustmenttbl')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLandAdjustments(data || []);
    } catch {
      setToastMessage('Failed to load land adjustments');
      setIsError(true);
      setShowToast(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLandAdjustments();
  }, [fetchLandAdjustments]);

  const filteredData = useMemo(() => {
    if (!searchTerm.trim()) return landAdjustments;
    const term = searchTerm.toLowerCase();
    return landAdjustments.filter(item =>
      item.adjustment_id.toLowerCase().includes(term) ||
      item.description.toLowerCase().includes(term) ||
      item.adjustment_factor.toLowerCase().includes(term) ||
      item.adjustment_type.toLowerCase().includes(term)
    );
  }, [landAdjustments, searchTerm]);

  const handleRowClick = (rowData: LandAdjustmentItem) => setSelectedRow(rowData);
  const handleCreateClick = () => setShowCreateModal(true);
  const handleArrowUpClick = () => selectedRow && setShowUpdateModal(true);
  const handleTrashClick = () => selectedRow && setShowDeleteAlert(true);
  const handleBackClick = () => router.push('/menu/home', 'back');

  const handleDeleteConfirm = async () => {
    if (!selectedRow) return;

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('landadjustmenttbl')
        .delete()
        .eq('adjustment_id', selectedRow.adjustment_id);

      if (error) throw error;

      await fetchLandAdjustments();
      setSelectedRow(null);
      setToastMessage('Land adjustment deleted successfully');
      setIsError(false);
      setShowToast(true);
    } catch {
      setToastMessage('Failed to delete land adjustment');
      setIsError(true);
      setShowToast(true);
    } finally {
      setIsLoading(false);
      setShowDeleteAlert(false);
    }
  };

  const handleLandAdjustmentCreated = () => {
    fetchLandAdjustments();
    setShowCreateModal(false);
    setToastMessage('Land adjustment created successfully');
    setIsError(false);
    setShowToast(true);
  };

  const handleLandAdjustmentUpdated = () => {
    fetchLandAdjustments();
    setSelectedRow(null);
    setShowUpdateModal(false);
    setToastMessage('Land adjustment updated successfully');
    setIsError(false);
    setShowToast(true);
  };

  const iconButtons = [
    { icon: add, onClick: handleCreateClick, disabled: false, title: "Create New" },
    { icon: arrowUpCircle, onClick: handleArrowUpClick, disabled: !selectedRow, title: "Edit" },
    { icon: trash, onClick: handleTrashClick, disabled: !selectedRow, title: "Delete" }
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
          <IonTitle>Residential Land</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonGrid>
        <IonRow>
          <IonCol size="12" className="search-container">
            <IonSearchbar
              ref={searchRef}
              placeholder="Search land adjustments..."
              value={searchTerm}
              onIonInput={e => setSearchTerm(e.detail.value || '')}
              debounce={200}
            />
            <div className="icon-group">
              {iconButtons.map((btn, idx) => (
                <IonIcon
                  key={idx}
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
              title="Land Adjustments"
              keyField="adjustment_id"
              onRowClick={handleRowClick}
              selectedRow={selectedRow}
            />
          </IonCol>
        </IonRow>
      </IonGrid>

      <IonLoading isOpen={isLoading} message="Loading..." />

      <LandAdjustmentCreateModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onLandAdjustmentCreated={handleLandAdjustmentCreated}
      />

      <LandAdjustmentUpdateModal
        isOpen={showUpdateModal}
        onClose={() => setShowUpdateModal(false)}
        onLandAdjustmentUpdated={handleLandAdjustmentUpdated}
        landAdjustmentData={selectedRow}
      />

      <IonAlert
        isOpen={showDeleteAlert}
        onDidDismiss={() => setShowDeleteAlert(false)}
        header={'Confirm Delete'}
        message={`Are you sure you want to delete adjustment ${selectedRow?.adjustment_id} (${selectedRow?.description})?`}
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

export default LandAdjustment;