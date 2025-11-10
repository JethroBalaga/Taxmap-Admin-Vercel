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

interface StructureUpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStructureUpdated?: () => void;
  structureData: {
    structure_code: string;
    description: string;
  } | null;
}

const StructureUpdateModal: React.FC<StructureUpdateModalProps> = ({
  isOpen,
  onClose,
  onStructureUpdated = () => {},
  structureData
}) => {
  const [originalStructureCode, setOriginalStructureCode] = useState(structureData?.structure_code || '');
  const [structureCode, setStructureCode] = useState(structureData?.structure_code || '');
  const [description, setDescription] = useState(structureData?.description || '');
  const [isLoading, setIsLoading] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [isError, setIsError] = useState(false);

  // Update form fields when structureData changes
  React.useEffect(() => {
    if (structureData) {
      setOriginalStructureCode(structureData.structure_code);
      setStructureCode(structureData.structure_code);
      setDescription(structureData.description);
    }
  }, [structureData]);

  const handleUpdate = async () => {
    if (!structureData || !structureCode || !description) return;

    setIsLoading(true);
    try {
      // First check if the new structure code already exists (if it was changed)
      if (structureCode !== originalStructureCode) {
        const { data: existingData, error: checkError } = await supabase
          .from('structure_typetbl')
          .select('structure_code')
          .eq('structure_code', structureCode.toUpperCase())
          .maybeSingle();

        if (checkError) throw checkError;
        
        if (existingData) {
          throw new Error('Structure code already exists');
        }
      }

      // Update the record using the original structure code as identifier
      const { error } = await supabase
        .from('structure_typetbl')
        .update({
          structure_code: structureCode.toUpperCase(),
          description: description.toUpperCase()
        })
        .eq('structure_code', originalStructureCode);

      if (error) throw error;

      setToastMessage('Structure type updated successfully!');
      onStructureUpdated();
      setTimeout(onClose, 1000);
    } catch (error: any) {
      setToastMessage(error.message || 'Failed to update structure type');
      setIsError(true);
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
      setShowToast(true);
    }
  };

  const handleStructureCodeChange = (value: string) => {
    setStructureCode(value);
  };

  const handleDescriptionChange = (value: string) => {
    setDescription(value);
  };

  const handleClose = () => {
    // Reset form fields when closing
    if (structureData) {
      setOriginalStructureCode(structureData.structure_code);
      setStructureCode(structureData.structure_code);
      setDescription(structureData.description);
    }
    onClose();
  };

  return (
    <>
      <IonModal isOpen={isOpen} onDidDismiss={handleClose} className="classification-modal">
        <IonHeader>
          <IonToolbar className="modal-header">
            <IonTitle className="modal-title">UPDATE STRUCTURE TYPE</IonTitle>
          </IonToolbar>
        </IonHeader>

        <IonContent className="modal-content">
          <IonGrid className="form-grid">
            <IonRow>
              <IonCol className="form-column">
                {/* Structure Code Input (Editable) */}
                <div className="input-wrapper">
                  <Input
                    label="STRUCTURE CODE"
                    value={structureCode}
                    onChange={handleStructureCodeChange}
                    placeholder="ENTER STRUCTURE CODE"
                    className="modal-input"
                  />
                </div>

                {/* Description Input */}
                <div className="input-wrapper">
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
                    onClick={handleClose}
                    className="cancel-btn"
                    disabled={isLoading}
                  >
                    CANCEL
                  </Button>

                  <Button
                    variant="primary"
                    onClick={handleUpdate}
                    disabled={!structureCode || !description || isLoading}
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

      <IonLoading isOpen={isLoading} message="UPDATING STRUCTURE TYPE..." />
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

export default StructureUpdateModal;