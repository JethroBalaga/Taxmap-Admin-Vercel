import React from "react";
import { IonInput, IonItem, IonLabel } from "@ionic/react";
import "./../../CSS/Input.css";

interface InputProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  type?: HTMLInputElement["type"];
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

const Input: React.FC<InputProps> = ({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  className,
  disabled = false
}) => {
  return (
    <div className={`input-container ${className}`}>
      {label && <label className="input-label">{label}</label>}
      <IonItem className={`input-field ${disabled ? 'disabled' : ''}`} lines="none">
        <IonInput
          value={value}
          type={type as any}
          placeholder={placeholder}
          onIonChange={(e) => onChange(e.detail.value ?? "")}
          disabled={disabled}
        />
      </IonItem>
    </div>
  );
};

export default Input;