import { useState, useEffect, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, X } from 'lucide-react';
import { TabData, SearchResult } from '@/lib/types/glossary';
import { Button } from '@/components/ui/button';

interface GlobalSearchProps {
  data: TabData[];
  onResultClick: (tabId: string, rowId: string) => void;
}

export const GlobalSearch = ({ data, onResultClick }: GlobalSearchProps) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  const searchData = useCallback((searchQuery: string): SearchResult[] => {
    if (!searchQuery.trim()) return [];
    
    const searchResults: SearchResult[] = [];
    const lowerQuery = searchQuery.toLowerCase();

    data.forEach(tab => {
      tab.rows.forEach(row => {
        const searchableFields = [
          { field: 'columnName', value: row.columnName },
          { field: 'explanation', value: row.explanation },
          { field: 'wcagSC', value: row.wcagSC || '' },
          { field: 'variable', value: row.variable || '' },
          { field: 'remediationGuidelines', value: row.remediationGuidelines || '' },
          { field: 'waveType', value: row.waveType || '' },
          { field: 'readabilityMetric', value: row.readabilityMetric || '' },
          { field: 'pdfuaClause', value: row.pdfuaClause || '' }
        ];

        searchableFields.forEach(({ field, value }) => {
          if (value.toLowerCase().includes(lowerQuery)) {
            const start = value.toLowerCase().indexOf(lowerQuery);
            const end = start + lowerQuery.length;
            const snippet = value.length > 100 
              ? `${value.substring(Math.max(0, start - 20), start)}${value.substring(start, end)}${value.substring(end, Math.min(value.length, end + 20))}...`
              : value;

            searchResults.push({
              row,
              tabName: tab.name,
              matchedField: field,
              snippet
            });
          }
        });
      });
    });

    return searchResults.slice(0, 20); // Limit to 20 results
  }, [data]);

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      const searchResults = searchData(query);
      setResults(searchResults);
      setIsOpen(searchResults.length > 0 && query.trim() !== '');
    }, 250);

    return () => clearTimeout(debounceTimer);
  }, [query, searchData]);

  const handleResultClick = (result: SearchResult) => {
    // Map category to correct tab ID
    let tabId = result.row.category;
    if (result.row.category === 'wave') {
      tabId = 'wave';
    } else if (result.row.category === 'readability') {
      tabId = 'readability';
    }
    
    onResultClick(tabId, result.row.id);
    setIsOpen(false);
    setQuery('');
  };

  const clearSearch = () => {
    setQuery('');
    setIsOpen(false);
  };

  const groupedResults = results.reduce((acc, result) => {
    if (!acc[result.tabName]) {
      acc[result.tabName] = [];
    }
    acc[result.tabName].push(result);
    return acc;
  }, {} as Record<string, SearchResult[]>);

  return (
    <div className="relative w-full max-w-2xl">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search all tables (e.g., 'alt text', '1.4.3', 'contrast_low')"
          className="pl-10 pr-10"
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              clearSearch();
            }
          }}
        />
        {query && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearSearch}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>

      {isOpen && (
        <Card className="absolute top-full mt-2 w-full max-h-96 overflow-y-auto z-50 p-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-sm">
                {results.length} results across {Object.keys(groupedResults).length} tables
              </h3>
              <Button variant="ghost" size="sm" onClick={clearSearch}>
                <X className="h-3 w-3" />
              </Button>
            </div>

            {Object.entries(groupedResults).map(([tabName, tabResults]) => (
              <div key={tabName} className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{tabName}</Badge>
                  <span className="text-sm text-muted-foreground">
                    {tabResults.length} results
                  </span>
                </div>
                <div className="space-y-1">
                  {tabResults.map((result, index) => (
                    <button
                      key={`${result.row.id}-${index}`}
                      onClick={() => handleResultClick(result)}
                      className="w-full text-left p-2 rounded hover:bg-muted transition-colors"
                    >
                      <div className="font-medium text-sm">{result.row.columnName}</div>
                      <div className="text-xs text-muted-foreground truncate">
                        {result.snippet}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};
