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
} from '@ionic/react';
import Input from '../Globalcomponents/Input';
import './../../CSS/Modal.css';
import Button from '../Globalcomponents/Button';
import { supabase } from './../../utils/supaBaseClient';

interface BuildingComUpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBuildingComUpdated?: () => void;
  buildingComData: {
    building_com_id: string;
    description: string;
  };
}

const BuildingComUpdateModal: React.FC<BuildingComUpdateModalProps> = ({
  isOpen,
  onClose,
  onBuildingComUpdated = () => {},
  buildingComData
}) => {
  const [buildingComId, setBuildingComId] = useState(buildingComData.building_com_id);
  const [description, setDescription] = useState(buildingComData.description);
  const [isLoading, setIsLoading] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [isError, setIsError] = useState(false);

  // Update form fields when buildingComData changes
  useEffect(() => {
    setBuildingComId(buildingComData.building_com_id);
    setDescription(buildingComData.description);
  }, [buildingComData]);

  const handleUpdate = async () => {
    if (!buildingComId || !description) return;

    setIsLoading(true);
    try {
      // First check if the new ID already exists (if it's different from the original)
      if (buildingComId !== buildingComData.building_com_id) {
        const { data: existingData, error: checkError } = await supabase
          .from('building_componenttbl')
          .select('building_com_id')
          .eq('building_com_id', buildingComId.toUpperCase())
          .single();

        if (existingData && !checkError) {
          throw new Error('Building Component ID already exists!');
        }
      }

      // Update the record - we need to handle the case where ID is changed
      if (buildingComId === buildingComData.building_com_id) {
        // Only description changed
        const { error } = await supabase
          .from('building_componenttbl')
          .update({
            description: description.toUpperCase(),
          })
          .eq('building_com_id', buildingComData.building_com_id);

        if (error) throw error;
      } else {
        // ID changed - we need to delete and recreate or use a transaction
        // For simplicity, we'll delete the old record and create a new one
        const { error: deleteError } = await supabase
          .from('building_componenttbl')
          .delete()
          .eq('building_com_id', buildingComData.building_com_id);

        if (deleteError) throw deleteError;

        const { error: insertError } = await supabase
          .from('building_componenttbl')
          .insert([{
            building_com_id: buildingComId.toUpperCase(),
            description: description.toUpperCase(),
          }]);

        if (insertError) throw insertError;
      }

      setToastMessage('Building Component updated successfully!');
      onBuildingComUpdated();
      setTimeout(onClose, 1000);
    } catch (error: any) {
      setToastMessage(error.message || 'Failed to update building component');
      setIsError(true);
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
      setShowToast(true);
    }
  };

  const handleBuildingComIdChange = (value: string) => {
    setBuildingComId(value.toUpperCase());
  };

  const handleDescriptionChange = (value: string) => {
    setDescription(value.toUpperCase());
  };

  return (
    <>
      <IonModal isOpen={isOpen} onDidDismiss={onClose} className="classification-modal">
        <IonHeader>
          <IonToolbar className="modal-header">
            <IonTitle className="modal-title">UPDATE BUILDING COMPONENT</IonTitle>
          </IonToolbar>
        </IonHeader>

        <IonContent className="modal-content">
          <IonGrid className="form-grid">
            <IonRow>
              <IonCol className="form-column">
                {/* Building Component ID Input (Now editable) */}
                <div className="input-wrapper" style={{ textTransform: 'uppercase' }}>
                  <Input
                    label="BUILDING COMPONENT ID"
                    value={buildingComId}
                    onChange={handleBuildingComIdChange}
                    placeholder="ENTER BUILDING COMPONENT ID"
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
                    disabled={!buildingComId || !description || isLoading}
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

      <IonLoading isOpen={isLoading} message="UPDATING BUILDING COMPONENT..." />
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

export default BuildingComUpdateModal;