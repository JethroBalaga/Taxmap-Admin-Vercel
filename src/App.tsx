import { Redirect, Route } from 'react-router-dom';
import { IonApp, IonRouterOutlet, setupIonicReact } from '@ionic/react';
import { IonReactHashRouter } from '@ionic/react-router';
import { useEffect } from 'react';

/* Your CSS imports */
import '@ionic/react/css/core.css';
import '@ionic/react/css/normalize.css';
import '@ionic/react/css/structure.css';
import '@ionic/react/css/typography.css';
import '@ionic/react/css/padding.css';
import '@ionic/react/css/float-elements.css';
import '@ionic/react/css/text-alignment.css';
import '@ionic/react/css/text-transformation.css';
import '@ionic/react/css/flex-utils.css';
import '@ionic/react/css/display.css';
import '@ionic/react/css/palettes/dark.system.css';
import './theme/variables.css';

import Login from './pages/Login';
import Menu from './pages/Menu';
import AdminRegister from './pages/AdminRegistration';

setupIonicReact();

const App: React.FC = () => {
  useEffect(() => {
    const clearInvalidTokens = () => {
      try {
        // Only clear specific Supabase tokens if they're corrupted
        const token = localStorage.getItem('supabase.auth.token');
        if (token) {
          try {
            JSON.parse(token);
            console.log('Valid token found, keeping it');
            return; // Token is valid, don't clear
          } catch (e) {
            console.log('Invalid token format, clearing it');
          }
        }
        
        // Only clear specific problematic tokens
        const tokensToRemove = [
          'supabase.auth.token',
          'sb-auth-token'
        ];
        
        tokensToRemove.forEach(token => {
          localStorage.removeItem(token);
          sessionStorage.removeItem(token);
        });
        
        console.log('Cleared invalid auth tokens');
      } catch (error) {
        console.log('No auth tokens to clear or error clearing:', error);
      }
    };

    clearInvalidTokens();
  }, []);

  return (
    <IonApp>
      <IonReactHashRouter>
        <IonRouterOutlet>
          <Route exact path="/" component={Login} />
          <Route exact path="/adminregistration" component={AdminRegister}/>
          <Route path="/menu" component={Menu} />
        </IonRouterOutlet>
      </IonReactHashRouter>
    </IonApp>
  );
};

export default App;