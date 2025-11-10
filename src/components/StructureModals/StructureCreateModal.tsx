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

interface StructureCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStructureCreated?: () => void;
}

const StructureCreateModal: React.FC<StructureCreateModalProps> = ({
  isOpen,
  onClose,
  onStructureCreated = () => {}
}) => {
  const [structureCode, setStructureCode] = useState('');
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [isError, setIsError] = useState(false);

  // Get current date in MM/DD/YYYY format
  const getCurrentDate = () => {
    const today = new Date();
    const month = today.getMonth() + 1; // Months are 0-indexed
    const day = today.getDate();
    const year = today.getFullYear();
    return `${month}/${day}/${year}`;
  };

  const handleCreate = async () => {
    if (!structureCode || !description) return;

    setIsLoading(true);
    try {
      const effectiveDate = getCurrentDate();
      
      const { error } = await supabase
        .from('structure_typetbl')
        .insert([{
          structure_code: structureCode.toUpperCase(),
          description: description.toUpperCase(),
          eff_date: effectiveDate
        }]);

      if (error) throw error;

      setToastMessage('Structure type created successfully!');
      setStructureCode('');
      setDescription('');
      onStructureCreated();
      setTimeout(onClose, 1000);
    } catch (error: any) {
      setToastMessage(error.message || 'Failed to create structure type');
      setIsError(true);
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
      setShowToast(true);
    }
  };

  const handleStructureCodeChange = (value: string) => {
    setStructureCode(value);
  };

  const handleDescriptionChange = (value: string) => {
    setDescription(value);
  };

  return (
    <>
      <IonModal isOpen={isOpen} onDidDismiss={onClose} className="classification-modal">
        <IonHeader>
          <IonToolbar className="modal-header">
            <IonTitle className="modal-title">CREATE STRUCTURE TYPE</IonTitle>
          </IonToolbar>
        </IonHeader>

        <IonContent className="modal-content">
          <IonGrid className="form-grid">
            <IonRow>
              <IonCol className="form-column">
                {/* Effective Date Label */}
                <IonItem lines="none" className="district-label-item">
                  <IonLabel className="district-label">EFFECTIVE DATE: {getCurrentDate()}</IonLabel>
                </IonItem>

                {/* Structure Code Input */}
                <div className="input-wrapper">
                  <Input
                    label="STRUCTURE CODE"
                    value={structureCode}
                    onChange={handleStructureCodeChange}
                    placeholder="ENTER STRUCTURE CODE"
                    className="modal-input"
                  />
                </div>

                {/* Description Input */}
                <div className="input-wrapper">
                  <Input
                    label="DESCRIPTION"
                    value={description}
                    onChange={handleDescriptionChange}
                    placeholder="ENTER DESCRIPTION"
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
                    disabled={!structureCode || !description || isLoading}
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

      <IonLoading isOpen={isLoading} message="CREATING STRUCTURE TYPE..." />
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

export default StructureCreateModal;