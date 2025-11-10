import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
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
import { arrowUpCircle, trash, arrowBack } from 'ionicons/icons';
import './../../CSS/Setup.css';
import DynamicTable from '../../components/Globalcomponents/DynamicTable';
import { supabase } from '../../utils/supaBaseClient';
import DeclarantUpdateModal from '../../components/DeclarantModals/DeclarantUpdateModal';

interface FormItem {
    form_id: string;
    declarant: string;
    created_at?: string;
    status?: string;
    class_id?: string;
}

const Declarant: React.FC = () => {
    const router = useIonRouter();
    const [forms, setForms] = useState<FormItem[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedRow, setSelectedRow] = useState<FormItem | null>(null);
    const [showDeleteAlert, setShowDeleteAlert] = useState(false);
    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const [isError, setIsError] = useState(false);
    const [showUpdateModal, setShowUpdateModal] = useState(false);
    const searchRef = useRef<HTMLIonSearchbarElement>(null);

    useEffect(() => {
        const timer = setTimeout(() => searchRef.current?.setFocus(), 100);
        return () => clearTimeout(timer);
    }, []);

    const fetchForms = useCallback(async () => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('formtbl')
                .select('form_id, declarant, created_at, status, class_id')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setForms(data || []);
        } catch {
            setToastMessage('Failed to load declarants');
            setIsError(true);
            setShowToast(true);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchForms();
    }, [fetchForms]);

    const filteredData = useMemo(() => {
        if (!searchTerm.trim()) return forms;
        const term = searchTerm.toLowerCase();
        return forms.filter(item =>
            item.declarant.toLowerCase().includes(term) ||
            item.form_id.toLowerCase().includes(term)
        );
    }, [forms, searchTerm]);

    const handleRowClick = (rowData: FormItem) => setSelectedRow(rowData);
    const handleUpdateClick = () => selectedRow && setShowUpdateModal(true);
    const handleDeleteClick = () => selectedRow && setShowDeleteAlert(true);

    const handleDeleteConfirm = async () => {
        if (!selectedRow) return;
        setIsLoading(true);
        try {
            const { error } = await supabase
                .from('formtbl')
                .delete()
                .eq('form_id', selectedRow.form_id);

            if (error) throw error;
            await fetchForms();
            setSelectedRow(null);
            setToastMessage(`Form with declarant "${selectedRow.declarant}" deleted successfully!`);
            setShowToast(true);
        } catch {
            setToastMessage('Failed to delete form');
            setIsError(true);
            setShowToast(true);
        } finally {
            setIsLoading(false);
            setShowDeleteAlert(false);
        }
    };

    const handleBackClick = () => router.push('/menu/people/user', 'back');

    const iconButtons = [
        { icon: arrowUpCircle, onClick: handleUpdateClick, disabled: !selectedRow, title: "Update Declarant" },
        { icon: trash, onClick: handleDeleteClick, disabled: !selectedRow, title: "Delete Form" }
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
                    <IonTitle>Declarants from Forms</IonTitle>
                </IonToolbar>
            </IonHeader>

            <IonGrid>
                <IonRow>
                    <IonCol size="12" className="search-container">
                        <IonSearchbar
                            ref={searchRef}
                            placeholder="Search declarants..."
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
                            title="Declarants from Forms"
                            keyField="form_id"
                            onRowClick={handleRowClick}
                            selectedRow={selectedRow}
                        />
                    </IonCol>
                </IonRow>
            </IonGrid>

            <IonLoading isOpen={isLoading} message="Loading..." />

            <DeclarantUpdateModal
                isOpen={showUpdateModal}
                onClose={() => setShowUpdateModal(false)}
                onDeclarantUpdated={fetchForms}
                selectedForm={selectedRow}
            />

            <IonAlert
                isOpen={showDeleteAlert}
                onDidDismiss={() => setShowDeleteAlert(false)}
                header={'Confirm Delete'}
                message={`Are you sure you want to delete the form with declarant <strong>${selectedRow?.declarant}</strong>?`}
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

export default Declarant;