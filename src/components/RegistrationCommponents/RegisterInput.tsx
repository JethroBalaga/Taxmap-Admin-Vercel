import React from 'react';
import { IonInput, IonInputPasswordToggle } from '@ionic/react';

interface RegisterInputProps {
  label: string;
  type: 'text' | 'password' | 'email' | 'number' | 'search' | 'tel' | 'url';
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  showToggle?: boolean;
  className?: string;
}

const RegisterInput: React.FC<RegisterInputProps> = ({
  label,
  type,
  placeholder,
  value,
  onChange,
  showToggle = false,
  className = ''
}) => {
  return (
    // In RegisterInput.tsx
    <IonInput
      className={className}
      label={label}
      labelPlacement="stacked"
      fill="outline"
      type={type}
      placeholder={placeholder}
      value={value}
      onIonChange={(e) => onChange(e.detail.value!)}
      style={showToggle ? { '--ionicon-stroke-width': '16px', '--color': 'white' } : {}}
    >
      {showToggle && <IonInputPasswordToggle slot="end" color="dark" />}
    </IonInput>
  );
};

export default RegisterInput;