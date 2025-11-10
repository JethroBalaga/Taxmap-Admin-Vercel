import React, { useState, useEffect, useCallback } from "react";
import {
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonIcon,
  IonButtons
} from "@ionic/react";
import { documentOutline, close, eyeOutline } from "ionicons/icons";
import { jsPDF } from 'jspdf';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { FileOpener } from '@capawesome-team/capacitor-file-opener';
import { supabase } from '../../../utils/supaBaseClient';
import "../../../CSS/LandFaasBackModal.css";

interface LandFaasBackModalProps {
  isOpen: boolean;
  onClose: () => void;
  formData?: any;
  baseMarketValue?: number;
  adjustedMarketValue?: number;
  assessmentLevel?: any;
  agriculturalData?: any;
  landAdjustments?: any[];
  subclassRates?: any[];
  isAgricultural?: boolean;
  formId?: string;
}

interface SubclassData {
  subclass_id: string;
  subclass_description: string;
  rate: number;
  base_market_value: number;
  adjustment_market_value: number;
  assessment_level: string;
  assessed_value: number;
}

interface AdjustmentData {
  adjustment_id: string;
  adjustment_type: string;
  adjustment_factor: number;
  description: string;
  value_adjustment: number;
  adjusted_market_value: number;
}

interface AgriculturalAdjustmentData {
  frontage: number;
  weather_road: number;
  market: number;
  total_adjustments: number;
  adjusted_market_value: number;
}

