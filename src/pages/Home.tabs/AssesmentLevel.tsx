import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
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
import { add, arrowUpCircle, trash, arrowBack } from 'ionicons/icons';
import './../../CSS/Setup2.css';
import DynamicTable from '../../components/Globalcomponents/DynamicTable';
import { supabase } from '../../utils/supaBaseClient';
import { useLocation } from 'react-router-dom';
import AssessmentCreateModal from '../../components/AssesmentLevelModals/AssesmentCreateModal';
import AssessmentUpdateModal from '../../components/AssesmentLevelModals/AssessmentUpdateModal';

interface AssessmentLevelItem {
    assessment_level_id: number;
    kind_id: number;
    class_id: number;
    effective_year: string;
    range1: string | number;
    range2: string | number;
    rate_percent: string;
    created_at?: string;
}

const AssessmentLevel: React.FC = () => {
    const [assessmentLevels, setAssessmentLevels] = useState<AssessmentLevelItem[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedRow, setSelectedRow] = useState<AssessmentLevelItem | null>(null);
    const [showDeleteAlert, setShowDeleteAlert] = useState(false);
    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const searchRef = useRef<HTMLIonSearchbarElement>(null);
    const [isError, setIsError] = useState(false);
    const location = useLocation();
    const router = useIonRouter();
    const [showUpdateModal, setShowUpdateModal] = useState(false);
    const [selectedAssessmentLevel, setSelectedAssessmentLevel] = useState<AssessmentLevelItem | null>(null);
    const [kindId, setKindId] = useState<string | null>(null);

    // Reset state when URL changes
    useEffect(() => {
        const queryParams = new URLSearchParams(location.search);
        const id = queryParams.get('kind_id');
        
        setKindId(id);
        setSelectedRow(null);
        setSearchTerm('');
        setAssessmentLevels([]);
    }, [location.search]);

    // Fetch data
    const fetchAssessmentLevels = useCallback(async () => {
        if (!kindId) return;

        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('assessmentleveltbl')
                .select('*')
                .eq('kind_id', kindId)
                .order('created_at', { ascending: false });

            if (error) throw error;

            setAssessmentLevels(data || []);
        } catch (error) {
            console.error('Error fetching assessment levels:', error);
            setToastMessage('Failed to load assessment levels');
            setIsError(true);
            setShowToast(true);
        } finally {
            setIsLoading(false);
        }
    }, [kindId]);

    useEffect(() => {
        if (kindId) {
            fetchAssessmentLevels();
        }
    }, [kindId, fetchAssessmentLevels]);

    // Filter data based on search term
    const filteredData = useMemo(() => {
        if (!searchTerm.trim()) return assessmentLevels;

        const term = searchTerm.toLowerCase();
        return assessmentLevels.filter(item => {
            const assessmentLevelId = item.assessment_level_id?.toString().toLowerCase() || '';
            const classId = item.class_id?.toString().toLowerCase() || '';
            const effectiveYear = item.effective_year?.toString().toLowerCase() || '';
            const range1 = item.range1?.toString().toLowerCase() || '';
            const range2 = item.range2?.toString().toLowerCase() || '';
            const ratePercent = item.rate_percent?.toString().toLowerCase() || '';

            return (
                assessmentLevelId.includes(term) ||
                classId.includes(term) ||
                effectiveYear.includes(term) ||
                range1.includes(term) ||
                range2.includes(term) ||
                ratePercent.includes(term)
            );
        });
    }, [assessmentLevels, searchTerm]);

    const handleRowClick = (rowData: AssessmentLevelItem) => {
        setSelectedRow(rowData);
    };

    const handleCreateClick = () => {
        setShowCreateModal(true);
    };

    const handleEditClick = () => {
        if (!selectedRow) return;
        setSelectedAssessmentLevel(selectedRow);
        setShowUpdateModal(true);
    };

    const handleDeleteClick = () => {
        if (!selectedRow) return;
        setShowDeleteAlert(true);
    };

    const handleDeleteConfirm = async () => {
        if (!selectedRow) return;

        try {
            setIsLoading(true);
            const { error } = await supabase
                .from('assessmentleveltbl')
                .delete()
                .eq('assessment_level_id', selectedRow.assessment_level_id);

            if (error) throw error;

            await fetchAssessmentLevels();
            setSelectedRow(null);
            setToastMessage('Assessment level deleted successfully');
            setIsError(false);
            setShowToast(true);
        } catch (error) {
            console.error('Error deleting assessment level:', error);
            setToastMessage('Failed to delete assessment level');
            setIsError(true);
            setShowToast(true);
        } finally {
            setIsLoading(false);
            setShowDeleteAlert(false);
        }
    };

    const handleBackClick = () => {
        router.push('/menu/home/kind', 'back');
    };

    const iconButtons = [
        { icon: add, onClick: handleCreateClick, disabled: !kindId, title: "Add Assessment Level" },
        { icon: arrowUpCircle, onClick: handleEditClick, disabled: !selectedRow, title: "Edit Assessment Level" },
        { icon: trash, onClick: handleDeleteClick, disabled: !selectedRow, title: "Delete Assessment Level" }
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
                    <IonTitle>{kindId ? `Assessment Levels - Kind ${kindId}` : 'Assessment Levels'}</IonTitle>
                </IonToolbar>
            </IonHeader>

            <IonGrid>
                <IonRow>
                    <IonCol size="12" className="search-container">
                        <IonSearchbar
                            ref={searchRef}
                            placeholder="Search by year, ID, or level..."
                            value={searchTerm}
                            onIonInput={(e) => setSearchTerm(e.detail.value || '')}
                            debounce={200}
                        />

                        <div className="icon-group">
                            {iconButtons.map((button, index) => (
                                <IonIcon
                                    key={index}
                                    icon={button.icon}
                                    className={`icon-yellow ${button.disabled ? 'icon-disabled' : ''}`}
                                    onClick={button.disabled ? undefined : button.onClick}
                                    title={button.title}
                                />
                            ))}
                        </div>
                    </IonCol>
                </IonRow>

                <IonRow>
                    <IonCol size="12">
                        <DynamicTable
                            data={filteredData}
                            title="Assessment Levels"
                            keyField="assessment_level_id"
                            onRowClick={handleRowClick}
                            selectedRow={selectedRow} 
                        />
                    </IonCol>
                </IonRow>
            </IonGrid>

            {kindId && (
                <AssessmentCreateModal
                    isOpen={showCreateModal}
                    onClose={() => setShowCreateModal(false)}
                    onAssessmentLevelCreated={fetchAssessmentLevels}
                    kind_id={kindId}
                />
            )}
            {selectedRow && (
                <AssessmentUpdateModal
                    isOpen={showUpdateModal}
                    onClose={() => setShowUpdateModal(false)}
                    assessmentLevelData={{
                        assessment_level_id: selectedRow.assessment_level_id,
                        kind_id: kindId || '',
                        class_id: selectedRow.class_id,
                        effective_year: selectedRow.effective_year,
                        range1: typeof selectedRow.range1 === 'string' ? parseFloat(selectedRow.range1) : selectedRow.range1,
                        range2: typeof selectedRow.range2 === 'string' ? parseFloat(selectedRow.range2) : selectedRow.range2,
                        rate_percent: selectedRow.rate_percent
                    }}
                    onAssessmentLevelUpdated={fetchAssessmentLevels}
                />
            )}
            <IonLoading isOpen={isLoading} message="Loading..." />

            <IonAlert
                isOpen={showDeleteAlert}
                onDidDismiss={() => setShowDeleteAlert(false)}
                header={'Confirm Delete'}
                message={`Are you sure you want to delete the assessment level for year ${selectedRow?.effective_year}?`}
                buttons={[
                    { text: 'Cancel', role: 'cancel', cssClass: 'secondary' },
                    { text: 'Delete', handler: handleDeleteConfirm }
                ]}
            />

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

export default AssessmentLevel;