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
} from '@ionic/react';
import Input from '../Globalcomponents/Input';
import './../../CSS/Modal.css';
import Button from '../Globalcomponents/Button';
import { supabase } from './../../utils/supaBaseClient';

interface BuildingComCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBuildingComCreated?: () => void;
}

const BuildingComCreateModal: React.FC<BuildingComCreateModalProps> = ({
  isOpen,
  onClose,
  onBuildingComCreated = () => {}
}) => {
  const [buildingComId, setBuildingComId] = useState('');
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [isError, setIsError] = useState(false);

  const handleCreate = async () => {
    if (!buildingComId || !description) return;

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('building_componenttbl')
        .insert([{
          building_com_id: buildingComId, // Already uppercase from onChange
          description: description, // Already uppercase from onChange
        }]);

      if (error) throw error;

      setToastMessage('Building Component created successfully!');
      setBuildingComId('');
      setDescription('');
      onBuildingComCreated();
      setTimeout(onClose, 1000);
    } catch (error: any) {
      setToastMessage(error.message || 'Failed to create building component');
      setIsError(true);
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
      setShowToast(true);
    }
  };

  const handleBuildingComIdChange = (value: string) => {
    setBuildingComId(value.toUpperCase()); // Convert to uppercase immediately
  };

  const handleDescriptionChange = (value: string) => {
    setDescription(value.toUpperCase()); // Convert to uppercase immediately
  };

  return (
    <>
      <IonModal isOpen={isOpen} onDidDismiss={onClose} className="classification-modal">
        <IonHeader>
          <IonToolbar className="modal-header">
            <IonTitle className="modal-title">CREATE BUILDING COMPONENT</IonTitle>
          </IonToolbar>
        </IonHeader>

        <IonContent className="modal-content">
          <IonGrid className="form-grid">
            <IonRow>
              <IonCol className="form-column">
                {/* Building Component ID Input */}
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
                    onClick={handleCreate}
                    disabled={!buildingComId || !description || isLoading}
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

      <IonLoading isOpen={isLoading} message="CREATING BUILDING COMPONENT..." />
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

export default BuildingComCreateModal;