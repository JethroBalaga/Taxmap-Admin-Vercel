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

interface ActualUsedCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onActualUsedCreated?: () => void;
  class_id: string;
}

const ActualUsedCreateModal: React.FC<ActualUsedCreateModalProps> = ({
  isOpen,
  onClose,
  onActualUsedCreated = () => {},
  class_id
}) => {
  const [actual_used_id, setActualUsedId] = useState('');
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [isError, setIsError] = useState(false);

  const handleCreate = async () => {
    if (!actual_used_id) return;

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('actual_usedtbl') // Replace with your actual table name
        .insert([{
          actual_used_id: actual_used_id.toUpperCase(), // Convert to uppercase
          description: description.toUpperCase(), // Convert to uppercase
          class_id: class_id.toUpperCase() // Convert to uppercase
        }]);

      if (error) throw error;

      setToastMessage('Actual Used created successfully!');
      setActualUsedId('');
      setDescription('');
      onActualUsedCreated();
      setTimeout(onClose, 1000);
    } catch (error: any) {
      setIsError(true);
      setToastMessage(error.message || 'Failed to create Actual Used');
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
      setShowToast(true);
    }
  };

  const handleActualUsedIdChange = (value: string) => {
    setActualUsedId(value.toUpperCase()); // Convert to uppercase
  };

  const handleDescriptionChange = (value: string) => {
    setDescription(value.toUpperCase()); // Convert to uppercase
  };

  const resetForm = () => {
    setActualUsedId('');
    setDescription('');
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
            <IonTitle className="modal-title">Create Actual Used</IonTitle>
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
                    label="Actual Used ID"
                    value={actual_used_id}
                    onChange={handleActualUsedIdChange}
                    placeholder="Enter actual used ID"
                    className="modal-input"
                  />
                </div>

                <div className="input-wrapper">
                  <Input
                    label="Description"
                    value={description}
                    onChange={handleDescriptionChange}
                    placeholder="Enter description"
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
                    disabled={!actual_used_id || isLoading}
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

      <IonLoading isOpen={isLoading} message="Creating Actual Used..." />
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

export default ActualUsedCreateModal;