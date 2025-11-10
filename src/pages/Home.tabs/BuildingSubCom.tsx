import React, { useState, useRef, useMemo, useEffect, useCallback } from 'react';
import {
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonGrid,
    IonRow,
    IonCol,
    IonIcon,
    IonLoading,
    IonSearchbar,
    IonButton,
    IonButtons,
    IonLabel,
    IonToast,
    IonAlert,
    useIonRouter
} from '@ionic/react';
import { add, arrowUpCircle, trash, arrowBack, checkmarkCircle, closeCircle } from 'ionicons/icons';
import { useLocation } from 'react-router-dom';
import './../../CSS/Setup.css';
import DynamicTable from '../../components/Globalcomponents/DynamicTable';
import { supabase } from '../../utils/supaBaseClient';
import BuildingSubComCreateModal from '../../components/BuildingSubcomModals/BuildingSubComCreateModal';
import BuildingSubComUpdateModal from '../../components/BuildingSubcomModals/BuildingSubComUpdateModal';

interface BuildingSubComItem {
    building_subcom_id: string;
    description: string;
    rate: number;
    building_com_id: string;
    percent: boolean;
    created_at?: string;
}

interface LocationState {
    buildingComData?: {
        building_com_id: string;
        description: string;
        created_at?: string;
    };
}

const PercentStatus: React.FC<{ percent: boolean }> = ({ percent }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {percent ? (
            <>
                <IonIcon icon={checkmarkCircle} style={{ color: '#28a745', fontSize: '18px' }} />
                <span style={{ color: '#28a745', fontWeight: 500 }}>Percent</span>
            </>
        ) : (
            <>
                <IonIcon icon={closeCircle} style={{ color: '#6c757d', fontSize: '18px' }} />
                <span style={{ color: '#6c757d' }}>Fixed</span>
            </>
        )}
    </div>
);

