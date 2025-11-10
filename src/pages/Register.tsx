import React, { useState, useEffect } from 'react';
import {
  IonContent,
  IonPage,
  IonCard,
  IonCardContent,
  IonSelect,
  IonSelectOption,
  IonLabel,
  IonInput,
  IonItem,
  IonModal,
  IonButton,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonIcon,
  IonLoading
} from '@ionic/react';
import { supabase } from '../utils/supaBaseClient';
import bcrypt from 'bcryptjs';
import '../CSS/Registration.css';
import RegisterInput from '../components/RegistrationCommponents/RegisterInput';
import StrengthMeter from '../components/RegistrationCommponents/StrengthMeter';
import RegisterButton from '../components/RegistrationCommponents/RegisterButton';
import VerificationModal from '../components/RegistrationCommponents/VerificationModal';
import AlertBox from '../components/RegistrationCommponents/AlertBox';
import backgroundImg from '../Images/Manolo 2.jpg';
import { useHistory } from 'react-router-dom';
import { eye, eyeOff, checkmarkCircle, closeCircle, arrowBack } from 'ionicons/icons';

// Electron detection hook
const useElectron = () => {
  const [isElectron, setIsElectron] = useState(false);

  useEffect(() => {
    const electronDetected = (
      // @ts-ignore
      window.process?.versions?.electron ||
      // @ts-ignore
      window.navigator.userAgent.includes('Electron') ||
      // @ts-ignore
      (window.require && window.process && window.process.type) ||
      window.location.protocol === 'file:'
    );
    
    setIsElectron(!!electronDetected);
  }, []);

  return isElectron;
};

