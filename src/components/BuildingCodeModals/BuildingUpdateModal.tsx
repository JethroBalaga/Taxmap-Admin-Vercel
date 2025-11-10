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

interface BuildingCodeItem {
  building_code: string;
  description: string;
  rate: number;
  created_at?: string;
}

interface BuildingUpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBuildingCodeUpdated?: () => void;
  buildingCodeData: BuildingCodeItem | null;
}

const BuildingUpdateModal: React.FC<BuildingUpdateModalProps> = ({
  isOpen,
  onClose,
  onBuildingCodeUpdated = () => {},
  buildingCodeData
}) => {
  const [building_code, setBuildingCode] = useState('');
  const [description, setDescription] = useState('');
  const [rate, setRate] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [isError, setIsError] = useState(false);

  // Populate form when buildingCodeData changes
  useEffect(() => {
    if (buildingCodeData) {
      setBuildingCode(buildingCodeData.building_code);
      setDescription(buildingCodeData.description);
      setRate(buildingCodeData.rate.toString());
    }
  }, [buildingCodeData]);

  const handleUpdate = async () => {
    if (!buildingCodeData || !building_code || !description || !rate) return;

    setIsLoading(true);
    try {
      // Convert rate to number
      const rateValue = parseFloat(rate);
      
      const { error } = await supabase
        .from('building_codetbl')
        .update({
          building_code: building_code.toUpperCase(),
          description: description.toUpperCase(),
          rate: rateValue
        })
        .eq('building_code', buildingCodeData.building_code); // Use original building_code for WHERE clause

      if (error) throw error;

      setToastMessage('Building code updated successfully!');
      onBuildingCodeUpdated();
      setTimeout(onClose, 1000);
    } catch (error: any) {
      setIsError(true);
      setToastMessage(error.message || 'Failed to update building code');
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

  const handleClose = () => {
    // Reset form when closing
    if (buildingCodeData) {
      setBuildingCode(buildingCodeData.building_code);
      setDescription(buildingCodeData.description);
      setRate(buildingCodeData.rate.toString());
    }
    onClose();
  };

  return (
    <>
      <IonModal isOpen={isOpen} onDidDismiss={handleClose} className="classification-modal">
        <IonHeader>
          <IonToolbar className="modal-header">
            <IonTitle className="modal-title">UPDATE BUILDING CODE</IonTitle>
          </IonToolbar>
        </IonHeader>

        <IonContent className="modal-content">
          <IonGrid className="form-grid">
            <IonRow>
              <IonCol className="form-column">
                <IonItem lines="none" className="structure-label-item">
                  <IonLabel className="structure-label">BUILDING CODE: {buildingCodeData?.building_code}</IonLabel>
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
                    onClick={handleClose}
                    className="cancel-btn"
                    disabled={isLoading}
                  >
                    CANCEL
                  </Button>

                  <Button
                    variant="primary"
                    onClick={handleUpdate}
                    disabled={!building_code || !description || !rate || isLoading}
                    className="update-btn"
                  >
                    {isLoading ? 'UPDATING...' : 'UPDATE'}
                  </Button>
                </div>
              </IonCol>
            </IonRow>
          </IonGrid>
        </IonContent>
      </IonModal>

      <IonLoading isOpen={isLoading} message="UPDATING BUILDING CODE..." />
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

export default BuildingUpdateModal;