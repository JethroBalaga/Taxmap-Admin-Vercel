import React, { useState, useRef, useEffect } from 'react';
import {
    IonContent,
    IonHeader,
    IonPage,
    IonTitle,
    IonToolbar,
    IonGrid,
    IonRow,
    IonCol,
    IonSearchbar,
    IonSelect,
    IonSelectOption,
    IonLoading,
    IonToast,
    IonRefresher,
    IonRefresherContent
} from '@ionic/react';
import { supabase } from '../utils/supaBaseClient';
import DynamicTable from '../components/Globalcomponents/DynamicTable';
import '../CSS/Setup.css';

const Logs: React.FC = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedTable, setSelectedTable] = useState<string>('Admin Activity');
    const [logsData, setLogsData] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const [isError, setIsError] = useState(false);
    const searchRef = useRef<HTMLIonSearchbarElement>(null);

    const tableOptions = [
        'Admin Activity',
        'User Activity',
        'Form Logs',
        'Classification',
        'Subclasses',
        'Subclass Rates',
        'Actual Used',
        'District',
        'District Rates',
        'Barangays',
        'Kind',
        'Assesment Levels',
        'Structural Type',
        'Building Code',
        'Building Component',
        'Building Subcomponent',
        'Equipment',
        'Land Adjustment'
    ];

    const fetchLogs = async () => {
        if (!selectedTable) return;
        setIsLoading(true);

        try {
            let tableName = '';

            switch (selectedTable) {
                case 'Admin Activity':
                    tableName = 'admin_activity_logs';
                    break;
                case 'User Activity':
                    tableName = 'user_activity_logs';
                    break;
                case 'Form Logs':
                    tableName = 'formtbl_logs';
                    break;
                case 'Classification':
                    tableName = 'classtbl_logs';
                    break;
                case 'Subclasses':
                    tableName = 'subclasstbl_logs';
                    break;
                case 'Subclass Rates':
                    tableName = 'subclassratetbl_logs';
                    break;
                case 'Actual Used':
                    tableName = 'actual_usedtbl_logs';
                    break;
                case 'District':
                    tableName = 'districttbl_logs';
                    break;
                case 'District Rates':
                    tableName = 'taxratetbl_logs';
                    break;
                case 'Barangays':
                    tableName = 'barangaytbl_logs';
                    break;
                case 'Kind':
                    tableName = 'kindtbl_logs';
                    break;
                case 'Assesment Levels':
                    tableName = 'assessmentleveltbl_logs';
                    break;
                case 'Structural Type':
                    tableName = 'structure_typetbl_logs';
                    break;
                case 'Building Code':
                    tableName = 'building_codetbl_logs';
                    break;
                case 'Building Component':
                    tableName = 'building_componenttbl_logs';
                    break;
                case 'Building Subcomponent':
                    tableName = 'building_subcomponenttbl_logs';
                    break;
                case 'Equipment':
                    tableName = 'equipment_logs';
                    break;
                case 'Land Adjustment':
                    tableName = 'landadjustmenttbl_logs';
                    break;
                default:
                    tableName = '';
            }

            if (!tableName) {
                setLogsData([]);
                return;
            }

            const { data, error } = await supabase
                .from(tableName)
                .select('*')
                .order('timestamp', { ascending: false });

            if (error) throw error;

            setLogsData(data || []);
        } catch (error) {
            console.error('Error fetching logs:', error);
            setToastMessage('Failed to load logs');
            setIsError(true);
            setShowToast(true);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs();
    }, [selectedTable]);

    useEffect(() => {
        const handlePageShow = (event: PageTransitionEvent) => {
            if (event.persisted) fetchLogs();
        };
        window.addEventListener('pageshow', handlePageShow);
        return () => window.removeEventListener('pageshow', handlePageShow);
    }, [selectedTable]);

    const handleRefresh = (event: any) => {
        fetchLogs().then(() => {
            event.detail.complete();
            setToastMessage('Logs refreshed successfully!');
            setShowToast(true);
        });
    };

    const filteredData = logsData.filter(item =>
        !searchTerm.trim() ||
        JSON.stringify(item).toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <IonPage>
            <IonHeader>
                <IonToolbar>
                    <IonTitle>Logs</IonTitle>
                </IonToolbar>
            </IonHeader>

            <IonContent fullscreen>
                <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
                    <IonRefresherContent></IonRefresherContent>
                </IonRefresher>

                <IonGrid>
                    <IonRow>
                        <IonCol size="12" className="search-container">
                            <IonSearchbar
                                ref={searchRef}
                                placeholder="Search logs..."
                                onIonInput={(e) => setSearchTerm(e.detail.value || '')}
                                debounce={0}
                                style={{
                                    display: 'inline-block',
                                    width: '30%',
                                    marginRight: '15px',
                                    verticalAlign: 'top'
                                }}
                            />

                            <IonSelect
                                value={selectedTable}
                                placeholder="Select Table"
                                onIonChange={(e) => setSelectedTable(e.detail.value)}
                                style={{
                                    display: 'inline-block',
                                    width: '20%',
                                    verticalAlign: 'top',
                                    '--color': '#000000',
                                    '--placeholder-color': '#000000'
                                }}
                            >
                                {tableOptions.map((table) => (
                                    <IonSelectOption key={table} value={table}>
                                        {table}
                                    </IonSelectOption>
                                ))}
                            </IonSelect>
                        </IonCol>
                    </IonRow>

                    <IonRow>
                        <IonCol size="12">
                            <DynamicTable
                                data={filteredData}
                                title={`${selectedTable} Logs`}
                                keyField="log_id"
                            />
                        </IonCol>
                    </IonRow>
                </IonGrid>

                <IonLoading isOpen={isLoading} message="Loading logs..." />

                <IonToast
                    isOpen={showToast}
                    onDidDismiss={() => setShowToast(false)}
                    message={toastMessage}
                    duration={3000}
                    color={isError ? 'danger' : 'success'}
                />
            </IonContent>
        </IonPage>
    );
};

export default Logs;