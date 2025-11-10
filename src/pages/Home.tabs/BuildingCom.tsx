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
    IonButtons,
    useIonRouter
} from '@ionic/react';
import { add, arrowUpCircle, trash, arrowBack, appsOutline } from 'ionicons/icons';
import { useLocation } from 'react-router-dom';
import './../../CSS/Setup.css';
import DynamicTable from '../../components/Globalcomponents/DynamicTable';
import BuildingComCreateModal from '../../components/BuildingComModals/BuildingComCreateModal';
import BuildingComUpdateModal from '../../components/BuildingComModals/BuildingComUpdateModal';
import { supabase } from '../../utils/supaBaseClient';

// Define the type for building component data
interface BuildingComItem {
    building_com_id: string;
    description: string;
    created_at?: string;
}

const BuildingCom: React.FC = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showUpdateModal, setShowUpdateModal] = useState(false);
    const [buildingComponents, setBuildingComponents] = useState<BuildingComItem[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedRow, setSelectedRow] = useState<BuildingComItem | null>(null);
    const [showDeleteAlert, setShowDeleteAlert] = useState(false);
    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const [isError, setIsError] = useState(false);
    const searchRef = useRef<HTMLIonSearchbarElement>(null);
    const router = useIonRouter();
    const location = useLocation();

    // Reset state when location changes (including tab navigation)
    useEffect(() => {
        setSelectedRow(null);
        setSearchTerm('');
        // Note: We don't reset buildingComponents here since we want to keep the data
        // but we reset selection and search when navigating
    }, [location.pathname]);

    // Fetch building components from Supabase
    const fetchBuildingComponents = useCallback(async () => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('building_componenttbl')
                .select('building_com_id, description, created_at')
                .order('created_at', { ascending: false });

            if (error) throw error;

            setBuildingComponents(data || []);
        } catch (error: any) {
            console.error('Error fetching building components:', error);
            setToastMessage(error.message || 'Failed to load building components');
            setIsError(true);
            setShowToast(true);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchBuildingComponents();
    }, [fetchBuildingComponents]);

    // Filter data based on search term
    const filteredData = useMemo(() => {
        if (!searchTerm.trim()) return buildingComponents;

        const term = searchTerm.toLowerCase();
        return buildingComponents.filter(item =>
            item.building_com_id.toLowerCase().includes(term) ||
            item.description.toLowerCase().includes(term)
        );
    }, [buildingComponents, searchTerm]);

    const handleRowClick = (rowData: BuildingComItem) => {
        setSelectedRow(rowData);
    };

    const handleAddClick = () => {
        setShowCreateModal(true);
    };

    const handleEditClick = () => {
        if (selectedRow) {
            setShowUpdateModal(true);
        }
    };

    const handleDeleteClick = () => {
        if (!selectedRow) return;
        setShowDeleteAlert(true);
    };

    const handleManageSubcomponents = () => {
        if (selectedRow) {
            // Navigate to BuildingSubCom with the selected building component data
            router.push(`/menu/home/buildingsubcom?building_com_id=${selectedRow.building_com_id}`, 'forward', 'push');
        }
    };

    const handleBackClick = () => {
        // Navigate back to the structure page
        router.push('/menu/home/structure', 'back');
    };

    const handleDeleteConfirm = async () => {
        if (!selectedRow) return;

        setIsLoading(true);
        try {
            const { error } = await supabase
                .from('building_componenttbl')
                .delete()
                .eq('building_com_id', selectedRow.building_com_id);

            if (error) throw error;

            await fetchBuildingComponents();
            setSelectedRow(null);
            setToastMessage('Building component deleted successfully!');
            setShowToast(true);
        } catch (error: any) {
            console.error('Error deleting building component:', error);
            setToastMessage(error.message || 'Failed to delete building component');
            setIsError(true);
            setShowToast(true);
        } finally {
            setIsLoading(false);
            setShowDeleteAlert(false);
        }
    };

    const handleBuildingComCreated = () => {
        fetchBuildingComponents();
        setShowCreateModal(false);
        setToastMessage('Building component created successfully!');
        setShowToast(true);
    };

    const handleBuildingComUpdated = () => {
        fetchBuildingComponents();
        setSelectedRow(null);
        setShowUpdateModal(false);
        setToastMessage('Building component updated successfully!');
        setShowToast(true);
    };

    const iconButtons = [
        { icon: add, onClick: handleAddClick, disabled: false, title: "Add Building Component" },
        { icon: arrowUpCircle, onClick: handleEditClick, disabled: !selectedRow, title: "Edit Building Component" },
        { icon: trash, onClick: handleDeleteClick, disabled: !selectedRow, title: "Delete Building Component" },
        { icon: appsOutline, onClick: handleManageSubcomponents, disabled: !selectedRow, title: "Manage Subcomponents" }
    ];

    return (
        <>
            <IonHeader>
                <IonToolbar>
                    <IonButtons slot="start">
                        <IonButton onClick={handleBackClick}>
                            <IonIcon icon={arrowBack} />
                        </IonButton>
                    </IonButtons>
                    <IonTitle>Building Component Setup</IonTitle>
                </IonToolbar>
            </IonHeader>

            <IonContent fullscreen>
                <IonGrid>
                    <IonRow>
                        <IonCol size="12" className="search-container">
                            <IonSearchbar
                                ref={searchRef}
                                placeholder="Search building components..."
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
                                title="Building Components"
                                keyField="building_com_id"
                                onRowClick={handleRowClick}
                                selectedRow={selectedRow} 
                            />
                        </IonCol>
                    </IonRow>
                </IonGrid>

                {/* Create Modal */}
                <BuildingComCreateModal
                    isOpen={showCreateModal}
                    onClose={() => setShowCreateModal(false)}
                    onBuildingComCreated={handleBuildingComCreated}
                />

                {/* Update Modal */}
                {selectedRow && (
                    <BuildingComUpdateModal
                        isOpen={showUpdateModal}
                        onClose={() => setShowUpdateModal(false)}
                        onBuildingComUpdated={handleBuildingComUpdated}
                        buildingComData={selectedRow}
                    />
                )}

                {/* Delete Confirmation */}
                <IonAlert
                    isOpen={showDeleteAlert}
                    onDidDismiss={() => setShowDeleteAlert(false)}
                    header="Confirm Delete"
                    message={`Are you sure you want to delete "${selectedRow?.description}"?`}
                    buttons={[
                        {
                            text: 'Cancel',
                            role: 'cancel',
                            cssClass: 'secondary'
                        },
                        {
                            text: 'Delete',
                            handler: handleDeleteConfirm,
                            cssClass: 'danger'
                        }
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
        </>
    );
};

export default BuildingCom;