import React, { useState, useEffect } from 'react';
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonGrid,
  IonRow,
  IonCol,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonButton,
  IonIcon,
  IonLoading,
  IonAlert,
  IonButtons,
  IonText
} from '@ionic/react';
import { arrowBackOutline, leaf, trendingUp, calculator, documentOutline } from 'ionicons/icons';
import { supabase } from '../../utils/supaBaseClient';
import { useHistory, useParams } from 'react-router-dom';
import DynamicTable from '../../components/Globalcomponents/DynamicTable';
import LandFaasBackModal from '../../components/Fass/LandFaas/LandFaasBackModal';
import '../../CSS/Setup.css';
import '../../CSS/AgriculturalCard.css';

interface FormData {
  form_id: string;
  declarant_name: string;
  district_name: string;
  class_id: string;
  kind_description: string;
  status: string;
  area?: number;
  actualUse?: string;
  [key: string]: any;
}

interface LandAdjustmentData {
  agrilandadjustment_id: string;
  value_info_id: string;
  frontage: number;
  weather_road: number;
  market: number;
  total_adjustments: number;
  adjusted_market_value: number;
  created_at: string;
}

interface AgriculturalLandValuation {
  value_info_id: string;
  rate: number;
  base_market_value: number;
  adjusted_market_value: number;
  assessment_level: string;
  assessed_value: number;
  subclass_id?: string;
  subclass_description?: string;
}

