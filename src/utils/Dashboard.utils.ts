import { supabase } from '../utils/supaBaseClient';
import { 
  DashboardStats, 
  KindData, 
  ClassificationData, 
  AdminActivityData, 
  UserActivityData, 
  FormSubmissionData, 
  FormReviewData,
  ViewType,
  TimeRangeType
} from './Dashboard.types';
import { jsPDF } from 'jspdf';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { FileOpener } from '@capawesome-team/capacitor-file-opener';

// Constants
export const KIND_IDS = [1, 2, 3] as const;
export const TIME_RANGES = ['7days', '30days'] as const;

export const STAT_CARDS = [
  { key: 'totalForms', title: 'Total Forms', color: '#7044ff', view: 'kinds' as ViewType },
  { key: 'totalUsers', title: 'Total Users', color: '#3880ff', view: undefined },
  { key: 'activeUsers', title: 'Active Users', color: '#10dc60', view: undefined },
  { key: 'formSubmissions', title: 'Form Submissions', color: '#ff4961', view: undefined }
] as const;

export const FORM_TYPE_CARDS = [
  { key: 'totalLand', title: 'Land Forms', color: '#2dd36f', view: 'land' as ViewType },
  { key: 'totalBuilding', title: 'Building Forms', color: '#5260ff', view: 'building' as ViewType },
  { key: 'totalMachinery', title: 'Machinery Forms', color: '#ffc409', view: 'machinery' as ViewType }
] as const;

export const KIND_CONFIG = [
  { id: 1, name: 'Land', color: '#2dd36f' },
  { id: 2, name: 'Building', color: '#5260ff' },
  { id: 3, name: 'Machinery', color: '#ffc409' }
] as const;

export const CHART_COLORS = [
  '#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57', '#ff9ff3',
  '#54a0ff', '#5f27cd', '#00d2d3', '#ff9f43', '#a29bfe', '#fd79a8'
] as const;

// Helper functions
export const generateDateLabels = (days: number): string[] => {
  return Array.from({ length: days }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (days - 1 - i));
    return date.toISOString().split('T')[0];
  });
};

export const getKindName = (kindId: number): string => {
  const kind = KIND_CONFIG.find(kind => kind.id === kindId);
  return kind?.name || 'Unknown';
};

export const getKindColor = (kindId: number): string => {
  const kind = KIND_CONFIG.find(kind => kind.id === kindId);
  return kind?.color || '#6c757d';
};

export const getClassificationColor = (index: number): string => 
  CHART_COLORS[index % CHART_COLORS.length];

// Helper function to get stat value
export const getStatValue = (stats: DashboardStats, key: string, totalFormSubmissions: number): number => {
  if (key === 'formSubmissions') {
    return totalFormSubmissions;
  }
  return stats[key as keyof DashboardStats];
};

// Universal PDF handling for both native and web
export const saveAndOpenPdf = async (pdfBlob: Blob, filename: string = 'Dashboard_Report.pdf') => {
  try {
    // Check if we're in a native Capacitor environment
    const isNative = (window as any).Capacitor?.isNativePlatform();
    
    if (isNative) {
      // NATIVE MOBILE: Use Filesystem and FileOpener
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
      const fileName = `${filename.replace('.pdf', '')}_${timestamp}.pdf`;

      // Write file to documents directory
      const result = await Filesystem.writeFile({
        path: fileName,
        data: base64Data,
        directory: Directory.Documents,
        recursive: true
      });

      console.log('PDF saved to:', result.uri);

      // Open the file using FileOpener
      try {
        await FileOpener.openFile({ 
          path: result.uri
        });
      } catch (openError) {
        console.error('Error opening file:', openError);
        // Show success message even if we can't auto-open
        alert(`PDF saved successfully to: ${result.uri}\nYou can find it in your Documents folder.`);
      }
    } else {
      // WEB: Use download approach
      const pdfUrl = URL.createObjectURL(pdfBlob);
      
      // Create download link
      const downloadLink = document.createElement('a');
      downloadLink.href = pdfUrl;
      downloadLink.download = filename;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      
      // Clean up URL
      setTimeout(() => URL.revokeObjectURL(pdfUrl), 1000);
    }
  } catch (error) {
    console.error('Error in saveAndOpenPdf:', error);
    
    // Ultimate fallback for both platforms
    alert('PDF generated successfully. If download did not start automatically, please check your downloads folder.');
    
    // Fallback download for web
    if (!(window as any).Capacitor?.isNativePlatform()) {
      const pdfUrl = URL.createObjectURL(pdfBlob);
      const downloadLink = document.createElement('a');
      downloadLink.href = pdfUrl;
      downloadLink.download = filename;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      setTimeout(() => URL.revokeObjectURL(pdfUrl), 1000);
    }
  }
};

