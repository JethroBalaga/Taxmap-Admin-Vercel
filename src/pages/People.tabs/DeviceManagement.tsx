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
    IonToast,
    IonAlert,
    IonButtons,
    IonButton,
    useIonRouter
} from '@ionic/react';
import { checkmarkCircleOutline, arrowBack } from 'ionicons/icons';
import './../../CSS/Setup.css';
import DynamicTable from '../../components/Globalcomponents/DynamicTable';
import { supabase } from '../../utils/supaBaseClient';
import { useLocation } from 'react-router-dom';

interface DeviceItem {
    device_id: string;
    user_id: string;
    device_name: string;
    registered: boolean;
    registered_at: string | null;
    created_at: string;
}

const DeviceManagement: React.FC = () => {
    const location = useLocation();
    const router = useIonRouter();
    const [devices, setDevices] = useState<DeviceItem[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedRow, setSelectedRow] = useState<DeviceItem | null>(null);
    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const [isError, setIsError] = useState(false);
    const [showConfirmAlert, setShowConfirmAlert] = useState(false);
    const searchRef = useRef<HTMLIonSearchbarElement>(null);

    // Focus search input
    useEffect(() => {
        const timer = setTimeout(() => searchRef.current?.setFocus(), 100);
        return () => clearTimeout(timer);
    }, []);

    const fetchDevices = useCallback(async () => {
        setIsLoading(true);
        try {
            const urlParams = new URLSearchParams(location.search);
            const userId = urlParams.get('user_id');

            let query = supabase
                .from('deviceregistration')
                .select('*')
                .order('created_at', { ascending: false });

            if (userId) query = query.eq('user_id', userId);

            const { data, error } = await query;
            if (error) throw error;

            const devicesWithStringId = (data || []).map(item => ({
                ...item,
                device_id: String(item.device_id),
                user_id: String(item.user_id)
            }));

            setDevices(devicesWithStringId);
        } catch {
            setToastMessage('Failed to load devices');
            setIsError(true);
            setShowToast(true);
        } finally {
            setIsLoading(false);
        }
    }, [location.search]);

    useEffect(() => {
        fetchDevices();
    }, [fetchDevices]);

    const filteredData = useMemo(() => {
        if (!searchTerm.trim()) return devices;
        const term = searchTerm.toLowerCase();
        return devices.filter(item =>
            item.device_name.toLowerCase().includes(term) ||
            item.device_id.toLowerCase().includes(term) ||
            item.user_id.toLowerCase().includes(term)
        );
    }, [devices, searchTerm]);

    const handleRowClick = (rowData: DeviceItem) => {
        setSelectedRow(rowData);
        setShowConfirmAlert(true);
    };

    const handleRegisterDevice = async () => {
        if (!selectedRow) return;

        setIsLoading(true);
        try {
            if (selectedRow.registered) {
                const { error } = await supabase
                    .from('deviceregistration')
                    .delete()
                    .eq('device_id', selectedRow.device_id);
                if (error) throw error;
                setToastMessage('Device unregistered and deleted successfully');
            } else {
                const { error } = await supabase
                    .from('deviceregistration')
                    .update({ 
                        registered: true,
                        registered_at: new Date().toISOString()
                    })
                    .eq('device_id', selectedRow.device_id);
                if (error) throw error;
                setToastMessage('Device registered successfully');
            }
            setShowToast(true);
            setIsError(false);
            fetchDevices();
        } catch {
            setToastMessage('Failed to update device');
            setIsError(true);
            setShowToast(true);
        } finally {
            setIsLoading(false);
            setShowConfirmAlert(false);
        }
    };

    const handleCancelAction = () => {
        if (!selectedRow?.registered) handleDeleteDevice();
        else setShowConfirmAlert(false);
    };

    const handleDeleteDevice = async () => {
        if (!selectedRow) return;
        setIsLoading(true);
        try {
            const { error } = await supabase
                .from('deviceregistration')
                .delete()
                .eq('device_id', selectedRow.device_id);
            if (error) throw error;
            setToastMessage('Device deleted successfully');
            setShowToast(true);
            setIsError(false);
            fetchDevices();
        } catch {
            setToastMessage('Failed to delete device');
            setIsError(true);
            setShowToast(true);
        } finally {
            setIsLoading(false);
            setShowConfirmAlert(false);
        }
    };

    const handleBackClick = () => router.push('/menu/people/user', 'back');

    const iconButtons = [
        {
            icon: checkmarkCircleOutline,
            onClick: () => selectedRow && handleRowClick(selectedRow),
            disabled: !selectedRow,
            title: "Manage Device Registration"
        }
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
                    <IonTitle>Device Management</IonTitle>
                </IonToolbar>
            </IonHeader>

            <IonGrid>
                <IonRow>
                    <IonCol size="12" className="search-container">
                        <IonSearchbar
                            ref={searchRef}
                            placeholder="Search devices..."
                            onIonInput={e => setSearchTerm(e.detail.value || '')}
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
                            title="Devices"
                            keyField="device_id"
                            onRowClick={handleRowClick}
                            selectedRow={selectedRow} 
                        />
                    </IonCol>
                </IonRow>
            </IonGrid>

            <IonLoading isOpen={isLoading} message="Loading..." />

            <IonAlert
                isOpen={showConfirmAlert}
                onDidDismiss={() => setShowConfirmAlert(false)}
                header={selectedRow?.registered ? 'Unregister Device' : 'Register Device'}
                message={selectedRow?.registered 
                    ? `Do you want to unregister the device "${selectedRow?.device_name}"? This will delete the device record.`
                    : `Allow the device "${selectedRow?.device_name}" to be registered?`
                }
                buttons={[
                    { text: 'No', role: 'cancel', handler: selectedRow?.registered ? undefined : handleCancelAction },
                    { text: 'Yes', handler: handleRegisterDevice }
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

export default DeviceManagement;