import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonSearchbar,
  IonIcon,
  IonGrid,
  IonRow,
  IonCol,
  IonLoading,
  IonAlert,
  IonToast,
  IonButtons,
  IonButton,
  useIonRouter
} from '@ionic/react';
import { useLocation } from 'react-router-dom';
import { add, arrowUpCircle, trash, arrowBack } from 'ionicons/icons';
import './../../CSS/Setup.css';
import TaxrateCreateModal from '../../components/TaxrateModals/TaxrateCreateModal';
import TaxrateUpdateModal from '../../components/TaxrateModals/TaxrateUpdateModal';
import DynamicTable from '../../components/Globalcomponents/DynamicTable';
import { supabase } from '../../utils/supaBaseClient';

interface TaxrateItem {
  tax_rate_id: string;
  effective_year: string;
  rate_percent: string;
  created_at?: string;
}

const Taxrate: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [taxrates, setTaxrates] = useState<TaxrateItem[]>([]);
  const [selectedRow, setSelectedRow] = useState<TaxrateItem | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const searchRef = useRef<HTMLIonSearchbarElement>(null);
  const location = useLocation();
  const router = useIonRouter();
  const [isError, setIsError] = useState(false);
  const [districtId, setDistrictId] = useState<string | null>(null);

  // Reset state when URL changes
  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const id = queryParams.get('district_id');
    setDistrictId(id);
    setSelectedRow(null);
    setSearchTerm('');
    setTaxrates([]);
  }, [location.search]);

  // Fetch tax rates
  const fetchTaxrates = useCallback(async () => {
    if (!districtId) return;
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('taxratetbl')
        .select('tax_rate_id, effective_year, rate_percent, created_at')
        .eq('district_id', districtId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setTaxrates(data || []);
    } catch (error) {
      console.error('Error fetching tax rates:', error);
      setToastMessage('Failed to load tax rates');
      setIsError(true);
      setShowToast(true);
    } finally {
      setIsLoading(false);
    }
  }, [districtId]);

  useEffect(() => {
    if (districtId) fetchTaxrates();
  }, [districtId, fetchTaxrates]);

  // Filter data
  const filteredData = useMemo(() => {
    if (!searchTerm.trim()) return taxrates;
    const term = searchTerm.toLowerCase();
    return taxrates.filter(item => {
      const taxRateId = item.tax_rate_id?.toLowerCase() || '';
      const effectiveYear = item.effective_year?.toLowerCase() || '';
      const ratePercent = item.rate_percent?.toLowerCase() || '';
      return taxRateId.includes(term) || effectiveYear.includes(term) || ratePercent.includes(term);
    });
  }, [taxrates, searchTerm]);

  const handleRowClick = (rowData: TaxrateItem) => setSelectedRow(rowData);
  const handleUpdateClick = () => selectedRow && setShowUpdateModal(true);
  const handleDeleteClick = () => selectedRow && setShowDeleteAlert(true);

  const handleDeleteConfirm = async () => {
    if (!selectedRow) return;
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('taxratetbl')
        .delete()
        .eq('tax_rate_id', selectedRow.tax_rate_id);
      if (error) throw error;
      await fetchTaxrates();
      setSelectedRow(null);
      setToastMessage('Tax rate deleted successfully');
      setIsError(false);
    } catch (error) {
      console.error('Error deleting tax rate:', error);
      setToastMessage('Failed to delete tax rate');
      setIsError(true);
    } finally {
      setIsLoading(false);
      setShowDeleteAlert(false);
      setShowToast(true);
    }
  };

  const handleBackClick = () => router.push('/menu/home/district', 'back');

  const iconButtons = [
    { icon: add, onClick: () => setShowCreateModal(true), disabled: !districtId, title: "Add Tax Rate" },
    { icon: arrowUpCircle, onClick: handleUpdateClick, disabled: !selectedRow, title: "Edit Tax Rate" },
    { icon: trash, onClick: handleDeleteClick, disabled: !selectedRow, title: "Delete Tax Rate" },
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
          <IonTitle>{districtId ? `Tax Rates - District ${districtId}` : 'Tax Rates'}</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonGrid>
        <IonRow>
          <IonCol size="12" className="search-container">
            <IonSearchbar
              ref={searchRef}
              placeholder="Search by year, ID, or rate..."
              value={searchTerm}
              onIonInput={(e) => setSearchTerm(e.detail.value || '')}
              debounce={200}
            />
            <div className="icon-group">
              {iconButtons.map((btn, idx) => (
                <IonIcon
                  key={idx}
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
            {filteredData.length > 0 ? (
              <DynamicTable
                data={filteredData}
                title="Tax Rates"
                keyField="tax_rate_id"
                onRowClick={handleRowClick}
                selectedRow={selectedRow}
              />
            ) : (
              <div style={{ padding: '20px', textAlign: 'center' }}>
                {isLoading ? 'Loading...' : 'No tax rates found for this district'}
              </div>
            )}
          </IonCol>
        </IonRow>
      </IonGrid>

      {districtId && (
        <TaxrateCreateModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          district_id={districtId}
          onTaxrateCreated={fetchTaxrates}
        />
      )}

      {selectedRow && districtId && (
        <TaxrateUpdateModal
          isOpen={showUpdateModal}
          onClose={() => setShowUpdateModal(false)}
          taxrateData={{
            tax_rate_id: selectedRow.tax_rate_id,
            district_id: districtId,
            effective_year: selectedRow.effective_year,
            rate_percent: selectedRow.rate_percent
          }}
          onTaxrateUpdated={fetchTaxrates}
        />
      )}

      <IonLoading isOpen={isLoading} message="Loading..." />

      <IonAlert
        isOpen={showDeleteAlert}
        onDidDismiss={() => setShowDeleteAlert(false)}
        header={'Confirm Delete'}
        message={`Are you sure you want to delete the tax rate for year ${selectedRow?.effective_year}?`}
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

export default Taxrate;