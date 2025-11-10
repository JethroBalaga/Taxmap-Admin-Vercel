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
  IonCheckbox,
  IonLabel,
  IonItem,
} from '@ionic/react';
import Input from '../Globalcomponents/Input';
import './../../CSS/Modal.css';
import Button from '../Globalcomponents/Button';
import { supabase } from './../../utils/supaBaseClient';

interface BuildingSubComUpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBuildingSubComUpdated?: () => void;
  buildingSubComData: {
    building_subcom_id: string;
    description: string;
    rate: number;
    building_com_id: string;
    percent: boolean; // Add percent field
  };
}

const BuildingSubComUpdateModal: React.FC<BuildingSubComUpdateModalProps> = ({
  isOpen,
  onClose,
  onBuildingSubComUpdated = () => {},
  buildingSubComData
}) => {
  const [buildingSubcomId, setBuildingSubcomId] = useState(buildingSubComData.building_subcom_id);
  const [description, setDescription] = useState(buildingSubComData.description);
  const [rate, setRate] = useState(buildingSubComData.rate.toString());
  const [percent, setPercent] = useState(buildingSubComData.percent); // Add percent state
  const [isLoading, setIsLoading] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [isError, setIsError] = useState(false);

  // Update form fields when buildingSubComData changes
  useEffect(() => {
    setBuildingSubcomId(buildingSubComData.building_subcom_id);
    setDescription(buildingSubComData.description);
    setRate(buildingSubComData.rate.toString());
    setPercent(buildingSubComData.percent); // Update percent field
  }, [buildingSubComData]);

  const handleUpdate = async () => {
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
      // First check if the new ID already exists (if it's different from the original)
      if (buildingSubcomId !== buildingSubComData.building_subcom_id) {
        const { data: existingData, error: checkError } = await supabase
          .from('building_subcomponenttbl')
          .select('building_subcom_id')
          .eq('building_subcom_id', buildingSubcomId.toUpperCase())
          .single();

        if (existingData && !checkError) {
          throw new Error('Building Sub-Component ID already exists!');
        }
      }

      // Update the record - handle both ID change and no ID change scenarios
      if (buildingSubcomId === buildingSubComData.building_subcom_id) {
        // Only description, rate, and/or percent changed
        const { error } = await supabase
          .from('building_subcomponenttbl')
          .update({
            description: description.toUpperCase(),
            rate: rateValue,
            percent: percent, // Add percent field
          })
          .eq('building_subcom_id', buildingSubComData.building_subcom_id)
          .eq('building_com_id', buildingSubComData.building_com_id);

        if (error) throw error;
      } else {
        // ID changed - we need to delete the old record and create a new one
        const { error: deleteError } = await supabase
          .from('building_subcomponenttbl')
          .delete()
          .eq('building_subcom_id', buildingSubComData.building_subcom_id)
          .eq('building_com_id', buildingSubComData.building_com_id);

        if (deleteError) throw deleteError;

        const { error: insertError } = await supabase
          .from('building_subcomponenttbl')
          .insert([{
            building_subcom_id: buildingSubcomId.toUpperCase(),
            description: description.toUpperCase(),
            rate: rateValue,
            building_com_id: buildingSubComData.building_com_id,
            percent: percent, // Add percent field
          }]);

        if (insertError) throw insertError;
      }

      setToastMessage('Building Sub-Component updated successfully!');
      onBuildingSubComUpdated();
      setTimeout(onClose, 1000);
    } catch (error: any) {
      setToastMessage(error.message || 'Failed to update building sub-component');
      setIsError(true);
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
      setShowToast(true);
    }
  };

  const handleBuildingSubcomIdChange = (value: string) => {
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
    setBuildingSubcomId(buildingSubComData.building_subcom_id);
    setDescription(buildingSubComData.description);
    setRate(buildingSubComData.rate.toString());
    setPercent(buildingSubComData.percent);
    onClose();
  };

  return (
    <>
      <IonModal isOpen={isOpen} onDidDismiss={handleClose} className="classification-modal">
        <IonHeader>
          <IonToolbar className="modal-header">
            <IonTitle className="modal-title">UPDATE BUILDING SUB-COMPONENT</IonTitle>
          </IonToolbar>
        </IonHeader>

        <IonContent className="modal-content">
          <IonGrid className="form-grid">
            <IonRow>
              <IonCol className="form-column">
                {/* Building Sub-Component ID Input (Editable) */}
                <div className="input-wrapper" style={{ textTransform: 'uppercase' }}>
                  <Input
                    label="BUILDING SUB-COMPONENT ID"
                    value={buildingSubcomId}
                    onChange={handleBuildingSubcomIdChange}
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
                    value={buildingSubComData.building_com_id}
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
                    onClick={handleUpdate}
                    disabled={!buildingSubcomId || !description || !rate || isLoading}
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

      <IonLoading isOpen={isLoading} message="UPDATING BUILDING SUB-COMPONENT..." />
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

export default BuildingSubComUpdateModal;