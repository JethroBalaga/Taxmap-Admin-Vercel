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
import { supabase } from '../../utils/supaBaseClient';
import ActualUsedCreateModal from '../../components/ActualUsedModals/ActualUsedCreateModal';
import ActualUsedUpdateModal from '../../components/ActualUsedModals/ActualUsedUpdateModal';
import DynamicTable from '../../components/Globalcomponents/DynamicTable';

interface ClassificationData {
  class_id: string;
  classification: string;
}

interface ActualUsedItem {
  actual_used_id: string;
  description: string;
  class_id: string;
  created_at: string;
}

const ActualUsed: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const searchRef = useRef<HTMLIonSearchbarElement>(null);
  const location = useLocation();
  const router = useIonRouter();
  const [classificationData, setClassificationData] = useState<ClassificationData | null>(null);
  const [actualUsedItems, setActualUsedItems] = useState<ActualUsedItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedRow, setSelectedRow] = useState<ActualUsedItem | null>(null);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);

  // Reset state when URL changes
  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const classId = queryParams.get('class_id');

    setSelectedRow(null);
    setSearchTerm('');

    try {
      if (location.state) {
        const stateData = location.state as any;

        if (stateData.classificationData) {
          setClassificationData(stateData.classificationData);
        } else if (stateData.class_id && stateData.classification) {
          setClassificationData({
            class_id: stateData.class_id,
            classification: stateData.classification
          });
        } else if (classId) {
          setClassificationData({
            class_id: classId,
            classification: `Classification ${classId}`
          });
        }
      } else if (classId) {
        setClassificationData({
          class_id: classId,
          classification: `Classification ${classId}`
        });
      }
    } catch (error) {
      console.error('Error parsing classification data:', error);
    }
  }, [location.search]);

  // Fetch actual used items
  const fetchActualUsedItems = useCallback(async () => {
    if (!classificationData) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('actual_usedtbl')
        .select('*')
        .eq('class_id', classificationData.class_id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setActualUsedItems(data || []);
    } catch (error) {
      console.error('Error fetching actual used items:', error);
      setToastMessage('Failed to load actual used items');
      setIsError(true);
      setShowToast(true);
    } finally {
      setIsLoading(false);
    }
  }, [classificationData]);

  useEffect(() => {
    fetchActualUsedItems();
  }, [fetchActualUsedItems]);

  const filteredData = useMemo(() => {
    if (!searchTerm.trim()) return actualUsedItems;

    const term = searchTerm.toLowerCase();
    return actualUsedItems.filter(item =>
      item.actual_used_id.toLowerCase().includes(term) ||
      item.description.toLowerCase().includes(term)
    );
  }, [actualUsedItems, searchTerm]);

  const handleRowClick = (rowData: ActualUsedItem) => setSelectedRow(rowData);
  const handleUpdateClick = () => selectedRow && setIsUpdateModalOpen(true);
  const handleDeleteClick = () => selectedRow && setShowDeleteAlert(true);

  const handleDeleteConfirm = async () => {
    if (!selectedRow) return;

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('actual_usedtbl')
        .delete()
        .eq('actual_used_id', selectedRow.actual_used_id);

      if (error) throw error;

      await fetchActualUsedItems();
      setSelectedRow(null);
      setToastMessage('Actual used item deleted successfully!');
      setShowToast(true);
    } catch (error) {
      console.error('Error deleting actual used item:', error);
      setToastMessage('Failed to delete actual used item');
      setIsError(true);
      setShowToast(true);
    } finally {
      setIsLoading(false);
      setShowDeleteAlert(false);
    }
  };

  const handleCreateClick = () => setIsCreateModalOpen(true);
  const handleActualUsedCreated = () => {
    fetchActualUsedItems();
    setToastMessage('Actual Used created successfully!');
    setShowToast(true);
  };

  const handleActualUsedUpdated = () => {
    fetchActualUsedItems();
    setToastMessage('Actual Used updated successfully!');
    setShowToast(true);
    setIsUpdateModalOpen(false);
  };

  const handleBackClick = () => router.push('/menu/home/classification', 'back');

  const iconButtons = [
    { icon: add, onClick: handleCreateClick, disabled: !classificationData, title: "Add Actual Used" },
    { icon: arrowUpCircle, onClick: handleUpdateClick, disabled: !selectedRow, title: "Edit Actual Used" },
    { icon: trash, onClick: handleDeleteClick, disabled: !selectedRow, title: "Delete Actual Used" },
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
            {classificationData ? `Actual Used (${classificationData.classification})` : 'Actual Used Setup'}
          </IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonGrid>
        <IonRow>
          <IonCol size="12" className="search-container">
            <IonSearchbar
              ref={searchRef}
              placeholder="Search actual used items..."
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
              title="Actual Used Items"
              keyField="actual_used_id"
              onRowClick={handleRowClick}
              selectedRow={selectedRow}
            />
          </IonCol>
        </IonRow>
      </IonGrid>

      <IonLoading isOpen={isLoading} message="Loading..." />

      {classificationData && (
        <ActualUsedCreateModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onActualUsedCreated={handleActualUsedCreated}
          class_id={classificationData.class_id}
        />
      )}

      {selectedRow && (
        <ActualUsedUpdateModal
          isOpen={isUpdateModalOpen}
          onClose={() => setIsUpdateModalOpen(false)}
          onActualUsedUpdated={handleActualUsedUpdated}
          actualUsedData={selectedRow}
        />
      )}

      <IonAlert
        isOpen={showDeleteAlert}
        onDidDismiss={() => setShowDeleteAlert(false)}
        header={'Confirm Delete'}
        message={`Are you sure you want to delete the actual used item <strong>${selectedRow?.description}</strong>?`}
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

export default ActualUsed;