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
  IonToast
} from '@ionic/react';
import Input from '../Globalcomponents/Input';
import './../../CSS/Modal.css';
import Button from '../Globalcomponents/Button';
import { supabase } from './../../utils/supaBaseClient';

interface ClassificationCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onClassificationCreated?: () => void; // Made optional
}

const ClassificationCreateModal: React.FC<ClassificationCreateModalProps> = ({
  isOpen,
  onClose,
  onClassificationCreated = () => {}, // Default empty function
}) => {
  const [code, setCode] = useState('');
  const [classification, setClassification] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [isError, setIsError] = useState(false);

  const handleCreate = async () => {
    if (!code || !classification) return;

    setIsLoading(true);
    
    try {
      // Check if classification code already exists
      const { data: existingData, error: existingError } = await supabase
        .from('classtbl')
        .select('class_id')
        .eq('class_id', code.toUpperCase()) // Convert to uppercase for comparison
        .maybeSingle();

      if (existingData) {
        throw new Error('CLASSIFICATION CODE ALREADY EXISTS');
      }

      // Insert new classification
      const { data, error } = await supabase
        .from('classtbl')
        .insert([{ 
          class_id: code.toUpperCase(), // Convert to uppercase
          classification: classification.toUpperCase() // Convert to uppercase
        }])
        .select();

      if (error) throw error;

      setToastMessage('CLASSIFICATION CREATED SUCCESSFULLY!');
      setCode('');
      setClassification('');
      onClassificationCreated(); // Safe to call now
      setTimeout(onClose, 1000);
    } catch (error: any) {
      const errorMessage = error.message || 'FAILED TO CREATE CLASSIFICATION';
      setToastMessage(errorMessage);
      setIsError(true);
      console.error('Error creating classification:', error);
    } finally {
      setIsLoading(false);
      setShowToast(true);
    }
  };

  const handleCodeChange = (value: string) => {
    setCode(value.toUpperCase()); // Convert to uppercase
  };

  const handleClassificationChange = (value: string) => {
    setClassification(value.toUpperCase()); // Convert to uppercase
  };

  return (
    <>
      <IonModal
        isOpen={isOpen}
        onDidDismiss={onClose}
        className="classification-modal"
      >
        <IonHeader>
          <IonToolbar className="modal-header">
            <IonTitle className="modal-title">CREATE NEW CLASSIFICATION</IonTitle>
          </IonToolbar>
        </IonHeader>

        <IonContent className="modal-content">
          <IonGrid className="form-grid">
            <IonRow>
              <IonCol className="form-column">
                <div className="input-wrapper">
                  <Input
                    label="CODE"
                    value={code}
                    onChange={handleCodeChange}
                    placeholder="ENTER CLASSIFICATION CODE (E.G., R, I)"
                    className="modal-input"
                  />
                </div>
                
                <div className="input-wrapper">
                  <Input
                    label="CLASSIFICATION"
                    value={classification}
                    onChange={handleClassificationChange}
                    placeholder="ENTER CLASSIFICATION NAME"
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
                    disabled={!code || !classification || isLoading}
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

      <IonLoading isOpen={isLoading} message="CREATING CLASSIFICATION..." />
      
      <IonToast
        isOpen={showToast}
        onDidDismiss={() => setShowToast(false)}
        message={toastMessage}
        duration={3000}
        color={isError ? 'danger' : 'success'} // Fixed color from 'green' to 'danger' for errors
      />
    </>
  );
};

export default ClassificationCreateModal;