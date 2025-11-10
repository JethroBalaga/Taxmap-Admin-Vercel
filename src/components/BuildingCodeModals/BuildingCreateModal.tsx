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

interface BuildingCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBuildingCodeCreated?: () => void;
  structure_code: string;
}

const BuildingCreateModal: React.FC<BuildingCreateModalProps> = ({
  isOpen,
  onClose,
  onBuildingCodeCreated = () => {},
  structure_code
}) => {
  const [building_code, setBuildingCode] = useState('');
  const [description, setDescription] = useState('');
  const [rate, setRate] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [isError, setIsError] = useState(false);

  const handleCreate = async () => {
    if (!building_code || !description || !rate) return;

    setIsLoading(true);
    try {
      // Convert rate to number
      const rateValue = parseFloat(rate);
      
      const { error } = await supabase
        .from('building_codetbl')
        .insert([{
          building_code: building_code.toUpperCase(),
          description: description.toUpperCase(),
          rate: rateValue,
          structure_code
        }]);

      if (error) throw error;

      setToastMessage('Building code created successfully!');
      setBuildingCode('');
      setDescription('');
      setRate('');
      onBuildingCodeCreated();
      setTimeout(onClose, 1000);
    } catch (error: any) {
      setIsError(true);
      setToastMessage(error.message || 'Failed to create building code');
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
      setShowToast(true);
    }
  };

  const handleBuildingCodeChange = (value: string) => {
    setBuildingCode(value.toUpperCase());
  };

  const handleDescriptionChange = (value: string) => {
    setDescription(value.toUpperCase());
  };

  const handleRateChange = (value: string) => {
    // Allow only numbers and decimal point
    const numericValue = value.replace(/[^0-9.]/g, '');
    setRate(numericValue);
  };

  return (
    <>
      <IonModal isOpen={isOpen} onDidDismiss={onClose} className="classification-modal">
        <IonHeader>
          <IonToolbar className="modal-header">
            <IonTitle className="modal-title">CREATE BUILDING CODE</IonTitle>
          </IonToolbar>
        </IonHeader>

        <IonContent className="modal-content">
          <IonGrid className="form-grid">
            <IonRow>
              <IonCol className="form-column">
                <IonItem lines="none" className="structure-label-item">
                  <IonLabel className="structure-label">STRUCTURE CODE: {structure_code}</IonLabel>
                </IonItem>

                <div className="input-wrapper">
                  <Input
                    label="BUILDING CODE"
                    value={building_code}
                    onChange={handleBuildingCodeChange}
                    placeholder="ENTER BUILDING CODE"
                    className="modal-input"
                  />
                </div>

                <div className="input-wrapper">
                  <Input
                    label="DESCRIPTION"
                    value={description}
                    onChange={handleDescriptionChange}
                    placeholder="ENTER DESCRIPTION"
                    className="modal-input"
                  />
                </div>

                <div className="input-wrapper">
                  <Input
                    label="RATE"
                    value={rate}
                    onChange={handleRateChange}
                    placeholder="ENTER RATE"
                    className="modal-input"
                    type="number"
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
                    disabled={!building_code || !description || !rate || isLoading}
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

      <IonLoading isOpen={isLoading} message="CREATING BUILDING CODE..." />
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

export default BuildingCreateModal;