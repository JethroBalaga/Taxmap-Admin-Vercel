import React, { useState, useEffect } from 'react';
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
  IonSpinner,
  IonText,
  IonButton,
  IonIcon,
  IonSegment,
  IonSegmentButton,
  IonLabel,
  IonAlert,
  IonButtons
} from '@ionic/react';
import { arrowBack, refresh, documentText } from 'ionicons/icons';
import { Pie, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  ChartOptions,
  Filler
} from 'chart.js';

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
} from '../utils/Dashboard.types';
import { 
  fetchStats, 
  fetchKindDistribution, 
  fetchClassificationDistribution,
  fetchAdminActivity,
  fetchUserActivity,
  fetchFormSubmissions,
  fetchFormReviewStats,
  getKindName,
  getKindColor,
  getClassificationColor,
  getStatValue,
  STAT_CARDS,
  FORM_TYPE_CARDS,
  TIME_RANGES,
  generateDashboardReport
} from '../utils/Dashboard.utils';
import '../CSS/Dashboard.css';

ChartJS.register(
  ArcElement,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Filler
);

const Dashboard: React.FC = () => {
  // State
  const [stats, setStats] = useState<DashboardStats>({
    totalForms: 0, totalLand: 0, totalBuilding: 0, totalMachinery: 0, totalUsers: 0, activeUsers: 0
  });
  const [kindData, setKindData] = useState<KindData[]>([]);
  const [classificationData, setClassificationData] = useState<ClassificationData[]>([]);
  const [selectedView, setSelectedView] = useState<ViewType>('overview');
  const [isLoading, setIsLoading] = useState(true);
  const [isChartLoading, setIsChartLoading] = useState(false);
  const [timeRange, setTimeRange] = useState<TimeRangeType>('7days');
  const [adminActivityData, setAdminActivityData] = useState<AdminActivityData[]>([]);
  const [userActivityData, setUserActivityData] = useState<UserActivityData[]>([]);
  const [formSubmissionData, setFormSubmissionData] = useState<FormSubmissionData[]>([]);
  const [formReviewData, setFormReviewData] = useState<FormReviewData[]>([]);
  const [isLineChartLoading, setIsLineChartLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  // Effects
  useEffect(() => { 
    fetchStats(setStats, setIsLoading, setError);
  }, []);
  
  useEffect(() => {
    if (selectedView === 'kinds') {
      fetchKindDistribution(setKindData, setIsChartLoading);
    } else if (selectedView !== 'overview') {
      const kindMap: Record<string, number> = {
        'land': 1,
        'building': 2, 
        'machinery': 3
      };
      const kindId = kindMap[selectedView];
      if (kindId) {
        fetchClassificationDistribution(kindId, setClassificationData, setIsChartLoading);
      }
    }
  }, [selectedView]);

  useEffect(() => {
    if (selectedView === 'overview') {
      const loadAllData = async () => {
        setIsLineChartLoading(true);
        await Promise.all([
          fetchAdminActivity(timeRange, setAdminActivityData),
          fetchUserActivity(timeRange, setUserActivityData),
          fetchFormSubmissions(timeRange, setFormSubmissionData),
          fetchFormReviewStats(timeRange, setFormReviewData)
        ]);
        setIsLineChartLoading(false);
      };
      loadAllData();
    }
  }, [timeRange, selectedView]);

  // Refresh function
  const handleRefresh = () => {
    if (selectedView === 'overview') {
      fetchStats(setStats, setIsLoading, setError);
      const loadAllData = async () => {
        setIsLineChartLoading(true);
        await Promise.all([
          fetchAdminActivity(timeRange, setAdminActivityData),
          fetchUserActivity(timeRange, setUserActivityData),
          fetchFormSubmissions(timeRange, setFormSubmissionData),
          fetchFormReviewStats(timeRange, setFormReviewData)
        ]);
        setIsLineChartLoading(false);
      };
      loadAllData();
    } else {
      if (selectedView === 'kinds') {
        fetchKindDistribution(setKindData, setIsChartLoading);
      } else {
        const kindMap: Record<string, number> = {
          'land': 1,
          'building': 2, 
          'machinery': 3
        };
        const kindId = kindMap[selectedView];
        if (kindId) {
          fetchClassificationDistribution(kindId, setClassificationData, setIsChartLoading);
        }
      }
    }
  };

  // PDF Generation function
  const handleGenerateReport = async () => {
    setIsGeneratingPdf(true);
    try {
      await generateDashboardReport(
        stats,
        kindData,
        classificationData,
        adminActivityData,
        userActivityData,
        formSubmissionData,
        formReviewData,
        timeRange,
        selectedView
      );
    } catch (error) {
      console.error('Error generating report:', error);
      setError('Failed to generate PDF report. Please try again.');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // Chart data configurations
  const kindsChartData = {
    labels: kindData.map(item => `${getKindName(item.kind_id)} (${item.count})`),
    datasets: [{
      data: kindData.map(item => item.count),
      backgroundColor: kindData.map(item => getKindColor(item.kind_id)),
      borderColor: '#ffffff',
      borderWidth: 2,
    }],
  };

  const classificationsChartData = {
    labels: classificationData.map(item => `${item.class_id} (${item.count})`),
    datasets: [{
      data: classificationData.map(item => item.count),
      backgroundColor: classificationData.map((_, index) => getClassificationColor(index)),
      borderColor: '#ffffff',
      borderWidth: 2,
    }],
  };

  const formatChartLabels = (data: Array<{date: string}>) => data.map(item => {
    const date = new Date(item.date);
    return timeRange === '7days' 
      ? date.toLocaleDateString('en-US', { weekday: 'short' })
      : date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  });

  const adminActivityChartData = {
    labels: formatChartLabels(adminActivityData),
    datasets: [
      {
        label: 'Admin Logins',
        data: adminActivityData.map(item => item.loginCount),
        borderColor: '#7044ff',
        backgroundColor: 'rgba(112, 68, 255, 0.1)',
        borderWidth: 2,
        tension: 0.4,
        fill: true,
      },
      {
        label: 'System Actions',
        data: adminActivityData.map(item => item.systemActionCount),
        borderColor: '#ff4961',
        backgroundColor: 'rgba(255, 73, 97, 0.1)',
        borderWidth: 2,
        tension: 0.4,
        fill: true,
      },
      {
        label: 'Form Reviews',
        data: formReviewData.map(item => item.reviewCount),
        borderColor: '#10dc60',
        backgroundColor: 'rgba(16, 220, 96, 0.1)',
        borderWidth: 2,
        tension: 0.4,
        fill: true,
      }
    ],
  };

  const userActivityChartData = {
    labels: formatChartLabels(userActivityData),
    datasets: [{
      label: 'User Logins',
      data: userActivityData.map(item => item.loginCount),
      borderColor: '#3880ff',
      backgroundColor: 'rgba(56, 128, 255, 0.1)',
      borderWidth: 2,
      tension: 0.4,
      fill: true,
    }],
  };

  const formSubmissionChartData = {
    labels: formatChartLabels(formSubmissionData),
    datasets: [
      {
        label: 'Total Submissions',
        data: formSubmissionData.map(item => item.totalCount),
        borderColor: '#7044ff',
        backgroundColor: 'rgba(112, 68, 255, 0.1)',
        borderWidth: 3,
        tension: 0.4,
        fill: true,
      },
      {
        label: 'Land Forms',
        data: formSubmissionData.map(item => item.landCount),
        borderColor: '#2dd36f',
        backgroundColor: 'rgba(45, 211, 111, 0.2)',
        borderWidth: 2,
        tension: 0.4,
        fill: false,
      },
      {
        label: 'Building Forms',
        data: formSubmissionData.map(item => item.buildingCount),
        borderColor: '#5260ff',
        backgroundColor: 'rgba(82, 96, 255, 0.2)',
        borderWidth: 2,
        tension: 0.4,
        fill: false,
      },
      {
        label: 'Machinery Forms',
        data: formSubmissionData.map(item => item.machineryCount),
        borderColor: '#ffc409',
        backgroundColor: 'rgba(255, 196, 9, 0.2)',
        borderWidth: 2,
        tension: 0.4,
        fill: false,
      }
    ],
  };

  // Chart options
  const pieChartOptions: ChartOptions<'pie'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom', labels: { padding: 20, usePointStyle: true } },
    },
  };

  const lineChartOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: 'top' as const } },
    scales: { y: { beginAtZero: true } },
  };

  // Components
  const StatCard: React.FC<{
    title: string;
    value: number;
    color: string;
    onClick?: () => void;
  }> = ({ title, value, color, onClick }) => (
    <IonCard 
      className="stat-card" 
      style={{ '--card-color': color } as any}
      button={!!onClick}
      onClick={onClick}
    >
      <IonCardHeader>
        <IonCardTitle className="stat-card-title">{title}</IonCardTitle>
      </IonCardHeader>
      <IonCardContent>
        <div className="stat-value">{value.toLocaleString()}</div>
      </IonCardContent>
    </IonCard>
  );

  // Calculations
  const totalAdminLogins = adminActivityData.reduce((sum, item) => sum + item.loginCount, 0);
  const totalFormReviews = formReviewData.reduce((sum, item) => sum + item.reviewCount, 0);
  const totalUserLogins = userActivityData.reduce((sum, item) => sum + item.loginCount, 0);
  const totalFormSubmissions = formSubmissionData.reduce((sum, item) => sum + item.totalCount, 0);

  const summaryItems = [
    { value: totalUserLogins, label: 'User Logins', color: 'primary' as const },
    { value: totalFormSubmissions, label: 'Forms Submitted', color: 'success' as const },
    { value: totalAdminLogins, label: 'Admin Logins', color: 'warning' as const },
    { value: totalFormReviews, label: 'Form Reviews', color: 'secondary' as const }
  ];

  const chartConfigs = [
    { title: 'User Logins Over Time', data: userActivityChartData },
    { title: 'Form Submissions Over Time', data: formSubmissionChartData },
    { title: 'Admin Activity Over Time', data: adminActivityChartData }
  ];

  const getPageTitle = () => {
    switch (selectedView) {
      case 'overview': return 'Admin Dashboard';
      case 'kinds': return 'Forms by Kind';
      case 'land': return 'Land Classifications';
      case 'building': return 'Building Classifications';
      case 'machinery': return 'Machinery Classifications';
      default: return 'Admin Dashboard';
    }
  };

  const getChartTitle = () => {
    switch (selectedView) {
      case 'kinds': return 'Forms Distribution by Kind';
      case 'land': return 'Land Classification Distribution';
      case 'building': return 'Building Classification Distribution';
      case 'machinery': return 'Machinery Classification Distribution';
      default: return '';
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>{getPageTitle()}</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={handleGenerateReport} disabled={isGeneratingPdf}>
              <IonIcon slot="icon-only" icon={isGeneratingPdf ? refresh : documentText} />
            </IonButton>
            <IonButton onClick={handleRefresh}>
              <IonIcon slot="icon-only" icon={refresh} />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent>
        <IonAlert isOpen={!!error} onDidDismiss={() => setError('')} header={'Error'} message={error} buttons={['OK']} />

        {selectedView === 'overview' && (
          <div className="dashboard-container">
            <IonCard>
              <IonCardContent>
                <IonSegment value={timeRange} onIonChange={e => {
                  if (e.detail.value) setTimeRange(e.detail.value as TimeRangeType);
                }}>
                  {TIME_RANGES.map(range => (
                    <IonSegmentButton key={range} value={range}>
                      <IonLabel>{range === '7days' ? '7 Days' : '30 Days'}</IonLabel>
                    </IonSegmentButton>
                  ))}
                </IonSegment>
              </IonCardContent>
            </IonCard>

            <IonGrid>
              <IonRow>
                <IonCol size="12">
                  <h2>Admin Dashboard</h2>
                  <IonText color="medium"><p>System overview and user activity analytics</p></IonText>
                </IonCol>
              </IonRow>

              {isLoading ? (
                <IonRow>
                  <IonCol size="12" className="loading-col">
                    <IonSpinner />
                    <IonText>Loading admin statistics...</IonText>
                  </IonCol>
                </IonRow>
              ) : (
                <>
                  {/* Stat Cards */}
                  <IonRow>
                    {STAT_CARDS.map((card: any) => (
                      <IonCol key={card.key} size="6" size-md="3">
                        <StatCard
                          title={card.title}
                          value={getStatValue(stats, card.key, totalFormSubmissions)}
                          color={card.color}
                          onClick={card.view ? () => setSelectedView(card.view) : undefined}
                        />
                      </IonCol>
                    ))}
                  </IonRow>

                  {/* Form Type Cards */}
                  <IonRow>
                    {FORM_TYPE_CARDS.map((card: any) => (
                      <IonCol key={card.key} size="4">
                        <StatCard
                          title={card.title}
                          value={getStatValue(stats, card.key, totalFormSubmissions)}
                          color={card.color}
                          onClick={() => setSelectedView(card.view)}
                        />
                      </IonCol>
                    ))}
                  </IonRow>

                  {/* Charts */}
                  {chartConfigs.map((chart, index) => (
                    <IonRow key={index}>
                      <IonCol size="12">
                        <IonCard>
                          <IonCardHeader><IonCardTitle>{chart.title}</IonCardTitle></IonCardHeader>
                          <IonCardContent>
                            {isLineChartLoading ? (
                              <div className="chart-loading">
                                <IonSpinner /><IonText>Loading chart data...</IonText>
                              </div>
                            ) : (
                              <div className="chart-container">
                                <Line data={chart.data} options={lineChartOptions} />
                              </div>
                            )}
                          </IonCardContent>
                        </IonCard>
                      </IonCol>
                    </IonRow>
                  ))}

                  {/* Quick Summary */}
                  <IonRow>
                    <IonCol size="12">
                      <IonCard>
                        <IonCardHeader><IonCardTitle>Quick Summary ({timeRange})</IonCardTitle></IonCardHeader>
                        <IonCardContent>
                          <IonGrid>
                            <IonRow>
                              {summaryItems.map((item, index) => (
                                <IonCol key={index} size="12" size-md="3">
                                  <div className="summary-item">
                                    <IonText color={item.color}><h3>{item.value}</h3></IonText>
                                    <IonText color="medium"><p>{item.label}</p></IonText>
                                  </div>
                                </IonCol>
                              ))}
                            </IonRow>
                          </IonGrid>
                        </IonCardContent>
                      </IonCard>
                    </IonCol>
                  </IonRow>
                </>
              )}
            </IonGrid>
          </div>
        )}

        {/* Pie Charts Section */}
        {selectedView !== 'overview' && (
          <div className="charts-container">
            <IonGrid>
              <IonRow>
                <IonCol size="12" size-md="8" offset-md="2">
                  <IonCard>
                    <IonCardHeader>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <IonCardTitle>{getChartTitle()}</IonCardTitle>
                        <div>
                          <IonButton fill="clear" onClick={handleRefresh} color="medium">
                            <IonIcon slot="icon-only" icon={refresh} />
                          </IonButton>
                          <IonButton fill="clear" onClick={() => setSelectedView('overview')} color="medium">
                            <IonIcon slot="start" icon={arrowBack} />
                            Back to Overview
                          </IonButton>
                        </div>
                      </div>
                    </IonCardHeader>
                    <IonCardContent>
                      {isChartLoading ? (
                        <div className="chart-loading">
                          <IonSpinner /><IonText>Loading chart data...</IonText>
                        </div>
                      ) : (
                        <div className="chart-container">
                          {selectedView === 'kinds' && kindData.length > 0 && (
                            <Pie data={kindsChartData} options={pieChartOptions} />
                          )}
                          {selectedView !== 'kinds' && classificationData.length > 0 && (
                            <Pie data={classificationsChartData} options={pieChartOptions} />
                          )}
                          {((selectedView === 'kinds' && kindData.length === 0) || 
                            (selectedView !== 'kinds' && classificationData.length === 0)) && (
                            <div className="no-data">
                              <IonText color="medium">
                                <p>No data available for chart.</p>
                              </IonText>
                            </div>
                          )}
                        </div>
                      )}
                    </IonCardContent>
                  </IonCard>
                </IonCol>
              </IonRow>
            </IonGrid>
          </div>
        )}
      </IonContent>
    </IonPage>
  );
};

export default Dashboard;