const BuildingSubCom: React.FC = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showUpdateModal, setShowUpdateModal] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [buildingSubComponents, setBuildingSubComponents] = useState<BuildingSubComItem[]>([]);
    const [selectedRow, setSelectedRow] = useState<BuildingSubComItem | null>(null);
    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const [isError, setIsError] = useState(false);
    const [showDeleteAlert, setShowDeleteAlert] = useState(false);
    const [buildingComId, setBuildingComId] = useState<string | null>(null);
    const [buildingComData, setBuildingComData] = useState<LocationState['buildingComData'] | null>(null);
    const searchRef = useRef<HTMLIonSearchbarElement>(null);
    const router = useIonRouter();
    const location = useLocation();

    useEffect(() => {
        const queryParams = new URLSearchParams(location.search);
        const comId = queryParams.get('building_com_id');
        setBuildingComId(comId);
        setSelectedRow(null);
        setSearchTerm('');
        setBuildingSubComponents([]);

        const locationState = location.state as LocationState;
        setBuildingComData(locationState?.buildingComData || null);
    }, [location.search, location.state]);

    const fetchBuildingSubComponents = useCallback(async () => {
        if (!buildingComId) return;
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('building_subcomponenttbl')
                .select('building_subcom_id, description, rate, building_com_id, percent, created_at')
                .eq('building_com_id', buildingComId)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setBuildingSubComponents(data || []);
        } catch (error: any) {
            console.error(error);
            setToastMessage(error.message || 'Failed to load building sub-components');
            setIsError(true);
            setShowToast(true);
        } finally {
            setIsLoading(false);
        }
    }, [buildingComId]);

    useEffect(() => {
        if (buildingComId) fetchBuildingSubComponents();
    }, [buildingComId, fetchBuildingSubComponents]);

    const filteredData = useMemo(() => {
        if (!searchTerm.trim()) return buildingSubComponents;
        const term = searchTerm.toLowerCase();
        return buildingSubComponents.filter(item =>
            item.building_subcom_id.toLowerCase().includes(term) ||
            item.description.toLowerCase().includes(term) ||
            item.rate.toString().includes(term) ||
            item.building_com_id.toLowerCase().includes(term) ||
            (item.percent ? 'percent' : 'fixed').includes(term)
        );
    }, [buildingSubComponents, searchTerm]);

    const handleRowClick = (rowData: BuildingSubComItem) => setSelectedRow(rowData);
    const handleAddClick = () => setShowCreateModal(true);
    const handleEditClick = () => selectedRow && setShowUpdateModal(true);
    const handleDeleteClick = () => selectedRow && setShowDeleteAlert(true);
    const handleBackClick = () => router.push('/menu/home/buildingcom', 'back');

    const handleDeleteConfirm = async () => {
        if (!selectedRow || !buildingComId) return;
        setIsLoading(true);
        try {
            const { error } = await supabase
                .from('building_subcomponenttbl')
                .delete()
                .eq('building_subcom_id', selectedRow.building_subcom_id)
                .eq('building_com_id', buildingComId);
            if (error) throw error;

            await fetchBuildingSubComponents();
            setSelectedRow(null);
            setToastMessage(`"${selectedRow.description}" deleted successfully!`);
            setShowToast(true);
        } catch (error: any) {
            console.error(error);
            setToastMessage(error.message || 'Failed to delete building sub-component');
            setIsError(true);
            setShowToast(true);
        } finally {
            setIsLoading(false);
            setShowDeleteAlert(false);
        }
    };

    const handleBuildingSubComCreated = () => {
        fetchBuildingSubComponents();
        setShowCreateModal(false);
        setToastMessage('Building Sub-Component created successfully!');
        setShowToast(true);
    };

    const handleBuildingSubComUpdated = () => {
        fetchBuildingSubComponents();
        setSelectedRow(null);
        setShowUpdateModal(false);
        setToastMessage('Building Sub-Component updated successfully!');
        setShowToast(true);
    };

    const iconButtons = [
        { icon: add, onClick: handleAddClick, disabled: !buildingComId, title: "Add Building Sub-Component" },
        { icon: arrowUpCircle, onClick: handleEditClick, disabled: !selectedRow, title: "Edit Building Sub-Component" },
        { icon: trash, onClick: handleDeleteClick, disabled: !selectedRow, title: "Delete Building Sub-Component" }
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
                    <IonTitle>Building Sub-Components</IonTitle>
                </IonToolbar>
                {buildingComData && (
                    <IonToolbar>
                        <IonLabel className="structure-label">
                            Component: {buildingComData.building_com_id} - {buildingComData.description}
                        </IonLabel>
                    </IonToolbar>
                )}
            </IonHeader>

            <IonGrid>
                <IonRow>
                    <IonCol size="12" className="search-container">
                        <IonSearchbar
                            ref={searchRef}
                            placeholder="Search building sub-components..."
                            value={searchTerm}
                            onIonInput={(e) => setSearchTerm(e.detail.value || '')}
                            debounce={300}
                        />
                        <div className="icon-group">
                            {iconButtons.map((btn, index) => (
                                <IonIcon
                                    key={index}
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
                            title="Building Sub-Components"
                            keyField="building_subcom_id"
                            onRowClick={handleRowClick}
                            selectedRow={selectedRow}
                        />
                    </IonCol>
                </IonRow>
            </IonGrid>

            {buildingComId && (
                <BuildingSubComCreateModal
                    isOpen={showCreateModal}
                    onClose={() => setShowCreateModal(false)}
                    onBuildingSubComCreated={handleBuildingSubComCreated}
                    building_com_id={buildingComId}
                />
            )}

            {selectedRow && (
                <BuildingSubComUpdateModal
                    isOpen={showUpdateModal}
                    onClose={() => setShowUpdateModal(false)}
                    onBuildingSubComUpdated={handleBuildingSubComUpdated}
                    buildingSubComData={selectedRow}
                />
            )}

            <IonAlert
                isOpen={showDeleteAlert}
                onDidDismiss={() => setShowDeleteAlert(false)}
                header="Confirm Delete"
                message={`Are you sure you want to delete "${selectedRow?.description}"?`}
                buttons={[
                    { text: 'Cancel', role: 'cancel', cssClass: 'secondary' },
                    { text: 'Delete', handler: handleDeleteConfirm, cssClass: 'danger' }
                ]}
            />

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

export default BuildingSubCom;