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
  IonItem,
  IonSelect,
  IonSelectOption
} from '@ionic/react';
import Input from '../Globalcomponents/Input';
import './../../CSS/Modal.css';
import Button from '../Globalcomponents/Button';
import { supabase } from './../../utils/supaBaseClient';

interface LandAdjustmentItem {
  adjustment_id: string;
  description: string;
  adjustment_factor: string;
  adjustment_type: string;
  created_at?: string;
}

interface LandAdjustmentUpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLandAdjustmentUpdated?: () => void;
  landAdjustmentData: LandAdjustmentItem | null;
}

const LandAdjustmentUpdateModal: React.FC<LandAdjustmentUpdateModalProps> = ({
  isOpen,
  onClose,
  onLandAdjustmentUpdated = () => {},
  landAdjustmentData
}) => {
  const [adjustment_id, setAdjustmentId] = useState('');
  const [description, setDescription] = useState('');
  const [adjustment_factor, setAdjustmentFactor] = useState('');
  const [adjustment_type, setAdjustmentType] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [isError, setIsError] = useState(false);

  const adjustmentTypes = [
    'Stripping',
    'Corner Influence',
    'Commercial Frontage',
    'Agricultural Frontage',
    'Weather Road',
    'Market'
  ];

  // Initialize form with existing data when modal opens or data changes
  useEffect(() => {
    if (landAdjustmentData) {
      setAdjustmentId(landAdjustmentData.adjustment_id);
      setDescription(landAdjustmentData.description);
      setAdjustmentFactor(landAdjustmentData.adjustment_factor.replace(/%/g, ''));
      setAdjustmentType(landAdjustmentData.adjustment_type || '');
    }
  }, [landAdjustmentData]);

  const handleUpdate = async () => {
    if (!landAdjustmentData || !adjustment_id || !description || !adjustment_factor || !adjustment_type) return;

    setIsLoading(true);
    try {
      // First check if the new adjustment_id already exists (if it was changed)
      if (adjustment_id !== landAdjustmentData.adjustment_id) {
        const { data: existingData, error: checkError } = await supabase
          .from('landadjustmenttbl')
          .select('adjustment_id')
          .eq('adjustment_id', adjustment_id)
          .single();

        if (existingData) {
          throw new Error('Adjustment ID already exists');
        }
      }

      // Update the record
      const { error } = await supabase
        .from('landadjustmenttbl')
        .update({
          adjustment_id: adjustment_id.toUpperCase(),
          description: description.toUpperCase(),
          adjustment_factor: adjustment_factor,
          adjustment_type: adjustment_type
        })
        .eq('adjustment_id', landAdjustmentData.adjustment_id);

      if (error) throw error;

      setToastMessage('Land Adjustment updated successfully!');
      resetForm();
      onLandAdjustmentUpdated();
      setTimeout(onClose, 1000);
    } catch (error: any) {
      setIsError(true);
      setToastMessage(error.message || 'Failed to update Land Adjustment');
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
      setShowToast(true);
    }
  };

  const handleAdjustmentIdChange = (value: string) => {
    setAdjustmentId(value.toUpperCase());
  };

  const handleDescriptionChange = (value: string) => {
    setDescription(value.toUpperCase());
  };

  const handleAdjustmentFactorChange = (value: string) => {
    const cleanedValue = value.replace(/%/g, '');
    if (cleanedValue === '' || /^-?\d*\.?\d*$/.test(cleanedValue)) {
      setAdjustmentFactor(cleanedValue);
    }
  };

  const getDisplayAdjustmentFactor = () => {
    if (adjustment_factor === '') return '';
    return adjustment_factor + '%';
  };

  const resetForm = () => {
    setAdjustmentId('');
    setDescription('');
    setAdjustmentFactor('');
    setAdjustmentType('');
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
            <IonTitle className="modal-title">Update Land Adjustment</IonTitle>
          </IonToolbar>
        </IonHeader>

        <IonContent className="modal-content">
          <IonGrid className="form-grid">
            <IonRow>
              <IonCol className="form-column">
                <div className="input-wrapper">
                  <Input
                    label="Adjustment ID"
                    value={adjustment_id}
                    onChange={handleAdjustmentIdChange}
                    placeholder="Enter adjustment ID"
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

                <div className="input-wrapper">
                  <IonItem className="modal-input">
                    <IonLabel position="stacked">Adjustment Type</IonLabel>
                    <IonSelect
                      value={adjustment_type}
                      placeholder="Select adjustment type"
                      onIonChange={(e) => setAdjustmentType(e.detail.value)}
                      interface="action-sheet"
                    >
                      {adjustmentTypes.map((type) => (
                        <IonSelectOption key={type} value={type}>
                          {type}
                        </IonSelectOption>
                      ))}
                    </IonSelect>
                  </IonItem>
                </div>

                <div className="input-wrapper">
                  <Input
                    label="Adjustment Factor"
                    value={getDisplayAdjustmentFactor()}
                    onChange={handleAdjustmentFactorChange}
                    placeholder="Enter adjustment factor (e.g., 23%, -9%)"
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
                    disabled={!adjustment_id || !description || !adjustment_factor || !adjustment_type || isLoading}
                    className="update-btn"
                  >
                    {isLoading ? 'Updating...' : 'Update'}
                  </Button>
                </div>
              </IonCol>
            </IonRow>
          </IonGrid>
        </IonContent>
      </IonModal>

      <IonLoading isOpen={isLoading} message="Updating Land Adjustment..." />
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

export default LandAdjustmentUpdateModal;