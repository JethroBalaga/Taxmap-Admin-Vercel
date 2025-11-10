import React, { useState } from 'react';
import {
    IonModal,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonGrid,
    IonRow,
    IonCol,
    IonLoading,
    IonToast,
    IonLabel,
    IonItem,
    IonDatetime
} from '@ionic/react';
import Input from '../Globalcomponents/Input';
import './../../CSS/Modal.css';
import Button from '../Globalcomponents/Button';
import { supabase } from './../../utils/supaBaseClient';

interface ScrCreateModalProps {
    isOpen: boolean;
    onClose: () => void;
    onScrCreated?: () => void;
    subclass_id: string;
}

const ScrCreateModal: React.FC<ScrCreateModalProps> = ({
    isOpen,
    onClose,
    onScrCreated = () => { },
    subclass_id
}) => {
    const [selectedYear, setSelectedYear] = useState<string>('');
    const [rate, setRate] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const [isError, setIsError] = useState(false);

    // Automatically generate subclassrate_id when subclass_id or year changes
    const subclassrateId = selectedYear ? `${subclass_id}${selectedYear}` : '';

    const handleCreate = async () => {
        if (!selectedYear || !rate) return;

        setIsLoading(true);
        try {
            const { error } = await supabase
                .from('subclassratetbl')
                .insert([{
                    subclassrate_id: subclassrateId,
                    subclass_id,
                    eff_year: selectedYear,
                    rate: parseFloat(rate)
                }]);

            if (error) throw error;

            setToastMessage('Subclass rate created successfully!');
            setSelectedYear('');
            setRate('');
            onScrCreated();
            setTimeout(onClose, 1000);
        } catch (error: any) {
            setToastMessage(error.message || 'Failed to create subclass rate');
            setIsError(true);
            console.error('Error:', error);
        } finally {
            setIsLoading(false);
            setShowToast(true);
        }
    };

    const handleRateChange = (value: string) => {
        // Allow numbers and decimal point
        const validValue = value.replace(/[^0-9.]/g, '');
        
        // Ensure only one decimal point
        const decimalCount = (validValue.match(/\./g) || []).length;
        if (decimalCount <= 1) {
            setRate(validValue);
        }
    };

    const handleYearChange = (e: CustomEvent) => {
        // Extract just the year from the datetime value
        const fullDate = e.detail.value?.toString() || '';
        const yearOnly = fullDate.split('-')[0];
        setSelectedYear(yearOnly);
    };

    return (
        <>
            <IonModal isOpen={isOpen} onDidDismiss={onClose} className="classification-modal">
                <IonHeader>
                    <IonToolbar className="modal-header">
                        <IonTitle className="modal-title">Create Subclass Rate</IonTitle>
                    </IonToolbar>
                </IonHeader>

                <IonContent className="modal-content">
                    <IonGrid className="form-grid">
                        <IonRow>
                            <IonCol className="form-column">
                                {/* Subclass ID Label */}
                                <IonItem lines="none" className="district-label-item">
                                    <IonLabel className="district-label">Subclass ID: {subclass_id}</IonLabel>
                                </IonItem>

                                {/* Generated Subclass Rate ID Display */}
                                <div className="input-wrapper">
                                    <IonLabel className="input-label">Subclass Rate ID (Auto-generated)</IonLabel>
                                    <IonItem lines="none" className="readonly-item">
                                        <IonLabel className="readonly-value">
                                            {subclassrateId || 'Select year to generate ID'}
                                        </IonLabel>
                                    </IonItem>
                                </div>

                                {/* Year Picker */}
                                <div className="input-wrapper">
                                    <IonLabel className="input-label">Effective Year *</IonLabel>
                                    <IonDatetime
                                        presentation="year"
                                        value={selectedYear}
                                        onIonChange={handleYearChange}
                                        className="year-picker"
                                    />
                                </div>

                                {/* Rate Input */}
                                <div className="input-wrapper">
                                    <Input
                                        label="Rate *"
                                        value={rate}
                                        onChange={handleRateChange}
                                        placeholder="Enter rate (e.g., 12.5)"
                                        className="modal-input"
                                        type="number"
                                    />
                                </div>

                                <div className="button-group">
                                    <Button
                                        variant="secondary"
                                        onClick={onClose}
                                        className="cancel-btn"
                                        disabled={isLoading}
                                    >
                                        Cancel
                                    </Button>

                                    <Button
                                        variant="primary"
                                        onClick={handleCreate}
                                        disabled={!selectedYear || !rate || isLoading}
                                        className="create-btn"
                                    >
                                        {isLoading ? 'Creating...' : 'Create'}
                                    </Button>
                                </div>
                            </IonCol>
                        </IonRow>
                    </IonGrid>
                </IonContent>
            </IonModal>

            <IonLoading isOpen={isLoading} message="Creating subclass rate..." />
            <IonToast
                isOpen={showToast}
                onDidDismiss={() => setShowToast(false)}
                message={toastMessage}
                duration={3000}
                color={isError ? 'danger' : 'success'}
            />
        </>
    );
};

export default ScrCreateModal;