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
  IonIcon
} from '@ionic/react';
import { warning } from 'ionicons/icons';
import Input from '../Globalcomponents/Input';
import './../../CSS/Modal.css';
import Button from '../Globalcomponents/Button';
import { supabase } from './../../utils/supaBaseClient';

interface ClassificationUpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  classificationData: { class_id: string; classification: string } | null;
  onClassificationUpdated?: () => void;
}

const ClassificationUpdateModal: React.FC<ClassificationUpdateModalProps> = ({
  isOpen,
  onClose,
  classificationData,
  onClassificationUpdated = () => {}
}) => {
  const [code, setCode] = useState('');
  const [classification, setClassification] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const [isFormValid, setIsFormValid] = useState(false);

  // Check form validity whenever inputs change
  useEffect(() => {
    setIsFormValid(code.trim() !== '' && classification.trim() !== '');
  }, [code, classification]);

  useEffect(() => {
    if (classificationData) {
      setCode(classificationData.class_id);
      setClassification(classificationData.classification);
      setIsFormValid(true); // Set to true initially since we're populating with valid data
    }
  }, [classificationData]);

  const handleUpdate = async () => {
    if (!isFormValid || !classificationData) return;

    setIsLoading(true);

    try {
      if (code !== classificationData.class_id) {
        const { count } = await supabase
          .from('classtbl')
          .select('*', { count: 'exact', head: true })
          .eq('class_id', code.toUpperCase()); // Convert to uppercase for comparison

        if (count && count > 0) {
          throw new Error('THIS ID ALREADY EXISTS!');
        }
      }

      const { error } = await supabase
        .from('classtbl')
        .update({ 
          class_id: code.toUpperCase(), // Convert to uppercase
          classification: classification.toUpperCase() // Convert to uppercase
        })
        .eq('class_id', classificationData.class_id);

      if (error) throw error;

      setToastMessage('CLASSIFICATION UPDATED SUCCESSFULLY!');
      onClassificationUpdated();
      setTimeout(onClose, 1000);
    } catch (error: any) {
      setToastMessage(error.message || 'FAILED TO UPDATE CLASSIFICATION');
      setIsError(true);
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

  const isChangingId = code !== (classificationData?.class_id || '');

  return (
    <>
      <IonModal
        isOpen={isOpen}
        onDidDismiss={onClose}
        className="classification-modal"
      >
        <IonHeader>
          <IonToolbar className="modal-header">
            <IonTitle className="modal-title">UPDATE CLASSIFICATION</IonTitle>
          </IonToolbar>
        </IonHeader>

        <IonContent className="modal-content">
          <IonGrid className="form-grid">
            <IonRow>
              <IonCol className="form-column">
                {isChangingId && (
                  <div className="id-change-notice">
                    <IonIcon icon={warning} className="warning-icon" />
                    <span>CHANGING ID WILL UPDATE ALL RELATED RECORDS</span>
                  </div>
                )}

                <div className="input-wrapper">
                  <Input
                    label="CODE"
                    value={code}
                    onChange={handleCodeChange}
                    placeholder="ENTER CLASSIFICATION CODE"
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
                    onClick={handleUpdate}
                    disabled={!isFormValid || isLoading}
                    className="create-btn"
                  >
                    {isLoading ? 'UPDATING...' : 'UPDATE'}
                  </Button>
                </div>
              </IonCol>
            </IonRow>
          </IonGrid>
        </IonContent>
      </IonModal>

      <IonLoading isOpen={isLoading} message="UPDATING CLASSIFICATION..." />

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

export default ClassificationUpdateModal;