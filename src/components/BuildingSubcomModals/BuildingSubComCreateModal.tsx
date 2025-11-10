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
  IonCheckbox,
  IonLabel,
  IonItem,
} from '@ionic/react';
import Input from '../Globalcomponents/Input';
import './../../CSS/Modal.css';
import Button from '../Globalcomponents/Button';
import { supabase } from './../../utils/supaBaseClient';

interface BuildingSubComCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBuildingSubComCreated?: () => void;
  building_com_id: string; // Inherited from parent component
}

const BuildingSubComCreateModal: React.FC<BuildingSubComCreateModalProps> = ({
  isOpen,
  onClose,
  onBuildingSubComCreated = () => {},
  building_com_id
}) => {
  const [buildingSubcomId, setBuildingSubcomId] = useState(''); // Updated variable name
  const [description, setDescription] = useState('');
  const [rate, setRate] = useState('');
  const [percent, setPercent] = useState(false); // New state for percent checkbox
  const [isLoading, setIsLoading] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [isError, setIsError] = useState(false);

  const handleCreate = async () => {
    if (!buildingSubcomId || !description || !rate) return;

    // Validate rate is a valid number
    const rateValue = parseFloat(rate);
    if (isNaN(rateValue) || rateValue < 0) {
      setToastMessage('Please enter a valid rate (positive number)');
      setIsError(true);
      setShowToast(true);
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('building_subcomponenttbl') // Updated table name
        .insert([{
          building_subcom_id: buildingSubcomId.toUpperCase(), // Updated column name
          description: description.toUpperCase(),
          rate: rateValue,
          building_com_id: building_com_id,
          percent: percent, // Add the percent field
        }]);

      if (error) throw error;

      setToastMessage('Building Sub-Component created successfully!');
      setBuildingSubcomId('');
      setDescription('');
      setRate('');
      setPercent(false); // Reset checkbox
      onBuildingSubComCreated();
      setTimeout(onClose, 1000);
    } catch (error: any) {
      setToastMessage(error.message || 'Failed to create building sub-component');
      setIsError(true);
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
      setShowToast(true);
    }
  };

  const handleBuildingSubcomIdChange = (value: string) => { // Updated function name
    setBuildingSubcomId(value.toUpperCase());
  };

  const handleDescriptionChange = (value: string) => {
    setDescription(value.toUpperCase());
  };

  const handleRateChange = (value: string) => {
    // Allow only numbers and decimal point
    const validatedValue = value.replace(/[^0-9.]/g, '');
    // Ensure only one decimal point
    const decimalCount = (validatedValue.match(/\./g) || []).length;
    if (decimalCount <= 1) {
      setRate(validatedValue);
    }
  };

  const handlePercentChange = (checked: boolean) => {
    setPercent(checked);
  };

  const handleClose = () => {
    // Reset form when closing
    setBuildingSubcomId('');
    setDescription('');
    setRate('');
    setPercent(false);
    onClose();
  };

  return (
    <>
      <IonModal isOpen={isOpen} onDidDismiss={handleClose} className="classification-modal">
        <IonHeader>
          <IonToolbar className="modal-header">
            <IonTitle className="modal-title">CREATE BUILDING SUB-COMPONENT</IonTitle>
          </IonToolbar>
        </IonHeader>

        <IonContent className="modal-content">
          <IonGrid className="form-grid">
            <IonRow>
              <IonCol className="form-column">
                {/* Building Sub-Component ID Input */}
                <div className="input-wrapper" style={{ textTransform: 'uppercase' }}>
                  <Input
                    label="BUILDING SUB-COMPONENT ID"
                    value={buildingSubcomId} // Updated variable name
                    onChange={handleBuildingSubcomIdChange} // Updated function name
                    placeholder="ENTER BUILDING SUB-COMPONENT ID"
                    className="modal-input"
                  />
                </div>

                {/* Description Input */}
                <div className="input-wrapper" style={{ textTransform: 'uppercase' }}>
                  <Input
                    label="DESCRIPTION"
                    value={description}
                    onChange={handleDescriptionChange}
                    placeholder="ENTER DESCRIPTION"
                    className="modal-input"
                  />
                </div>

                {/* Rate Input */}
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

                {/* Percent Checkbox */}
                <div className="input-wrapper">
                  <IonItem className="checkbox-item" lines="none">
                    <IonCheckbox
                      checked={percent}
                      onIonChange={(e) => handlePercentChange(e.detail.checked)}
                      slot="start"
                      className="percent-checkbox"
                    />
                    <IonLabel className="checkbox-label">Percent</IonLabel>
                  </IonItem>
                  <div className="checkbox-hint">
                    {percent 
                      ? 'Rate will be treated as a percentage' 
                      : 'Rate will be treated as a fixed value'
                    }
                  </div>
                </div>

                {/* Building Component ID (Display only) */}
                <div className="input-wrapper">
                  <Input
                    label="BUILDING COMPONENT ID"
                    value={building_com_id}
                    onChange={() => {}} // Read-only
                    placeholder="BUILDING COMPONENT ID"
                    className="modal-input"
                    disabled={true}
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
                    onClick={handleCreate}
                    disabled={!buildingSubcomId || !description || !rate || isLoading} // Updated variable name
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

      <IonLoading isOpen={isLoading} message="CREATING BUILDING SUB-COMPONENT..." />
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

export default BuildingSubComCreateModal;