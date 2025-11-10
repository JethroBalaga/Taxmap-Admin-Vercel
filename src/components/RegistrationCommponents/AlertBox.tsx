import React from 'react';
import { IonAlert } from '@ionic/react';

interface AlertBoxProps {
  message: string;
  isOpen: boolean;
  onClose: () => void;
}

const AlertBox: React.FC<AlertBoxProps> = ({
  message,
  isOpen,
  onClose,
}) => {
  return (
    <IonAlert
      isOpen={isOpen}
      onDidDismiss={onClose}
      header="Notification"
      message={message}
      buttons={['OK']}
    />
  );
};

export default AlertBox;