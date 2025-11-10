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
  IonIcon,
  IonDatetimeButton,
  IonPopover,
  IonLabel,
  IonDatetime,
  IonInput
} from '@ionic/react';
import { warning } from 'ionicons/icons';
import Input from '../Globalcomponents/Input';
import './../../CSS/Modal.css';
import Button from '../Globalcomponents/Button';
import { supabase } from './../../utils/supaBaseClient';

interface DistrictUpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  districtData: { district_id: number; district_name: string; founded: string } | null;
  onDistrictUpdated?: () => void;
}

const DistrictUpdateModal: React.FC<DistrictUpdateModalProps> = ({
  isOpen,
  onClose,
  districtData,
  onDistrictUpdated = () => {}
}) => {
  const [districtId, setDistrictId] = useState<number | null>(null);
  const [districtName, setDistrictName] = useState('');
  const [foundedDate, setFoundedDate] = useState<string>(new Date().toISOString());
  const [isLoading, setIsLoading] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const [isFormValid, setIsFormValid] = useState(false);

  useEffect(() => {
    setIsFormValid(
      districtId !== null && 
      !!districtName && 
      !!foundedDate
    );
  }, [districtId, districtName, foundedDate]);

  useEffect(() => {
    if (districtData) {
      setDistrictId(districtData.district_id);
      setDistrictName(districtData.district_name);
      try {
        const date = districtData.founded ? new Date(districtData.founded) : new Date();
        setFoundedDate(date.toISOString());
      } catch {
        setFoundedDate(new Date().toISOString());
      }
      setIsFormValid(true);
    }
  }, [districtData]);

  const handleUpdate = async () => {
    if (!isFormValid || !districtData || districtId === null) return;

    setIsLoading(true);

    try {
      if (districtId !== districtData.district_id) {
        const { count } = await supabase
          .from('districttbl')
          .select('*', { count: 'exact', head: true })
          .eq('district_id', districtId);

        if (count && count > 0) {
          throw new Error('This District ID already exists!');
        }
      }

      const formattedDate = new Date(foundedDate).toISOString().split('T')[0];

      const { error } = await supabase
        .from('districttbl')
        .update({ 
          district_id: districtId, 
          district_name: districtName.toUpperCase(), // Convert to uppercase
          founded: formattedDate
        })
        .eq('district_id', districtData.district_id);

      if (error) throw error;

      setToastMessage('District updated successfully!');
      onDistrictUpdated();
      setTimeout(onClose, 1000);
    } catch (error: any) {
      setToastMessage(error.message || 'Failed to update district');
      setIsError(true);
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

  const isChangingId = districtId !== (districtData?.district_id || null);

  return (
    <>
      <IonModal isOpen={isOpen} onDidDismiss={onClose} className="classification-modal">
        <IonHeader>
          <IonToolbar className="modal-header">
            <IonTitle className="modal-title">Update District</IonTitle>
          </IonToolbar>
        </IonHeader>

        <IonContent className="modal-content">
          <IonGrid className="form-grid">
            <IonRow>
              <IonCol className="form-column">
                {isChangingId && (
                  <div className="id-change-notice">
                    <IonIcon icon={warning} className="warning-icon" />
                    <span>Changing District ID will update all related records</span>
                  </div>
                )}

                <div className="input-wrapper">
                  <IonLabel className="input-label">District ID (Number)</IonLabel>
                  <IonInput
                    type="number"
                    value={districtId}
                    onIonChange={(e) => handleDistrictIdChange(e.detail.value!)}
                    placeholder="Enter district number"
                    className="modal-input"
                  />
                </div>

                <div className="input-wrapper">
                  <Input
                    label="District Name"
                    value={districtName}
                    onChange={handleDistrictNameChange}
                    placeholder="Enter district name"
                    className="modal-input"
                  />
                </div>

                <div className="input-wrapper">
                  <IonLabel className="input-label">Founded Date</IonLabel>
                  <IonDatetimeButton datetime="datetime" />
                  <IonPopover keepContentsMounted={true}>
                    <IonDatetime 
                      id="datetime"
                      value={foundedDate}
                      onIonChange={(e) => setFoundedDate(e.detail.value?.toString() || new Date().toISOString())}
                      presentation="date"
                      showDefaultButtons={true}
                      doneText="Select"
                      cancelText="Cancel"
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
                    Cancel
                  </Button>

                  <Button
                    variant="primary"
                    onClick={handleUpdate}
                    disabled={!isFormValid || isLoading}
                    className="create-btn"
                  >
                    {isLoading ? 'Updating...' : 'Update'}
                  </Button>
                </div>
              </IonCol>
            </IonRow>
          </IonGrid>
        </IonContent>
      </IonModal>

      <IonLoading isOpen={isLoading} message="Updating district..." />

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

export default DistrictUpdateModal;