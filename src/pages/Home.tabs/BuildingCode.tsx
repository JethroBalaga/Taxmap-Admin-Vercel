import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
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
    IonAlert,
    IonToast,
    IonButton,
    IonLabel,
    IonButtons,
    useIonRouter
} from '@ionic/react';
import { useLocation } from 'react-router-dom';
import { add, arrowUpCircle, trash, arrowBack } from 'ionicons/icons';
import './../../CSS/Setup.css';
import DynamicTable from '../../components/Globalcomponents/DynamicTable';
import { supabase } from '../../utils/supaBaseClient';
import BuildingCreateModal from '../../components/BuildingCodeModals/BuildingCreateModal';
import BuildingUpdateModal from '../../components/BuildingCodeModals/BuildingUpdateModal';

interface LocationState {
    structureData?: {
        structure_code: string;
        description: string;
        rate: string;
        created_at?: string;
    };
}

interface BuildingCodeItem {
    building_code: string;
    description: string;
    rate: number;
    created_at?: string;
}

const BuildingCode: React.FC = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showUpdateModal, setShowUpdateModal] = useState(false);
    const [buildingCodes, setBuildingCodes] = useState<BuildingCodeItem[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedRow, setSelectedRow] = useState<BuildingCodeItem | null>(null);
    const [showDeleteAlert, setShowDeleteAlert] = useState(false);
    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const [isError, setIsError] = useState(false);
    const searchRef = useRef<HTMLIonSearchbarElement>(null);
    const location = useLocation();
    const router = useIonRouter();
    const [structureCode, setStructureCode] = useState<string | null>(null);
    const [structureData, setStructureData] = useState<LocationState['structureData'] | null>(null);

    useEffect(() => {
        const queryParams = new URLSearchParams(location.search);
        const code = queryParams.get('structure_code');
        setStructureCode(code);
        setSelectedRow(null);
        setSearchTerm('');
        setBuildingCodes([]);

        const locationState = location.state as LocationState;
        setStructureData(locationState?.structureData || null);
    }, [location.search, location.state]);

    const fetchBuildingCodes = useCallback(async () => {
        if (!structureCode) return;

        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('building_codetbl')
                .select('building_code, description, rate, created_at')
                .eq('structure_code', structureCode)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setBuildingCodes(data || []);
        } catch (error) {
            console.error('Error fetching building codes:', error);
            setToastMessage('Failed to load building codes');
            setIsError(true);
            setShowToast(true);
        } finally {
            setIsLoading(false);
        }
    }, [structureCode]);

    useEffect(() => {
        if (structureCode) fetchBuildingCodes();
    }, [structureCode, fetchBuildingCodes]);

    const filteredData = useMemo(() => {
        if (!searchTerm.trim()) return buildingCodes;

        const term = searchTerm.toLowerCase();
        return buildingCodes.filter(item =>
            item.building_code.toLowerCase().includes(term) ||
            item.description.toLowerCase().includes(term) ||
            item.rate.toString().toLowerCase().includes(term)
        );
    }, [buildingCodes, searchTerm]);

    const handleRowClick = (rowData: BuildingCodeItem) => setSelectedRow(rowData);
    const handleAddClick = () => setShowCreateModal(true);
    const handleEditClick = () => selectedRow && setShowUpdateModal(true);
    const handleDeleteClick = () => selectedRow && setShowDeleteAlert(true);
    const handleBackClick = () => router.push('/menu/home/structure', 'back');

    const handleDeleteConfirm = async () => {
        if (!selectedRow) return;

        setIsLoading(true);
        try {
            const { error } = await supabase
                .from('building_codetbl')
                .delete()
                .eq('building_code', selectedRow.building_code)
                .eq('structure_code', structureCode);
            if (error) throw error;

            setToastMessage(`${selectedRow.description} deleted successfully!`);
            setSelectedRow(null);
            fetchBuildingCodes();
        } catch (error) {
            console.error('Error deleting building code:', error);
            setToastMessage('Failed to delete building code');
            setIsError(true);
        } finally {
            setIsLoading(false);
            setShowDeleteAlert(false);
            setShowToast(true);
        }
    };

    const handleBuildingCodeCreated = () => {
        fetchBuildingCodes();
        setShowCreateModal(false);
        setToastMessage('Building code created successfully!');
        setShowToast(true);
    };

    const handleBuildingCodeUpdated = () => {
        fetchBuildingCodes();
        setSelectedRow(null);
        setShowUpdateModal(false);
        setToastMessage('Building code updated successfully!');
        setShowToast(true);
    };

    const iconButtons = [
        { icon: add, onClick: handleAddClick, disabled: !structureCode, title: "Add Building Code" },
        { icon: arrowUpCircle, onClick: handleEditClick, disabled: !selectedRow, title: "Edit Building Code" },
        { icon: trash, onClick: handleDeleteClick, disabled: !selectedRow, title: "Delete Building Code" }
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
                    <IonTitle>Building Codes</IonTitle>
                </IonToolbar>
                {structureData && (
                    <IonToolbar>
                        <IonLabel className="structure-label">
                            Structure: {structureData.structure_code} - {structureData.description}
                        </IonLabel>
                    </IonToolbar>
                )}
            </IonHeader>

            <IonGrid>
                <IonRow>
                    <IonCol size="12" className="search-container">
                        <IonSearchbar
                            ref={searchRef}
                            placeholder="Search building codes..."
                            value={searchTerm}
                            onIonInput={(e) => setSearchTerm(e.detail.value || '')}
                            debounce={0}
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
                            title="Building Codes"
                            keyField="building_code"
                            onRowClick={handleRowClick}
                            selectedRow={selectedRow} 
                        />
                    </IonCol>
                </IonRow>
            </IonGrid>

            {structureCode && (
                <BuildingCreateModal
                    isOpen={showCreateModal}
                    onClose={() => setShowCreateModal(false)}
                    onBuildingCodeCreated={handleBuildingCodeCreated}
                    structure_code={structureCode}
                />
            )}

            <BuildingUpdateModal
                isOpen={showUpdateModal}
                onClose={() => setShowUpdateModal(false)}
                onBuildingCodeUpdated={handleBuildingCodeUpdated}
                buildingCodeData={selectedRow}
            />

            <IonAlert
                isOpen={showDeleteAlert}
                onDidDismiss={() => setShowDeleteAlert(false)}
                header="Confirm Delete"
                message={`Are you sure you want to delete ${selectedRow?.description}?`}
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

export default BuildingCode;