const AgriculturalLand: React.FC = () => {
  const [formData, setFormData] = useState<FormData | null>(null);
  const [valuationData, setValuationData] = useState<AgriculturalLandValuation[]>([]);
  const [adjustmentData, setAdjustmentData] = useState<LandAdjustmentData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [showFaasModal, setShowFaasModal] = useState(false);
  const history = useHistory();
  const { formId } = useParams<{ formId: string }>();

  useEffect(() => {
    if (formId) {
      loadFormData();
    }
  }, [formId]);

  useEffect(() => {
    if (formData) {
      loadValuationData();
      loadAdjustmentData();
    }
  }, [formData]);

  const loadFormData = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('form_view')
        .select('*')
        .eq('form_id', formId)
        .single();

      if (error) {
        console.error('Error fetching form data:', error);
        setAlertMessage('Failed to load form data');
        setShowAlert(true);
        return;
      }

      console.log('Raw form data:', data);

      if (data) {
        const kind = data.kind_description?.toUpperCase();
        const classId = data.class_id?.toUpperCase();
        
        console.log(`Checking conditions - Kind: ${kind}, Class: ${classId}`);
        
        if (kind === 'LAND' && classId === 'A') {
          setFormData(data);
        } else {
          setAlertMessage(`This form is not an Agricultural Land. Found: Kind=${kind}, Class=${classId}. Required: Kind=LAND, Class=A`);
          setShowAlert(true);
        }
      }
    } catch (error) {
      console.error('Failed to load form data:', error);
      setAlertMessage('An error occurred while loading the form');
      setShowAlert(true);
    } finally {
      setIsLoading(false);
    }
  };

  const loadValuationData = async () => {
    try {
      // First get value_info_id from form_id
      const { data: valueInfoData, error: valueError } = await supabase
        .from('value_info')
        .select('value_info_id')
        .eq('form_id', formId);

      if (valueError) {
        console.error('Error fetching value_info:', valueError);
        return;
      }

      if (!valueInfoData || valueInfoData.length === 0) {
        console.log('No value_info found for form_id:', formId);
        setValuationData([]);
        return;
      }

      const valueInfoIds = valueInfoData.map(item => item.value_info_id);

      // Then get agricultural land valuation data using value_info_ids
      const { data: valuationData, error: valuationError } = await supabase
        .from('agricultural_land_valuation_view')
        .select('*')
        .in('value_info_id', valueInfoIds);

      if (valuationError) {
        console.error('Error fetching agricultural land valuation:', valuationError);
        return;
      }

      console.log('Valuation data:', valuationData);
      setValuationData(valuationData || []);
    } catch (error) {
      console.error('Failed to load valuation data:', error);
    }
  };

  const loadAdjustmentData = async () => {
    try {
      // First get value_info_id from form_id
      const { data: valueInfoData, error: valueError } = await supabase
        .from('value_info')
        .select('value_info_id')
        .eq('form_id', formId);

      if (valueError) {
        console.error('Error fetching value_info:', valueError);
        return;
      }

      if (!valueInfoData || valueInfoData.length === 0) {
        console.log('No value_info found for form_id:', formId);
        setAdjustmentData(null);
        return;
      }

      const valueInfoIds = valueInfoData.map(item => item.value_info_id);

      // Get land adjustment data from the view
      const { data: adjustmentData, error: adjustmentError } = await supabase
        .from('land_adjustment_view')
        .select('*')
        .in('value_info_id', valueInfoIds);

      if (adjustmentError) {
        console.error('Error fetching land adjustment data:', adjustmentError);
        return;
      }

      console.log('Adjustment data:', adjustmentData);
      // Take the first adjustment record if multiple exist
      setAdjustmentData(adjustmentData && adjustmentData.length > 0 ? adjustmentData[0] : null);
    } catch (error) {
      console.error('Failed to load adjustment data:', error);
    }
  };

  const handleBack = () => {
    history.goBack();
  };

  const handleViewFaas = () => {
    setShowFaasModal(true);
  };

  const handleCloseFaas = () => {
    setShowFaasModal(false);
  };

  const formatFieldName = (fieldName: string): string => {
    return fieldName
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Filter out form_id from the form data to display
  const getDisplayData = () => {
    if (!formData) return [];
    
    return Object.entries(formData)
      .filter(([key]) => key !== 'form_id')
      .map(([key, value]) => ({
        field: formatFieldName(key),
        value: value || 'N/A'
      }));
  };

  // Format valuation data for DynamicTable
  const getValuationDisplayData = () => {
    return valuationData.map(item => {
      const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('en-PH', {
          style: 'currency',
          currency: 'PHP',
          minimumFractionDigits: 2
        }).format(value);
      };

      return {
        rate: `₱${item.rate.toLocaleString()}`,
        base_market_value: formatCurrency(item.base_market_value),
        adjusted_market_value: formatCurrency(item.adjusted_market_value),
        assessment_level: item.assessment_level,
        assessed_value: formatCurrency(item.assessed_value)
      };
    });
  };

  // Handle row clicks for valuation table
  const handleValuationRowClick = (rowData: any) => {
    console.log('Valuation row clicked:', rowData);
  };

  // Calculate base market value for FAAS
  const getBaseMarketValue = () => {
    if (valuationData.length > 0) {
      return valuationData[0]?.base_market_value || 0;
    }
    return 0;
  };

  // Calculate adjusted market value for FAAS
  const getAdjustedMarketValue = () => {
    if (valuationData.length > 0) {
      return valuationData[0]?.adjusted_market_value || 0;
    }
    return 0;
  };

  // Get assessment level for FAAS
  const getAssessmentLevel = () => {
    if (valuationData.length > 0) {
      return {
        rate_percent: valuationData[0]?.assessment_level || '0%'
      };
    }
    return { rate_percent: '0%' };
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonButton onClick={handleBack}>
              <IonIcon icon={arrowBackOutline} />
              Back to Forms
            </IonButton>
          </IonButtons>
          <IonTitle>Agricultural Land - Form {formId}</IonTitle>
          <IonButtons slot="end">
            <IonButton
              onClick={handleViewFaas}
              fill="solid"
              color="primary"
              style={{
                '--background': '#3880ff',
                '--background-hover': '#3171e0',
                '--background-activated': '#3171e0',
                '--background-focused': '#3171e0',
              }}
            >
              <IonIcon icon={documentOutline} slot="start" />
              View FAAS
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent>
        <IonLoading isOpen={isLoading} message="Loading agricultural land details..." />
        
        <IonAlert
          isOpen={showAlert}
          onDidDismiss={() => {
            setShowAlert(false);
            history.goBack();
          }}
          header={'Access Denied'}
          message={alertMessage}
          buttons={['OK']}
        />

        <IonGrid>
          {/* Main Form Data Card */}
          {formData && (
            <IonRow>
              <IonCol size="12">
                <IonCard>
                  <IonCardHeader>
                    <IonCardTitle>Form Details</IonCardTitle>
                  </IonCardHeader>
                  <IonCardContent>
                    {getDisplayData().map((item, index) => (
                      <div key={index} className="data-field">
                        <strong>{item.field}:</strong> 
                        <span className="field-value">{item.value}</span>
                      </div>
                    ))}
                  </IonCardContent>
                </IonCard>
              </IonCol>
            </IonRow>
          )}

          {/* Agricultural Land Valuation Table - KEEP THE DYNAMIC TABLE */}
          {valuationData.length > 0 && (
            <IonRow>
              <IonCol size="12">
                <DynamicTable
                  data={getValuationDisplayData()}
                  title="Agricultural Land Valuation"
                  keyField="value_info_id"
                  onRowClick={handleValuationRowClick}
                />
              </IonCol>
            </IonRow>
          )}

          {/* Land Adjustment Data Card - AFTER THE DYNAMIC TABLE */}
          {adjustmentData && (
            <IonRow>
              <IonCol size="12">
                <IonCard className="agricultural-card">
                  <IonCardHeader>
                    <IonCardTitle className="agricultural-title">
                      <IonIcon icon={leaf} className="agricultural-title-icon" />
                      Land Adjustment Data
                    </IonCardTitle>
                  </IonCardHeader>

                  <IonCardContent>
                    <div className="agricultural-section">
                      <IonText className="agricultural-section-title">
                        <IonIcon icon={trendingUp} className="agricultural-section-icon" />
                        <h4>Adjustment Factors</h4>
                      </IonText>
                      <div className="agricultural-grid">
                        <div className="agricultural-item">
                          <label>Frontage</label>
                          <IonText className="agricultural-value">
                            {adjustmentData.frontage || 'N/A'}
                          </IonText>
                        </div>
                        <div className="agricultural-item">
                          <label>Weather Road</label>
                          <IonText className="agricultural-value">
                            {adjustmentData.weather_road || 'N/A'}
                          </IonText>
                        </div>
                        <div className="agricultural-item">
                          <label>Market</label>
                          <IonText className="agricultural-value">
                            {adjustmentData.market || 'N/A'}
                          </IonText>
                        </div>
                      </div>
                    </div>

                    <div className="agricultural-section">
                      <IonText className="agricultural-section-title">
                        <IonIcon icon={calculator} className="agricultural-section-icon" />
                        <h4>Calculations</h4>
                      </IonText>
                      <div className="agricultural-grid">
                        <div className="agricultural-item">
                          <label>Total Adjustments</label>
                          <IonText className="agricultural-value total-adjustment">
                            {adjustmentData.total_adjustments}
                          </IonText>
                        </div>
                        <div className="agricultural-item">
                          <label>Adjusted Market Value %</label>
                          <IonText className="agricultural-value adjusted-market-value">
                            {adjustmentData.adjusted_market_value}%
                          </IonText>
                        </div>
                      </div>
                    </div>
                  </IonCardContent>
                </IonCard>
              </IonCol>
            </IonRow>
          )}

          {/* Show message if no adjustment data found */}
          {!isLoading && !adjustmentData && (
            <IonRow>
              <IonCol size="12">
                <div style={{ textAlign: 'center', padding: '20px' }}>
                  <IonText>
                    <h3>No Land Adjustment Data Found</h3>
                    <p style={{ marginTop: '10px', color: 'var(--ion-color-medium)' }}>
                      No land adjustment data has been submitted for this form yet.
                    </p>
                  </IonText>
                </div>
              </IonCol>
            </IonRow>
          )}

          {/* Show message if no valuation data found */}
          {!isLoading && valuationData.length === 0 && formData && (
            <IonRow>
              <IonCol size="12">
                <div style={{ textAlign: 'center', padding: '20px' }}>
                  No valuation data found for this agricultural land.
                </div>
              </IonCol>
            </IonRow>
          )}

          {/* Show message if no form data found */}
          {!isLoading && !formData && (
            <IonRow>
              <IonCol size="12">
                <div style={{ textAlign: 'center', padding: '20px' }}>
                  No agricultural land data found for this form.
                </div>
              </IonCol>
            </IonRow>
          )}
        </IonGrid>

        {/* LAND FAAS BACK MODAL */}
        <LandFaasBackModal
          isOpen={showFaasModal}
          onClose={handleCloseFaas}
          formData={formData}
          baseMarketValue={getBaseMarketValue()}
          adjustedMarketValue={getAdjustedMarketValue()}
          assessmentLevel={getAssessmentLevel()}
          agriculturalData={adjustmentData}
          subclassRates={valuationData}
          isAgricultural={true}
          formId={formId}
        />
      </IonContent>
    </IonPage>
  );
};

export default AgriculturalLand;