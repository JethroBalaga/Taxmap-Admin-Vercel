import React, { useState, useRef, useEffect } from 'react';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonGrid,
  IonRow,
  IonCol,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonSearchbar,
  IonLoading,
  IonButtons,
  IonButton,
  IonIcon,
} from '@ionic/react';
import { arrowBackOutline } from 'ionicons/icons';
import '../../CSS/Setup.css';
import { useParams, useHistory } from 'react-router-dom';
import { supabase } from '../../utils/supaBaseClient';
import DynamicTable from '../../components/Globalcomponents/DynamicTable';
import BuildingFaasBackModal from '../../components/Fass/BuildingFaas/BuildingFaasBackModal ';

interface FormData {
  form_id: string;
  declarant_name: string;
  district_name: string;
  class_id: string;
  kind_description: string;
  status: string;
  [key: string]: any;
}

interface GeneralDescription {
  building_code: string;
  storey: number;
  floor_order: number;
  bld_age: string;
  bldg_permit: string;
  construction_percent: string;
  date_constructed: string;
  date_occupied: string;
  date_completed: string;
  depreciation_rate: string;
  value_info_id: string;
  general_id: string;
  created_at?: string;
}

interface AssessmentSummary {
  form_id: string;
  class_id: string;
  actual_used_id: string;
  area: number;
  base_market_value: number;
  final_adjusted_market_value: number;
  assessment_percent: string;
  assessed_value: number;
  value_info_id: string;
}

interface BuildingAdjustment {
  bldg_adjust_id: string;
  building_subcom_id: string;
  area: number;
  rate: number;
  completion_percent: string;
  base_value: number;
  adjusted_value: number;
  value_info_id: string;
  depreciation?: number;
}

interface BuildingCode {
  building_code: string;
  structure_code: string;
  description: string;
  rate: number;
  created_at: string;
}

