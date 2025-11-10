import React, { useState, useEffect, useCallback } from "react";
import {
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonIcon,
  IonButtons,
  IonSpinner,
  IonAlert
} from "@ionic/react";
import { documentOutline, close } from "ionicons/icons";
import { jsPDF } from 'jspdf';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { FileOpener } from '@capawesome-team/capacitor-file-opener';
import "../../../CSS/MachineFaasBack.css";

interface MachineFaasBackModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedMachine?: MachineCalculationsData | null;
  formContext?: FormContextData | null;
  assessmentData?: MachineAssessmentData[];
  // ADD THESE MISSING PROPS:
  baseMarketValue?: number;
  adjustedMarketValue?: number;
  assessmentLevel?: string;
}

interface FormContextData {
  district_name: string;
  declarant_name: string;
}

interface MachineAssessmentData {
  value_info_id: string;
  class_id: string;
  actual_used_id: string;
  base_market_value: number;
  adjusted_market_value: number;
  assessment_level: string;
  assessed_value: number;
}

interface MachineCalculationsData {
  machinedata_id: string;
  total_cost: number;
  adjusted_market_value: number;
  years_remaining: number;
  selected_equipment: string;
  serial_no: string;
  brand_model: string;
  condition: string;
  years_used: number;
  estimated_life: number;
  machine_description: string | null;
  machine_details: string | null;
  purchase_type: string | null;
  date_acquired: string | null;
  date_installed: string | null;
  date_operated: string | null;
  number_of_units: number | null;
  original_cost: number | null;
  freight: number | null;
  insurance: number | null;
  installation: number | null;
  others: number | null;
  depreciation: number | null;
}

