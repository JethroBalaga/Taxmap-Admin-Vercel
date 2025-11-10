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
  IonItem
} from '@ionic/react';
import Input from '../Globalcomponents/Input';
import './../../CSS/Modal.css';
import Button from '../Globalcomponents/Button';
import { supabase } from './../../utils/supaBaseClient';

interface BarangayUpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  barangayData: { 
    barangay_id: string;
    barangay_name: string;
    district_id: number;
  } | null;
  onBarangayUpdated?: () => void;
}

const BarangayUpdateModal: React.FC<BarangayUpdateModalProps> = ({
  isOpen,
  onClose,
  barangayData,
  onBarangayUpdated = () => {}
}) => {
  const [barangayId, setBarangayId] = useState('');
  const [barangayName, setBarangayName] = useState('');
  const [districtId, setDistrictId] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const [isFormValid, setIsFormValid] = useState(false);

  // Initialize form with barangayData
  useEffect(() => {
    if (barangayData) {
      setBarangayId(barangayData.barangay_id);
      setBarangayName(barangayData.barangay_name);
      setDistrictId(barangayData.district_id);
      setIsFormValid(true);
    }
  }, [barangayData]);

  const handleUpdate = async () => {
    if (!isFormValid || !barangayData) return;

    setIsLoading(true);

    try {
      const { error } = await supabase
        .from('barangaytbl')
        .update({ 
          barangay_id: barangayId.toUpperCase(), // Convert to uppercase
          barangay: barangayName.toUpperCase(),  // Convert to uppercase
          district_id: districtId
        })
        .eq('barangay_id', barangayData.barangay_id);

      if (error) throw error;

      setToastMessage('BARANGAY UPDATED SUCCESSFULLY!');
      onBarangayUpdated();
      setTimeout(onClose, 1000);
    } catch (error: any) {
      setToastMessage(error.message || 'FAILED TO UPDATE BARANGAY');
      setIsError(true);
    } finally {
      setIsLoading(false);
      setShowToast(true);
    }
  };

  const handleBarangayIdChange = (value: string) => {
    setBarangayId(value.toUpperCase()); // Convert to uppercase
  };

  const handleBarangayNameChange = (value: string) => {
    setBarangayName(value.toUpperCase()); // Convert to uppercase
  };

  return (
    <>
      <IonModal isOpen={isOpen} onDidDismiss={onClose} className="classification-modal">
        <IonHeader>
          <IonToolbar className="modal-header">
            <IonTitle className="modal-title">UPDATE BARANGAY</IonTitle>
          </IonToolbar>
        </IonHeader>

        <IonContent className="modal-content">
          <IonGrid className="form-grid">
            <IonRow>
              <IonCol className="form-column">
                <IonItem lines="none" className="district-label-item">
                  <IonLabel className="district-label">DISTRICT ID: {districtId}</IonLabel>
                </IonItem>

                <div className="input-wrapper">
                  <Input
                    label="BARANGAY ID"
                    value={barangayId}
                    onChange={handleBarangayIdChange}
                    placeholder="ENTER BARANGAY ID"
                    className="modal-input"
                  />
                </div>

                <div className="input-wrapper">
                  <Input
                    label="BARANGAY NAME"
                    value={barangayName}
                    onChange={handleBarangayNameChange}
                    placeholder="ENTER BARANGAY NAME"
                    className="modal-input"
                  />
                </div>

                <div className="button-group">
                  <Button
                    variant="secondary"
                    onClick={onClose}
                    className="cancel-btn"
                    disabled={isLoading}
                  >
                    CANCEL
                  </Button>

                  <Button
                    variant="primary"
                    onClick={handleUpdate}
                    disabled={!isFormValid || isLoading}
                    className="update-btn"
                  >
                    {isLoading ? 'UPDATING...' : 'UPDATE'}
                  </Button>
                </div>
              </IonCol>
            </IonRow>
          </IonGrid>
        </IonContent>
      </IonModal>

      <IonLoading isOpen={isLoading} message="UPDATING BARANGAY..." />
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

export default BarangayUpdateModal;