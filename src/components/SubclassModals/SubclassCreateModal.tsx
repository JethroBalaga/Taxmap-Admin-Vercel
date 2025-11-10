import React, { useState, useEffect } from 'react';
import {
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonGrid,
  IonRow,
  IonCol,
  IonLoading,
  IonToast,
  IonLabel,
  IonItem,
  IonSelect,
  IonSelectOption
} from '@ionic/react';
import Input from '../Globalcomponents/Input';
import './../../CSS/Modal.css';
import Button from '../Globalcomponents/Button';
import { supabase } from './../../utils/supaBaseClient';

interface SubclassCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubclassCreated?: () => void;
  class_id: string;
}

interface BarangayItem {
  barangay_id: string;
  barangay: string;
}

const SubclassCreateModal: React.FC<SubclassCreateModalProps> = ({
  isOpen,
  onClose,
  onSubclassCreated = () => {},
  class_id
}) => {
  const [subclass_id, setSubclassId] = useState('');
  const [subclass, setSubclass] = useState('');
  const [selectedBarangay, setSelectedBarangay] = useState<string | null>(null);
  const [barangays, setBarangays] = useState<BarangayItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [isError, setIsError] = useState(false);

  // Fetch barangays for dropdown
  useEffect(() => {
    const fetchBarangays = async () => {
      try {
        const { data, error } = await supabase
          .from('barangaytbl')
          .select('barangay_id, barangay')
          .order('barangay', { ascending: true });

        if (error) throw error;
        setBarangays(data || []);
      } catch (error) {
        console.error('Error fetching barangays:', error);
      }
    };

    if (isOpen) {
      fetchBarangays();
    }
  }, [isOpen]);

  const handleCreate = async () => {
    if (!subclass_id || !subclass) return;

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('subclasstbl')
        .insert([{
          subclass_id: subclass_id.toUpperCase(), // Convert to uppercase
          subclass: subclass.toUpperCase(), // Convert to uppercase
          class_id: class_id.toUpperCase(), // Convert to uppercase
          barangay_id: selectedBarangay
        }]);

      if (error) throw error;

      setToastMessage('Subclass created successfully!');
      setSubclassId('');
      setSubclass('');
      setSelectedBarangay(null);
      onSubclassCreated();
      setTimeout(onClose, 1000);
    } catch (error: any) {
      setIsError(true);
      setToastMessage(error.message || 'Failed to create subclass');
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
      setShowToast(true);
    }
  };

  const handleSubclassIdChange = (value: string) => {
    setSubclassId(value.toUpperCase()); // Convert to uppercase
  };

  const handleSubclassChange = (value: string) => {
    setSubclass(value.toUpperCase()); // Convert to uppercase
  };

  return (
    <>
      <IonModal isOpen={isOpen} onDidDismiss={onClose} className="classification-modal">
        <IonHeader>
          <IonToolbar className="modal-header">
            <IonTitle className="modal-title">Create Subclass</IonTitle>
          </IonToolbar>
        </IonHeader>

        <IonContent className="modal-content">
          <IonGrid className="form-grid">
            <IonRow>
              <IonCol className="form-column">
                <IonItem lines="none" className="district-label-item">
                  <IonLabel className="district-label">Class ID: {class_id}</IonLabel>
                </IonItem>

                <div className="input-wrapper">
                  <Input
                    label="Subclass ID"
                    value={subclass_id}
                    onChange={handleSubclassIdChange}
                    placeholder="Enter subclass ID"
                    className="modal-input"
                  />
                </div>

                <div className="input-wrapper">
                  <Input
                    label="Subclass Name"
                    value={subclass}
                    onChange={handleSubclassChange}
                    placeholder="Enter subclass name"
                    className="modal-input"
                  />
                </div>

                <div className="input-wrapper">
                  <IonItem>
                    <IonLabel>Barangay (Optional)</IonLabel>
                    <IonSelect
                      value={selectedBarangay}
                      placeholder="Select Barangay"
                      onIonChange={(e) => setSelectedBarangay(e.detail.value)}
                      interface="action-sheet"
                    >
                      <IonSelectOption value={null}>None</IonSelectOption>
                      {barangays.map((barangay) => (
                        <IonSelectOption 
                          key={barangay.barangay_id} 
                          value={barangay.barangay_id}
                        >
                          {barangay.barangay}
                        </IonSelectOption>
                      ))}
                    </IonSelect>
                  </IonItem>
                </div>

                <div className="button-group">
                  <Button
                    variant="secondary"
                    onClick={onClose}
                    className="cancel-btn"
                    disabled={isLoading}
                  >
                    Cancel
                  </Button>

                  <Button
                    variant="primary"
                    onClick={handleCreate}
                    disabled={!subclass_id || !subclass || isLoading}
                    className="create-btn"
                  >
                    {isLoading ? 'Creating...' : 'Create'}
                  </Button>
                </div>
              </IonCol>
            </IonRow>
          </IonGrid>
        </IonContent>
      </IonModal>

      <IonLoading isOpen={isLoading} message="Creating subclass..." />
      <IonToast
        isOpen={showToast}
        onDidDismiss={() => setShowToast(false)}
        message={toastMessage}
        duration={3000}
        color={isError ? 'danger' : 'success'}
      />
    </>
  );
};

export default SubclassCreateModal;