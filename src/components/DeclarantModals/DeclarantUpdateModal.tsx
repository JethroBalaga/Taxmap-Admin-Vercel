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
  IonToast
} from '@ionic/react';
import Input from '../Globalcomponents/Input';
import './../../CSS/Modal.css';
import Button from '../Globalcomponents/Button';
import { supabase } from './../../utils/supaBaseClient';

interface FormItem {
  form_id: string;
  declarant: string;
  created_at?: string;
  status?: string;
  class_id?: string;
}

interface DeclarantUpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDeclarantUpdated?: () => void;
  selectedForm: FormItem | null; // Changed from selectedDeclarant to selectedForm
}

const DeclarantUpdateModal: React.FC<DeclarantUpdateModalProps> = ({
  isOpen,
  onClose,
  onDeclarantUpdated = () => {},
  selectedForm, // Changed from selectedDeclarant
}) => {
  const [declarant, setDeclarant] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [isError, setIsError] = useState(false);

  // Populate form field when selectedForm changes
  useEffect(() => {
    if (selectedForm) {
      setDeclarant(selectedForm.declarant);
    }
  }, [selectedForm]);

  const handleUpdate = async () => {
    if (!declarant || !selectedForm) return;

    setIsLoading(true);
    
    try {
      // Update only the declarant field in formtbl
      const { error } = await supabase
        .from('formtbl')
        .update({ 
          declarant: declarant.toUpperCase()
        })
        .eq('form_id', selectedForm.form_id);

      if (error) throw error;

      setToastMessage('DECLARANT UPDATED SUCCESSFULLY!');
      onDeclarantUpdated();
      setTimeout(onClose, 1000);
    } catch (error: any) {
      const errorMessage = error.message || 'FAILED TO UPDATE DECLARANT';
      setToastMessage(errorMessage);
      setIsError(true);
      console.error('Error updating declarant:', error);
    } finally {
      setIsLoading(false);
      setShowToast(true);
    }
  };

  const handleDeclarantChange = (value: string) => {
    setDeclarant(value.toUpperCase());
  };

  const handleClose = () => {
    // Reset form field when closing
    if (selectedForm) {
      setDeclarant(selectedForm.declarant);
    }
    onClose();
  };

  return (
    <>
      <IonModal
        isOpen={isOpen}
        onDidDismiss={handleClose}
        className="classification-modal"
      >
        <IonHeader>
          <IonToolbar className="modal-header">
            <IonTitle className="modal-title">UPDATE DECLARANT</IonTitle>
          </IonToolbar>
        </IonHeader>

        <IonContent className="modal-content">
          <IonGrid className="form-grid">
            <IonRow>
              <IonCol className="form-column">
                <div className="input-wrapper">
                  <Input
                    label="DECLARANT NAME"
                    value={declarant}
                    onChange={handleDeclarantChange}
                    placeholder="ENTER DECLARANT NAME"
                    className="modal-input"
                  />
                </div>

                {selectedForm && (
                  <div className="selected-item-info">
                    <p>Current Declarant: {selectedForm.declarant}</p>
                    <p>Form ID: {selectedForm.form_id}</p>
                    {selectedForm.status && <p>Status: {selectedForm.status}</p>}
                    {selectedForm.class_id && <p>Class: {selectedForm.class_id}</p>}
                  </div>
                )}

                <div className="button-group">
                  <Button
                    variant="secondary"
                    onClick={handleClose}
                    className="cancel-btn"
                    disabled={isLoading}
                  >
                    CANCEL
                  </Button>
                  
                  <Button 
                    variant="primary"
                    onClick={handleUpdate}
                    disabled={!declarant || isLoading || 
                             (declarant === selectedForm?.declarant)}
                    className="update-btn"
                  >
                    {isLoading ? 'UPDATING...' : 'UPDATE DECLARANT'}
                  </Button>
                </div>
              </IonCol>
            </IonRow>
          </IonGrid>
        </IonContent>
      </IonModal>

      <IonLoading isOpen={isLoading} message="UPDATING DECLARANT..." />
      
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

export default DeclarantUpdateModal;