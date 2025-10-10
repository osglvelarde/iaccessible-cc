import { useState, useEffect } from 'react';
import { Header } from '@/components/layout/Header';
import { Dashboard } from '@/components/dashboard/Dashboard';
import { TestingWorkspace } from '@/components/testing/TestingWorkspace';
import type { WCAGVersion, WCAGLevel, ScopeType, ReportStatus, Report } from '@/types';

type AppView = 'dashboard' | 'testing';

interface AppState {
  currentView: AppView;
  selectedReportId?: string;
}

const Index = () => {
  const [appState, setAppState] = useState<AppState>({
    currentView: 'dashboard'
  });

  const [reports, setReports] = useState<Report[]>([]);
  const [suggestedPages, setSuggestedPages] = useState<string[]>([]);

  useEffect(() => {
    async function fetchReports() {
      try {
        const response = await fetch('http://localhost:3001/reports');
        if (!response.ok) {
          throw new Error('Failed to fetch reports');
        }
        const data = await response.json();
        setReports(data);
      } catch (error) {
        console.error(error);
        setReports([]);
      }
    }
    fetchReports();
  }, []);

  const handleReportSelect = (reportId: string) => {
    setAppState({
      currentView: 'testing',
      selectedReportId: reportId
    });
    // Update suggested pages for the selected report
    const report = reports.find(r => r.id === reportId);
    if (report && report.suggestedPages) {
      setSuggestedPages(report.suggestedPages);
    } else {
      setSuggestedPages([]);
    }
  };

  const handleReportCreate = (newReport: Report) => {
    setReports(prevReports => [...prevReports, newReport]);
    setAppState({
      currentView: 'testing',
      selectedReportId: newReport.id
    });
    if (newReport.suggestedPages) {
      setSuggestedPages(newReport.suggestedPages);
    } else {
      setSuggestedPages([]);
    }
  };

  const handleReportComplete = (newReportId: string) => {
    // Fetch the newly created report from backend and update state
    fetch(`http://localhost:3001/reports/${newReportId}`)
      .then(res => res.json())
      .then((createdReport: Report) => {
        setReports(prevReports => [...prevReports, createdReport]);
        setAppState({
          currentView: 'testing',
          selectedReportId: createdReport.id
        });
        if (createdReport.suggestedPages) {
          setSuggestedPages(createdReport.suggestedPages);
        } else {
          setSuggestedPages([]);
        }
      })
      .catch(() => {
        // Fallback: just set selectedReportId without updating reports list
        setAppState({
          currentView: 'testing',
          selectedReportId: newReportId
        });
        setSuggestedPages([]);
      });
  };

  const handleBackToDashboard = () => {
    setAppState({
      currentView: 'dashboard',
      selectedReportId: undefined
    });
    setSuggestedPages([]);
  };

  const selectedReport = reports.find(r => r.id === appState.selectedReportId);

  return (
    <div className="min-h-screen bg-background">
      {appState.currentView === 'dashboard' ? (
        <>
          <Header />
          <main>
            <Dashboard onReportSelect={handleReportSelect} onReportComplete={handleReportComplete} />
          </main>
        </>
      ) : (
        <main>
          {selectedReport ? (
            <TestingWorkspace 
              report={selectedReport}
              suggestedPages={suggestedPages}
              onBack={handleBackToDashboard}
            />
          ) : (
            <div>No report selected.</div>
          )}
        </main>
      )}
    </div>
  );
};

export default Index;
