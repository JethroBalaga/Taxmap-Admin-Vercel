import React from 'react';
import { IonButton } from '@ionic/react';

interface RegisterButtonProps {
  onClick?: () => void;
  routerLink?: string;
  expand?: 'full' | 'block';
  fill?: 'clear' | 'outline' | 'solid';
  shape?: 'round';
  color?: string;
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
}

const RegisterButton: React.FC<RegisterButtonProps> = ({
  onClick,
  routerLink,
  expand = 'block',
  fill,
  shape,
  color,
  className = '',
  style,
  children
}) => {
  return (
    <IonButton
      className={className}
      onClick={onClick}
      routerLink={routerLink}
      expand={expand}
      fill={fill}
      shape={shape}
      color={color}
      style={style}
    >
      {children}
    </IonButton>
  );
};

export default RegisterButton;