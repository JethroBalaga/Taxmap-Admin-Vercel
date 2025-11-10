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

interface EquipmentCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEquipmentCreated?: () => void;
}

const EquipmentCreateModal: React.FC<EquipmentCreateModalProps> = ({
  isOpen,
  onClose,
  onEquipmentCreated = () => {}
}) => {
  const [equipment_id, setEquipmentId] = useState('');
  const [machine_type, setMachineType] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [isError, setIsError] = useState(false);

  const handleCreate = async () => {
    if (!equipment_id) return;

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('equipment')
        .insert([{
          equipment_id: equipment_id.toUpperCase(),
          machine_type: machine_type.toUpperCase()
        }]);

      if (error) throw error;

      setToastMessage('Equipment created successfully!');
      setEquipmentId('');
      setMachineType('');
      onEquipmentCreated();
      setTimeout(onClose, 1000);
    } catch (error: any) {
      setIsError(true);
      setToastMessage(error.message || 'Failed to create equipment');
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
      setShowToast(true);
    }
  };

  const handleEquipmentIdChange = (value: string) => {
    setEquipmentId(value.toUpperCase());
  };

  const handleMachineTypeChange = (value: string) => {
    setMachineType(value.toUpperCase());
  };

  const resetForm = () => {
    setEquipmentId('');
    setMachineType('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <>
      <IonModal isOpen={isOpen} onDidDismiss={handleClose} className="classification-modal">
        <IonHeader>
          <IonToolbar className="modal-header">
            <IonTitle className="modal-title">Create Equipment</IonTitle>
          </IonToolbar>
        </IonHeader>

        <IonContent className="modal-content">
          <IonGrid className="form-grid">
            <IonRow>
              <IonCol className="form-column">
                <div className="input-wrapper">
                  <Input
                    label="Equipment ID"
                    value={equipment_id}
                    onChange={handleEquipmentIdChange}
                    placeholder="Enter equipment ID"
                    className="modal-input"
                  />
                </div>

                <div className="input-wrapper">
                  <Input
                    label="Machine Type"
                    value={machine_type}
                    onChange={handleMachineTypeChange}
                    placeholder="Enter machine type"
                    className="modal-input"
                  />
                </div>

                <div className="button-group">
                  <Button
                    variant="secondary"
                    onClick={handleClose}
                    className="cancel-btn"
                    disabled={isLoading}
                  >
                    Cancel
                  </Button>

                  <Button
                    variant="primary"
                    onClick={handleCreate}
                    disabled={!equipment_id || isLoading}
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

      <IonLoading isOpen={isLoading} message="Creating Equipment..." />
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

export default EquipmentCreateModal;