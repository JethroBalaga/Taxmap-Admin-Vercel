import {
  IonButton,
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  useIonRouter,
  IonInput,
  IonInputPasswordToggle,
  IonAlert,
  IonToast,
  IonCard,
  IonCardContent,
  IonAvatar,
} from '@ionic/react';
import { useState, useEffect } from 'react';
import { supabase } from '../utils/supaBaseClient';
import Logo from '../Images/Flag_of_Manolo_Fortich,_Bukidnon.png';
import backgroundImg from '../Images/Background.jpg';
import '../CSS/Login.css';

const AlertBox: React.FC<{ message: string; isOpen: boolean; onClose: () => void }> = ({ message, isOpen, onClose }) => {
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

const Login: React.FC = () => {
  const navigation = useIonRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [alertMessage, setAlertMessage] = useState('');
  const [showAlert, setShowAlert] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [hasExistingAdmins, setHasExistingAdmins] = useState(false);

  // Check if admins exist on component mount
  useEffect(() => {
    checkExistingAdmins();
  }, []);

  const checkExistingAdmins = async () => {
    try {
      const { data, error } = await supabase
        .from('admins')
        .select('user_id')
        .limit(1);

      if (!error && data && data.length > 0) {
        setHasExistingAdmins(true);
      }
    } catch (error) {
      console.error('Error checking existing admins:', error);
    }
  };

  const doLogin = async () => {
    try {
      let resolvedEmail = email.trim();

      // 1. Check if the input is a username instead of email
      if (!resolvedEmail.includes('@')) {
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('user_email, suspended')
          .eq('username', resolvedEmail)
          .single();

        if (userError || !userData) {
          setAlertMessage('Username not found. Please check and try again.');
          setShowAlert(true);
          return;
        }

        // Check if user is suspended
        if (userData.suspended) {
          setAlertMessage('Your account has been suspended. Please contact administrator.');
          setShowAlert(true);
          return;
        }

        resolvedEmail = userData.user_email;
      }

      // 2. Check if the email exists in the admins table AND check if user is suspended
      const { data: adminData, error: adminError } = await supabase
        .from('admins')
        .select('user_id, user_email')
        .eq('user_email', resolvedEmail)
        .single();

      if (adminError || !adminData) {
        setAlertMessage('Access restricted to admin users only.');
        setShowAlert(true);
        return;
      }

      // 3. Check if the user is suspended in the users table
      const { data: userData, error: userCheckError } = await supabase
        .from('users')
        .select('suspended')
        .eq('user_email', resolvedEmail)
        .single();

      if (!userCheckError && userData && userData.suspended) {
        setAlertMessage('Your account has been suspended. Please contact administrator.');
        setShowAlert(true);
        return;
      }

      // 4. Verify credentials through Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: resolvedEmail,
        password
      });

      if (authError) {
        if (authError.message.includes('Invalid login credentials')) {
          setAlertMessage('Incorrect email/username or password.');
        } else {
          setAlertMessage(authError.message);
        }
        setShowAlert(true);
        return;
      }

      // 5. Insert login activity into admin_activity_logs
      const { error: logError } = await supabase.from('admin_activity_logs').insert([
        {
          admin_id: adminData.user_id,
          admin_email: resolvedEmail,
          activity_type: 'LOGIN',
        },
      ]);

      if (logError) {
        console.error('Failed to log admin login activity:', logError.message);
      }

      // 6. Login successful - Navigate to menu (let the router handle the default route)
      console.log('Login successful! Redirecting...');
      setShowToast(true);
      
      setTimeout(() => {
        // This will let your router handle the default route (which seems to be /menu/dashboard)
        window.location.hash = '#/menu';
        console.log('Navigation initiated to /menu');
      }, 1500);

    } catch (error) {
      setAlertMessage('An unexpected error occurred. Please try again.');
      setShowAlert(true);
      console.error('Login error:', error);
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle className="login-title">Admin Login</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className='ion-padding' fullscreen>
        <div
          className="login-background"
          style={{ backgroundImage: `url(${backgroundImg})` }}
        />

        <div className="login-container">
          <IonCard className="login-card">
            <IonCardContent>
              <div className="login-content">
                <IonAvatar className="login-avatar">
                  <img src={Logo} alt="Logo" />
                </IonAvatar>

                <h1 className="login-title">TaxMap Admin</h1>

                <IonInput
                  label="Email or Username"
                  labelPlacement="floating"
                  fill="outline"
                  type="email"
                  placeholder="Enter Email or Username"
                  value={email}
                  onIonChange={e => setEmail(e.detail.value!)}
                  className="login-input"
                />

                <IonInput
                  label="Password"
                  labelPlacement="floating"
                  fill="outline"
                  type="password"
                  placeholder="Password"
                  value={password}
                  onIonChange={e => setPassword(e.detail.value!)}
                  className="login-input"
                >
                  <IonInputPasswordToggle slot="end" color="dark" />
                </IonInput>

                <IonButton
                  onClick={doLogin}
                  expand="block"
                  shape="round"
                  color="warning"
                  className="login-button"
                >
                  Login
                </IonButton>

                {/* Only show "Add First Admin" if no admins exist */}
                {!hasExistingAdmins && (
                  <IonButton
                    routerLink="/adminregistration"
                    expand="block"
                    fill="clear"
                    shape="round"
                    style={{
                      '--color': 'white',
                      '--background': 'transparent',
                      '--border-color': 'transparent'
                    }}
                    className="login-secondary-button"
                  >
                    Add First Admin
                  </IonButton>
                )}
              </div>
            </IonCardContent>
          </IonCard>
        </div>

        <AlertBox message={alertMessage} isOpen={showAlert} onClose={() => setShowAlert(false)} />

        <IonToast
          isOpen={showToast}
          onDidDismiss={() => setShowToast(false)}
          message="Login successful! Redirecting..."
          duration={1500}
          position="top"
          color="primary"
        />
      </IonContent>
    </IonPage>
  );
};

export default Login;