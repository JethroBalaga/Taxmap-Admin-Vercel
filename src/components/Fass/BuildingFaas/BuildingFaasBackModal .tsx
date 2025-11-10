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
import { documentOutline, close } from "ionicons/icons";
import { jsPDF } from 'jspdf';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { FileOpener } from '@capawesome-team/capacitor-file-opener';
import { supabase } from '../../../utils/supaBaseClient';
import "../../../CSS/BuildingFaasBack.css";

const ROW_ITEMS = 10;
const ROW_ASSESSMENT = 4;
const ROW_APPRAISAL = 6;

interface BuildingFaasBackModalProps {
  isOpen: boolean;
  onClose: () => void;
  buildingData?: any;
  formData?: any;
  baseMarketValue?: number;
  buildingAdjustments?: any[];
  adjustedMarketValue?: number;
  assessmentLevel?: any;
  buildingCodes?: any[];
  generalData?: any[];
  assessmentSummary?: any[];
}

interface BuildingComponent {
  building_com_id: string;
  description: string;
  created_at?: string;
}

interface BuildingSubcomponent {
  building_subcom_id: string;
  description: string;
  rate: number;
  building_com_id: string;
  created_at?: string;
  percent: boolean;
}

interface BuildingCode {
  building_code: string;
  structure_code: string;
  description: string;
  rate: number;
  created_at: string;
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
  area?: string | number;
}

