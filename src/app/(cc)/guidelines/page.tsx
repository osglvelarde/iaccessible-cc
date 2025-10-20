"use client";
import { useState } from 'react';
import { GlossaryHeader } from '@/components/cc/glossary/GlossaryHeader';
import { OnboardingTip } from '@/components/cc/glossary/OnboardingTip';
import { GlobalSearch } from '@/components/cc/glossary/GlobalSearch';
import { GlossaryTabs } from '@/components/cc/glossary/GlossaryTabs';
import { GLOSSARY_DATA } from '@/lib/glossary-data';

export default function GuidelinesPage() {
  const [activeTab, setActiveTab] = useState('wcag');
  const [highlightedRowId, setHighlightedRowId] = useState<string | undefined>();
  const [expandedRowId, setExpandedRowId] = useState<string | undefined>();

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    setHighlightedRowId(undefined);
    setExpandedRowId(undefined);
  };

  const handleRowExpand = (rowId: string) => {
    if (expandedRowId === rowId) {
      setExpandedRowId(undefined);
    } else {
      setExpandedRowId(rowId);
    }
  };

  const handleResultClick = (tabId: string, rowId: string) => {
    setActiveTab(tabId);
    setHighlightedRowId(rowId);
    setExpandedRowId(rowId);
    
    // Scroll to the table after a brief delay to ensure tab switch completes
    setTimeout(() => {
      const element = document.getElementById(`row-${rowId}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);
  };

  return (
    <div className="min-h-screen bg-background">
      <GlossaryHeader />
      
      <main className="container mx-auto px-4 py-6">
        <OnboardingTip />
        
        <div className="mb-6">
          <GlobalSearch 
            data={GLOSSARY_DATA}
            onResultClick={handleResultClick}
          />
        </div>
        
        <GlossaryTabs
          data={GLOSSARY_DATA}
          activeTab={activeTab}
          onTabChange={handleTabChange}
          highlightedRowId={highlightedRowId}
          onRowExpand={handleRowExpand}
          expandedRowId={expandedRowId}
        />
      </main>
    </div>
  );
}
