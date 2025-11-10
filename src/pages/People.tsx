import React from 'react';
import {
  IonIcon,
  IonLabel,
  IonRouterOutlet,
  IonTabBar,
  IonTabButton,
  IonTabs,
  IonPage,
  IonContent
} from '@ionic/react';
import { Route, Redirect, useLocation } from 'react-router';
import { documentOutline, personCircleOutline, phonePortraitOutline } from 'ionicons/icons';
import Declarant from './People.tabs/Declarant';
import User from './People.tabs/User';
import Register from './Register';
import DeviceManagement from './People.tabs/DeviceManagement';

const People: React.FC = () => {
  const location = useLocation();

  const tabs = [
    { name: 'Declarant', tab: 'declarant', url: '/menu/people/declarant', icon: documentOutline },
    { name: 'User', tab: 'user', url: '/menu/people/user', icon: personCircleOutline },
    { name: 'Devices', tab: 'devices', url: '/menu/people/devices', icon: phonePortraitOutline },
  ]
  
  return (
    <IonPage>
      <IonContent fullscreen>
        <IonTabs>
          <IonRouterOutlet>
            <Route exact path="/menu/people/declarant" component={Declarant} />
            <Route exact path="/menu/people/user" component={User} />
            <Route exact path="/menu/people/register" component={Register} />
            <Route exact path="/menu/people/devices" component={DeviceManagement} /> 
            
            <Route exact path="/menu/people">
              <Redirect to="/menu/people/declarant" />
            </Route>
          </IonRouterOutlet>

          <IonTabBar slot="bottom">
            {tabs.map((item, index) => (
              <IonTabButton 
                key={index} 
                tab={item.tab} 
                href={item.url}
              >
                <IonIcon icon={item.icon} />
                <IonLabel>{item.name}</IonLabel>
              </IonTabButton>
            ))}
          </IonTabBar>
        </IonTabs>
      </IonContent>
    </IonPage>
  );
};

export default People;