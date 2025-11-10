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
    IonButtons,
    IonButton,
    useIonRouter
} from '@ionic/react';
import { useLocation } from 'react-router-dom';
import { add, arrowUpCircle, constructOutline, cubeOutline, trash, arrowBack } from 'ionicons/icons';
import './../../CSS/Setup.css';
import DynamicTable from '../../components/Globalcomponents/DynamicTable';
import { supabase } from '../../utils/supaBaseClient';
import StructureCreateModal from '../../components/StructureModals/StructureCreateModal';
import StructureUpdateModal from '../../components/StructureModals/StructureUpdateModal';

// Define the type for structure data
interface StructureItem {
    structure_code: string;
    description: string;
    eff_date: string;
    created_at?: string;
}

const Structure: React.FC = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showUpdateModal, setShowUpdateModal] = useState(false);
    const [structures, setStructures] = useState<StructureItem[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedRow, setSelectedRow] = useState<StructureItem | null>(null);
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
    }, [location.pathname]);

    // Fetch structures
    const fetchStructures = useCallback(async () => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('structure_typetbl')
                .select('structure_code, description, eff_date, created_at')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setStructures(data || []);
        } catch (error) {
            console.error('Error fetching structures:', error);
            setToastMessage('Failed to load structures');
            setIsError(true);
            setShowToast(true);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchStructures();
    }, [fetchStructures]);

    // Filter data based on search term
    const filteredData = useMemo(() => {
        if (!searchTerm.trim()) return structures;

        const term = searchTerm.toLowerCase();
        return structures.filter(item =>
            item.structure_code.toLowerCase().includes(term) ||
            item.description.toLowerCase().includes(term) ||
            item.eff_date.toLowerCase().includes(term)
        );
    }, [structures, searchTerm]);

    const handleRowClick = (rowData: StructureItem) => setSelectedRow(rowData);

    const handleAddClick = () => setShowCreateModal(true);
    const handleEditClick = () => selectedRow && setShowUpdateModal(true);
    const handleDeleteClick = () => selectedRow && setShowDeleteAlert(true);

    const handleConstructClick = () => {
        if (!selectedRow) return;
        // Method 1: Using query parameters only (recommended)
        router.push(`/menu/home/buildingcode?structure_code=${selectedRow.structure_code}`, 'forward');
        
        // Method 2: If you need to pass complex data, use a different approach
        // You can store the data in a context, service, or localStorage temporarily
        // Or fetch it again in the target component using the structure_code
    };

    const handleCubeOutlineClick = () => {
        router.push('/menu/home/buildingcom', 'forward');
    };

    const handleBackClick = () => router.push('/menu/home', 'back');

    const handleDeleteConfirm = async () => {
        if (!selectedRow) return;
        setIsLoading(true);
        try {
            const { error } = await supabase
                .from('structure_typetbl')
                .delete()
                .eq('structure_code', selectedRow.structure_code);

            if (error) throw error;

            setToastMessage(`${selectedRow.description} deleted successfully!`);
            setSelectedRow(null);
            fetchStructures();
        } catch (error) {
            setToastMessage('Failed to delete structure');
            setIsError(true);
            console.error('Error deleting structure:', error);
        } finally {
            setIsLoading(false);
            setShowDeleteAlert(false);
            setShowToast(true);
        }
    };

    const handleStructureCreated = () => {
        fetchStructures();
        setShowCreateModal(false);
        setToastMessage('Structure created successfully!');
        setShowToast(true);
    };

    const handleStructureUpdated = () => {
        fetchStructures();
        setSelectedRow(null);
        setShowUpdateModal(false);
        setToastMessage('Structure updated successfully!');
        setShowToast(true);
    };

    const iconButtons = [
        { icon: add, onClick: handleAddClick, disabled: false, title: "Add Structure" },
        { icon: arrowUpCircle, onClick: handleEditClick, disabled: !selectedRow, title: "Edit Structure" },
        { icon: trash, onClick: handleDeleteClick, disabled: !selectedRow, title: "Delete Structure" },
        { icon: constructOutline, onClick: handleConstructClick, disabled: !selectedRow, title: "Building Code" },
        { icon: cubeOutline, onClick: handleCubeOutlineClick, disabled: false, title: "Building Component" }
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
                    <IonTitle>Structure Setup</IonTitle>
                </IonToolbar>
            </IonHeader>

            <IonGrid>
                <IonRow>
                    <IonCol size="12" className="search-container">
                        <IonSearchbar
                            ref={searchRef}
                            placeholder="Search structures..."
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
                            title="Structures"
                            keyField="structure_code"
                            onRowClick={handleRowClick}
                            selectedRow={selectedRow} 
                        />
                    </IonCol>
                </IonRow>
            </IonGrid>

            {/* Structure Create Modal */}
            <StructureCreateModal
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                onStructureCreated={handleStructureCreated}
            />

            {/* Structure Update Modal */}
            <StructureUpdateModal
                isOpen={showUpdateModal}
                onClose={() => setShowUpdateModal(false)}
                onStructureUpdated={handleStructureUpdated}
                structureData={selectedRow}
            />

            {/* Delete Confirmation */}
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

export default Structure;