import React from "react";
import { IonButton } from "@ionic/react";
import "./../../CSS/Button.css";

interface ButtonProps {
  variant?: "primary" | "secondary";
  onClick?: () => void;
  children: React.ReactNode;
  disabled?: boolean;
  className?: string;
}

const Button: React.FC<ButtonProps> = ({
  variant = "primary",
  onClick,
  children,
  disabled,
  className
}) => {
  return (
    <IonButton
      className={`custom-btn ${variant} ${className}`}
      onClick={onClick}
      disabled={disabled}
      fill="solid"
      shape="round"
    >
      {children}
    </IonButton>
  );
};

export default Button;