// PDF Generation Function - Simplified Statistics Focus
export const generateDashboardReport = async (
  stats: DashboardStats,
  kindData: KindData[],
  classificationData: ClassificationData[],
  adminActivityData: AdminActivityData[],
  userActivityData: UserActivityData[],
  formSubmissionData: FormSubmissionData[],
  formReviewData: FormReviewData[],
  timeRange: TimeRangeType,
  selectedView: ViewType
) => {
  try {
    const pdf = new jsPDF('p', 'mm', 'a4');
    let yPosition = 20;

    // Header
    pdf.setFontSize(20);
    pdf.setFont('helvetica', 'bold');
    pdf.text('ADMIN DASHBOARD REPORT', 105, yPosition, { align: 'center' });
    
    yPosition += 10;
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Generated on: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`, 105, yPosition, { align: 'center' });
    pdf.text(`Time Range: ${timeRange === '7days' ? 'Last 7 Days' : 'Last 30 Days'}`, 105, yPosition + 5, { align: 'center' });

    yPosition += 20;

    // Main Statistics Section
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.text('MAIN STATISTICS', 20, yPosition);
    yPosition += 10;

    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    
    // First column - Core Statistics
    pdf.text('System Overview:', 20, yPosition);
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`• Total Forms: ${stats.totalForms.toLocaleString()}`, 25, yPosition + 7);
    pdf.text(`• Total Users: ${stats.totalUsers.toLocaleString()}`, 25, yPosition + 14);
    pdf.text(`• Active Users: ${stats.activeUsers.toLocaleString()}`, 25, yPosition + 21);
    
    // Second column - Form Types
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Form Types:', 100, yPosition);
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`• Land Forms: ${stats.totalLand.toLocaleString()}`, 105, yPosition + 7);
    pdf.text(`• Building Forms: ${stats.totalBuilding.toLocaleString()}`, 105, yPosition + 14);
    pdf.text(`• Machinery Forms: ${stats.totalMachinery.toLocaleString()}`, 105, yPosition + 21);

    yPosition += 35;

    // Activity Statistics
    const totalAdminLogins = adminActivityData.reduce((sum, item) => sum + item.loginCount, 0);
    const totalFormReviews = formReviewData.reduce((sum, item) => sum + item.reviewCount, 0);
    const totalUserLogins = userActivityData.reduce((sum, item) => sum + item.loginCount, 0);
    const totalFormSubmissions = formSubmissionData.reduce((sum, item) => sum + item.totalCount, 0);

    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.text('ACTIVITY STATISTICS', 20, yPosition);
    yPosition += 10;

    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Period Totals:', 20, yPosition);
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    
    // First column
    pdf.text(`• User Logins: ${totalUserLogins.toLocaleString()}`, 25, yPosition + 7);
    pdf.text(`• Form Submissions: ${totalFormSubmissions.toLocaleString()}`, 25, yPosition + 14);
    
    // Second column
    pdf.text(`• Admin Logins: ${totalAdminLogins.toLocaleString()}`, 100, yPosition + 7);
    pdf.text(`• Form Reviews: ${totalFormReviews.toLocaleString()}`, 100, yPosition + 14);

    yPosition += 30;

    // Forms Distribution
    if (selectedView === 'overview' || selectedView === 'kinds') {
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text('FORMS DISTRIBUTION BY KIND', 20, yPosition);
      yPosition += 10;

      if (kindData.length > 0) {
        pdf.setFontSize(11);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Kind', 20, yPosition);
        pdf.text('Count', 80, yPosition);
        pdf.text('Percentage', 120, yPosition);
        yPosition += 7;

        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'normal');
        
        kindData.forEach((kind) => {
          const kindName = getKindName(kind.kind_id);
          pdf.text(kindName, 20, yPosition);
          pdf.text(kind.count.toString(), 80, yPosition);
          pdf.text(`${kind.percentage.toFixed(1)}%`, 120, yPosition);
          yPosition += 6;
          
          // Add page break if needed
          if (yPosition > 250) {
            pdf.addPage();
            yPosition = 20;
          }
        });
      } else {
        pdf.setFontSize(10);
        pdf.text('No kind distribution data available', 20, yPosition);
        yPosition += 6;
      }

      yPosition += 10;
    }

    // Classification Distribution
    if (selectedView !== 'overview' && selectedView !== 'kinds' && classificationData.length > 0) {
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text(`${selectedView.toUpperCase()} CLASSIFICATIONS`, 20, yPosition);
      yPosition += 10;

      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Classification', 20, yPosition);
      pdf.text('Count', 80, yPosition);
      pdf.text('Percentage', 120, yPosition);
      yPosition += 7;

      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      
      classificationData.forEach((classification) => {
        pdf.text(classification.class_id, 20, yPosition);
        pdf.text(classification.count.toString(), 80, yPosition);
        pdf.text(`${classification.percentage.toFixed(1)}%`, 120, yPosition);
        yPosition += 6;
        
        // Add page break if needed
        if (yPosition > 250) {
          pdf.addPage();
          yPosition = 20;
        }
      });

      yPosition += 10;
    }

    // Recent Activity Summary
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.text('RECENT ACTIVITY SUMMARY', 20, yPosition);
    yPosition += 10;

    // Show last 3 days of key metrics
    const recentDays = 3;
    const recentFormSubmissions = formSubmissionData.slice(-recentDays);
    const recentUserActivity = userActivityData.slice(-recentDays);

    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Date', 20, yPosition);
    pdf.text('Forms', 60, yPosition);
    pdf.text('User Logins', 100, yPosition);
    pdf.text('Land/Bldg/Mach', 140, yPosition);
    yPosition += 7;

    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');

    for (let i = recentDays - 1; i >= 0; i--) {
      const submission = recentFormSubmissions[i];
      const userActivity = recentUserActivity[i];
      
      if (submission && userActivity) {
        const date = new Date(submission.date).toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric' 
        });
        
        pdf.text(date, 20, yPosition);
        pdf.text(submission.totalCount.toString(), 60, yPosition);
        pdf.text(userActivity.loginCount.toString(), 100, yPosition);
        pdf.text(`${submission.landCount}/${submission.buildingCount}/${submission.machineryCount}`, 140, yPosition);
        yPosition += 5;
        
        if (yPosition > 250) {
          pdf.addPage();
          yPosition = 20;
        }
      }
    }

    // Footer
    const pageCount = pdf.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      pdf.setPage(i);
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Page ${i} of ${pageCount}`, 105, 290, { align: 'center' });
      pdf.text('SPIDC Dashboard System', 190, 290, { align: 'right' });
    }

    // Convert to Blob and save
    const pdfBlob = pdf.output('blob');
    const filename = `Dashboard_Report_${new Date().getTime()}.pdf`;
    await saveAndOpenPdf(pdfBlob, filename);
    
    return true;
  } catch (error) {
    console.error('Error generating dashboard report:', error);
    alert('Failed to generate PDF report. Please try again.');
    return false;
  }
};

