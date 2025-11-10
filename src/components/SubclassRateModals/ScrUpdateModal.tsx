import React, { useState, useEffect } from 'react';
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

interface SubclassRateItem {
  subclassrate_id: string;
  subclass_id: string;
  rate: number;
  eff_year: string;
  created_at: string;
}

interface ScrUpdateModalProps {
    isOpen: boolean;
    onClose: () => void;
    onScrUpdated?: () => void;
    subclassRateData: SubclassRateItem | null;
}

const ScrUpdateModal: React.FC<ScrUpdateModalProps> = ({
    isOpen,
    onClose,
    onScrUpdated = () => { },
    subclassRateData
}) => {
    const [selectedYear, setSelectedYear] = useState<string>('');
    const [rate, setRate] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const [isError, setIsError] = useState(false);

    // Set initial values when modal opens or data changes
    useEffect(() => {
        if (subclassRateData) {
            setSelectedYear(subclassRateData.eff_year);
            setRate(subclassRateData.rate.toString());
        }
    }, [subclassRateData, isOpen]);

    // Automatically generate subclassrate_id when subclass_id or year changes
    const subclassrateId = selectedYear && subclassRateData ? 
        `${subclassRateData.subclass_id}${selectedYear}` : '';

    const handleUpdate = async () => {
        if (!selectedYear || !rate || !subclassRateData) return;

        setIsLoading(true);
        try {
            const { error } = await supabase
                .from('subclassratetbl')
                .update({
                    eff_year: selectedYear,
                    rate: parseFloat(rate),
                    subclassrate_id: subclassrateId // Update the ID if year changed
                })
                .eq('subclassrate_id', subclassRateData.subclassrate_id);

            if (error) throw error;

            setToastMessage('Subclass rate updated successfully!');
            onScrUpdated();
            setTimeout(onClose, 1000);
        } catch (error: any) {
            setToastMessage(error.message || 'Failed to update subclass rate');
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

    const handleClose = () => {
        // Reset form when closing
        if (subclassRateData) {
            setSelectedYear(subclassRateData.eff_year);
            setRate(subclassRateData.rate.toString());
        }
        onClose();
    };

    return (
        <>
            <IonModal isOpen={isOpen} onDidDismiss={handleClose} className="classification-modal">
                <IonHeader>
                    <IonToolbar className="modal-header">
                        <IonTitle className="modal-title">Update Subclass Rate</IonTitle>
                    </IonToolbar>
                </IonHeader>

                <IonContent className="modal-content">
                    <IonGrid className="form-grid">
                        <IonRow>
                            <IonCol className="form-column">
                                {/* Subclass ID Label */}
                                <IonItem lines="none" className="district-label-item">
                                    <IonLabel className="district-label">Subclass ID: {subclassRateData?.subclass_id}</IonLabel>
                                </IonItem>

                                {/* Original Subclass Rate ID Display */}
                                <div className="input-wrapper">
                                    <IonLabel className="input-label">Original Rate ID</IonLabel>
                                    <IonItem lines="none" className="readonly-item">
                                        <IonLabel className="readonly-value">
                                            {subclassRateData?.subclassrate_id || 'N/A'}
                                        </IonLabel>
                                    </IonItem>
                                </div>

                                {/* New Subclass Rate ID Display */}
                                <div className="input-wrapper">
                                    <IonLabel className="input-label">New Rate ID (Auto-generated)</IonLabel>
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
                                        onClick={handleClose}
                                        className="cancel-btn"
                                        disabled={isLoading}
                                    >
                                        Cancel
                                    </Button>

                                    <Button
                                        variant="primary"
                                        onClick={handleUpdate}
                                        disabled={!selectedYear || !rate || isLoading}
                                        className="create-btn"
                                    >
                                        {isLoading ? 'Updating...' : 'Update'}
                                    </Button>
                                </div>
                            </IonCol>
                        </IonRow>
                    </IonGrid>
                </IonContent>
            </IonModal>

            <IonLoading isOpen={isLoading} message="Updating subclass rate..." />
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

export default ScrUpdateModal;