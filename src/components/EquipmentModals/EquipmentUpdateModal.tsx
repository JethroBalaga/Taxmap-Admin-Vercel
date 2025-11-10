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
} from '@ionic/react';
import Input from '../Globalcomponents/Input';
import './../../CSS/Modal.css';
import Button from '../Globalcomponents/Button';
import { supabase } from './../../utils/supaBaseClient';

interface EquipmentUpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEquipmentUpdated?: () => void;
  equipmentData: {
    equipment_id: string;
    machine_type: string;
  } | null;
}

const EquipmentUpdateModal: React.FC<EquipmentUpdateModalProps> = ({
  isOpen,
  onClose,
  onEquipmentUpdated = () => {},
  equipmentData
}) => {
  const [equipment_id, setEquipmentId] = useState('');
  const [machine_type, setMachineType] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [isError, setIsError] = useState(false);

  // Populate form when modal opens or data changes
  useEffect(() => {
    if (equipmentData) {
      setEquipmentId(equipmentData.equipment_id);
      setMachineType(equipmentData.machine_type || '');
    }
  }, [equipmentData, isOpen]);

  const handleUpdate = async () => {
    if (!equipment_id || !equipmentData) return;

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('equipment')
        .update({
          equipment_id: equipment_id.toUpperCase(),
          machine_type: machine_type.toUpperCase()
        })
        .eq('equipment_id', equipmentData.equipment_id);

      if (error) throw error;

      setToastMessage('Equipment updated successfully!');
      onEquipmentUpdated();
      setTimeout(onClose, 1000);
    } catch (error: any) {
      setIsError(true);
      setToastMessage(error.message || 'Failed to update equipment');
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
            <IonTitle className="modal-title">Update Equipment</IonTitle>
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
                    onClick={handleUpdate}
                    disabled={!equipment_id || isLoading}
                    className="create-btn"
                  >
                    {isLoading ? 'Updating...' : 'Update'}
                  </Button>
                </div>
              </IonCol>
            </IonRow>
          </IonGrid>
        </IonContent>
      </IonModal>

      <IonLoading isOpen={isLoading} message="Updating Equipment..." />
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

export default EquipmentUpdateModal;