// Data fetching functions
export const fetchStats = async (
  setStats: (stats: DashboardStats) => void,
  setIsLoading: (loading: boolean) => void,
  setError: (error: string) => void
) => {
  try {
    setIsLoading(true);
    setError('');

    // Get all forms data from form_view
    const { data: allForms, error: formsError } = await supabase
      .from('form_view')
      .select('form_id, kind_description, class_id, status');

    let totalForms = 0;
    let totalLand = 0;
    let totalBuilding = 0;
    let totalMachinery = 0;

    if (formsError) {
      console.error('Forms query error:', formsError);
      setError('Failed to load forms data: ' + formsError.message);
    } else if (allForms) {
      totalForms = allForms.length;
      
      // Count by kind_description instead of kind_id
      totalLand = allForms.filter(form => 
        form.kind_description && form.kind_description.toLowerCase().includes('land')
      ).length;
      
      totalBuilding = allForms.filter(form => 
        form.kind_description && form.kind_description.toLowerCase().includes('building')
      ).length;
      
      totalMachinery = allForms.filter(form => 
        form.kind_description && form.kind_description.toLowerCase().includes('machinery')
      ).length;
    }

    // Get user statistics
    let totalUsers = 0, activeUsers = 0;
    try {
      // Get total users count
      const { count: usersCount, error: usersError } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true });
      
      if (usersError) {
        console.error('Users count error:', usersError);
      } else {
        totalUsers = usersCount || 0;
      }

      // Get active users (not suspended)
      const { count: activeUsersCount, error: activeUsersError } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('suspended', false);
      
      if (activeUsersError) {
        console.error('Active users error:', activeUsersError);
        activeUsers = totalUsers;
      } else {
        activeUsers = activeUsersCount || 0;
      }

    } catch (userError) {
      console.error('User statistics error:', userError);
    }

    const finalStats: DashboardStats = {
      totalForms,
      totalLand,
      totalBuilding,
      totalMachinery,
      totalUsers,
      activeUsers
    };

    setStats(finalStats);

  } catch (error: any) {
    console.error('Error fetching admin stats:', error);
    setError('Failed to load dashboard data: ' + error.message);
  } finally {
    setIsLoading(false);
  }
};

