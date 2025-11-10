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
import { albumsOutline, bookOutline, trailSignOutline } from 'ionicons/icons';
import Classification from './Home.tabs/Classification';
import District from './Home.tabs/District';
import Kind from './Home.tabs/Kind';
import Subclass from './Home.tabs/Subclass';
import Taxrate from './Home.tabs/Taxrate';
import Barangay from './Home.tabs/Barangay';
import AssessmentLevel from './Home.tabs/AssesmentLevel';
import SubclassRate from './Home.tabs/SubclassRate';
import Structure from './Home.tabs/Structure';
import BuildingCode from './Home.tabs/BuildingCode';
import ActualUsed from './Home.tabs/ActualUsed';
import BuildingCom from './Home.tabs/BuildingCom';
import BuildingSubCom from './Home.tabs/BuildingSubCom';
import Equipment from './Home.tabs/Equipment';
import LandAdjustment from './Home.tabs/LandAdjustment';

const Home: React.FC = () => {
  const location = useLocation();

  const tabs = [
    { name: 'Classification', tab: 'classification', url: '/menu/home/classification', icon: bookOutline },
    { name: 'District', tab: 'district', url: '/menu/home/district', icon: trailSignOutline },
    { name: 'Kind', tab: 'kind', url: '/menu/home/kind', icon: albumsOutline },
  ]

  return (
    <IonPage>
      <IonContent fullscreen>
        <IonTabs>
          <IonRouterOutlet>
            <Route exact path="/menu/home/classification" component={Classification} />
            <Route exact path="/menu/home/district" component={District} />
            <Route exact path="/menu/home/kind" component={Kind} />
            <Route exact path="/menu/home/subclass" component={Subclass} />
            <Route exact path="/menu/home/taxrate" component={Taxrate} />
            <Route exact path="/menu/home/barangay" component={Barangay} />
            <Route exact path="/menu/home/assesmentlevel" component={AssessmentLevel} />
            <Route exact path="/menu/home/subclassrate" component={SubclassRate} />
            <Route exact path="/menu/home/structure" component={Structure} />
            <Route exact path="/menu/home/buildingcode" component={BuildingCode} />
            <Route exact path="/menu/home/actualused" component={ActualUsed} />
            <Route exact path="/menu/home/buildingcom" component={BuildingCom} />
            <Route exact path="/menu/home/buildingsubcom" component={BuildingSubCom} />
            <Route exact path="/menu/home/equipment" component={Equipment} />
            <Route exact path="/menu/home/landadjustment" component={LandAdjustment} />

            <Route exact path="/menu/home">
              <Redirect to="/menu/home/classification" />
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

export default Home;