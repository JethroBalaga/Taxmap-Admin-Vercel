import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
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
  IonLoading,
  IonToast,
  IonAlert,
  IonButtons,
  IonButton,
  useIonRouter
} from '@ionic/react';
import { add, arrowUpCircle, cashOutline, trash, arrowBack } from 'ionicons/icons';
import './../../CSS/Setup.css';
import SubclassCreateModal from '../../components/SubclassModals/SubclassCreateModal';
import SubclassUpdateModal from '../../components/SubclassModals/SubclassUpdateModal';
import DynamicTable from '../../components/Globalcomponents/DynamicTable';
import { supabase } from '../../utils/supaBaseClient';

interface SubclassItem {
  subclass_id: string;
  subclass: string;
  class_id: string;
  barangay_id: string | null;
  created_at: string;
}

const Subclass: React.FC = () => {
  const location = useLocation();
  const router = useIonRouter();
  const [classId, setClassId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [subclasses, setSubclasses] = useState<SubclassItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedRow, setSelectedRow] = useState<SubclassItem | null>(null);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [isError, setIsError] = useState(false);

  // Reset state when URL changes (including tab navigation)
  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const id = queryParams.get('class_id');
    setClassId(id);
    setSelectedRow(null);
    setSearchTerm('');
  }, [location.search]);

  // Fetch subclasses
  const fetchSubclasses = useCallback(async () => {
    if (!classId) return;
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('subclasstbl')
        .select('subclass_id, class_id, barangay_id, subclass, created_at')
        .eq('class_id', classId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setSubclasses(data || []);
    } catch (error) {
      console.error(error);
      setToastMessage('Failed to load subclasses');
      setIsError(true);
      setShowToast(true);
    } finally {
      setIsLoading(false);
    }
  }, [classId]);

  useEffect(() => {
    if (classId) fetchSubclasses();
  }, [classId, fetchSubclasses]);

  // Filtered data
  const filteredData = useMemo(() => {
    if (!searchTerm.trim()) return subclasses;
    const term = searchTerm.toLowerCase();
    return subclasses.filter(item =>
      item.subclass_id.toLowerCase().includes(term) ||
      item.subclass.toLowerCase().includes(term)
    );
  }, [subclasses, searchTerm]);

  const handleRowClick = (row: SubclassItem) => setSelectedRow(row);

  const handleUpdateClick = () => selectedRow && setIsUpdateModalOpen(true);
  const handleDeleteClick = () => selectedRow && setShowDeleteAlert(true);
  const handleDeleteConfirm = async () => {
    if (!selectedRow) return;
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('subclasstbl')
        .delete()
        .eq('subclass_id', selectedRow.subclass_id);
      if (error) throw error;
      await fetchSubclasses();
      setSelectedRow(null);
      setToastMessage('Subclass deleted successfully!');
      setShowToast(true);
    } catch (error) {
      console.error(error);
      setToastMessage('Failed to delete subclass');
      setIsError(true);
      setShowToast(true);
    } finally {
      setIsLoading(false);
      setShowDeleteAlert(false);
    }
  };

  const handleSubclassCreated = () => {
    fetchSubclasses();
    setToastMessage('Subclass created successfully!');
    setShowToast(true);
  };

  const handleSubclassUpdated = () => {
    fetchSubclasses();
    setToastMessage('Subclass updated successfully!');
    setShowToast(true);
    setIsUpdateModalOpen(false);
  };

  const handleRate = () => {
    if (selectedRow)
      router.push(`/menu/home/subclassrate?subclass_id=${selectedRow.subclass_id}&class_id=${classId}`, 'forward', 'push');
  };

  const handleBackClick = () => router.push('/menu/home/classification', 'back');

  const iconButtons = [
    { icon: add, onClick: () => setIsCreateModalOpen(true), disabled: !classId, title: "Add Subclass" },
    { icon: arrowUpCircle, onClick: handleUpdateClick, disabled: !selectedRow, title: "Edit Subclass" },
    { icon: trash, onClick: handleDeleteClick, disabled: !selectedRow, title: "Delete Subclass" },
    { icon: cashOutline, onClick: handleRate, disabled: !selectedRow, title: "View Rates" }
  ];

  return (
    <IonContent fullscreen>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonButton onClick={handleBackClick}><IonIcon icon={arrowBack} /></IonButton>
          </IonButtons>
          <IonTitle>{classId ? `Subclasses (Class ID: ${classId})` : 'Subclasses'}</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonGrid>
        <IonRow>
          <IonCol size="12" className="search-container">
            <IonSearchbar
              placeholder="Search subclasses..."
              value={searchTerm}
              onIonInput={(e) => setSearchTerm(e.detail.value || '')}
              debounce={0}
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
              title="Subclasses"
              keyField="subclass_id"
              onRowClick={handleRowClick}
              selectedRow={selectedRow}
            />
          </IonCol>
        </IonRow>
      </IonGrid>

      <IonLoading isOpen={isLoading} message="Loading..." />

      {classId && (
        <>
          <SubclassCreateModal
            isOpen={isCreateModalOpen}
            onClose={() => setIsCreateModalOpen(false)}
            onSubclassCreated={handleSubclassCreated}
            class_id={classId}
          />
          <SubclassUpdateModal
            isOpen={isUpdateModalOpen}
            onClose={() => setIsUpdateModalOpen(false)}
            subclassData={selectedRow}
            onSubclassUpdated={handleSubclassUpdated}
          />
        </>
      )}

      <IonAlert
        isOpen={showDeleteAlert}
        onDidDismiss={() => setShowDeleteAlert(false)}
        header={'Confirm Delete'}
        message={`Are you sure you want to delete the subclass <strong>${selectedRow?.subclass}</strong>?`}
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

export default Subclass;