export const fetchKindDistribution = async (
  setKindData: (data: KindData[]) => void,
  setIsChartLoading: (loading: boolean) => void
) => {
  try {
    setIsChartLoading(true);
    
    // Get all forms with kind_description from form_view
    const { data, error } = await supabase
      .from('form_view')
      .select('kind_description');
    
    if (error) {
      console.error('Kind distribution error:', error);
      throw error;
    }

    // Count by kind_description
    const landCount = data?.filter(form => 
      form.kind_description && form.kind_description.toLowerCase().includes('land')
    ).length || 0;
    
    const buildingCount = data?.filter(form => 
      form.kind_description && form.kind_description.toLowerCase().includes('building')
    ).length || 0;
    
    const machineryCount = data?.filter(form => 
      form.kind_description && form.kind_description.toLowerCase().includes('machinery')
    ).length || 0;

    const total = data?.length || 0;
    const processedData = [
      { kind_id: 1, count: landCount, percentage: total > 0 ? (landCount / total) * 100 : 0 },
      { kind_id: 2, count: buildingCount, percentage: total > 0 ? (buildingCount / total) * 100 : 0 },
      { kind_id: 3, count: machineryCount, percentage: total > 0 ? (machineryCount / total) * 100 : 0 }
    ];

    setKindData(processedData);
    
  } catch (error) {
    console.error('Error fetching kind distribution:', error);
    setKindData([]);
  } finally {
    setIsChartLoading(false);
  }
};

export const fetchClassificationDistribution = async (
  kindId: number,
  setClassificationData: (data: ClassificationData[]) => void,
  setIsChartLoading: (loading: boolean) => void
) => {
  try {
    setIsChartLoading(true);
    
    // Map kind_id to kind_description for filtering
    const kindMap: Record<number, string> = {
      1: 'land',
      2: 'building', 
      3: 'machinery'
    };
    const kindDescription = kindMap[kindId];
    
    if (!kindDescription) {
      console.error('Invalid kindId:', kindId);
      setClassificationData([]);
      return;
    }
    
    const { data, error } = await supabase
      .from('form_view')
      .select('class_id, kind_description')
      .ilike('kind_description', `%${kindDescription}%`);
    
    if (error) {
      console.error('Classification distribution error:', error);
      throw error;
    }

    const classCounts: { [key: string]: number } = {};
    data?.forEach(item => { 
      if (item.class_id) {
        classCounts[item.class_id] = (classCounts[item.class_id] || 0) + 1;
      }
    });

    const total = data?.length || 0;
    const processedData = Object.entries(classCounts).map(([class_id, count]) => ({
      class_id,
      count,
      percentage: total > 0 ? (count / total) * 100 : 0
    }));

    setClassificationData(processedData);
    
  } catch (error) {
    console.error('Error fetching classification distribution:', error);
    setClassificationData([]);
  } finally {
    setIsChartLoading(false);
  }
};