const BuildingFaasBackModal: React.FC<BuildingFaasBackModalProps> = ({ 
  isOpen,
  onClose,
  buildingData, 
  formData, 
  baseMarketValue = 0, 
  buildingAdjustments = [],
  adjustedMarketValue = 0,
  assessmentLevel,
  buildingCodes = [],
  generalData = [],
  assessmentSummary = []
}) => {
  const [appraisal, setAppraisal] = useState<Record<string, string>>({});
  const [addItems, setAddItems] = useState<Record<string, string>>({});
  const [assessment, setAssessment] = useState<Record<string, string>>({});
  const [buildingComponents, setBuildingComponents] = useState<BuildingComponent[]>([]);
  const [buildingSubcomponents, setBuildingSubcomponents] = useState<BuildingSubcomponent[]>([]);
  const [componentMap, setComponentMap] = useState<Record<string, string>>({});
  const [subcomponentMap, setSubcomponentMap] = useState<Record<string, string>>({});
  const [subcomponentToComponentMap, setSubcomponentToComponentMap] = useState<Record<string, string>>({});
  const [isTaxable, setIsTaxable] = useState<boolean>(false);
  const [isExempt, setIsExempt] = useState<boolean>(false);
  const [currentQuarter, setCurrentQuarter] = useState<string>("1");
  const [currentYear, setCurrentYear] = useState<string>("");
  const [isGeneratingPdf, setIsGeneratingPdf] = useState<boolean>(false);

  // Get current quarter and year
  useEffect(() => {
    const now = new Date();
    const year = now.getFullYear();
    setCurrentQuarter("1");
    setCurrentYear(year.toString());
  }, []);

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

  // Fetch building components and subcomponents
  useEffect(() => {
    const fetchBuildingData = async () => {
      try {
        const { data: components, error: componentsError } = await supabase
          .from('building_componenttbl')
          .select('*');

        if (componentsError) {
          console.error('Error fetching building components:', componentsError);
          return;
        }

        const { data: subcomponents, error: subcomponentsError } = await supabase
          .from('building_subcomponenttbl')
          .select('*');

        if (subcomponentsError) {
          console.error('Error fetching building subcomponents:', subcomponentsError);
          return;
        }

        setBuildingComponents(components || []);
        setBuildingSubcomponents(subcomponents || []);

        // Create lookup maps for faster access
        const compMap: Record<string, string> = {};
        const subcompMap: Record<string, string> = {};
        const subToCompMap: Record<string, string> = {};
        
        components?.forEach(comp => {
          compMap[comp.building_com_id] = comp.description;
        });
        
        subcomponents?.forEach(subcomp => {
          subcompMap[subcomp.building_subcom_id] = subcomp.description;
          subToCompMap[subcomp.building_subcom_id] = subcomp.building_com_id;
        });
        
        setComponentMap(compMap);
        setSubcomponentMap(subcompMap);
        setSubcomponentToComponentMap(subToCompMap);

      } catch (error) {
        console.error('Failed to fetch building data:', error);
      }
    };

    fetchBuildingData();
  }, []);

  // Format field names for display
  const formatFieldName = (fieldName: string): string => {
    return fieldName
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Get form details for table display
  const getFormDetailsData = () => {
    if (!formData) return [];
    
    return Object.entries(formData)
      .filter(([key]) => !['form_id', 'created_at', 'updated_at'].includes(key))
      .map(([key, value]) => ({
        field: formatFieldName(key),
        value: value !== null && value !== undefined ? String(value) : 'N/A'
      }));
  };

  // Get general information for table display
  const getGeneralInformationData = () => {
    if (!generalData || generalData.length === 0) return [];
    
    return generalData.map((item, index) => {
      const { value_info_id, general_id, created_at, ...displayFields } = item;
      const formattedData: any = {};
      
      Object.entries(displayFields).forEach(([key, value]) => {
        formattedData[formatFieldName(key)] = value !== null && value !== undefined ? String(value) : 'N/A';
      });
      
      return {
        id: `general-${index}`,
        ...formattedData
      };
    });
  };

  // Get component description by subcomponent ID
  const getComponentDescriptionBySubcomponentId = (subcomponentId: string): string => {
    if (!subcomponentId) return 'Additional Component';
    
    const componentId = subcomponentToComponentMap[subcomponentId];
    if (!componentId) return 'Additional Component';
    
    return componentMap[componentId] || 'Additional Component';
  };

  // Get building code data for main structure
  const getBuildingCodeData = (buildingCode: string): BuildingCode | null => {
    if (!buildingCode || !buildingCodes || buildingCodes.length === 0) return null;
    return buildingCodes.find(code => code.building_code === buildingCode) || null;
  };

  // Helper function to get floor name
  const getFloorName = (floorNumber: number): string => {
    const floorNames: { [key: number]: string } = {
      1: '1st Floor',
      2: '2nd Floor', 
      3: '3rd Floor',
      4: '4th Floor'
    };
    return floorNames[floorNumber] || `${floorNumber}th Floor`;
  };

  // FIXED: Calculate combined appraisal data for main building structures
  const getCombinedAppraisalData = () => {
    const combinedData: any[] = [];
    
    if (generalData && generalData.length > 0) {
      generalData.forEach((generalItem: GeneralDescription) => {
        // Get building code from general description
        const buildingCode = generalItem.building_code;
        
        // Find the building code data
        const buildingCodeData = getBuildingCodeData(buildingCode);
        
        // Get values from general description
        const area = parseFloat(generalItem.area as any) || parseFloat(formData?.area as any) || 0;
        const storeyCount = parseInt(generalItem.storey as any) || 1;
        const depreciationRate = parseFloat(generalItem.depreciation_rate) || 0;
        const constructionPercent = parseFloat(generalItem.construction_percent) || 100;
        
        // Use base market value from assessment summary if available
        let baseMarketValueTotal = baseMarketValue || 0;
        if (assessmentSummary && assessmentSummary.length > 0) {
          baseMarketValueTotal = parseFloat(assessmentSummary[0]?.base_market_value) || baseMarketValueTotal;
        }
        
        // Calculate per storey values
        const areaPerStorey = storeyCount > 0 ? area / storeyCount : 0;
        const baseValuePerStorey = storeyCount > 0 ? baseMarketValueTotal / storeyCount : 0;
        const afterConstruction = baseValuePerStorey * (constructionPercent / 100);
        const depreciationCost = afterConstruction * (depreciationRate / 100);
        const marketValuePerStorey = afterConstruction - depreciationCost;

        for (let storey = 1; storey <= storeyCount; storey++) {
          combinedData.push({
            description: `${buildingCodeData?.description || buildingCode || 'Building Structure'} - ${getFloorName(storey)}`,
            type: buildingCode || 'BLD', // Use building code as type
            unitValue: buildingCodeData?.rate || 0,
            area: areaPerStorey,
            baseValue: baseValuePerStorey,
            marketValue: marketValuePerStorey,
            depreciationRate: depreciationRate,
            depreciationCost: depreciationCost,
            completionPercent: constructionPercent,
            storeyNumber: storey,
            totalStoreys: storeyCount
          });
        }
      });
    }

    return combinedData;
  };

  // FIXED: Calculate main building totals
  const getMainBuildingTotals = () => {
    const combinedData = getCombinedAppraisalData();
    
    let totalArea = 0;
    let totalBaseValue = 0;
    let totalMarketValue = 0;
    let totalDepreciation = 0;

    combinedData.forEach(item => {
      totalArea += item.area;
      totalBaseValue += item.baseValue;
      totalMarketValue += item.marketValue;
      totalDepreciation += item.depreciationCost;
    });

    return {
      area: totalArea,
      baseValue: totalBaseValue,
      marketValue: totalMarketValue,
      depreciation: totalDepreciation
    };
  };

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
        const fileName = `BuildingFAAS_${formData?.form_id || timestamp}.pdf`;

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
        downloadLink.download = `BuildingFAAS_${formData?.form_id || new Date().getTime()}.pdf`;
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

  // Pure jsPDF generation for Building FAAS
  const generatePdf = useCallback(async () => {
    if (isGeneratingPdf) return;
    
    setIsGeneratingPdf(true);
    
    try {
      const combinedAppraisalData = getCombinedAppraisalData();
      const mainBuildingTotals = getMainBuildingTotals();
      const additionalItemsTotals = calculateAdditionalItemsTotals();
      
      const combinedTotalMarketValue = mainBuildingTotals.marketValue + additionalItemsTotals.totalMarketValue;
      const assessmentValue = calculateAssessmentValue(combinedTotalMarketValue, assessmentLevel?.rate_percent || '0%');
      const actualUse = formData?.actualUse || buildingData?.actual_use || formData?.kind_description || 'Building';

      // Create PDF
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      let yPosition = 20;

      // FORM DETAILS SECTION
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text('FORM DETAILS', 20, yPosition);
      yPosition += 8;

      // Form details table
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'bold');
      const formDetails = getFormDetailsData();
      formDetails.forEach((item, index) => {
        if (yPosition > 270) {
          pdf.addPage();
          yPosition = 20;
        }
        pdf.text(`${item.field}:`, 20, yPosition);
        pdf.text(item.value, 80, yPosition);
        yPosition += 6;
      });

      yPosition += 10;

      // GENERAL INFORMATION SECTION
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text('GENERAL INFORMATION', 20, yPosition);
      yPosition += 8;

      // General information table
      const generalInfo = getGeneralInformationData();
      if (generalInfo.length > 0) {
        pdf.setFontSize(8);
        pdf.setFont('helvetica', 'bold');
        
        // Headers
        const generalHeaders = Object.keys(generalInfo[0]).filter(key => key !== 'id');
        let xPosition = 20;
        generalHeaders.forEach(header => {
          pdf.text(header, xPosition, yPosition);
          xPosition += 40;
        });
        yPosition += 6;

        // Data rows
        pdf.setFont('helvetica', 'normal');
        generalInfo.forEach(item => {
          if (yPosition > 270) {
            pdf.addPage();
            yPosition = 20;
          }
          xPosition = 20;
          generalHeaders.forEach(header => {
            pdf.text(item[header], xPosition, yPosition);
            xPosition += 40;
          });
          yPosition += 6;
        });
      }

      yPosition += 10;

      // PROPERTY APPRAISAL SECTION
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'bold');
      pdf.text('PROPERTY APPRAISAL', 20, yPosition);
      yPosition += 8;

      // Table headers
      pdf.setFontSize(6);
      pdf.setFont('helvetica', 'bold');
      const headers = ['Desc', 'Type', 'Area', 'Unit Val', '% Compl', 'Base Mkt Val', '% Depn', 'Depn Cost', 'Mkt Val'];
      
      let xPosition = 10;
      const columnWidths = [25, 15, 12, 15, 12, 20, 10, 18, 18];
      headers.forEach((header, index) => {
        pdf.text(header, xPosition, yPosition);
        xPosition += columnWidths[index];
      });
      yPosition += 5;

      // Storey rows
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(6);
      combinedAppraisalData.forEach((item, index) => {
        const rowData = [
          item.description.substring(0, 20),
          item.type.substring(0, 8),
          item.area.toFixed(2),
          item.unitValue.toFixed(2),
          item.completionPercent.toString(),
          Math.round(item.baseValue).toLocaleString(),
          item.depreciationRate.toString(),
          Math.round(item.depreciationCost).toLocaleString(),
          Math.round(item.marketValue).toLocaleString()
        ];

        xPosition = 10;
        rowData.forEach((data, index) => {
          const maxLength = [20, 8, 6, 10, 5, 12, 4, 12, 12][index];
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

      // Subtotal
      yPosition += 4;
      pdf.setFont('helvetica', 'bold');
      pdf.text('Sub-total', 10, yPosition);
      pdf.text(`${mainBuildingTotals.area.toFixed(2)} sq m`, 10 + 25 + 15, yPosition);
      pdf.text(Math.round(mainBuildingTotals.baseValue).toLocaleString(), 10 + 25 + 15 + 12 + 15 + 12, yPosition);
      pdf.text(Math.round(mainBuildingTotals.depreciation).toLocaleString(), 10 + 25 + 15 + 12 + 15 + 12 + 20 + 10, yPosition);
      pdf.text(Math.round(mainBuildingTotals.marketValue).toLocaleString(), 10 + 25 + 15 + 12 + 15 + 12 + 20 + 10 + 18, yPosition);

      yPosition += 15;

      // ADDITIONAL ITEMS SECTION
      if (buildingAdjustments && buildingAdjustments.length > 0) {
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'bold');
        pdf.text('ADDITIONAL ITEMS:', 20, yPosition);
        yPosition += 8;

        // Table headers
        pdf.setFontSize(6);
        pdf.setFont('helvetica', 'bold');
        xPosition = 10;
        headers.forEach((header, index) => {
          pdf.text(header, xPosition, yPosition);
          xPosition += columnWidths[index];
        });
        yPosition += 5;

        // Additional items rows
        pdf.setFont('helvetica', 'normal');
        buildingAdjustments.forEach((adjustment, index) => {
          const componentDescription = getComponentDescriptionBySubcomponentId(adjustment.building_subcom_id);
          const subcomponentDescription = subcomponentMap[adjustment.building_subcom_id] || 'Additional Item';
          
          const area = adjustment.area || 0;
          const completionPercent = adjustment.completion_percent || '0';
          const unitValue = adjustment.rate || 0;
          const depreciation = adjustment.depreciation || '0';
          const baseValue = adjustment.base_value || 0;
          const marketValue = adjustment.adjusted_value || 0;
          const depreciationCost = baseValue * (parseFloat(depreciation) / 100);

          const rowData = [
            componentDescription.substring(0, 20),
            subcomponentDescription.substring(0, 8),
            area.toString(),
            unitValue.toString(),
            completionPercent,
            Math.round(baseValue).toLocaleString(),
            depreciation,
            Math.round(depreciationCost).toLocaleString(),
            Math.round(marketValue).toLocaleString()
          ];

          xPosition = 10;
          rowData.forEach((data, index) => {
            const maxLength = [20, 8, 6, 10, 5, 12, 4, 12, 12][index];
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

        // Additional items subtotal
        yPosition += 4;
        pdf.setFont('helvetica', 'bold');
        pdf.text('Sub-total', 10, yPosition);
        pdf.text(`${additionalItemsTotals.totalArea.toFixed(2)} sq m`, 10 + 25 + 15, yPosition);
        pdf.text(Math.round(additionalItemsTotals.totalBaseValue).toLocaleString(), 10 + 25 + 15 + 12 + 15 + 12, yPosition);
        pdf.text(Math.round(additionalItemsTotals.totalDepreciationCost).toLocaleString(), 10 + 25 + 15 + 12 + 15 + 12 + 20 + 10, yPosition);
        pdf.text(Math.round(additionalItemsTotals.totalMarketValue).toLocaleString(), 10 + 25 + 15 + 12 + 15 + 12 + 20 + 10 + 18, yPosition);

        yPosition += 15;
      }

      // COMBINED TOTALS SECTION
      const combinedTotalArea = mainBuildingTotals.area + additionalItemsTotals.totalArea;
      const combinedTotalBaseValue = mainBuildingTotals.baseValue + additionalItemsTotals.totalBaseValue;
      const combinedTotalDepreciationCost = mainBuildingTotals.depreciation + additionalItemsTotals.totalDepreciationCost;

      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'bold');
      pdf.text('COMBINED TOTALS', 20, yPosition);
      yPosition += 10;

      pdf.setFontSize(6);
      pdf.text('TOTAL AREA', 20, yPosition);
      pdf.text(`${combinedTotalArea.toFixed(2)} sq m`, 45, yPosition);
      
      pdf.text('TOTAL BASE MARKET VALUE', 80, yPosition);
      pdf.text(Math.round(combinedTotalBaseValue).toLocaleString(), 135, yPosition);
      
      pdf.text('TOTAL DEP', 160, yPosition);
      pdf.text(Math.round(combinedTotalDepreciationCost).toLocaleString(), 190, yPosition, { align: 'right' });
      yPosition += 4;

      pdf.text('GRAND TOTAL', 160, yPosition);
      pdf.text(Math.round(combinedTotalMarketValue).toLocaleString(), 190, yPosition, { align: 'right' });

      yPosition += 12;

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
        Math.round(combinedTotalMarketValue).toLocaleString(),
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
      pdf.text('Appraised by:', 20, yPosition);
      pdf.text('Approved by:', 130, yPosition);
      yPosition += 12;

      pdf.line(20, yPosition, 100, yPosition);
      pdf.line(130, yPosition, 190, yPosition);
      yPosition += 6;

      pdf.setFontSize(6);
      pdf.text('Acting Provincial Assessor', 160, yPosition, { align: 'center' });

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
    isGeneratingPdf, buildingData, formData, baseMarketValue, buildingAdjustments, 
    adjustedMarketValue, assessmentLevel, isTaxable, isExempt, currentQuarter, currentYear,
    buildingCodes, generalData, componentMap, subcomponentMap, subcomponentToComponentMap, assessmentSummary
  ]);

  // Calculate additional items totals
  const calculateAdditionalItemsTotals = () => {
    let totalArea = 0;
    let totalBaseValue = 0;
    let totalDepreciationCost = 0;
    let totalMarketValue = 0;

    buildingAdjustments.forEach((adjustment) => {
      const area = adjustment.area || 0;
      const completionPercent = adjustment.completion_percent || '0';
      const unitValue = adjustment.rate || 0;
      const depreciation = adjustment.depreciation || '0';
      const baseValue = adjustment.base_value || 0;
      const marketValue = adjustment.adjusted_value || 0;
      const depreciationCost = baseValue * (parseFloat(depreciation) / 100);

      totalArea += area;
      totalBaseValue += baseValue;
      totalDepreciationCost += depreciationCost;
      totalMarketValue += marketValue;
    });

    return {
      totalArea,
      totalBaseValue,
      totalDepreciationCost,
      totalMarketValue
    };
  };

  // Calculate assessment value
  const calculateAssessmentValue = (marketValue: number, assessmentRate: string): number => {
    if (!assessmentRate) return 0;
    
    let rateDecimal: number;
    if (assessmentRate.includes('%')) {
      rateDecimal = parseFloat(assessmentRate.replace('%', '')) / 100;
    } else {
      rateDecimal = parseFloat(assessmentRate);
    }
    
    const assessedValue = marketValue * rateDecimal;
    return Math.round(assessedValue);
  };

  const formatCurrency = (value: number) => `₱${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  // Prepare data for display
  const combinedAppraisalData = getCombinedAppraisalData();
  const mainBuildingTotals = getMainBuildingTotals();
  const additionalItemsTotals = calculateAdditionalItemsTotals();
  
  const combinedTotalArea = mainBuildingTotals.area + additionalItemsTotals.totalArea;
  const combinedTotalBaseValue = mainBuildingTotals.baseValue + additionalItemsTotals.totalBaseValue;
  const combinedTotalDepreciationCost = mainBuildingTotals.depreciation + additionalItemsTotals.totalDepreciationCost;
  const combinedTotalMarketValue = mainBuildingTotals.marketValue + additionalItemsTotals.totalMarketValue;
  const assessmentValue = calculateAssessmentValue(combinedTotalMarketValue, assessmentLevel?.rate_percent || '0%');
  const actualUse = formData?.actualUse || buildingData?.actual_use || formData?.kind_description || 'Building';

  // Get data for tables
  const formDetailsData = getFormDetailsData();
  const generalInformationData = getGeneralInformationData();

  // Create arrays for display
  const appraisalHeaders = ['Description', 'Type', 'Area (sq.m.)', 'Unit Value', '% Completion (BUCC)', 'Base Market Value (₱)', '% Depn.', 'Depreciation Cost (₱)', 'Market Value (₱)'];
  
  // Additional items rows
  const additionalItemsRows = buildingAdjustments.map((adjustment, index) => {
    const componentDescription = getComponentDescriptionBySubcomponentId(adjustment.building_subcom_id);
    const subcomponentDescription = subcomponentMap[adjustment.building_subcom_id] || 'Additional Item';
    
    const area = adjustment.area || 0;
    const completionPercent = adjustment.completion_percent || '0';
    const unitValue = adjustment.rate || 0;
    const depreciation = adjustment.depreciation || '0';
    const baseValue = adjustment.base_value || 0;
    const marketValue = adjustment.adjusted_value || 0;
    const depreciationCost = baseValue * (parseFloat(depreciation) / 100);

    return {
      description: componentDescription,
      type: subcomponentDescription,
      area: area.toString(),
      unitValue: unitValue.toString(),
      completionPercent,
      baseValue: formatCurrency(baseValue),
      depreciation,
      depreciationCost: formatCurrency(depreciationCost),
      marketValue: formatCurrency(marketValue)
    };
  });

  const assessmentHeaders = ['Actual Use', 'Adjusted Market Value', 'Assessment Level (%)', 'Assessment Value'];
  
  const assessmentRows = [
    {
      actualUse: actualUse,
      adjustedMarketValue: formatCurrency(combinedTotalMarketValue),
      assessmentLevel: assessmentLevel?.rate_percent || '0%',
      assessmentValue: formatCurrency(assessmentValue)
    },
    ...Array(ROW_ASSESSMENT - 1).fill(null).map((_, index) => ({
      actualUse: "",
      adjustedMarketValue: "",
      assessmentLevel: "",
      assessmentValue: ""
    }))
  ];

  const combinedTotalsData = [
    { label: 'TOTAL AREA', value: `${combinedTotalArea.toFixed(2)} sq m` },
    { label: 'TOTAL BASE MARKET VALUE', value: formatCurrency(combinedTotalBaseValue) },
    { label: 'TOTAL DEPRECIATION', value: formatCurrency(combinedTotalDepreciationCost) },
    { label: 'GRAND TOTAL', value: formatCurrency(combinedTotalMarketValue) }
  ];

  return (
    <IonModal
      isOpen={isOpen}
      onDidDismiss={onClose}
      style={{ '--width': '95%', '--height': '95%' }}
    >
      <IonHeader>
        <IonToolbar>
          <IonTitle>Building FAAS - Form {formData?.form_id}</IonTitle>
          <IonButtons slot="end">
            <IonButton 
              onClick={generatePdf} 
              className="generate-pdf-btn"
              disabled={isGeneratingPdf}
            >
              <IonIcon icon={documentOutline} /> 
              &nbsp; 
              {isGeneratingPdf ? 'Generating...' : 'Generate PDF'}
            </IonButton>
            <IonButton onClick={onClose}>
              <IonIcon icon={close} />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      
      <IonContent>
        <div id="faas-back-sheet" className="sheet">
          {/* FORM DETAILS TABLE */}
          {formDetailsData.length > 0 && (
            <>
              <div className="section-header">FORM DETAILS</div>
              <table className="table form-details-table">
                <thead>
                  <tr>
                    <th>Field</th>
                    <th>Value</th>
                  </tr>
                </thead>
                <tbody>
                  {formDetailsData.map((item, index) => (
                    <tr key={index}>
                      <td style={{ fontWeight: 'bold', width: '40%' }}>{item.field}</td>
                      <td style={{ width: '60%' }}>{item.value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}

          {/* GENERAL INFORMATION TABLE */}
          {generalInformationData.length > 0 && (
            <>
              <div className="section-header">GENERAL INFORMATION</div>
              <table className="table general-info-table">
                <thead>
                  <tr>
                    {generalInformationData.length > 0 && 
                      Object.keys(generalInformationData[0])
                        .filter(key => key !== 'id')
                        .map((header, index) => (
                          <th key={index}>{header}</th>
                        ))
                    }
                  </tr>
                </thead>
                <tbody>
                  {generalInformationData.map((row, index) => (
                    <tr key={row.id}>
                      {Object.keys(row)
                        .filter(key => key !== 'id')
                        .map((key, cellIndex) => (
                          <td key={cellIndex}>{row[key]}</td>
                        ))
                      }
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}

          {/* PROPERTY APPRAISAL - TABLE 1 - FIXED WITH CORRECT DATA */}
          <div className="section-header">PROPERTY APPRAISAL</div>

          <table className="table appraisal-table">
            <thead>
              <tr>
                {appraisalHeaders.map((header, index) => (
                  <th key={index}>{header}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {combinedAppraisalData.map((item, index) => (
                <tr key={index}>
                  <td>
                    <input
                      value={appraisal[`desc_${index}`] || item.description}
                      onChange={(e) => setAppraisal((p) => ({ ...p, [`desc_${index}`]: e.target.value }))}
                    />
                  </td>
                  <td>
                    <input
                      value={appraisal[`type_${index}`] || item.type}
                      onChange={(e) => setAppraisal((p) => ({ ...p, [`type_${index}`]: e.target.value }))}
                    />
                  </td>
                  <td>
                    <input
                      value={appraisal[`area_${index}`] || item.area.toFixed(2)}
                      onChange={(e) => setAppraisal((p) => ({ ...p, [`area_${index}`]: e.target.value }))}
                    />
                  </td>
                  <td>
                    <input
                      value={appraisal[`unit_${index}`] || item.unitValue.toFixed(2)}
                      onChange={(e) => setAppraisal((p) => ({ ...p, [`unit_${index}`]: e.target.value }))}
                    />
                  </td>
                  <td>
                    <input
                      value={appraisal[`bucc_${index}`] || item.completionPercent.toString()}
                      onChange={(e) => setAppraisal((p) => ({ ...p, [`bucc_${index}`]: e.target.value }))}
                    />
                  </td>
                  <td>
                    <input
                      value={appraisal[`base_${index}`] || formatCurrency(item.baseValue)}
                      onChange={(e) => setAppraisal((p) => ({ ...p, [`base_${index}`]: e.target.value }))}
                    />
                  </td>
                  <td>
                    <input
                      value={appraisal[`depn_${index}`] || item.depreciationRate.toString()}
                      onChange={(e) => setAppraisal((p) => ({ ...p, [`depn_${index}`]: e.target.value }))}
                    />
                  </td>
                  <td>
                    <input
                      value={appraisal[`depn_cost_${index}`] || formatCurrency(item.depreciationCost)}
                      onChange={(e) => setAppraisal((p) => ({ ...p, [`depn_cost_${index}`]: e.target.value }))}
                    />
                  </td>
                  <td>
                    <input
                      value={appraisal[`market_${index}`] || formatCurrency(item.marketValue)}
                      onChange={(e) => setAppraisal((p) => ({ ...p, [`market_${index}`]: e.target.value }))}
                    />
                  </td>
                </tr>
              ))}
              
              {/* EMPTY ROWS FOR PROPERTY APPRAISAL */}
              {combinedAppraisalData.length < ROW_APPRAISAL && 
                [...Array(ROW_APPRAISAL - combinedAppraisalData.length)].map((_, index) => {
                  const emptyIndex = index + combinedAppraisalData.length;
                  return (
                    <tr key={`empty-${emptyIndex}`}>
                      {[...Array(9)].map((_, c) => (
                        <td key={c}>
                          <input
                            value={appraisal[`empty${emptyIndex}_c${c}`] || ""}
                            onChange={(e) => setAppraisal((p) => ({ ...p, [`empty${emptyIndex}_c${c}`]: e.target.value }))}
                          />
                        </td>
                      ))}
                    </tr>
                  );
                })
              }
              
              {/* Table 1 Totals */}
              <tr className="subtotal-row">
                <td style={{ textAlign: 'left', fontWeight: 'bold' }}>Sub-total</td>
                <td></td>
                <td style={{ textAlign: 'right', fontWeight: 'bold' }}>{mainBuildingTotals.area.toFixed(2)} sq m</td>
                <td></td>
                <td></td>
                <td style={{ textAlign: 'right', fontWeight: 'bold' }}>{formatCurrency(mainBuildingTotals.baseValue)}</td>
                <td></td>
                <td style={{ textAlign: 'right', fontWeight: 'bold' }}>{formatCurrency(mainBuildingTotals.depreciation)}</td>
                <td style={{ textAlign: 'right', fontWeight: 'bold' }}>{formatCurrency(mainBuildingTotals.marketValue)}</td>
              </tr>
            </tbody>
          </table>

          {/* ADDITIONAL ITEMS - TABLE 2 */}
          <div className="section-header">ADDITIONAL ITEMS:</div>

          <table className="table items-table">
            <thead>
              <tr>
                {appraisalHeaders.map((header, index) => (
                  <th key={index}>{header}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {additionalItemsRows.map((row, index) => (
                <tr key={index}>
                  <td>
                    <input
                      value={addItems[`adj${index}_desc`] || row.description}
                      onChange={(e) => setAddItems((p) => ({ ...p, [`adj${index}_desc`]: e.target.value }))}
                    />
                  </td>
                  <td>
                    <input
                      value={addItems[`adj${index}_type`] || row.type}
                      onChange={(e) => setAddItems((p) => ({ ...p, [`adj${index}_type`]: e.target.value }))}
                    />
                  </td>
                  <td>
                    <input
                      value={addItems[`adj${index}_area`] || row.area}
                      onChange={(e) => setAddItems((p) => ({ ...p, [`adj${index}_area`]: e.target.value }))}
                    />
                  </td>
                  <td>
                    <input
                      value={addItems[`adj${index}_unit`] || row.unitValue}
                      onChange={(e) => setAddItems((p) => ({ ...p, [`adj${index}_unit`]: e.target.value }))}
                    />
                  </td>
                  <td>
                    <input
                      value={addItems[`adj${index}_bucc`] || row.completionPercent}
                      onChange={(e) => setAddItems((p) => ({ ...p, [`adj${index}_bucc`]: e.target.value }))}
                    />
                  </td>
                  <td>
                    <input
                      value={addItems[`adj${index}_base`] || row.baseValue}
                      onChange={(e) => setAddItems((p) => ({ ...p, [`adj${index}_base`]: e.target.value }))}
                    />
                  </td>
                  <td>
                    <input
                      value={addItems[`adj${index}_depn`] || row.depreciation}
                      onChange={(e) => setAddItems((p) => ({ ...p, [`adj${index}_depn`]: e.target.value }))}
                    />
                  </td>
                  <td>
                    <input
                      value={addItems[`adj${index}_depn_cost`] || row.depreciationCost}
                      onChange={(e) => setAddItems((p) => ({ ...p, [`adj${index}_depn_cost`]: e.target.value }))}
                    />
                  </td>
                  <td>
                    <input
                      value={addItems[`adj${index}_market`] || row.marketValue}
                      onChange={(e) => setAddItems((p) => ({ ...p, [`adj${index}_market`]: e.target.value }))}
                    />
                  </td>
                </tr>
              ))}
              
              {/* EMPTY ROWS FOR ADDITIONAL ITEMS */}
              {additionalItemsRows.length < ROW_ITEMS && 
                [...Array(ROW_ITEMS - additionalItemsRows.length)].map((_, index) => {
                  const emptyIndex = index + additionalItemsRows.length;
                  return (
                    <tr key={`empty-adj-${emptyIndex}`}>
                      {[...Array(9)].map((_, c) => (
                        <td key={c}>
                          <input
                            value={addItems[`emptyadj${emptyIndex}_c${c}`] || ""}
                            onChange={(e) => setAddItems((p) => ({ ...p, [`emptyadj${emptyIndex}_c${c}`]: e.target.value }))}
                          />
                        </td>
                      ))}
                    </tr>
                  );
                })
              }
              
              {/* Table 2 Totals */}
              <tr className="subtotal-row">
                <td style={{ textAlign: 'left', fontWeight: 'bold' }}>Sub-total</td>
                <td></td>
                <td style={{ textAlign: 'right', fontWeight: 'bold' }}>{additionalItemsTotals.totalArea.toFixed(2)} sq m</td>
                <td></td>
                <td></td>
                <td style={{ textAlign: 'right', fontWeight: 'bold' }}>{formatCurrency(additionalItemsTotals.totalBaseValue)}</td>
                <td></td>
                <td style={{ textAlign: 'right', fontWeight: 'bold' }}>{formatCurrency(additionalItemsTotals.totalDepreciationCost)}</td>
                <td style={{ textAlign: 'right', fontWeight: 'bold' }}>{formatCurrency(additionalItemsTotals.totalMarketValue)}</td>
              </tr>
            </tbody>
          </table>

          {/* COMBINED TOTALS */}
          <div className="section-header">COMBINED TOTALS</div>

          <table className="table combined-totals-table">
            <tbody>
              <tr className="total-row">
                {combinedTotalsData.map((item, index) => (
                  <React.Fragment key={index}>
                    <td style={{ textAlign: 'left', fontWeight: 'bold', width: '25%' }}>{item.label}</td>
                    <td style={{ textAlign: 'right', fontWeight: 'bold', width: '25%' }}>{item.value}</td>
                  </React.Fragment>
                ))}
              </tr>
            </tbody>
          </table>

          {/* PROPERTY ASSESSMENT */}
          <div className="section-header">PROPERTY ASSESSMENT</div>

          <table className="table assessment-table">
            <thead>
              <tr>
                {assessmentHeaders.map((header, index) => (
                  <th key={index}>{header}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {assessmentRows.map((row, index) => (
                <tr key={index}>
                  <td>
                    <input
                      value={assessment[`actual_use_${index}`] || row.actualUse}
                      onChange={(e) => setAssessment((p) => ({ ...p, [`actual_use_${index}`]: e.target.value }))}
                    />
                  </td>
                  <td>
                    <input
                      value={assessment[`adjusted_market_value_${index}`] || row.adjustedMarketValue}
                      onChange={(e) => setAssessment((p) => ({ ...p, [`adjusted_market_value_${index}`]: e.target.value }))}
                    />
                  </td>
                  <td>
                    <input
                      value={assessment[`assessment_level_${index}`] || row.assessmentLevel}
                      onChange={(e) => setAssessment((p) => ({ ...p, [`assessment_level_${index}`]: e.target.value }))}
                    />
                  </td>
                  <td>
                    <input
                      value={assessment[`assessment_value_${index}`] || row.assessmentValue}
                      onChange={(e) => setAssessment((p) => ({ ...p, [`assessment_value_${index}`]: e.target.value }))}
                    />
                  </td>
                </tr>
              ))}
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

          <div className="signature-container">
            <div>
              <div>Appraised by:</div>
              <div className="sig-line"></div>
            </div>
            <div>
              <div>Approved by:</div>
              <div className="sig-line"></div>
              <div className="prov">Acting Provincial Assessor</div>
            </div>
          </div>

          <div className="memoranda">
            MEMORANDA:<br />
            Date of Entry in the Record of Assessment ______ By: ____________
          </div>

          <div className="powered">Powered by: SPIDC</div>
        </div>
      </IonContent>
    </IonModal>
  );
};

export default BuildingFaasBackModal;