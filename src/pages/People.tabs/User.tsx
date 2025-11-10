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
    IonModal,
    IonToast,
    IonButton,
    IonItem,
    IonLabel,
    IonInput,
    IonButtons,
    useIonRouter
} from '@ionic/react';
import { add, banOutline, trash, phonePortraitOutline, eye, eyeOff, checkmarkCircle, closeCircle, arrowBack } from 'ionicons/icons';
import './../../CSS/Setup.css';
import DynamicTable from '../../components/Globalcomponents/DynamicTable';
import { supabase } from '../../utils/supaBaseClient';
import { useLocation } from 'react-router-dom';
import bcrypt from 'bcryptjs';

interface UserItem {
    user_id: string;
    username: string;
    user_email: string;
    user_firstname: string;
    user_lastname: string;
    date_registered: string;
    user_role: string;
    suspended: boolean;
}

const User: React.FC = () => {
    const router = useIonRouter();
    const location = useLocation();
    const [users, setUsers] = useState<UserItem[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedRow, setSelectedRow] = useState<UserItem | null>(null);
    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const searchRef = useRef<HTMLIonSearchbarElement>(null);
    const [isError, setIsError] = useState(false);

    // Ban/Unban and Delete states
    const [showBanModal, setShowBanModal] = useState(false);
    const [adminPassword, setAdminPassword] = useState('');
    const [showAdminPassword, setShowAdminPassword] = useState(false);
    const [isPasswordCorrect, setIsPasswordCorrect] = useState<boolean | null>(null);

    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleteAdminPassword, setDeleteAdminPassword] = useState('');
    const [showDeleteAdminPassword, setShowDeleteAdminPassword] = useState(false);
    const [isDeletePasswordCorrect, setIsDeletePasswordCorrect] = useState<boolean | null>(null);

    const [currentAdmin, setCurrentAdmin] = useState<any>(null);

    // Focus search input
    useEffect(() => {
        const timer = setTimeout(() => {
            searchRef.current?.setFocus();
        }, 100);
        return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
        const getCurrentAdmin = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) setCurrentAdmin(session.user);
        };
        getCurrentAdmin();
    }, []);

    const fetchUsers = useCallback(async () => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('user_roles')
                .select('*')
                .order('date_registered', { ascending: false });
            if (error) throw error;

            const usersWithStringId = (data || []).map(item => ({
                ...item,
                user_id: String(item.user_id)
            }));
            setUsers(usersWithStringId);
        } catch {
            setToastMessage('Failed to load users');
            setIsError(true);
            setShowToast(true);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchUsers();
        const urlParams = new URLSearchParams(location.search);
        if (urlParams.has('refresh')) {
            setToastMessage('User list refreshed successfully');
            setShowToast(true);
        }
    }, [fetchUsers, location.search]);

    const filteredData = useMemo(() => {
        if (!searchTerm.trim()) return users;
        const term = searchTerm.toLowerCase();
        return users.filter(item =>
            item.username.toLowerCase().includes(term) ||
            item.user_email.toLowerCase().includes(term) ||
            item.user_firstname.toLowerCase().includes(term) ||
            item.user_lastname.toLowerCase().includes(term) ||
            item.user_role.toLowerCase().includes(term) ||
            item.user_id.toLowerCase().includes(term)
        );
    }, [users, searchTerm]);

    const handleRowClick = (row: UserItem) => setSelectedRow(row);
    const handleAddUser = () => router.push('/menu/people/register', 'forward', 'push');
    const handleCheckDevice = () => selectedRow && router.push(`/menu/people/devices?user_id=${selectedRow.user_id}`, 'forward', 'push');
    const handleBackClick = () => router.push('/menu', 'back');

    const iconButtons = [
        { icon: add, onClick: handleAddUser, disabled: false, title: 'Add User' },
        { icon: banOutline, onClick: () => selectedRow && setShowBanModal(true), disabled: !selectedRow, title: selectedRow?.suspended ? 'Unban User' : 'Ban User' },
        { icon: phonePortraitOutline, onClick: handleCheckDevice, disabled: !selectedRow, title: 'Check Device' },
        { icon: trash, onClick: () => selectedRow && setShowDeleteModal(true), disabled: !selectedRow, title: 'Delete User' }
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
                    <IonTitle>Users</IonTitle>
                </IonToolbar>
            </IonHeader>

            <IonGrid>
                <IonRow>
                    <IonCol size="12" className="search-container">
                        <IonSearchbar
                            ref={searchRef}
                            placeholder="Search users..."
                            value={searchTerm}
                            onIonInput={e => setSearchTerm(e.detail.value!)}
                            debounce={0}
                        />
                        <div className="icon-group">
                            {iconButtons.map((btn, i) => (
                                <IonIcon
                                    key={i}
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
                            title="Users"
                            keyField="user_id"
                            onRowClick={handleRowClick}
                            selectedRow={selectedRow}
                        />
                    </IonCol>
                </IonRow>
            </IonGrid>

            <IonLoading isOpen={isLoading} message="Loading..." />

            {/* Ban/Unban Modal */}
            <IonModal isOpen={showBanModal} onDidDismiss={() => { setShowBanModal(false); setAdminPassword(''); setIsPasswordCorrect(null); setShowAdminPassword(false); }}>
                <IonHeader>
                    <IonToolbar>
                        <IonTitle>{selectedRow?.suspended ? 'Unban User' : 'Ban User'}</IonTitle>
                        <IonButtons slot="end"><IonButton onClick={() => setShowBanModal(false)}>Close</IonButton></IonButtons>
                    </IonToolbar>
                </IonHeader>
                <IonContent className="ion-padding">
                    {/* You can insert your password verification and confirm button here */}
                </IonContent>
            </IonModal>

            {/* Delete Modal */}
            <IonModal isOpen={showDeleteModal} onDidDismiss={() => { setShowDeleteModal(false); setDeleteAdminPassword(''); setIsDeletePasswordCorrect(null); setShowDeleteAdminPassword(false); }}>
                <IonHeader>
                    <IonToolbar>
                        <IonTitle>Delete User</IonTitle>
                        <IonButtons slot="end"><IonButton onClick={() => setShowDeleteModal(false)}>Close</IonButton></IonButtons>
                    </IonToolbar>
                </IonHeader>
                <IonContent className="ion-padding">
                    {/* You can insert your password verification and confirm delete button here */}
                </IonContent>
            </IonModal>

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

export default User;