export const fetchFormSubmissions = async (
  timeRange: TimeRangeType,
  setFormSubmissionData: (data: FormSubmissionData[]) => void
) => {
  try {
    const days = timeRange === '7days' ? 7 : 30;
    const dateLabels = generateDateLabels(days);

    try {
      // Use form_view with created_at
      const { data: formData, error: formError } = await supabase
        .from('form_view')
        .select('created_at, kind_id')
        .gte('created_at', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString())
        .in('kind_id', KIND_IDS);

      if (formError) {
        console.error('Error fetching form submissions:', formError);
        throw formError;
      }

      const processedData = dateLabels.map(date => {
        const dateForms = formData?.filter(form => 
          form.created_at && form.created_at.split('T')[0] === date
        ) || [];
        
        const landCount = dateForms.filter(f => f.kind_id === 1).length;
        const buildingCount = dateForms.filter(f => f.kind_id === 2).length;
        const machineryCount = dateForms.filter(f => f.kind_id === 3).length;
        
        return {
          date,
          totalCount: landCount + buildingCount + machineryCount,
          landCount,
          buildingCount,
          machineryCount
        };
      });
      
      setFormSubmissionData(processedData);
      
    } catch (error) {
      console.error('Error fetching form submissions:', error);
      // Return empty data
      setFormSubmissionData(dateLabels.map(date => ({
        date,
        totalCount: 0,
        landCount: 0,
        buildingCount: 0,
        machineryCount: 0
      })));
    }
  } catch (error) {
    console.error('Error fetching form submissions:', error);
  }
};

export const fetchAdminActivity = async (
  timeRange: TimeRangeType,
  setAdminActivityData: (data: AdminActivityData[]) => void
) => {
  try {
    const days = timeRange === '7days' ? 7 : 30;
    const dateLabels = generateDateLabels(days);

    try {
      const { data: adminData } = await supabase
        .from('admin_activity_logs')
        .select('timestamp, activity_type')
        .gte('timestamp', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString())
        .in('activity_type', ['LOGIN', 'SYSTEM_ACTION']);

      const processedData = dateLabels.map(date => {
        const dateActivities = adminData?.filter(activity => 
          activity.timestamp && activity.timestamp.split('T')[0] === date
        ) || [];
        return {
          date,
          loginCount: dateActivities.filter(a => a.activity_type === 'LOGIN').length,
          systemActionCount: dateActivities.filter(a => a.activity_type === 'SYSTEM_ACTION').length,
        };
      });
      
      setAdminActivityData(processedData);
      
    } catch {
      const emptyData = dateLabels.map(date => ({
        date,
        loginCount: 0,
        systemActionCount: 0,
      }));
      setAdminActivityData(emptyData);
    }
  } catch (error) {
    console.error('Error fetching admin activity:', error);
  }
};

export const fetchUserActivity = async (
  timeRange: TimeRangeType,
  setUserActivityData: (data: UserActivityData[]) => void
) => {
  try {
    const days = timeRange === '7days' ? 7 : 30;
    const dateLabels = generateDateLabels(days);

    try {
      const { data: userData } = await supabase
        .from('user_activity_logs')
        .select('timestamp, activity_type')
        .gte('timestamp', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString())
        .eq('activity_type', 'LOGIN');

      const processedData = dateLabels.map(date => {
        const dateActivities = userData?.filter(activity => 
          activity.timestamp && activity.timestamp.split('T')[0] === date
        ) || [];
        return { date, loginCount: dateActivities.length };
      });
      
      setUserActivityData(processedData);
      
    } catch {
      const emptyData = dateLabels.map(date => ({
        date, 
        loginCount: 0
      }));
      setUserActivityData(emptyData);
    }
  } catch (error) {
    console.error('Error fetching user activity:', error);
  }
};

export const fetchFormReviewStats = async (
  timeRange: TimeRangeType,
  setFormReviewData: (data: FormReviewData[]) => void
) => {
  try {
    const days = timeRange === '7days' ? 7 : 30;
    const dateLabels = generateDateLabels(days);

    try {
      const { data: reviewedForms } = await supabase
        .from('form_view')
        .select('created_at, status')
        .gte('created_at', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString())
        .eq('status', 'Inspected');

      const processedData = dateLabels.map(date => {
        const dateReviews = reviewedForms?.filter(form => 
          form.created_at && form.created_at.split('T')[0] === date
        ) || [];
        return { date, reviewCount: dateReviews.length };
      });
      
      setFormReviewData(processedData);
    } catch {
      const emptyData = dateLabels.map(date => ({
        date, 
        reviewCount: 0
      }));
      setFormReviewData(emptyData);
    }
  } catch (error) {
    console.error('Error fetching form review stats:', error);
  }
};