const MachineFaasBackModal: React.FC<MachineFaasBackModalProps> = ({ 
  isOpen,
  onClose,
  selectedMachine, 
  formContext,
  assessmentData = [],
  // ADD THESE PROPS:
  baseMarketValue = 0,
  adjustedMarketValue = 0,
  assessmentLevel = 'N/A'
}) => {
  const [appraisal, setAppraisal] = useState<Record<string, string>>({});
  const [assessment, setAssessment] = useState<Record<string, string>>({});
  const [isTaxable, setIsTaxable] = useState<boolean>(false);
  const [isExempt, setIsExempt] = useState<boolean>(false);
  const [currentQuarter, setCurrentQuarter] = useState<string>("1");
  const [currentYear, setCurrentYear] = useState<string>("");
  const [isGeneratingPdf, setIsGeneratingPdf] = useState<boolean>(false);
  const [showAlert, setShowAlert] = useState<boolean>(false);

  // Get current quarter and year
  useEffect(() => {
    const now = new Date();
    const year = now.getFullYear();
    setCurrentQuarter("1");
    setCurrentYear(year.toString());
  }, []);

  // Set taxable checkbox based on assessment level
  useEffect(() => {
    if (assessmentLevel && assessmentLevel !== '0%' && assessmentLevel !== 'N/A') {
      setIsTaxable(true);
      setIsExempt(false);
    } else {
      setIsTaxable(false);
      setIsExempt(true);
    }
  }, [assessmentLevel]);

  // Calculate depreciation rate
  const calculateDepreciationRate = (): number => {
    if (!selectedMachine?.depreciation) return 0;
    return selectedMachine.depreciation;
  };

  // Calculate total base cost - USE THE PASSED baseMarketValue
  const calculateTotalBaseCost = (): number => {
    if (baseMarketValue && baseMarketValue > 0) {
      return baseMarketValue;
    }
    if (!selectedMachine) return 0;
    
    // Use total_cost from calculations if available, otherwise calculate from components
    if (selectedMachine.total_cost && selectedMachine.total_cost > 0) {
      return selectedMachine.total_cost;
    }
    
    // Fallback calculation from individual cost components
    const originalCost = selectedMachine.original_cost || 0;
    const freight = selectedMachine.freight || 0;
    const insurance = selectedMachine.insurance || 0;
    const installation = selectedMachine.installation || 0;
    const others = selectedMachine.others || 0;
    
    return originalCost + freight + insurance + installation + others;
  };

  // Calculate depreciation cost
  const calculateDepreciationCost = (): number => {
    const totalBaseCost = calculateTotalBaseCost();
    const depreciationRate = calculateDepreciationRate();
    return totalBaseCost * (depreciationRate / 100);
  };

  // Calculate market value - USE THE PASSED adjustedMarketValue
  const calculateMarketValue = (): number => {
    if (adjustedMarketValue && adjustedMarketValue > 0) {
      return adjustedMarketValue;
    }
    if (!selectedMachine) return 0;
    
    // Use adjusted_market_value from calculations if available
    if (selectedMachine.adjusted_market_value && selectedMachine.adjusted_market_value > 0) {
      return selectedMachine.adjusted_market_value;
    }
    
    // Fallback calculation
    const totalBaseCost = calculateTotalBaseCost();
    const depreciationCost = calculateDepreciationCost();
    return totalBaseCost - depreciationCost;
  };

  // Get assessed value
  const getAssessedValue = (): number => {
    const marketValue = calculateMarketValue();
    if (!assessmentLevel || assessmentLevel === 'N/A') return 0;
    
    let rateDecimal: number;
    if (assessmentLevel.includes('%')) {
      rateDecimal = parseFloat(assessmentLevel.replace('%', '')) / 100;
    } else {
      rateDecimal = parseFloat(assessmentLevel);
    }
    
    if (isNaN(rateDecimal)) return 0;
    
    const assessedValue = marketValue * rateDecimal;
    return Math.round(assessedValue);
  };

  // Universal PDF handling
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
        const fileName = `MachineFAAS_${timestamp}.pdf`;

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
          console.error('Error opening file:', openError);
          alert(`PDF saved successfully to: ${result.uri}\nYou can find it in your Documents folder.`);
        }
      } else {
        const pdfUrl = URL.createObjectURL(pdfBlob);
        const downloadLink = document.createElement('a');
        downloadLink.href = pdfUrl;
        downloadLink.download = `MachineFAAS_${new Date().getTime()}.pdf`;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
        setTimeout(() => URL.revokeObjectURL(pdfUrl), 1000);
      }
    } catch (error) {
      console.error('Error in saveAndOpenPdf:', error);
      alert('PDF generated successfully. If download did not start automatically, please check your downloads folder.');
      
      if (!(window as any).Capacitor?.isNativePlatform()) {
        const pdfUrl = URL.createObjectURL(pdfBlob);
        const downloadLink = document.createElement('a');
        downloadLink.href = pdfUrl;
        downloadLink.download = `MachineFAAS_${new Date().getTime()}.pdf`;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
        setTimeout(() => URL.revokeObjectURL(pdfUrl), 1000);
      }
    }
  };

  // PDF generation
  const generatePdf = useCallback(async () => {
    if (isGeneratingPdf || !selectedMachine) return;
    
    setIsGeneratingPdf(true);
    
    try {
      const machineDescription = selectedMachine.machine_description || selectedMachine.selected_equipment || 'N/A';
      const totalBaseValue = calculateTotalBaseCost();
      const depreciationRate = calculateDepreciationRate();
      const depreciationCost = calculateDepreciationCost();
      const marketValue = calculateMarketValue();
      const assessmentValue = getAssessedValue();

      const pdf = new jsPDF('p', 'mm', 'a4');
      let yPosition = 20;

      // PROPERTY APPRAISAL SECTION
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'bold');
      pdf.text('PROPERTY APPRAISAL', 20, yPosition);
      yPosition += 8;

      // Table headers
      pdf.setFontSize(6);
      pdf.setFont('helvetica', 'bold');
      const headers = ['Desc', 'Type', 'Units', 'Unit Val', 'Base Mkt Val', '% Depn', 'Depn Cost', 'Mkt Val'];
      
      let xPosition = 10;
      const columnWidths = [30, 20, 15, 20, 25, 15, 25, 25];
      headers.forEach((header, index) => {
        pdf.text(header, xPosition, yPosition);
        xPosition += columnWidths[index];
      });
      yPosition += 5;

      // Machine row
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(6);
      
      const rowData = [
        machineDescription.substring(0, 25),
        'Machinery',
        selectedMachine.number_of_units?.toString() || '1',
        Math.round(totalBaseValue).toLocaleString(),
        Math.round(totalBaseValue).toLocaleString(),
        depreciationRate.toString(),
        Math.round(depreciationCost).toLocaleString(),
        Math.round(marketValue).toLocaleString()
      ];

      xPosition = 10;
      rowData.forEach((data, index) => {
        const maxLength = [25, 10, 5, 10, 12, 4, 12, 12][index];
        const text = (typeof data === 'string' ? data : String(data)).substring(0, maxLength);
        pdf.text(text, xPosition, yPosition);
        xPosition += columnWidths[index];
      });
      yPosition += 5;

      // Empty rows
      for (let i = 0; i < 5; i++) {
        xPosition = 10;
        headers.forEach((_, index) => {
          pdf.text('', xPosition, yPosition);
          xPosition += columnWidths[index];
        });
        yPosition += 5;
      }

      // Subtotal
      yPosition += 4;
      pdf.setFont('helvetica', 'bold');
      pdf.text('Sub-total', 10, yPosition);
      pdf.text(`${selectedMachine.number_of_units || '1'} units`, 10 + 30 + 20, yPosition);
      pdf.text(Math.round(totalBaseValue).toLocaleString(), 10 + 30 + 20 + 15 + 20, yPosition);
      pdf.text(Math.round(depreciationCost).toLocaleString(), 10 + 30 + 20 + 15 + 20 + 25 + 15, yPosition);
      pdf.text(Math.round(marketValue).toLocaleString(), 10 + 30 + 20 + 15 + 20 + 25 + 15 + 25, yPosition);

      yPosition += 20;

      // COMBINED TOTALS SECTION
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'bold');
      pdf.text('COMBINED TOTALS', 20, yPosition);
      yPosition += 10;

      pdf.setFontSize(6);
      pdf.text('TOTAL UNITS', 20, yPosition);
      pdf.text(`${selectedMachine.number_of_units || '1'} units`, 45, yPosition);
      
      pdf.text('TOTAL BASE MARKET VALUE', 80, yPosition);
      pdf.text(Math.round(totalBaseValue).toLocaleString(), 135, yPosition);
      
      pdf.text('TOTAL DEP', 160, yPosition);
      pdf.text(Math.round(depreciationCost).toLocaleString(), 190, yPosition, { align: 'right' });
      yPosition += 4;

      pdf.text('GRAND TOTAL', 160, yPosition);
      pdf.text(Math.round(marketValue).toLocaleString(), 190, yPosition, { align: 'right' });

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
      const actualUse = 'Industrial'; // You might want to get this from your data
      const assessmentRowData = [
        actualUse.substring(0, 15),
        Math.round(marketValue).toLocaleString(),
        assessmentLevel || '0%',
        Math.round(assessmentValue).toLocaleString()
      ];

      xPosition = 20;
      assessmentRowData.forEach((data, index) => {
        pdf.text(String(data), xPosition, yPosition);
        xPosition += 42;
      });

      // Empty assessment rows
      for (let i = 0; i < 3; i++) {
        yPosition += 5;
        xPosition = 20;
        assessmentHeaders.forEach(() => {
          pdf.text('', xPosition, yPosition);
          xPosition += 42;
        });
      }

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

      const pdfBlob = pdf.output('blob');
      await saveAndOpenPdf(pdfBlob);
      
    } catch (error) {
      console.error("PDF generation failed", error);
      alert("PDF generation failed — check console.");
    } finally {
      setIsGeneratingPdf(false);
    }
  }, [
    isGeneratingPdf, selectedMachine, isTaxable, isExempt, currentQuarter, currentYear,
    baseMarketValue, adjustedMarketValue, assessmentLevel // ADD THESE DEPENDENCIES
  ]);

  // Format currency values
  const formatCurrency = (value: number) => `₱${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  // Calculate values for display
  const totalBaseValue = calculateTotalBaseCost();
  const depreciationRate = calculateDepreciationRate();
  const depreciationCost = calculateDepreciationCost();
  const marketValue = calculateMarketValue();
  const assessmentValue = getAssessedValue();
  const machineDescription = selectedMachine?.machine_description || selectedMachine?.selected_equipment || 'N/A';
  const actualUse = 'Industrial'; // Adjust based on your data

  // Handle PDF generation with validation
  const handleGeneratePdf = () => {
    if (!selectedMachine) {
      setShowAlert(true);
      return;
    }
    generatePdf();
  };

  if (!selectedMachine) {
    return (
      <IonModal isOpen={isOpen} onDidDismiss={onClose}>
        <IonHeader>
          <IonToolbar>
            <IonTitle>Machinery FAAS - BACK PAGE</IonTitle>
            <IonButtons slot="end">
              <IonButton onClick={onClose}>
                <IonIcon icon={close} />
              </IonButton>
            </IonButtons>
          </IonToolbar>
        </IonHeader>
        <IonContent>
          <div className="no-machine-selected">
            <p>No machine selected. Please select a machine from the list.</p>
          </div>
        </IonContent>
      </IonModal>
    );
  }

  return (
    <IonModal
      isOpen={isOpen}
      onDidDismiss={onClose}
      style={{ '--width': '95%', '--height': '95%' }}
    >
      <IonHeader>
        <IonToolbar>
          <IonTitle>Machinery FAAS - BACK PAGE</IonTitle>
          <IonButtons slot="end">
            <IonButton 
              onClick={handleGeneratePdf} 
              className="generate-pdf-btn"
              disabled={isGeneratingPdf}
            >
              {isGeneratingPdf ? <IonSpinner /> : <IonIcon icon={documentOutline} />}
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
        <div id="machine-faas-back-sheet" className="sheet">
          {/* Machine Info Header */}
          <div className="machine-header">
            <h3>{selectedMachine.selected_equipment}</h3>
            <p>{selectedMachine.brand_model} • Serial: {selectedMachine.serial_no || 'N/A'}</p>
          </div>

          {/* PROPERTY APPRAISAL - TABLE 1 */}
          <div className="section-header">PROPERTY APPRAISAL</div>

          <table className="table appraisal-table">
            <thead>
              <tr>
                <th>Description</th>
                <th>Type</th>
                <th>Units</th>
                <th>Unit Value</th>
                <th>Base Market Value (₱)</th>
                <th>% Depn.</th>
                <th>Depreciation Cost (₱)</th>
                <th>Market Value (₱)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <input
                    value={appraisal[`machine_desc`] || machineDescription}
                    onChange={(e) => setAppraisal((p) => ({ ...p, machine_desc: e.target.value }))}
                    placeholder={machineDescription}
                  />
                </td>
                <td>
                  <input
                    value={appraisal[`machine_type`] || "Machinery"}
                    onChange={(e) => setAppraisal((p) => ({ ...p, machine_type: e.target.value }))}
                    placeholder="Machinery"
                  />
                </td>
                <td>
                  <input
                    value={appraisal[`machine_units`] || (selectedMachine.number_of_units?.toString() || '1')}
                    onChange={(e) => setAppraisal((p) => ({ ...p, machine_units: e.target.value }))}
                    placeholder={selectedMachine.number_of_units?.toString() || '1'}
                  />
                </td>
                <td>
                  <input
                    value={appraisal[`machine_unit_value`] || formatCurrency(totalBaseValue)}
                    onChange={(e) => setAppraisal((p) => ({ ...p, machine_unit_value: e.target.value }))}
                    placeholder={formatCurrency(totalBaseValue)}
                  />
                </td>
                <td>
                  <input
                    value={appraisal[`machine_base`] || formatCurrency(totalBaseValue)}
                    onChange={(e) => setAppraisal((p) => ({ ...p, machine_base: e.target.value }))}
                    placeholder={formatCurrency(totalBaseValue)}
                  />
                </td>
                <td>
                  <input
                    value={appraisal[`machine_depn`] || depreciationRate.toString()}
                    onChange={(e) => setAppraisal((p) => ({ ...p, machine_depn: e.target.value }))}
                    placeholder={depreciationRate.toString()}
                  />
                </td>
                <td>
                  <input
                    value={appraisal[`machine_depn_cost`] || formatCurrency(depreciationCost)}
                    onChange={(e) => setAppraisal((p) => ({ ...p, machine_depn_cost: e.target.value }))}
                    placeholder={formatCurrency(depreciationCost)}
                  />
                </td>
                <td>
                  <input
                    value={appraisal[`machine_market`] || formatCurrency(marketValue)}
                    onChange={(e) => setAppraisal((p) => ({ ...p, machine_market: e.target.value }))}
                    placeholder={formatCurrency(marketValue)}
                  />
                </td>
              </tr>
              
              {/* Empty rows to maintain table structure */}
              {[...Array(5)].map((_, index) => (
                <tr key={`empty-${index}`}>
                  {[...Array(8)].map((_, c) => (
                    <td key={c}>
                      <input
                        value={appraisal[`empty${index}_c${c}`] || ""}
                        onChange={(e) => setAppraisal((p) => ({ ...p, [`empty${index}_c${c}`]: e.target.value }))}
                      />
                    </td>
                  ))}
                </tr>
              ))}
              
              {/* Table 1 Totals */}
              <tr className="subtotal-row">
                <td style={{ textAlign: 'left', fontWeight: 'bold' }}>
                  Sub-total
                </td>
                <td></td>
                <td style={{ textAlign: 'right', fontWeight: 'bold' }}>
                  {selectedMachine.number_of_units || '1'} units
                </td>
                <td></td>
                <td style={{ textAlign: 'right', fontWeight: 'bold' }}>
                  {formatCurrency(totalBaseValue)}
                </td>
                <td></td>
                <td style={{ textAlign: 'right', fontWeight: 'bold' }}>
                  {formatCurrency(depreciationCost)}
                </td>
                <td style={{ textAlign: 'right', fontWeight: 'bold' }}>
                  {formatCurrency(marketValue)}
                </td>
              </tr>
            </tbody>
          </table>

          {/* COMBINED TOTALS */}
          <div className="section-header">COMBINED TOTALS</div>

          <table className="table combined-totals-table">
            <tbody>
              <tr className="subtotal-row">
                <td style={{ textAlign: 'left', fontWeight: 'bold', width: '20%' }}>
                  TOTAL UNITS
                </td>
                <td style={{ textAlign: 'right', fontWeight: 'bold', width: '15%' }}>
                  {selectedMachine.number_of_units || '1'} units
                </td>
                <td style={{ textAlign: 'left', fontWeight: 'bold', width: '20%' }}>
                  TOTAL BASE MARKET VALUE
                </td>
                <td style={{ textAlign: 'right', fontWeight: 'bold', width: '15%' }}>
                  {formatCurrency(totalBaseValue)}
                </td>
                <td style={{ textAlign: 'left', fontWeight: 'bold', width: '20%' }}>
                  TOTAL DEPRECIATION
                </td>
                <td style={{ textAlign: 'right', fontWeight: 'bold', width: '15%' }}>
                  {formatCurrency(depreciationCost)}
                </td>
                <td style={{ textAlign: 'left', fontWeight: 'bold', width: '20%' }}>
                  GRAND TOTAL
                </td>
                <td style={{ textAlign: 'right', fontWeight: 'bold', width: '15%' }}>
                  {formatCurrency(marketValue)}
                </td>
              </tr>
            </tbody>
          </table>

          {/* PROPERTY ASSESSMENT */}
          <div className="section-header">PROPERTY ASSESSMENT</div>

          <table className="table assessment-table">
            <thead>
              <tr>
                <th>Actual Use</th>
                <th>Adjusted Market Value</th>
                <th>Assessment Level (%)</th>
                <th>Assessment Value</th>
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
                    value={assessment[`adjusted_market_value`] || formatCurrency(marketValue)}
                    onChange={(e) => setAssessment((p) => ({ ...p, adjusted_market_value: e.target.value }))}
                    placeholder={formatCurrency(marketValue)}
                  />
                </td>
                <td>
                  <input
                    value={assessment[`assessment_level`] || assessmentLevel || '0%'}
                    onChange={(e) => setAssessment((p) => ({ ...p, assessment_level: e.target.value }))}
                    placeholder={assessmentLevel || '0%'}
                  />
                </td>
                <td>
                  <input
                    value={assessment[`assessment_value`] || formatCurrency(assessmentValue)}
                    onChange={(e) => setAssessment((p) => ({ ...p, assessment_value: e.target.value }))}
                    placeholder={formatCurrency(assessmentValue)}
                  />
                </td>
              </tr>
              
              {/* Empty rows */}
              {[...Array(3)].map((_, r) => (
                <tr key={`empty-assess-${r}`}>
                  {[...Array(4)].map((_, c) => (
                    <td key={c}>
                      <input
                        value={assessment[`empty${r}_c${c}`] || ""}
                        onChange={(e) => setAssessment((p) => ({ ...p, [`empty${r}_c${c}`]: e.target.value }))}
                      />
                    </td>
                  ))}
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

        <IonAlert
          isOpen={showAlert}
          onDidDismiss={() => setShowAlert(false)}
          header={'No Machine Selected'}
          message={'Please select a machine to generate PDF.'}
          buttons={['OK']}
        />
      </IonContent>
    </IonModal>
  );
};

export default MachineFaasBackModal;