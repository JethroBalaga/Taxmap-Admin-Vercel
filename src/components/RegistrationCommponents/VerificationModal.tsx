import React from 'react';
import { IonModal, IonContent, IonCard, IonCardHeader, IonCardTitle, IonCardSubtitle, IonButton } from '@ionic/react';

interface VerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  formData: {
    username: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

const VerificationModal: React.FC<VerificationModalProps> = ({ 
  isOpen, 
  onClose, 
  onConfirm,
  formData 
}) => {
  return (
    <IonModal isOpen={isOpen} onDidDismiss={onClose}>
      <IonContent className="ion-padding">
        <IonCard className="ion-padding" style={{ marginTop: '25%', background: '#1e1e1e' }}>
          <IonCardHeader>
            <IonCardTitle style={{ color: 'white' }}>User Registration Details</IonCardTitle>
            <hr style={{ borderColor: '#333' }} />
            <IonCardSubtitle style={{ color: '#a1a1aa' }}>Username</IonCardSubtitle>
            <IonCardTitle style={{ color: 'white' }}>{formData.username}</IonCardTitle>

            <IonCardSubtitle style={{ color: '#a1a1aa' }}>Email</IonCardSubtitle>
            <IonCardTitle style={{ color: 'white' }}>{formData.email}</IonCardTitle>

            <IonCardSubtitle style={{ color: '#a1a1aa' }}>Name</IonCardSubtitle>
            <IonCardTitle style={{ color: 'white' }}>
              {formData.firstName} {formData.lastName}
            </IonCardTitle>
          </IonCardHeader>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginRight: '5px' }}>
            <IonButton fill="clear" onClick={onClose}>
              Cancel
            </IonButton>
            <IonButton color="primary" onClick={onConfirm}>
              Confirm
            </IonButton>
          </div>
        </IonCard>
      </IonContent>
    </IonModal>
  );
};

export default VerificationModal;