import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
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
import { add, arrowUpCircle, layersOutline, trash, briefcaseOutline, arrowBack } from 'ionicons/icons';
import './../../CSS/Setup.css';
import ClassificationCreateModal from '../../components/ClassificationModals/ClassificationCreateModal';
import ClassificationUpdateModal from '../../components/ClassificationModals/ClassificationUpdateModal';
import DynamicTable from '../../components/Globalcomponents/DynamicTable';
import { supabase } from '../../utils/supaBaseClient';
import { useLocation } from 'react-router-dom';

interface ClassificationItem {
  class_id: string;
  classification: string;
  created_at?: string;
}

const Classification: React.FC = () => {
  const router = useIonRouter();
  const location = useLocation();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [classifications, setClassifications] = useState<ClassificationItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRow, setSelectedRow] = useState<ClassificationItem | null>(null);
  const [selectedClassification, setSelectedClassification] = useState<ClassificationItem | null>(null);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [showCannotDeleteAlert, setShowCannotDeleteAlert] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const searchRef = useRef<HTMLIonSearchbarElement>(null);

  useEffect(() => {
    setSelectedRow(null);
    setSearchTerm('');
  }, [location.pathname]);

  useEffect(() => {
    const timer = setTimeout(() => {
      searchRef.current?.setFocus();
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  const fetchClassifications = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('classtbl')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setClassifications(data || []);
    } catch (error) {
      console.error(error);
      setToastMessage('Failed to load classifications');
      setIsError(true);
      setShowToast(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchClassifications();
  }, [fetchClassifications]);

  const checkIfClassificationIsUsed = async (classId: string) => {
    try {
      const { count } = await supabase
        .from('subclasstbl')
        .select('*', { count: 'exact', head: true })
        .eq('class_id', classId);
      return (count || 0) > 0;
    } catch {
      return true;
    }
  };

  const filteredData = useMemo(() => {
    if (!searchTerm.trim()) return classifications;
    const term = searchTerm.toLowerCase();
    return classifications.filter(item =>
      item.class_id.toLowerCase().includes(term) ||
      item.classification.toLowerCase().includes(term)
    );
  }, [classifications, searchTerm]);

  const handleRowClick = (rowData: ClassificationItem) => setSelectedRow(rowData);
  const handleUpdateClick = () => selectedRow && (setSelectedClassification(selectedRow), setShowUpdateModal(true));
  const handleBackClick = () => router.push('/menu', 'back');

  const handleDeleteClick = async () => {
    if (!selectedRow) return;
    setIsLoading(true);
    try {
      const isUsed = await checkIfClassificationIsUsed(selectedRow.class_id);
      if (isUsed) setShowCannotDeleteAlert(true);
      else setShowDeleteAlert(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedRow) return;
    setIsLoading(true);
    try {
      const { error } = await supabase.from('classtbl').delete().eq('class_id', selectedRow.class_id);
      if (error) throw error;
      await fetchClassifications();
      setSelectedRow(null);
      setToastMessage(`${selectedRow.classification} deleted successfully!`);
      setShowToast(true);
    } catch {
      setToastMessage('Failed to delete classification');
      setIsError(true);
      setShowToast(true);
    } finally {
      setIsLoading(false);
      setShowDeleteAlert(false);
    }
  };

  const navigateToSubclass = () => {
    if (selectedRow) {
      router.push(`/menu/home/subclass?class_id=${selectedRow.class_id}`, 'forward', 'push');
    }
  };

  const navigateToActualUsed = () => {
    if (selectedRow) {
      router.push(`/menu/home/actualused?class_id=${selectedRow.class_id}`, 'forward', 'push');
    }
  };

  const iconButtons = [
    { icon: add, onClick: () => setShowCreateModal(true), disabled: false, title: "Add Classification" },
    { icon: arrowUpCircle, onClick: handleUpdateClick, disabled: !selectedRow, title: "Edit Classification" },
    { icon: trash, onClick: handleDeleteClick, disabled: !selectedRow, title: "Delete Classification" },
    { icon: layersOutline, onClick: navigateToSubclass, disabled: !selectedRow, title: "Manage Subclasses" },
    { icon: briefcaseOutline, onClick: navigateToActualUsed, disabled: !selectedRow, title: "Manage Actual Used" }
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
          <IonTitle>Classification Setup</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonGrid>
        <IonRow>
          <IonCol size="12" className="search-container">
            <IonSearchbar
              ref={searchRef}
              placeholder="Search classifications..."
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
              title="Classifications"
              keyField="class_id"
              onRowClick={handleRowClick}
              selectedRow={selectedRow} 
            />
          </IonCol>
        </IonRow>
      </IonGrid>

      <IonLoading isOpen={isLoading} message="Loading..." />

      <ClassificationCreateModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onClassificationCreated={fetchClassifications}
      />

      <ClassificationUpdateModal
        isOpen={showUpdateModal}
        onClose={() => setShowUpdateModal(false)}
        classificationData={selectedClassification}
        onClassificationUpdated={fetchClassifications}
      />

      <IonAlert
        isOpen={showDeleteAlert}
        onDidDismiss={() => setShowDeleteAlert(false)}
        header={'Confirm Delete'}
        message={`Are you sure you want to delete <strong>${selectedRow?.classification}</strong>?`}
        buttons={[
          { text: 'Cancel', role: 'cancel', cssClass: 'secondary' },
          { text: 'Delete', handler: handleDeleteConfirm }
        ]}
      />

      <IonAlert
        isOpen={showCannotDeleteAlert}
        onDidDismiss={() => setShowCannotDeleteAlert(false)}
        header={'Cannot Delete'}
        message={`The classification <strong>${selectedRow?.classification}</strong> cannot be deleted because it has associated subclasses.`}
        buttons={['OK']}
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

export default Classification;