import React from 'react';
import { IonModal, IonContent, IonTitle, IonText, IonButton } from '@ionic/react';

interface SuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SuccessModal: React.FC<SuccessModalProps> = ({ isOpen, onClose }) => {
  return (
    <IonModal isOpen={isOpen} onDidDismiss={onClose}>
      <IonContent
        className="ion-padding"
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          textAlign: 'center',
          background: '#1e1e1e'
        }}
      >
        <IonTitle style={{ marginTop: '35%', color: 'white' }}>Registration Successful 🎉</IonTitle>
        <IonText style={{ color: '#a1a1aa' }}>
          <p>Your account has been created successfully.</p>
          <p>Please check your email address.</p>
        </IonText>
        <IonButton routerLink="/" routerDirection="back" color="primary">
          Go to Login
        </IonButton>
      </IonContent>
    </IonModal>
  );
};

export default SuccessModal;