const BuildingTable: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState<FormData | null>(null);
  const [generalData, setGeneralData] = useState<GeneralDescription[]>([]);
  const [assessmentSummary, setAssessmentSummary] = useState<AssessmentSummary[]>([]);
  const [buildingAdjustments, setBuildingAdjustments] = useState<BuildingAdjustment[]>([]);
  const [buildingCodes, setBuildingCodes] = useState<BuildingCode[]>([]);
  const [filteredAdjustments, setFilteredAdjustments] = useState<BuildingAdjustment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showFaasModal, setShowFaasModal] = useState(false); // MODAL STATE

  const searchRef = useRef<HTMLIonSearchbarElement>(null);

  const { formId } = useParams<{ formId: string }>();
  const history = useHistory();

  useEffect(() => {
    if (formId) {
      loadFormData();
      fetchBuildingCodes();
    }
  }, [formId]);

  useEffect(() => {
    if (formData) {
      fetchGeneralDescriptionData();
      fetchAssessmentSummary();
    }
  }, [formData]);

  useEffect(() => {
    if (generalData.length > 0) {
      fetchBuildingAdjustments();
    }
  }, [generalData]);

  useEffect(() => {
    if (!searchTerm) {
      setFilteredAdjustments(buildingAdjustments);
    } else {
      const filtered = buildingAdjustments.filter(adjustment =>
        adjustment.area.toString().includes(searchTerm) ||
        adjustment.rate.toString().includes(searchTerm) ||
        adjustment.completion_percent.includes(searchTerm) ||
        adjustment.base_value.toString().includes(searchTerm) ||
        adjustment.adjusted_value.toString().includes(searchTerm)
      );
      setFilteredAdjustments(filtered);
    }
  }, [searchTerm, buildingAdjustments]);

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
        return;
      }

      console.log('Raw form data:', data);

      if (data) {
        const kind = data.kind_description?.toUpperCase();
        const classId = data.class_id?.toUpperCase();

        console.log(`Checking conditions - Kind: ${kind}, Class: ${classId}`);

        if (kind === 'BUILDING') {
          setFormData(data);
        } else {
          console.log(`This form is not a Building. Found: Kind=${kind}, Class=${classId}. Required: Kind=BUILDING`);
        }
      }
    } catch (error) {
      console.error('Failed to load form data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchBuildingCodes = async () => {
    try {
      const { data, error } = await supabase
        .from('building_codetbl')
        .select('*');

      if (error) {
        console.error('Error fetching building codes:', error);
        return;
      }

      setBuildingCodes(data || []);
    } catch (error) {
      console.error('Failed to load building codes:', error);
    }
  };

  const fetchGeneralDescriptionData = async () => {
    if (!formId) return;

    try {
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
        setGeneralData([]);
        return;
      }

      const valueInfoIds = valueInfoData.map(item => item.value_info_id);

      const { data: generalData, error: generalError } = await supabase
        .from('general_descriptiontbl')
        .select('*')
        .in('value_info_id', valueInfoIds);

      if (generalError) {
        console.error('Error fetching general_descriptiontbl:', generalError);
        return;
      }

      setGeneralData(generalData || []);
    } catch (error) {
      console.error('Failed to load general description data:', error);
    }
  };

  const fetchAssessmentSummary = async () => {
    if (!formId) return;

    try {
      const { data, error } = await supabase
        .from('vw_form_assessment_summary')
        .select('*')
        .eq('form_id', formId);

      if (error) {
        console.error('Error fetching assessment summary:', error);
        return;
      }

      setAssessmentSummary(data || []);
    } catch (error) {
      console.error('Failed to load assessment summary:', error);
    }
  };

  const fetchBuildingAdjustments = async () => {
    try {
      const valueInfoIds = generalData.map(item => item.value_info_id);

      if (valueInfoIds.length === 0) return;

      const { data, error } = await supabase
        .from('building_adjustments_view')
        .select('*')
        .in('value_info_id', valueInfoIds);

      if (error) {
        console.error('Error fetching building adjustments:', error);
        return;
      }

      setBuildingAdjustments(data || []);
      setFilteredAdjustments(data || []);
    } catch (error) {
      console.error('Failed to load building adjustments:', error);
    }
  };

  const handleBack = () => {
    history.goBack();
  };

  // Prepare building data for the modal
  const getBuildingDataForModal = () => {
    if (generalData.length === 0) return null;

    const firstGeneral = generalData[0];
    return {
      storey: firstGeneral.storey || 1,
      structureType: firstGeneral.building_code || '',
      depreciationRate: parseFloat(firstGeneral.depreciation_rate) || 0,
      constructionPercent: parseFloat(firstGeneral.construction_percent) || 100,
      actual_use: assessmentSummary[0]?.actual_used_id || 'Residential'
    };
  };

  // Prepare assessment level for modal
  const getAssessmentLevelForModal = () => {
    if (assessmentSummary.length === 0) return null;

    const firstAssessment = assessmentSummary[0];
    return {
      rate_percent: firstAssessment.assessment_percent || '1%'
    };
  };

  // Get base market value
  const getBaseMarketValue = () => {
    if (assessmentSummary.length > 0) {
      return assessmentSummary[0]?.base_market_value || 0;
    }
    return 0;
  };

  // Get adjusted market value
  const getAdjustedMarketValue = () => {
    if (assessmentSummary.length > 0) {
      return assessmentSummary[0]?.final_adjusted_market_value || 0;
    }
    return 0;
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

  const getDisplayData = () => {
    if (!formData) return [];

    return Object.entries(formData)
      .filter(([key]) => key !== 'form_id')
      .map(([key, value]) => ({
        field: formatFieldName(key),
        value: value || 'N/A'
      }));
  };

  const getGeneralDisplayData = () => {
    return generalData.map(item => {
      const { value_info_id, general_id, created_at, ...displayItem } = item;
      return displayItem;
    });
  };

  const getAssessmentDisplayData = () => {
    return assessmentSummary.map(item => {
      const { form_id, value_info_id, ...displayItem } = item;
      return displayItem;
    });
  };

  const getAdjustmentDisplayData = () => {
    return filteredAdjustments.map(item => {
      const { value_info_id, ...displayItem } = item;
      return displayItem;
    });
  };

  const handleGeneralRowClick = (rowData: any) => {
    console.log('General description row clicked:', rowData);
  };

  const handleAssessmentRowClick = (rowData: any) => {
    console.log('Assessment summary row clicked:', rowData);
  };

  const handleAdjustmentRowClick = (rowData: any) => {
    console.log('Building adjustment row clicked:', rowData);
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
          <IonTitle>Building Details - Form {formId}</IonTitle>
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
              View Faas
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent>
        <IonLoading isOpen={isLoading} message="Loading building details..." />

        <IonGrid>
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

          {generalData.length > 0 && (
            <IonRow>
              <IonCol size="12">
                <DynamicTable
                  data={getGeneralDisplayData()}
                  title="General Description"
                  keyField="general_id"
                  onRowClick={handleGeneralRowClick}
                />
              </IonCol>
            </IonRow>
          )}

          {assessmentSummary.length > 0 && (
            <IonRow>
              <IonCol size="12">
                <DynamicTable
                  data={getAssessmentDisplayData()}
                  title="Assessment Summary"
                  keyField="form_id"
                  onRowClick={handleAssessmentRowClick}
                />
              </IonCol>
            </IonRow>
          )}

          <IonRow>
            <IonCol size="12" className="search-container">
              <IonSearchbar
                ref={searchRef}
                placeholder="Search adjustments by area, rate, completion %, or value..."
                onIonInput={(e) => setSearchTerm(e.detail.value || '')}
                debounce={300}
                value={searchTerm}
              />
            </IonCol>
          </IonRow>

          {filteredAdjustments.length > 0 ? (
            <IonRow>
              <IonCol size="12">
                <DynamicTable
                  data={getAdjustmentDisplayData()}
                  title="Building Adjustments"
                  keyField="bldg_adjust_id"
                  onRowClick={handleAdjustmentRowClick}
                />
              </IonCol>
            </IonRow>
          ) : (
            !isLoading && buildingAdjustments.length === 0 && (
              <IonRow>
                <IonCol size="12">
                  <div style={{ textAlign: 'center', padding: '20px' }}>
                    No building adjustments data found.
                  </div>
                </IonCol>
              </IonRow>
            )
          )}

          {!isLoading && assessmentSummary.length === 0 && (
            <IonRow>
              <IonCol size="12">
                <div style={{ textAlign: 'center', padding: '20px' }}>
                  No assessment summary data found for this form.
                </div>
              </IonCol>
            </IonRow>
          )}

          {!isLoading && !formData && (
            <IonRow>
              <IonCol size="12">
                <div style={{ textAlign: 'center', padding: '20px' }}>
                  No building data found for this form.
                </div>
              </IonCol>
            </IonRow>
          )}
        </IonGrid>

        {/* BUILDING FAAS BACK MODAL */}
        <BuildingFaasBackModal
          isOpen={showFaasModal}
          onClose={handleCloseFaas}
          buildingData={getBuildingDataForModal()}
          formData={formData}
          baseMarketValue={getBaseMarketValue()}
          buildingAdjustments={buildingAdjustments}
          adjustedMarketValue={getAdjustedMarketValue()}
          assessmentLevel={getAssessmentLevelForModal()}
          buildingCodes={buildingCodes}
          generalData={generalData}
          assessmentSummary={assessmentSummary} // ADD THIS LINE
        />
      </IonContent>
    </IonPage>
  );
};

export default BuildingTable;