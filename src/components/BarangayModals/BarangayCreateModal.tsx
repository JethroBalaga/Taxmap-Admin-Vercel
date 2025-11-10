import React, { useState } from 'react';
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

interface BarangayCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBarangayCreated?: () => void;
  district_id: number;
}

const BarangayCreateModal: React.FC<BarangayCreateModalProps> = ({
  isOpen,
  onClose,
  onBarangayCreated = () => {},
  district_id
}) => {
  const [barangay_id, setBarangayId] = useState('');
  const [barangay, setBarangay] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [isError, setIsError] = useState(false);

  const handleCreate = async () => {
    if (!barangay_id || !barangay) return;

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('barangaytbl')
        .insert([{
          barangay_id: barangay_id.toUpperCase(), // Ensure uppercase when saving
          barangay: barangay.toUpperCase(), // Ensure uppercase when saving
          district_id
        }]);

      if (error) throw error;

      setToastMessage('Barangay created successfully!');
      setBarangayId('');
      setBarangay('');
      onBarangayCreated();
      setTimeout(onClose, 1000);
    } catch (error: any) {
      setIsError(true);
      setToastMessage(error.message || 'Failed to create barangay');
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
      setShowToast(true);
    }
  };

  const handleBarangayIdChange = (value: string) => {
    setBarangayId(value.toUpperCase()); // Convert to uppercase on change
  };

  const handleBarangayChange = (value: string) => {
    setBarangay(value.toUpperCase()); // Convert to uppercase on change
  };

  return (
    <>
      <IonModal isOpen={isOpen} onDidDismiss={onClose} className="classification-modal">
        <IonHeader>
          <IonToolbar className="modal-header">
            <IonTitle className="modal-title">CREATE BARANGAY</IonTitle>
          </IonToolbar>
        </IonHeader>

        <IonContent className="modal-content">
          <IonGrid className="form-grid">
            <IonRow>
              <IonCol className="form-column">
                <IonItem lines="none" className="district-label-item">
                  <IonLabel className="district-label">DISTRICT ID: {district_id}</IonLabel>
                </IonItem>

                <div className="input-wrapper">
                  <Input
                    label="BARANGAY ID"
                    value={barangay_id}
                    onChange={handleBarangayIdChange}
                    placeholder="ENTER BARANGAY ID"
                    className="modal-input"
                  />
                </div>

                <div className="input-wrapper">
                  <Input
                    label="BARANGAY"
                    value={barangay}
                    onChange={handleBarangayChange}
                    placeholder="ENTER BARANGAY"
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
                    onClick={handleCreate}
                    disabled={!barangay_id || !barangay || isLoading}
                    className="create-btn"
                  >
                    {isLoading ? 'CREATING...' : 'CREATE'}
                  </Button>
                </div>
              </IonCol>
            </IonRow>
          </IonGrid>
        </IonContent>
      </IonModal>

      <IonLoading isOpen={isLoading} message="CREATING BARANGAY..." />
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

export default BarangayCreateModal;