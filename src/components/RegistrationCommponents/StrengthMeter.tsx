import React from 'react';
import { IonProgressBar, IonText } from '@ionic/react';

interface PasswordStrengthMeterProps {
  password: string;
  strength: {
    value: number;
    label: string;
    color: string;
  };
}

const StrengthMeter: React.FC<PasswordStrengthMeterProps> = ({ password, strength }) => {
  if (!password) return null;

  const getRequirementColor = (condition: boolean) => {
    return condition ? 'password-requirement-valid' : '';
  };

  return (
    <div className="password-strength-container">
      <IonProgressBar 
        value={strength.value} 
        color={strength.color}
        className="password-strength-bar"
      />
      <IonText color={strength.color} className="password-strength-label">
        {strength.label}
      </IonText>
      
      <div className="password-requirements">
        <p>Password should contain:</p>
        <ul>
          <li className={getRequirementColor(password.length >= 8)}>
            At least 8 characters
          </li>
          <li className={getRequirementColor(/[A-Z]/.test(password))}>
            One uppercase letter
          </li>
          <li className={getRequirementColor(/[0-9]/.test(password))}>
            One number
          </li>
          <li className={getRequirementColor(/[^A-Za-z0-9]/.test(password))}>
            One special character
          </li>
        </ul>
      </div>
    </div>
  );
};

export default StrengthMeter;