// Custom Electron Header
const ElectronHeader: React.FC<{ 
  onBack: () => void;
}> = ({ onBack }) => (
  <div style={{
    background: '#3880ff',
    color: 'white',
    padding: '12px 16px',
    borderBottom: '1px solid #2a5fc1',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
  }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
      <button 
        onClick={onBack}
        style={{
          background: 'rgba(255,255,255,0.2)',
          color: 'white',
          border: 'none',
          padding: '8px 12px',
          borderRadius: '4px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          fontSize: '14px',
          fontWeight: '500'
        }}
      >
        <IonIcon 
          icon={arrowBack} 
          style={{ fontSize: '16px', color: 'white' }}
        />
        Back
      </button>
      <h2 style={{ 
        margin: 0, 
        fontSize: '18px', 
        fontWeight: '600',
        flex: 1 
      }}>
        Create User Account
      </h2>
    </div>
  </div>
);

const Register: React.FC = () => {
  const [formData, setFormData] = useState({
    username: '',
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'user'
  });

  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [showAlert, setShowAlert] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState({
    value: 0,
    label: '',
    color: 'primary'
  });
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [showAdminPasswordModal, setShowAdminPasswordModal] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [showAdminPassword, setShowAdminPassword] = useState(false);
  const [isPasswordCorrect, setIsPasswordCorrect] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const history = useHistory();
  const isElectron = useElectron();

  // Get current user session
  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setCurrentUser(session.user);
      }
    };
    getCurrentUser();
  }, []);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  useEffect(() => {
    if (formData.password) {
      const strength = calculatePasswordStrength(formData.password);
      setPasswordStrength(strength);
    } else {
      setPasswordStrength({ value: 0, label: '', color: 'primary' });
    }
  }, [formData.password]);

  const calculatePasswordStrength = (password: string) => {
    let strength = 0;
    if (password.length >= 8) strength += 1;
    if (password.length >= 12) strength += 1;
    if (/[A-Z]/.test(password)) strength += 1;
    if (/[a-z]/.test(password)) strength += 1;
    if (/[0-9]/.test(password)) strength += 1;
    if (/[^A-Za-z0-9]/.test(password)) strength += 1;

    if (strength <= 2) return { value: 0.25, label: 'Very Weak', color: 'danger' };
    if (strength <= 4) return { value: 0.5, label: 'Weak', color: 'warning' };
    if (strength <= 6) return { value: 0.75, label: 'Strong', color: 'success' };
    return { value: 1, label: 'Very Strong', color: 'primary' };
  };

  // Get admin user data with password
  const getAdminUserData = async () => {
    if (!currentUser) return null;

    try {
      // First check if user is admin
      const { data: adminData, error: adminError } = await supabase
        .from('admins')
        .select('user_id')
        .eq('user_id', currentUser.id)
        .single();

      if (adminError || !adminData) {
        return null;
      }

      // Then get the user data with password
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('user_password')
        .eq('user_id', currentUser.id)
        .single();

      if (userError || !userData) {
        return null;
      }

      return userData;
    } catch (error) {
      console.error('Error getting admin user data:', error);
      return null;
    }
  };

  // Check admin password in real-time against the users table
  const checkAdminPassword = async (password: string) => {
    if (!currentUser || !password) {
      setIsPasswordCorrect(null);
      return false;
    }

    try {
      const userData = await getAdminUserData();
      
      if (!userData) {
        setIsPasswordCorrect(false);
        return false;
      }

      // Verify admin password against the stored hash in users table
      const isCorrect = await bcrypt.compare(password, userData.user_password);
      setIsPasswordCorrect(isCorrect);
      return isCorrect;
    } catch (error) {
      console.error('Error checking admin password:', error);
      setIsPasswordCorrect(false);
      return false;
    }
  };

  const handleAdminPasswordChange = async (password: string) => {
    setAdminPassword(password);
    if (password) {
      await checkAdminPassword(password);
    } else {
      setIsPasswordCorrect(null);
    }
  };

  const verifyAdminPassword = async (): Promise<boolean> => {
    if (!currentUser) {
      setAlertMessage('No user session found.');
      setShowAlert(true);
      return false;
    }

    try {
      const userData = await getAdminUserData();
      
      if (!userData) {
        setAlertMessage('Only administrators can create new users.');
        setShowAlert(true);
        return false;
      }

      // Verify admin password against the stored hash in users table
      const isCorrect = await bcrypt.compare(adminPassword, userData.user_password);
      if (isCorrect) {
        return true;
      } else {
        setAlertMessage('Invalid admin password.');
        setShowAlert(true);
        return false;
      }
    } catch (error) {
      console.error('Error verifying admin:', error);
      setAlertMessage('Error verifying administrator privileges.');
      setShowAlert(true);
      return false;
    }
  };

  const handleOpenVerificationModal = async () => {
    // 1️⃣ Validate email format
    const email = formData.email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setAlertMessage('Please enter a valid email address.');
      setShowAlert(true);
      return;
    }

    // 2️⃣ Validate passwords
    if (formData.password !== formData.confirmPassword) {
      setAlertMessage('Passwords do not match.');
      setShowAlert(true);
      return;
    }
    if (formData.password.length < 8) {
      setAlertMessage('Password must be at least 8 characters.');
      setShowAlert(true);
      return;
    }

    // 3️⃣ Show admin password modal for verification
    setShowAdminPasswordModal(true);
  };

  const handleAdminVerification = async () => {
    if (!adminPassword) {
      setAlertMessage('Please enter admin password.');
      setShowAlert(true);
      return;
    }

    const verified = await verifyAdminPassword();
    if (verified) {
      setShowAdminPasswordModal(false);
      setAdminPassword('');
      setIsPasswordCorrect(null);
      setShowAdminPassword(false);
      // Now show the final verification modal
      setShowVerificationModal(true);
    }
  };

  const doRegister = async () => {
    setIsLoading(true);
    setShowVerificationModal(false);
    try {
      const email = formData.email.trim().toLowerCase();

      // 1️⃣ Create Supabase Auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password: formData.password
      });

      if (authError) throw new Error('Account creation failed: ' + authError.message);
      if (!authData.user?.id) throw new Error('Failed to retrieve user ID from Auth');

      const userId = authData.user.id;

      // 2️⃣ Insert into users table
      const { error: userError } = await supabase
        .from('users')
        .insert({
          user_id: userId,
          username: formData.username,
          user_email: email,
          user_firstname: formData.firstName,
          user_lastname: formData.lastName,
          user_password: await bcrypt.hash(formData.password, 10)
        });

      if (userError) throw new Error('Failed to save user data: ' + userError.message);

      // 3️⃣ Insert into admins table if role is admin
      if (formData.role === 'admin') {
        const { error: adminError } = await supabase
          .from('admins')
          .insert({
            user_id: userId,
            username: formData.username,
            user_email: email
          });
        if (adminError) throw new Error('Failed to create admin: ' + adminError.message);
      }

      // After successful registration, navigate appropriately
      if (isElectron) {
        window.location.hash = '/menu/people/user?refresh=' + Date.now();
      } else {
        history.push('/menu/people/user?refresh=' + Date.now());
      }
    } catch (err) {
      if (err instanceof Error) setAlertMessage(err.message);
      else setAlertMessage('An unknown error occurred.');
      setShowAlert(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackClick = () => {
    if (isElectron) {
      window.location.hash = '/menu/people/user';
    } else {
      history.push('/menu/people/user');
    }
  };

  // For Electron: Use simpler structure but preserve all styling
  if (isElectron) {
    return (
      <div className="registration-container" style={{ 
        height: '100vh', 
        display: 'flex', 
        flexDirection: 'column'
      }}>
        <ElectronHeader onBack={handleBackClick} />
        
        <div className="registration-content-wrapper" style={{ 
          flex: 1, 
          overflow: 'auto',
          position: 'relative'
        }}>
          {/* Background Image */}
          <div
            className="registration-background"
            style={{ 
              backgroundImage: `url(${backgroundImg})`,
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
              zIndex: 0
            }}
          />

          {/* Content */}
          <div className="registration-center-wrapper" style={{
            position: 'relative',
            zIndex: 1,
            minHeight: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}>
            <IonCard className="registration-card">
              <IonCardContent className="registration-content">
                <h1 className="registration-title">Create User Account</h1>

                <RegisterInput
                  label="Username"
                  type="text"
                  placeholder="Enter a unique username"
                  value={formData.username}
                  onChange={(value) => handleInputChange('username', value)}
                  className="registration-input"
                />

                <RegisterInput
                  label="First Name"
                  type="text"
                  placeholder="Enter first name"
                  value={formData.firstName}
                  onChange={(value) => handleInputChange('firstName', value)}
                  className="registration-input"
                />

                <RegisterInput
                  label="Last Name"
                  type="text"
                  placeholder="Enter last name"
                  value={formData.lastName}
                  onChange={(value) => handleInputChange('lastName', value)}
                  className="registration-input"
                />

                <RegisterInput
                  label="Email"
                  type="email"
                  placeholder="youremail@gmail.com"
                  value={formData.email}
                  onChange={(value) => handleInputChange('email', value)}
                  className="registration-input"
                />

                <RegisterInput
                  label="Password"
                  type="password"
                  placeholder="Enter password"
                  value={formData.password}
                  onChange={(value) => handleInputChange('password', value)}
                  className="registration-input"
                  showToggle
                />

                <StrengthMeter
                  password={formData.password}
                  strength={passwordStrength}
                />

                <RegisterInput
                  label="Confirm Password"
                  type="password"
                  placeholder="Confirm password"
                  value={formData.confirmPassword}
                  onChange={(value) => handleInputChange('confirmPassword', value)}
                  className="registration-input"
                  showToggle
                />

                <div className="registration-input">
                  <IonLabel>Account Type</IonLabel>
                  <IonSelect
                    value={formData.role}
                    onIonChange={e => handleInputChange('role', e.detail.value)}
                    interface="popover"
                  >
                    <IonSelectOption value="user">User</IonSelectOption>
                    <IonSelectOption value="admin">Admin</IonSelectOption>
                  </IonSelect>
                </div>

                <RegisterButton
                  onClick={handleOpenVerificationModal}
                  className="registration-button"
                >
                  Register User
                </RegisterButton>

                <RegisterButton
                  onClick={handleBackClick}
                  className="registration-secondary-button"
                  fill="clear"
                >
                  Back to Users
                </RegisterButton>

                {/* Admin Password Verification Modal */}
                <IonModal isOpen={showAdminPasswordModal} onDidDismiss={() => {
                  setShowAdminPasswordModal(false);
                  setAdminPassword('');
                  setIsPasswordCorrect(null);
                  setShowAdminPassword(false);
                }}>
                  <IonHeader>
                    <IonToolbar>
                      <IonTitle>Admin Verification Required</IonTitle>
                      <IonButtons slot="end">
                        <IonButton onClick={() => setShowAdminPasswordModal(false)}>Close</IonButton>
                      </IonButtons>
                    </IonToolbar>
                  </IonHeader>
                  <IonContent className="ion-padding">
                    <div style={{ textAlign: 'center', padding: '20px' }}>
                      <h2>Admin Verification</h2>
                      <p>Please enter your admin password to proceed with user registration.</p>
                      
                      <IonItem style={{ margin: '20px 0' }}>
                        <IonLabel position="stacked">Admin Password</IonLabel>
                        <IonInput
                          type={showAdminPassword ? "text" : "password"}
                          value={adminPassword}
                          onIonInput={(e) => handleAdminPasswordChange(e.detail.value!)}
                          placeholder="Enter your admin password"
                        />
                        <IonButtons slot="end">
                          <IonButton onClick={() => setShowAdminPassword(!showAdminPassword)}>
                            <IonIcon icon={showAdminPassword ? eyeOff : eye} />
                          </IonButton>
                        </IonButtons>
                      </IonItem>

                      {/* Password validation indicator */}
                      {adminPassword && (
                        <div style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center', 
                          margin: '10px 0',
                          color: isPasswordCorrect ? 'green' : 'red'
                        }}>
                          <IonIcon 
                            icon={isPasswordCorrect ? checkmarkCircle : closeCircle} 
                            style={{ marginRight: '8px' }}
                          />
                          <span>
                            {isPasswordCorrect ? 'Password is correct' : 'Password is incorrect'}
                          </span>
                        </div>
                      )}

                      <IonButton
                        onClick={handleAdminVerification}
                        expand="block"
                        style={{ margin: '10px 0' }}
                        disabled={!isPasswordCorrect}
                      >
                        Verify & Continue
                      </IonButton>

                      <IonButton
                        onClick={() => setShowAdminPasswordModal(false)}
                        expand="block"
                        fill="outline"
                      >
                        Cancel
                      </IonButton>
                    </div>
                  </IonContent>
                </IonModal>

                <VerificationModal
                  isOpen={showVerificationModal}
                  onClose={() => setShowVerificationModal(false)}
                  onConfirm={doRegister}
                  formData={formData}
                />

                <AlertBox
                  message={alertMessage}
                  isOpen={showAlert}
                  onClose={() => setShowAlert(false)}
                />
              </IonCardContent>
            </IonCard>
          </div>
        </div>
      </div>
    );
  }

  // Original code for browser
  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonButton onClick={handleBackClick}>
              <IonIcon icon={arrowBack} />
            </IonButton>
          </IonButtons>
          <IonTitle>Create User Account</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="registration-container">
        <div
          className="registration-background"
          style={{ backgroundImage: `url(${backgroundImg})` }}
        />

        <div className="registration-center-wrapper">
          <IonCard className="registration-card">
            <IonCardContent className="registration-content">
              <h1 className="registration-title">Create User Account</h1>

              <RegisterInput
                label="Username"
                type="text"
                placeholder="Enter a unique username"
                value={formData.username}
                onChange={(value) => handleInputChange('username', value)}
                className="registration-input"
              />

              <RegisterInput
                label="First Name"
                type="text"
                placeholder="Enter first name"
                value={formData.firstName}
                onChange={(value) => handleInputChange('firstName', value)}
                className="registration-input"
              />

              <RegisterInput
                label="Last Name"
                type="text"
                placeholder="Enter last name"
                value={formData.lastName}
                onChange={(value) => handleInputChange('lastName', value)}
                className="registration-input"
              />

              <RegisterInput
                label="Email"
                type="email"
                placeholder="youremail@gmail.com"
                value={formData.email}
                onChange={(value) => handleInputChange('email', value)}
                className="registration-input"
              />

              <RegisterInput
                label="Password"
                type="password"
                placeholder="Enter password"
                value={formData.password}
                onChange={(value) => handleInputChange('password', value)}
                className="registration-input"
                showToggle
              />

              <StrengthMeter
                password={formData.password}
                strength={passwordStrength}
              />

              <RegisterInput
                label="Confirm Password"
                type="password"
                placeholder="Confirm password"
                value={formData.confirmPassword}
                onChange={(value) => handleInputChange('confirmPassword', value)}
                className="registration-input"
                showToggle
              />

              <div className="registration-input">
                <IonLabel>Account Type</IonLabel>
                <IonSelect
                  value={formData.role}
                  onIonChange={e => handleInputChange('role', e.detail.value)}
                  interface="popover"
                >
                  <IonSelectOption value="user">User</IonSelectOption>
                  <IonSelectOption value="admin">Admin</IonSelectOption>
                </IonSelect>
              </div>

              <RegisterButton
                onClick={handleOpenVerificationModal}
                className="registration-button"
              >
                Register User
              </RegisterButton>

              <RegisterButton
                onClick={handleBackClick}
                className="registration-secondary-button"
                fill="clear"
              >
                Back to Users
              </RegisterButton>

              {/* Admin Password Verification Modal */}
              <IonModal isOpen={showAdminPasswordModal} onDidDismiss={() => {
                setShowAdminPasswordModal(false);
                setAdminPassword('');
                setIsPasswordCorrect(null);
                setShowAdminPassword(false);
              }}>
                <IonHeader>
                  <IonToolbar>
                    <IonTitle>Admin Verification Required</IonTitle>
                    <IonButtons slot="end">
                      <IonButton onClick={() => setShowAdminPasswordModal(false)}>Close</IonButton>
                    </IonButtons>
                  </IonToolbar>
                </IonHeader>
                <IonContent className="ion-padding">
                  <div style={{ textAlign: 'center', padding: '20px' }}>
                    <h2>Admin Verification</h2>
                    <p>Please enter your admin password to proceed with user registration.</p>
                    
                    <IonItem style={{ margin: '20px 0' }}>
                      <IonLabel position="stacked">Admin Password</IonLabel>
                      <IonInput
                        type={showAdminPassword ? "text" : "password"}
                        value={adminPassword}
                        onIonInput={(e) => handleAdminPasswordChange(e.detail.value!)}
                        placeholder="Enter your admin password"
                      />
                      <IonButtons slot="end">
                        <IonButton onClick={() => setShowAdminPassword(!showAdminPassword)}>
                          <IonIcon icon={showAdminPassword ? eyeOff : eye} />
                        </IonButton>
                      </IonButtons>
                    </IonItem>

                    {/* Password validation indicator */}
                    {adminPassword && (
                      <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        margin: '10px 0',
                        color: isPasswordCorrect ? 'green' : 'red'
                      }}>
                        <IonIcon 
                          icon={isPasswordCorrect ? checkmarkCircle : closeCircle} 
                          style={{ marginRight: '8px' }}
                        />
                        <span>
                          {isPasswordCorrect ? 'Password is correct' : 'Password is incorrect'}
                        </span>
                      </div>
                    )}

                    <IonButton
                      onClick={handleAdminVerification}
                      expand="block"
                      style={{ margin: '10px 0' }}
                      disabled={!isPasswordCorrect}
                    >
                      Verify & Continue
                    </IonButton>

                    <IonButton
                      onClick={() => setShowAdminPasswordModal(false)}
                      expand="block"
                      fill="outline"
                    >
                      Cancel
                    </IonButton>
                  </div>
                </IonContent>
              </IonModal>

              <VerificationModal
                isOpen={showVerificationModal}
                onClose={() => setShowVerificationModal(false)}
                onConfirm={doRegister}
                formData={formData}
              />

              <AlertBox
                message={alertMessage}
                isOpen={showAlert}
                onClose={() => setShowAlert(false)}
              />

              <IonLoading isOpen={isLoading} message="Creating account..." />
            </IonCardContent>
          </IonCard>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Register;