const LandFaasBackModal: React.FC<LandFaasBackModalProps> = ({
  isOpen,
  onClose,
  formData,
  baseMarketValue = 0,
  adjustedMarketValue = 0,
  assessmentLevel,
  agriculturalData,
  landAdjustments = [],
  subclassRates = [],
  isAgricultural = false,
  formId
}) => {
  const [adjustment, setAdjustment] = useState<Record<string, string>>({});
  const [assessment, setAssessment] = useState<Record<string, string>>({});
  const [subclassData, setSubclassData] = useState<SubclassData[]>([]);
  const [adjustmentData, setAdjustmentData] = useState<AdjustmentData[]>([]);
  const [agriculturalAdjustmentData, setAgriculturalAdjustmentData] = useState<AgriculturalAdjustmentData | null>(null);
  const [isTaxable, setIsTaxable] = useState<boolean>(false);
  const [isExempt, setIsExempt] = useState<boolean>(false);
  const [currentQuarter, setCurrentQuarter] = useState<string>("1");
  const [currentYear, setCurrentYear] = useState<string>("");
  const [isGeneratingPdf, setIsGeneratingPdf] = useState<boolean>(false);
  const [showAssessment, setShowAssessment] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Get current quarter and year
  useEffect(() => {
    const now = new Date();
    const year = now.getFullYear();
    setCurrentQuarter("1");
    setCurrentYear(year.toString());
  }, []);

  // Load data from database when modal opens
  useEffect(() => {
    if (isOpen && formId) {
      loadData();
    }
  }, [isOpen, formId]);

  // LOAD FORM DATA TO GET SUBCLASS_ID
  const loadFormData = async () => {
    try {
      const { data: formData, error } = await supabase
        .from('formtbl')
        .select('*')
        .eq('form_id', formId)
        .single();

      if (error) {
        console.error('Error fetching form data:', error);
        return null;
      }

      return formData;
    } catch (error) {
      console.error('Error fetching form data:', error);
      return null;
    }
  };

  // GET SUBCLASS DESCRIPTION
  const fetchSubclassDescription = async (subclassId: string) => {
    try {
      const { data: subclassData, error } = await supabase
        .from('subclasstbl')
        .select('subclass')
        .eq('subclass_id', subclassId)
        .single();

      if (error) {
        console.error('Error fetching subclass:', error);
        return 'N/A';
      }

      return subclassData?.subclass || 'N/A';
    } catch (error) {
      console.error('Error fetching subclass:', error);
      return 'N/A';
    }
  };

  // MAIN DATA LOADING FUNCTION
  const loadData = async () => {
    setIsLoading(true);
    try {
      // 1. First get the form data to get subclass_id
      const formDataFromDB = await loadFormData();
      if (!formDataFromDB) {
        console.error('No form data found');
        return;
      }

      // 2. Get subclass description
      let subclassDescription = 'N/A';
      if (formDataFromDB.subclass_id) {
        subclassDescription = await fetchSubclassDescription(formDataFromDB.subclass_id);
      }

      // 3. Calculate assessed value
      const assessmentRate = parseFloat(assessmentLevel?.rate_percent?.replace('%', '') || '0') / 100;
      const assessedValue = (adjustedMarketValue || 0) * assessmentRate;

      // 4. Create subclass data with assessment level and assessed value
      const simpleSubclassData: SubclassData[] = [{
        subclass_id: formDataFromDB.subclass_id || 'default',
        subclass_description: subclassDescription,
        rate: subclassRates?.[0]?.rate || 0,
        base_market_value: baseMarketValue || 0,
        adjustment_market_value: adjustedMarketValue || 0,
        assessment_level: assessmentLevel?.rate_percent || '0%',
        assessed_value: assessedValue
      }];

      setSubclassData(simpleSubclassData);

      // 5. Load adjustment data based on land type
      if (isAgricultural) {
        await loadAgriculturalAdjustmentData();
      } else {
        await loadNonAgriculturalAdjustmentData();
      }

    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Load agricultural adjustment data
  const loadAgriculturalAdjustmentData = async () => {
    try {
      // Get value_info_id first
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
        return;
      }

      const valueInfoIds = valueInfoData.map(item => item.value_info_id);

      const { data: adjustmentData, error } = await supabase
        .from('land_adjustment_view')
        .select('*')
        .in('value_info_id', valueInfoIds);

      if (error) {
        console.error('Error fetching agricultural adjustment data:', error);
        return;
      }

      if (adjustmentData && adjustmentData.length > 0) {
        setAgriculturalAdjustmentData(adjustmentData[0]);
      }
    } catch (error) {
      console.error('Error loading agricultural adjustment data:', error);
    }
  };

  // Load non-agricultural adjustment data
  const loadNonAgriculturalAdjustmentData = async () => {
    try {
      // Get value_info_id first
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
        return;
      }

      const valueInfoIds = valueInfoData.map(item => item.value_info_id);

      // Try other_adjustments_view first
      let { data: adjustmentData, error } = await supabase
        .from('other_adjustments_view')
        .select('*')
        .in('value_info_id', valueInfoIds);

      if (error || !adjustmentData || adjustmentData.length === 0) {
        // Try stripping_adjustments_view as fallback
        const { data: strippingData, error: strippingError } = await supabase
          .from('stripping_adjustments_view')
          .select('*')
          .in('value_info_id', valueInfoIds);

        if (strippingError) {
          console.error('Error fetching non-agricultural adjustment data:', strippingError);
          return;
        }

        adjustmentData = strippingData;
      }

      if (adjustmentData) {
        console.log('Non-agricultural adjustment data loaded:', adjustmentData);
        setAdjustmentData(adjustmentData);
      }
    } catch (error) {
      console.error('Error loading non-agricultural adjustment data:', error);
    }
  };

  // Set taxable checkbox based on assessment level
  useEffect(() => {
    if (assessmentLevel && assessmentLevel.rate_percent && assessmentLevel.rate_percent !== '0%') {
      setIsTaxable(true);
      setIsExempt(false);
    } else {
      setIsTaxable(false);
      setIsExempt(true);
    }
  }, [assessmentLevel]);

  // Universal PDF handling for both native and web
  const saveAndOpenPdf = async (pdfBlob: Blob) => {
    try {
      const isNative = (window as any).Capacitor?.isNativePlatform();
      
      if (isNative) {
        const base64Data = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onerror = reject;
          reader.onload = () => {
            const result = reader.result as string;
            const base64 = result.split(',')[1];
            resolve(base64);
          };
          reader.readAsDataURL(pdfBlob);
        });

        const timestamp = new Date().getTime();
        const fileName = `LandFAAS_${formData?.form_id || timestamp}.pdf`;

        const result = await Filesystem.writeFile({
          path: fileName,
          data: base64Data,
          directory: Directory.Documents,
          recursive: true
        });

        try {
          await FileOpener.openFile({ 
            path: result.uri
          });
        } catch (openError) {
          alert(`PDF saved successfully to: ${result.uri}\nYou can find it in your Documents folder.`);
        }
      } else {
        const pdfUrl = URL.createObjectURL(pdfBlob);
        const downloadLink = document.createElement('a');
        downloadLink.href = pdfUrl;
        downloadLink.download = `LandFAAS_${formData?.form_id || new Date().getTime()}.pdf`;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
        setTimeout(() => URL.revokeObjectURL(pdfUrl), 1000);
      }
    } catch (error) {
      console.error('Error in saveAndOpenPdf:', error);
      alert('PDF generated successfully. If download did not start automatically, please check your downloads folder.');
    }
  };

  // Pure jsPDF generation for Land FAAS
  const generatePdf = useCallback(async () => {
    if (isGeneratingPdf) return;
    
    setIsGeneratingPdf(true);
    
    try {
      const actualUse = formData?.actualUse || formData?.kind_description || 'N/A';
      const marketValue = adjustedMarketValue || baseMarketValue || 0;
      const { totalAdjustment: agriculturalTotalAdjustment, adjustments: agriculturalAdjustments } = calculateAgriculturalAdjustments();
      const { totalBaseValue, totalAdjustedValue, totalAssessedValue } = calculateSubclassTotals();

      // Calculate assessment value
      const assessmentValue = totalAssessedValue > 0 ? totalAssessedValue :
        (assessmentLevel ? marketValue * (parseFloat(assessmentLevel.rate_percent?.replace('%', '') || '0') / 100) : 0);

      // Create PDF
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      let yPosition = 20;

      // PROPERTY DETAILS SECTION
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text('PROPERTY DETAILS', 20, yPosition);
      yPosition += 8;

      // Property details table
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'normal');
      
      const propertyDetails = [
        { label: 'Form ID:', value: formData?.form_id || 'N/A' },
        { label: 'Declarant:', value: formData?.declarant_name || 'N/A' },
        { label: 'District:', value: formData?.district_name || 'N/A' },
        { label: 'Land Type:', value: isAgricultural ? 'Agricultural Land' : 'Non-Agricultural Land' },
        { label: 'Actual Use:', value: actualUse },
        { label: 'Area:', value: `${formData?.area || 0} sqm` },
        { label: 'Base Market Value:', value: formatCurrency(totalBaseValue || baseMarketValue || 0) },
        { label: 'Adjusted Market Value:', value: formatCurrency(totalAdjustedValue || marketValue) },
        { label: 'Assessment Level:', value: assessmentLevel?.rate_percent || '0%' },
        { label: 'Assessed Value:', value: formatCurrency(assessmentValue) }
      ];

      propertyDetails.forEach((item, index) => {
        if (yPosition > 270) {
          pdf.addPage();
          yPosition = 20;
        }
        pdf.text(`${item.label}`, 20, yPosition);
        pdf.text(item.value, 60, yPosition);
        yPosition += 6;
      });

      yPosition += 10;

      // SUBCLASS BREAKDOWN SECTION
      if (subclassData && subclassData.length > 0) {
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'bold');
        pdf.text('SUBCLASS BREAKDOWN', 20, yPosition);
        yPosition += 8;

        // Table headers
        pdf.setFontSize(6);
        pdf.setFont('helvetica', 'bold');
        const headers = ['Subclass Desc', 'Rate (/sqm)', 'Area (sqm)', 'Base Mkt Val', 'Adj Mkt Val', 'Assess Level', 'Assess Value'];
        
        let xPosition = 10;
        const columnWidths = [30, 18, 18, 25, 25, 18, 25];
        headers.forEach((header, index) => {
          pdf.text(header, xPosition, yPosition);
          xPosition += columnWidths[index];
        });
        yPosition += 5;

        // Subclass rows
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(6);
        subclassData.forEach((rate, index) => {
          const area = formData?.area || 0;
          const subclassDescription = rate.subclass_description || 'N/A';
          const ratePerSqm = parseFloat(rate.rate as any) || 0;
          const baseMarketValue = parseFloat(rate.base_market_value as any) || 0;
          const adjustedMarketValue = parseFloat(rate.adjustment_market_value as any) || 0;
          const assessmentLevel = rate.assessment_level || '0%';
          const assessedValue = parseFloat(rate.assessed_value as any) || 0;

          const rowData = [
            subclassDescription.substring(0, 20),
            formatRate(ratePerSqm),
            area.toLocaleString(),
            Math.round(baseMarketValue).toLocaleString(),
            Math.round(adjustedMarketValue).toLocaleString(),
            assessmentLevel,
            Math.round(assessedValue).toLocaleString()
          ];

          xPosition = 10;
          rowData.forEach((data, index) => {
            const maxLength = [20, 8, 8, 10, 10, 8, 10][index];
            const text = (typeof data === 'string' ? data : String(data)).substring(0, maxLength);
            pdf.text(text, xPosition, yPosition);
            xPosition += columnWidths[index];
          });
          yPosition += 5;

          if (yPosition > 270) {
            pdf.addPage();
            yPosition = 20;
          }
        });

        // Subclass totals
        yPosition += 4;
        pdf.setFont('helvetica', 'bold');
        pdf.text('Total', 10, yPosition);
        pdf.text(Math.round(totalBaseValue).toLocaleString(), 10 + 30 + 18 + 18, yPosition);
        pdf.text(Math.round(totalAdjustedValue).toLocaleString(), 10 + 30 + 18 + 18 + 25, yPosition);
        pdf.text(Math.round(totalAssessedValue).toLocaleString(), 10 + 30 + 18 + 18 + 25 + 25 + 18, yPosition);

        yPosition += 15;
      }

      // VALUE ADJUSTMENT SECTION
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'bold');
      pdf.text('VALUE ADJUSTMENT', 20, yPosition);
      yPosition += 8;

      // Table headers
      pdf.setFontSize(6);
      pdf.setFont('helvetica', 'bold');
      const adjustmentHeaders = ['Base Mkt Val', 'Adj Factor', 'Adj %', 'Value Adj', 'Mkt Val'];
      
      let xPosition = 10;
      const adjColumnWidths = [25, 25, 15, 25, 25];
      adjustmentHeaders.forEach((header, index) => {
        pdf.text(header, xPosition, yPosition);
        xPosition += adjColumnWidths[index];
      });
      yPosition += 5;

      // Agricultural Adjustments
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(6);
      if (isAgricultural && agriculturalAdjustments && agriculturalAdjustments.length > 0) {
        agriculturalAdjustments.forEach((adj, index) => {
          const rowData = [
            Math.round(totalBaseValue || baseMarketValue || 0).toLocaleString(),
            (adj.description || 'N/A').substring(0, 15),
            `${adj.value}%`,
            Math.round((totalBaseValue || baseMarketValue || 0) * (adj.value / 100)).toLocaleString(),
            Math.round(totalAdjustedValue || marketValue).toLocaleString()
          ];

          xPosition = 10;
          rowData.forEach((data, index) => {
            const maxLength = [10, 15, 5, 10, 10][index];
            const text = (typeof data === 'string' ? data : String(data)).substring(0, maxLength);
            pdf.text(text, xPosition, yPosition);
            xPosition += adjColumnWidths[index];
          });
          yPosition += 5;

          if (yPosition > 270) {
            pdf.addPage();
            yPosition = 20;
          }
        });
      }

      // Non-Agricultural Adjustments
      if (!isAgricultural && adjustmentData && adjustmentData.length > 0) {
        adjustmentData.forEach((adj, index) => {
          const rowData = [
            Math.round(totalBaseValue || baseMarketValue || 0).toLocaleString(),
            (adj.adjustment_type || 'N/A').substring(0, 15),
            formatAdjustmentFactor(adj.adjustment_factor).substring(0, 5),
            Math.round(parseFloat(adj.value_adjustment as any) || 0).toLocaleString(),
            Math.round(parseFloat(adj.adjusted_market_value as any) || 0).toLocaleString()
          ];

          xPosition = 10;
          rowData.forEach((data, index) => {
            const maxLength = [10, 15, 5, 10, 10][index];
            const text = (typeof data === 'string' ? data : String(data)).substring(0, maxLength);
            pdf.text(text, xPosition, yPosition);
            xPosition += adjColumnWidths[index];
          });
          yPosition += 5;

          if (yPosition > 270) {
            pdf.addPage();
            yPosition = 20;
          }
        });
      }

      // Adjustment totals
      yPosition += 4;
      pdf.setFont('helvetica', 'bold');
      pdf.text(Math.round(totalBaseValue || baseMarketValue || 0).toLocaleString(), 10, yPosition);
      pdf.text('Total', 10 + 25, yPosition);
      pdf.text(`${isAgricultural ? agriculturalTotalAdjustment : '0'}%`, 10 + 25 + 25, yPosition);
      pdf.text(Math.round((totalBaseValue || baseMarketValue || 0) * ((isAgricultural ? agriculturalTotalAdjustment : 0) / 100)).toLocaleString(), 10 + 25 + 25 + 15, yPosition);
      pdf.text(Math.round(totalAdjustedValue || marketValue).toLocaleString(), 10 + 25 + 25 + 15 + 25, yPosition);

      yPosition += 15;

      // PROPERTY ASSESSMENT SECTION
      pdf.setFontSize(10);
      pdf.text('PROPERTY ASSESSMENT', 20, yPosition);
      yPosition += 8;

      // Assessment table
      pdf.setFontSize(7);
      const assessmentHeaders = ['Actual Use', 'Adj Mkt Val', 'Assess Level %', 'Assess Value'];
      
      xPosition = 20;
      assessmentHeaders.forEach((header, index) => {
        pdf.text(header, xPosition, yPosition);
        xPosition += 42;
      });
      yPosition += 5;

      // Assessment data
      pdf.setFont('helvetica', 'normal');
      const assessmentData = [
        actualUse.substring(0, 15),
        Math.round(totalAdjustedValue || marketValue).toLocaleString(),
        assessmentLevel?.rate_percent || '0%',
        Math.round(assessmentValue).toLocaleString()
      ];

      xPosition = 20;
      assessmentData.forEach((data, index) => {
        pdf.text(String(data), xPosition, yPosition);
        xPosition += 42;
      });

      yPosition += 15;

      // TAXABLE/EXEMPT SECTION
      pdf.setFontSize(8);
      pdf.text(`Taxable: ${isTaxable ? '[X]' : '[ ]'}`, 20, yPosition);
      pdf.text(`Exempt: ${isExempt ? '[X]' : '[ ]'}`, 60, yPosition);
      pdf.text(`Effectivity: ${currentQuarter} Qtr. ${currentYear} Yr.`, 100, yPosition);

      yPosition += 12;

      // SIGNATURE SECTION
      pdf.text('Approved by:', 20, yPosition);
      yPosition += 12;

      pdf.line(20, yPosition, 100, yPosition);
      yPosition += 6;

      pdf.setFontSize(6);
      pdf.text('Municipal Assessor', 60, yPosition, { align: 'center' });

      yPosition += 12;

      // MEMORANDA
      pdf.setFontSize(7);
      pdf.text('MEMORANDA:', 20, yPosition);
      yPosition += 4;
      pdf.text('Date of Entry in the Record of Assessment ______ By: ____________', 20, yPosition);

      // POWERED BY
      yPosition += 8;
      pdf.setFontSize(5);
      pdf.text('Powered by: SPIDC', 190, yPosition, { align: 'right' });

      // Convert to Blob for universal handling
      const pdfBlob = pdf.output('blob');
      
      // Use the universal PDF handler
      await saveAndOpenPdf(pdfBlob);
      
    } catch (error) {
      console.error("PDF generation failed", error);
      alert("PDF generation failed — check console.");
    } finally {
      setIsGeneratingPdf(false);
    }
  }, [
    isGeneratingPdf, formData, baseMarketValue, adjustedMarketValue, 
    assessmentLevel, subclassData, adjustmentData, agriculturalAdjustmentData,
    isTaxable, isExempt, currentQuarter, currentYear, isAgricultural
  ]);

  // Calculate agricultural adjustments
  const calculateAgriculturalAdjustments = () => {
    if (!agriculturalAdjustmentData || !isAgricultural) return { totalAdjustment: 0, adjustments: [] };

    const frontage = agriculturalAdjustmentData.frontage || 0;
    const weatherRoad = agriculturalAdjustmentData.weather_road || 0;
    const market = agriculturalAdjustmentData.market || 0;

    const totalAdjustment = agriculturalAdjustmentData.total_adjustments || (frontage + weatherRoad + market);

    const adjustments = [
      { description: "Frontage", value: frontage },
      { description: "Weather Road", value: weatherRoad },
      { description: "Market", value: market }
    ].filter(adj => adj.value !== 0);

    return { totalAdjustment, adjustments };
  };

  // Calculate subclass totals
  const calculateSubclassTotals = () => {
    let totalBaseValue = 0;
    let totalAdjustedValue = 0;
    let totalAssessedValue = 0;

    subclassData.forEach(rate => {
      totalBaseValue += parseFloat(rate.base_market_value as any) || 0;
      totalAdjustedValue += parseFloat(rate.adjustment_market_value as any) || 0;
      totalAssessedValue += parseFloat(rate.assessed_value as any) || 0;
    });

    return { totalBaseValue, totalAdjustedValue, totalAssessedValue };
  };

  // Format currency values
  const formatCurrency = (value: number) => {
    if (isNaN(value)) return '₱0.00';
    return `₱${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // Safe number formatting for rates
  const formatRate = (rate: any) => {
    if (!rate) return '0.0000';

    try {
      const numRate = typeof rate === 'string' ? parseFloat(rate) : rate;
      if (isNaN(numRate)) return '0.0000';
      return numRate.toFixed(4);
    } catch (error) {
      return '0.0000';
    }
  };

  // Function to properly format adjustment factor without double percent signs
  const formatAdjustmentFactor = (factor: any) => {
    if (!factor) return '0%';

    try {
      const factorStr = String(factor);
      // If it already ends with %, return as is
      if (factorStr.endsWith('%')) {
        return factorStr;
      }
      // Otherwise, add % sign
      return `${factorStr}%`;
    } catch (error) {
      return '0%';
    }
  };

  const actualUse = formData?.actualUse || formData?.kind_description || 'N/A';
  const marketValue = adjustedMarketValue || baseMarketValue || 0;
  const { totalAdjustment: agriculturalTotalAdjustment, adjustments: agriculturalAdjustments } = calculateAgriculturalAdjustments();
  const { totalBaseValue, totalAdjustedValue, totalAssessedValue } = calculateSubclassTotals();

  // Calculate assessment value
  const assessmentValue = totalAssessedValue > 0 ? totalAssessedValue :
    (assessmentLevel ? marketValue * (parseFloat(assessmentLevel.rate_percent?.replace('%', '') || '0') / 100) : 0);

  return (
    <IonModal
      isOpen={isOpen}
      onDidDismiss={onClose}
      style={{ '--width': '95%', '--height': '95%' }}
    >
      <IonHeader>
        <IonToolbar>
          <IonTitle>
            {isAgricultural ? 'Agricultural' : 'Non-Agricultural'} Land FAAS - Form {formData?.form_id}
          </IonTitle>
          <IonButtons slot="end">
            <IonButton 
              onClick={() => setShowAssessment(!showAssessment)}
              className="view-assessment-btn"
            >
              <IonIcon icon={eyeOutline} slot="start" />
              {showAssessment ? 'Hide Assessment' : 'View Assessment'}
            </IonButton>
            <IonButton 
              onClick={generatePdf} 
              className="generate-pdf-btn"
              disabled={isGeneratingPdf || isLoading}
            >
              <IonIcon icon={documentOutline} slot="start" />
              {isGeneratingPdf ? 'Generating...' : 'Generate PDF'}
            </IonButton>
            <IonButton onClick={onClose}>
              <IonIcon icon={close} />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent>
        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '20px' }}>
            Loading FAAS data...
          </div>
        ) : (
          <div id="land-faas-back-sheet" className="sheet">
            {/* PROPERTY DETAILS TABLE */}
            <div className="section-header">PROPERTY DETAILS</div>
            <table className="table property-details-table">
              <thead>
                <tr>
                  <th>Field</th>
                  <th>Value</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>Form ID</strong></td>
                  <td>{formData?.form_id || 'N/A'}</td>
                </tr>
                <tr>
                  <td><strong>Declarant</strong></td>
                  <td>{formData?.declarant_name || 'N/A'}</td>
                </tr>
                <tr>
                  <td><strong>District</strong></td>
                  <td>{formData?.district_name || 'N/A'}</td>
                </tr>
                <tr>
                  <td><strong>Land Type</strong></td>
                  <td>{isAgricultural ? 'Agricultural Land' : 'Non-Agricultural Land'}</td>
                </tr>
                <tr>
                  <td><strong>Actual Use</strong></td>
                  <td>{actualUse}</td>
                </tr>
                <tr>
                  <td><strong>Area</strong></td>
                  <td>{formData?.area || 0} sqm</td>
                </tr>
                <tr>
                  <td><strong>Base Market Value</strong></td>
                  <td>{formatCurrency(totalBaseValue || baseMarketValue || 0)}</td>
                </tr>
                <tr>
                  <td><strong>Adjusted Market Value</strong></td>
                  <td>{formatCurrency(totalAdjustedValue || marketValue)}</td>
                </tr>
                <tr>
                  <td><strong>Assessment Level</strong></td>
                  <td>{assessmentLevel?.rate_percent || '0%'}</td>
                </tr>
                <tr>
                  <td><strong>Assessed Value</strong></td>
                  <td>{formatCurrency(assessmentValue)}</td>
                </tr>
              </tbody>
            </table>

            {/* SUBCLASS BREAKDOWN WITH ASSESSMENT LEVEL AND ASSESSED VALUE */}
            {subclassData && subclassData.length > 0 && (
              <>
                <div className="section-header">SUBCLASS BREAKDOWN</div>
                <table className="table subclass-table">
                  <thead>
                    <tr>
                      <th>Subclass Description</th>
                      <th>Rate (₱/sqm)</th>
                      <th>Area (sqm)</th>
                      <th>Base Market Value (₱)</th>
                      <th>Adjusted Market Value (₱)</th>
                      <th>Assessment Level</th>
                      <th>Assessed Value (₱)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {subclassData.map((rate, index) => {
                      const area = formData?.area || 0;
                      const subclassDescription = rate.subclass_description || 'N/A';
                      const ratePerSqm = parseFloat(rate.rate as any) || 0;
                      const baseMarketValue = parseFloat(rate.base_market_value as any) || 0;
                      const adjustedMarketValue = parseFloat(rate.adjustment_market_value as any) || 0;
                      const assessmentLevel = rate.assessment_level || '0%';
                      const assessedValue = parseFloat(rate.assessed_value as any) || 0;

                      return (
                        <tr key={index}>
                          <td>
                            <input
                              value={adjustment[`subclass_desc_${index}`] || subclassDescription}
                              onChange={(e) => setAdjustment((p) => ({ ...p, [`subclass_desc_${index}`]: e.target.value }))}
                              placeholder={subclassDescription}
                            />
                          </td>
                          <td>
                            <input
                              value={adjustment[`subclass_rate_${index}`] || formatRate(ratePerSqm)}
                              onChange={(e) => setAdjustment((p) => ({ ...p, [`subclass_rate_${index}`]: e.target.value }))}
                              placeholder={formatRate(ratePerSqm)}
                            />
                          </td>
                          <td>
                            <input
                              value={adjustment[`subclass_area_${index}`] || area.toLocaleString()}
                              onChange={(e) => setAdjustment((p) => ({ ...p, [`subclass_area_${index}`]: e.target.value }))}
                              placeholder={area.toLocaleString()}
                            />
                          </td>
                          <td>
                            <input
                              value={adjustment[`subclass_base_${index}`] || formatCurrency(baseMarketValue)}
                              onChange={(e) => setAdjustment((p) => ({ ...p, [`subclass_base_${index}`]: e.target.value }))}
                              placeholder={formatCurrency(baseMarketValue)}
                            />
                          </td>
                          <td>
                            <input
                              value={adjustment[`subclass_adjusted_${index}`] || formatCurrency(adjustedMarketValue)}
                              onChange={(e) => setAdjustment((p) => ({ ...p, [`subclass_adjusted_${index}`]: e.target.value }))}
                              placeholder={formatCurrency(adjustedMarketValue)}
                            />
                          </td>
                          <td>
                            <input
                              value={adjustment[`subclass_assessment_${index}`] || assessmentLevel}
                              onChange={(e) => setAdjustment((p) => ({ ...p, [`subclass_assessment_${index}`]: e.target.value }))}
                              placeholder={assessmentLevel}
                            />
                          </td>
                          <td>
                            <input
                              value={adjustment[`subclass_assessed_${index}`] || formatCurrency(assessedValue)}
                              onChange={(e) => setAdjustment((p) => ({ ...p, [`subclass_assessed_${index}`]: e.target.value }))}
                              placeholder={formatCurrency(assessedValue)}
                            />
                          </td>
                        </tr>
                      );
                    })}
                    <tr className="subtotal-row">
                      <td style={{ textAlign: 'center', fontWeight: 'bold' }} colSpan={3}>
                        Total
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 'bold' }}>
                        {formatCurrency(totalBaseValue)}
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 'bold' }}>
                        {formatCurrency(totalAdjustedValue)}
                      </td>
                      <td></td>
                      <td style={{ textAlign: 'right', fontWeight: 'bold' }}>
                        {formatCurrency(totalAssessedValue)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </>
            )}

            {/* VALUE ADJUSTMENT SECTION - WORKING FOR BOTH AGRI AND NON-AGRI */}
            <div className="section-header">VALUE ADJUSTMENT</div>
            <table className="table adjustment-table">
              <thead>
                <tr>
                  <th>Base Market Value (₱)</th>
                  <th>Adjustment Factor</th>
                  <th>Adjustment Percent</th>
                  <th>Value Adjustment (₱)</th>
                  <th>Market Value (₱)</th>
                </tr>
              </thead>
              <tbody>
                {/* Agricultural Adjustments - Only show for agricultural land */}
                {isAgricultural && agriculturalAdjustments && agriculturalAdjustments.map((adj, index) => (
                  <tr key={`agri-${index}`}>
                    <td>
                      <input
                        value={adjustment[`agri_base_value_${index}`] || formatCurrency(totalBaseValue || baseMarketValue || 0)}
                        onChange={(e) => setAdjustment((p) => ({ ...p, [`agri_base_value_${index}`]: e.target.value }))}
                        placeholder={formatCurrency(totalBaseValue || baseMarketValue || 0)}
                      />
                    </td>
                    <td>
                      <input
                        value={adjustment[`agri_factor_${index}`] || adj.description || 'N/A'}
                        onChange={(e) => setAdjustment((p) => ({ ...p, [`agri_factor_${index}`]: e.target.value }))}
                        placeholder={adj.description || 'N/A'}
                      />
                    </td>
                    <td>
                      <input
                        value={adjustment[`agri_percent_${index}`] || `${adj.value}%`}
                        onChange={(e) => setAdjustment((p) => ({ ...p, [`agri_percent_${index}`]: e.target.value }))}
                        placeholder={`${adj.value}%`}
                      />
                    </td>
                    <td>
                      <input
                        value={adjustment[`agri_value_adj_${index}`] || formatCurrency((totalBaseValue || baseMarketValue || 0) * (adj.value / 100))}
                        onChange={(e) => setAdjustment((p) => ({ ...p, [`agri_value_adj_${index}`]: e.target.value }))}
                        placeholder={formatCurrency((totalBaseValue || baseMarketValue || 0) * (adj.value / 100))}
                      />
                    </td>
                    <td>
                      <input
                        value={adjustment[`agri_market_${index}`] || formatCurrency(totalAdjustedValue || marketValue)}
                        onChange={(e) => setAdjustment((p) => ({ ...p, [`agri_market_${index}`]: e.target.value }))}
                        placeholder={formatCurrency(totalAdjustedValue || marketValue)}
                      />
                    </td>
                  </tr>
                ))}

                {/* Non-Agricultural Adjustments - Only show for non-agricultural land */}
                {!isAgricultural && adjustmentData && adjustmentData.map((adj, index) => {
                  return (
                    <tr key={`nonagri-${index}`}>
                      <td>
                        <input
                          value={adjustment[`base_value_${index}`] || formatCurrency(totalBaseValue || baseMarketValue || 0)}
                          onChange={(e) => setAdjustment((p) => ({ ...p, [`base_value_${index}`]: e.target.value }))}
                          placeholder={formatCurrency(totalBaseValue || baseMarketValue || 0)}
                        />
                      </td>
                      <td>
                        <input
                          value={adjustment[`factor_${index}`] || adj.adjustment_type || 'N/A'}
                          onChange={(e) => setAdjustment((p) => ({ ...p, [`factor_${index}`]: e.target.value }))}
                          placeholder={adj.adjustment_type || 'N/A'}
                        />
                      </td>
                      <td>
                        <input
                          value={adjustment[`percent_${index}`] || formatAdjustmentFactor(adj.adjustment_factor)}
                          onChange={(e) => setAdjustment((p) => ({ ...p, [`percent_${index}`]: e.target.value }))}
                          placeholder={formatAdjustmentFactor(adj.adjustment_factor)}
                        />
                      </td>
                      <td>
                        <input
                          value={adjustment[`value_adj_${index}`] || formatCurrency(parseFloat(adj.value_adjustment as any) || 0)}
                          onChange={(e) => setAdjustment((p) => ({ ...p, [`value_adj_${index}`]: e.target.value }))}
                          placeholder={formatCurrency(parseFloat(adj.value_adjustment as any) || 0)}
                        />
                      </td>
                      <td>
                        <input
                          value={adjustment[`market_${index}`] || formatCurrency(parseFloat(adj.adjusted_market_value as any) || 0)}
                          onChange={(e) => setAdjustment((p) => ({ ...p, [`market_${index}`]: e.target.value }))}
                          placeholder={formatCurrency(parseFloat(adj.adjusted_market_value as any) || 0)}
                        />
                      </td>
                    </tr>
                  );
                })}

                {/* Empty rows to ensure minimum 5 rows total */}
                {Array.from({ length: Math.max(0, 5 - ((adjustmentData?.length || 0) + (agriculturalAdjustments?.length || 0))) }).map((_, index) => {
                  const emptyIndex = index + (adjustmentData?.length || 0) + (agriculturalAdjustments?.length || 0);
                  return (
                    <tr key={`empty-${emptyIndex}`}>
                      <td>
                        <input
                          value={adjustment[`empty_base_${emptyIndex}`] || ""}
                          onChange={(e) => setAdjustment((p) => ({ ...p, [`empty_base_${emptyIndex}`]: e.target.value }))}
                          placeholder="Enter base value"
                        />
                      </td>
                      <td>
                        <input
                          value={adjustment[`empty_factor_${emptyIndex}`] || ""}
                          onChange={(e) => setAdjustment((p) => ({ ...p, [`empty_factor_${emptyIndex}`]: e.target.value }))}
                          placeholder="Enter factor"
                        />
                      </td>
                      <td>
                        <input
                          value={adjustment[`empty_percent_${emptyIndex}`] || ""}
                          onChange={(e) => setAdjustment((p) => ({ ...p, [`empty_percent_${emptyIndex}`]: e.target.value }))}
                          placeholder="Enter percent"
                        />
                      </td>
                      <td>
                        <input
                          value={adjustment[`empty_value_${emptyIndex}`] || ""}
                          onChange={(e) => setAdjustment((p) => ({ ...p, [`empty_value_${emptyIndex}`]: e.target.value }))}
                          placeholder="Enter value adjustment"
                        />
                      </td>
                      <td>
                        <input
                          value={adjustment[`empty_market_${emptyIndex}`] || ""}
                          onChange={(e) => setAdjustment((p) => ({ ...p, [`empty_market_${emptyIndex}`]: e.target.value }))}
                          placeholder="Enter market value"
                        />
                      </td>
                    </tr>
                  );
                })}

                <tr className="subtotal-row">
                  <td style={{ textAlign: 'right', fontWeight: 'bold' }}>
                    <input
                      value={adjustment[`total_base_final`] || formatCurrency(totalBaseValue || baseMarketValue || 0)}
                      onChange={(e) => setAdjustment((p) => ({ ...p, total_base_final: e.target.value }))}
                      placeholder={formatCurrency(totalBaseValue || baseMarketValue || 0)}
                      style={{ textAlign: 'right', fontWeight: 'bold', border: 'none', background: 'transparent' }}
                    />
                  </td>
                  <td style={{ textAlign: 'center', fontWeight: 'bold' }}>
                    Total
                  </td>
                  <td style={{ textAlign: 'center', fontWeight: 'bold' }}>
                    <input
                      value={adjustment[`total_adjustment_percent`] || `${isAgricultural ? agriculturalTotalAdjustment : '0'}%`}
                      onChange={(e) => setAdjustment((p) => ({ ...p, total_adjustment_percent: e.target.value }))}
                      placeholder={`${isAgricultural ? agriculturalTotalAdjustment : '0'}%`}
                      style={{ textAlign: 'center', fontWeight: 'bold', border: 'none', background: 'transparent' }}
                    />
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: 'bold' }}>
                    <input
                      value={adjustment[`total_value_adjustment`] || formatCurrency((totalBaseValue || baseMarketValue || 0) * ((isAgricultural ? agriculturalTotalAdjustment : 0) / 100))}
                      onChange={(e) => setAdjustment((p) => ({ ...p, total_value_adjustment: e.target.value }))}
                      placeholder={formatCurrency((totalBaseValue || baseMarketValue || 0) * ((isAgricultural ? agriculturalTotalAdjustment : 0) / 100))}
                      style={{ textAlign: 'right', fontWeight: 'bold', border: 'none', background: 'transparent' }}
                    />
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: 'bold' }}>
                    <input
                      value={adjustment[`total_market_value`] || formatCurrency(totalAdjustedValue || marketValue)}
                      onChange={(e) => setAdjustment((p) => ({ ...p, total_market_value: e.target.value }))}
                      placeholder={formatCurrency(totalAdjustedValue || marketValue)}
                      style={{ textAlign: 'right', fontWeight: 'bold', border: 'none', background: 'transparent' }}
                    />
                  </td>
                </tr>
              </tbody>
            </table>

            {/* PROPERTY ASSESSMENT - SHOW/HIDE BASED ON BUTTON */}
            {showAssessment && (
              <>
                <div className="section-header">PROPERTY ASSESSMENT</div>
                <table className="table assessment-table">
                  <thead>
                    <tr>
                      <th>Actual Use</th>
                      <th>Adjusted Market Value (₱)</th>
                      <th>Assessment Level</th>
                      <th>Assessed Value (₱)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>
                        <input
                          value={assessment[`actual_use`] || actualUse}
                          onChange={(e) => setAssessment((p) => ({ ...p, actual_use: e.target.value }))}
                          placeholder={actualUse}
                        />
                      </td>
                      <td>
                        <input
                          value={assessment[`adjusted_market_value`] || formatCurrency(totalAdjustedValue || marketValue)}
                          onChange={(e) => setAssessment((p) => ({ ...p, adjusted_market_value: e.target.value }))}
                          placeholder={formatCurrency(totalAdjustedValue || marketValue)}
                        />
                      </td>
                      <td>
                        <input
                          value={assessment[`assessment_level`] || assessmentLevel?.rate_percent || '0%'}
                          onChange={(e) => setAssessment((p) => ({ ...p, assessment_level: e.target.value }))}
                          placeholder={assessmentLevel?.rate_percent || '0%'}
                        />
                      </td>
                      <td>
                        <input
                          value={assessment[`assessed_value`] || formatCurrency(assessmentValue)}
                          onChange={(e) => setAssessment((p) => ({ ...p, assessed_value: e.target.value }))}
                          placeholder={formatCurrency(assessmentValue)}
                        />
                      </td>
                    </tr>
                    <tr className="subtotal-row">
                      <td style={{ textAlign: 'left', fontWeight: 'bold' }}>
                        Total
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 'bold' }}>
                        {formatCurrency(totalAdjustedValue || marketValue)}
                      </td>
                      <td></td>
                      <td style={{ textAlign: 'right', fontWeight: 'bold' }}>
                        {formatCurrency(assessmentValue)}
                      </td>
                    </tr>
                  </tbody>
                </table>

                <div className="tax-row">
                  <label>
                    Taxable
                    <input
                      type="checkbox"
                      checked={isTaxable}
                      onChange={(e) => {
                        setIsTaxable(e.target.checked);
                        if (e.target.checked) setIsExempt(false);
                      }}
                    />
                  </label>
                  <label>
                    Exempt
                    <input
                      type="checkbox"
                      checked={isExempt}
                      onChange={(e) => {
                        setIsExempt(e.target.checked);
                        if (e.target.checked) setIsTaxable(false);
                      }}
                    />
                  </label>
                  <div className="effectivity">
                    Effectivity of Assessment: {currentQuarter} Qtr. {currentYear} Yr.
                  </div>
                </div>

                {/* APPROVAL SIGNATURE */}
                <div className="signature-container">
                  <div>
                    <div>Approved by:</div>
                    <div className="sig-line"></div>
                    <div className="prov">Municipal Assessor</div>
                  </div>
                </div>

                {/* MEMORANDA */}
                <div className="memoranda">
                  MEMORANDA:<br />
                  Date of Entry in the Record of Assessment ______ By: ____________
                </div>
              </>
            )}

            <div className="powered">Powered by: SPIDC</div>
          </div>
        )}
      </IonContent>
    </IonModal>
  );
};

export default LandFaasBackModal;