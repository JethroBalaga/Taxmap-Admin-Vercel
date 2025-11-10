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

interface TaxrateUpdateModalProps {
    isOpen: boolean;
    onClose: () => void;
    onTaxrateUpdated?: () => void;
    taxrateData: {
        tax_rate_id: string;
        district_id: string;
        effective_year: string;
        rate_percent: string;
    } | null;
}

const TaxrateUpdateModal: React.FC<TaxrateUpdateModalProps> = ({
    isOpen,
    onClose,
    onTaxrateUpdated = () => { },
    taxrateData
}) => {
    const [selectedYear, setSelectedYear] = useState<string>('');
    const [rate, setRate] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const [isError, setIsError] = useState(false);

    useEffect(() => {
        if (taxrateData) {
            // Extract just the year if the stored value is a full date
            const yearOnly = taxrateData.effective_year.split('-')[0];
            setSelectedYear(yearOnly);
            setRate(taxrateData.rate_percent.replace('%', ''));
        }
    }, [taxrateData]);

    const handleUpdate = async () => {
        if (!selectedYear || !rate || !taxrateData) return;

        setIsLoading(true);
        try {
            const { error } = await supabase
                .from('taxratetbl')
                .update({
                    effective_year: selectedYear, // Just the year
                    rate_percent: `${rate}%`,
                })
                .eq('tax_rate_id', taxrateData.tax_rate_id);

            if (error) throw error;

            setToastMessage('Tax rate updated successfully!');
            onTaxrateUpdated();
            setTimeout(onClose, 1000);
        } catch (error: any) {
            setIsError(true);
            setToastMessage(error.message || 'Failed to update tax rate');
            console.error('Error:', error);
        } finally {
            setIsLoading(false);
            setShowToast(true);
        }
    };

    const handleRateChange = (value: string) => {
        setRate(value.replace(/[^0-9]/g, ''));
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
                        <IonTitle className="modal-title">Update Tax Rate</IonTitle>
                    </IonToolbar>
                </IonHeader>

                <IonContent className="modal-content">
                    <IonGrid className="form-grid">
                        <IonRow>
                            <IonCol className="form-column">
                                {/* District ID Label */}
                                <IonItem lines="none" className="district-label-item">
                                    <IonLabel className="district-label">District: {taxrateData?.district_id}</IonLabel>
                                </IonItem>

                                {/* Tax Rate ID Label */}
                                <IonItem lines="none" className="district-label-item">
                                    <IonLabel className="district-label">Tax Rate ID: {taxrateData?.tax_rate_id}</IonLabel>
                                </IonItem>

                                {/* Year Picker */}
                                <div className="input-wrapper">
                                    <IonLabel className="input-label">Effective Year</IonLabel>
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
                                        label="Rate"
                                        value={rate ? `${rate}%` : ''}
                                        onChange={handleRateChange}
                                        placeholder="Enter rate (e.g., 12)"
                                        className="modal-input"
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
                                        onClick={handleUpdate}
                                        disabled={!selectedYear || !rate || isLoading}
                                        className="update-btn"
                                    >
                                        {isLoading ? 'Updating...' : 'Update'}
                                    </Button>
                                </div>
                            </IonCol>
                        </IonRow>
                    </IonGrid>
                </IonContent>
            </IonModal>

            <IonLoading isOpen={isLoading} message="Updating tax rate..." />
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

export default TaxrateUpdateModal;