import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  IonContent,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonGrid,
  IonRow,
  IonCol,
  IonIcon,
  IonLoading,
  IonSearchbar,
  IonToast,
  IonButtons,
  IonButton,
  useIonRouter
} from '@ionic/react';
import { businessOutline, readerOutline, buildOutline, earthOutline, arrowBack } from 'ionicons/icons';
import './../../CSS/Setup2.css';
import DynamicTable from '../../components/Globalcomponents/DynamicTable';
import { supabase } from '../../utils/supaBaseClient';

interface KindItem {
  kind_id: number;
  description: string;
  created_at?: string;
}

const Kind: React.FC = () => {
  const [kinds, setKinds] = useState<KindItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRow, setSelectedRow] = useState<KindItem | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const searchRef = useRef<HTMLIonSearchbarElement>(null);
  const router = useIonRouter();

  const isBuilding = selectedRow?.description.toUpperCase() === 'BUILDING';
  const isMachinery = selectedRow?.description.toUpperCase() === 'MACHINERY';
  const isLand = selectedRow?.description.toUpperCase() === 'LAND';

  const fetchKinds = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('kindtbl')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setKinds(data || []);
    } catch {
      setToastMessage('Failed to load kinds');
      setIsError(true);
      setShowToast(true);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchKinds();
  }, []);

  const filteredData = useMemo(() => {
    if (!searchTerm.trim()) return kinds;
    const term = searchTerm.toLowerCase();
    return kinds.filter(item =>
      item.kind_id.toString().includes(term) ||
      item.description.toLowerCase().includes(term)
    );
  }, [kinds, searchTerm]);

  const handleRowClick = (rowData: KindItem) => setSelectedRow(rowData);

  const handleManageAssessmentLevels = () => {
    if (!selectedRow) return;
    router.push(`/menu/home/assesmentlevel?kind_id=${selectedRow.kind_id}`, 'forward', 'push');
  };

  const handleBuildingStructuralType = () => {
    if (!selectedRow || !isBuilding) return;
    router.push(`/menu/home/structure?kind_id=${selectedRow.kind_id}`, 'forward', 'push');
  };

  const handleManageEquipment = () => {
    if (!selectedRow || !isMachinery) return;
    router.push(`/menu/home/equipment?kind_id=${selectedRow.kind_id}`, 'forward', 'push');
  };

  const handleLandManagement = () => {
    if (!selectedRow || !isLand) return;
    router.push(`/menu/home/landadjustment?kind_id=${selectedRow.kind_id}`, 'forward', 'push');
  };

  const handleBackClick = () => router.push('/menu', 'back');

  const iconButtons = [
    { icon: readerOutline, onClick: handleManageAssessmentLevels, disabled: !selectedRow, title: "Manage Assessment Levels" },
    { icon: businessOutline, onClick: handleBuildingStructuralType, disabled: !isBuilding, title: "Building Structural Type" },
    { icon: buildOutline, onClick: handleManageEquipment, disabled: !isMachinery, title: "Manage Equipment" },
    { icon: earthOutline, onClick: handleLandManagement, disabled: !isLand, title: "Land Management" }
  ];

  return (
    <IonContent fullscreen>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonButton onClick={handleBackClick}>
              <IonIcon icon={arrowBack} />
            </IonButton>
          </IonButtons>
          <IonTitle>Kind Setup</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonGrid>
        <IonRow>
          <IonCol size="12" className="search-container">
            <IonSearchbar
              ref={searchRef}
              placeholder="Search kinds..."
              onIonInput={e => setSearchTerm(e.detail.value || '')}
              debounce={200}
            />
            <div className="icon-group">
              {iconButtons.map((btn, idx) => (
                <IonIcon
                  key={idx}
                  icon={btn.icon}
                  className={`icon-yellow ${btn.disabled ? 'icon-disabled' : ''}`}
                  onClick={btn.disabled ? undefined : btn.onClick}
                  title={btn.title}
                />
              ))}
            </div>
          </IonCol>
        </IonRow>

        <IonRow>
          <IonCol size="12">
            <DynamicTable
              data={filteredData}
              title="Kinds"
              keyField="kind_id"
              onRowClick={handleRowClick}
              selectedRow={selectedRow}
            />
          </IonCol>
        </IonRow>
      </IonGrid>

      <IonLoading isOpen={isLoading} message="Loading..." />

      <IonToast
        isOpen={showToast}
        onDidDismiss={() => setShowToast(false)}
        message={toastMessage}
        duration={3000}
        color={isError ? 'danger' : 'success'}
      />
    </IonContent>
  );
};

export default Kind;