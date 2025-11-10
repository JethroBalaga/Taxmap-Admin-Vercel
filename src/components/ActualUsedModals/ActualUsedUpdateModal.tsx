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

interface ActualUsedUpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onActualUsedUpdated?: () => void;
  actualUsedData: {
    actual_used_id: string;
    description: string;
    class_id: string;
  } | null;
}

const ActualUsedUpdateModal: React.FC<ActualUsedUpdateModalProps> = ({
  isOpen,
  onClose,
  onActualUsedUpdated = () => {},
  actualUsedData
}) => {
  const [actual_used_id, setActualUsedId] = useState('');
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [isError, setIsError] = useState(false);

  // Populate form when modal opens or data changes
  useEffect(() => {
    if (actualUsedData) {
      setActualUsedId(actualUsedData.actual_used_id);
      setDescription(actualUsedData.description);
    }
  }, [actualUsedData, isOpen]);

  const handleUpdate = async () => {
    if (!actual_used_id || !actualUsedData) return;

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('actual_usedtbl')
        .update({
          actual_used_id: actual_used_id.toUpperCase(),
          description: description.toUpperCase()
        })
        .eq('actual_used_id', actualUsedData.actual_used_id);

      if (error) throw error;

      setToastMessage('Actual Used updated successfully!');
      onActualUsedUpdated();
      setTimeout(onClose, 1000);
    } catch (error: any) {
      setIsError(true);
      setToastMessage(error.message || 'Failed to update Actual Used');
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
      setShowToast(true);
    }
  };

  const handleActualUsedIdChange = (value: string) => {
    setActualUsedId(value.toUpperCase());
  };

  const handleDescriptionChange = (value: string) => {
    setDescription(value.toUpperCase());
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
            <IonTitle className="modal-title">Update Actual Used</IonTitle>
          </IonToolbar>
        </IonHeader>

        <IonContent className="modal-content">
          <IonGrid className="form-grid">
            <IonRow>
              <IonCol className="form-column">
                <IonItem lines="none" className="district-label-item">
                  <IonLabel className="district-label">Class ID: {actualUsedData?.class_id}</IonLabel>
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
                    onClick={handleUpdate}
                    disabled={!actual_used_id || isLoading}
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

      <IonLoading isOpen={isLoading} message="Updating Actual Used..." />
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

export default ActualUsedUpdateModal;