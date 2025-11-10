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

interface SubclassUpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  subclassData: {
    subclass_id: string;
    subclass: string;
    class_id: string;
    barangay_id: string | null;
  } | null;
  onSubclassUpdated?: () => void;
}

interface BarangayItem {
  barangay_id: string;
  barangay: string;
}

const SubclassUpdateModal: React.FC<SubclassUpdateModalProps> = ({
  isOpen,
  onClose,
  subclassData,
  onSubclassUpdated = () => {}
}) => {
  const [subclassId, setSubclassId] = useState('');
  const [subclassName, setSubclassName] = useState('');
  const [selectedBarangay, setSelectedBarangay] = useState<string | null>(null);
  const [barangays, setBarangays] = useState<BarangayItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [isError, setIsError] = useState(false);

  // Fetch barangays and initialize form with subclassData
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
      
      if (subclassData) {
        setSubclassId(subclassData.subclass_id);
        setSubclassName(subclassData.subclass);
        setSelectedBarangay(subclassData.barangay_id);
      }
    }
  }, [isOpen, subclassData]);

  const handleUpdate = async () => {
    if (!subclassData) return;

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('subclasstbl')
        .update({ 
          subclass_id: subclassId.toUpperCase(), // Convert to uppercase
          subclass: subclassName.toUpperCase(), // Convert to uppercase
          barangay_id: selectedBarangay
        })
        .eq('subclass_id', subclassData.subclass_id);

      if (error) throw error;

      setToastMessage('Subclass updated successfully!');
      onSubclassUpdated();
      setTimeout(onClose, 1000);
    } catch (error: any) {
      setIsError(true);
      setToastMessage(error.message || 'Failed to update subclass');
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
      setShowToast(true);
    }
  };

  const handleSubclassIdChange = (value: string) => {
    setSubclassId(value.toUpperCase()); // Convert to uppercase
  };

  const handleSubclassNameChange = (value: string) => {
    setSubclassName(value.toUpperCase()); // Convert to uppercase
  };

  return (
    <>
      <IonModal isOpen={isOpen} onDidDismiss={onClose} className="classification-modal">
        <IonHeader>
          <IonToolbar className="modal-header">
            <IonTitle className="modal-title">Update Subclass</IonTitle>
          </IonToolbar>
        </IonHeader>

        <IonContent className="modal-content">
          <IonGrid className="form-grid">
            <IonRow>
              <IonCol className="form-column">
                <IonItem lines="none" className="district-label-item">
                  <IonLabel className="district-label">Class ID: {subclassData?.class_id}</IonLabel>
                </IonItem>

                <div className="input-wrapper">
                  <Input
                    label="Subclass ID"
                    value={subclassId}
                    onChange={handleSubclassIdChange}
                    placeholder="Enter subclass ID"
                    className="modal-input"
                  />
                </div>

                <div className="input-wrapper">
                  <Input
                    label="Subclass Name"
                    value={subclassName}
                    onChange={handleSubclassNameChange}
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
                    onClick={handleUpdate}
                    disabled={!subclassId || !subclassName || isLoading}
                    className="update-btn"
                  >
                    {isLoading ? 'Updating...' : 'Update'}
                  </Button>
                </div>
              </IonCol>
            </IonRow>
          </IonGrid>
        </IonContent>
      </IonModal>

      <IonLoading isOpen={isLoading} message="Updating subclass..." />
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

export default SubclassUpdateModal;