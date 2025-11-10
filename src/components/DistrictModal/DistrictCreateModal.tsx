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
  IonDatetimeButton,
  IonPopover,
  IonLabel,
  IonDatetime,
  IonInput
} from '@ionic/react';
import Input from '../Globalcomponents/Input';
import './../../CSS/Modal.css';
import Button from '../Globalcomponents/Button';
import { supabase } from './../../utils/supaBaseClient';

interface DistrictCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDistrictCreated?: () => void;
}

const DistrictCreateModal: React.FC<DistrictCreateModalProps> = ({
  isOpen,
  onClose,
  onDistrictCreated = () => {},
}) => {
  const [districtId, setDistrictId] = useState<number | null>(null);
  const [districtName, setDistrictName] = useState('');
  const [foundedDate, setFoundedDate] = useState<string>(new Date().toISOString());
  const [isLoading, setIsLoading] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [isError, setIsError] = useState(false);

  const handleCreate = async () => {
    if (districtId === null || !districtName || !foundedDate) return;

    setIsLoading(true);
    
    try {
      // Check if district ID already exists
      const { data: existingData, error: existingError } = await supabase
        .from('districttbl')
        .select('district_id')
        .eq('district_id', districtId)
        .maybeSingle();

      if (existingData) {
        throw new Error('DISTRICT ID ALREADY EXISTS');
      }

      // Format the date for Supabase (YYYY-MM-DD)
      const formattedDate = new Date(foundedDate).toISOString().split('T')[0];

      // Insert new district
      const { data, error } = await supabase
        .from('districttbl')
        .insert([{ 
          district_id: districtId, 
          district_name: districtName.toUpperCase(), // Convert to uppercase
          founded: formattedDate
        }])
        .select();

      if (error) throw error;

      setToastMessage('DISTRICT CREATED SUCCESSFULLY!');
      setDistrictId(null);
      setDistrictName('');
      onDistrictCreated();
      setTimeout(onClose, 1000);
    } catch (error: any) {
      const errorMessage = error.message || 'FAILED TO CREATE DISTRICT';
      setToastMessage(errorMessage);
      setIsError(true);
      console.error('Error creating district:', error);
    } finally {
      setIsLoading(false);
      setShowToast(true);
    }
  };

  const handleDistrictIdChange = (value: string) => {
    const num = parseInt(value, 10);
    setDistrictId(isNaN(num) ? null : num);
  };

  const handleDistrictNameChange = (value: string) => {
    setDistrictName(value.toUpperCase()); // Convert to uppercase
  };

  return (
    <>
      <IonModal isOpen={isOpen} onDidDismiss={onClose} className="classification-modal">
        <IonHeader>
          <IonToolbar className="modal-header">
            <IonTitle className="modal-title">CREATE NEW DISTRICT</IonTitle>
          </IonToolbar>
        </IonHeader>

        <IonContent className="modal-content">
          <IonGrid className="form-grid">
            <IonRow>
              <IonCol className="form-column">
                <div className="input-wrapper">
                  <IonLabel className="input-label">DISTRICT ID (NUMBER)</IonLabel>
                  <IonInput
                    type="number"
                    value={districtId}
                    onIonChange={(e) => handleDistrictIdChange(e.detail.value!)}
                    placeholder="ENTER DISTRICT NUMBER"
                    className="modal-input"
                  />
                </div>
                
                <div className="input-wrapper">
                  <Input
                    label="DISTRICT NAME"
                    value={districtName}
                    onChange={handleDistrictNameChange}
                    placeholder="ENTER DISTRICT NAME"
                    className="modal-input"
                  />
                </div>

                <div className="input-wrapper">
                  <IonLabel className="input-label">FOUNDED DATE</IonLabel>
                  <IonDatetimeButton datetime="datetime" />
                  <IonPopover keepContentsMounted={true}>
                    <IonDatetime 
                      id="datetime"
                      value={foundedDate}
                      onIonChange={(e) => setFoundedDate(e.detail.value?.toString() || new Date().toISOString())}
                      presentation="date"
                      showDefaultButtons={true}
                      doneText="SELECT"
                      cancelText="CANCEL"
                    />
                  </IonPopover>
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
                    disabled={districtId === null || !districtName || !foundedDate || isLoading}
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

      <IonLoading isOpen={isLoading} message="CREATING DISTRICT..." />
      
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

export default DistrictCreateModal;