"use client";
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { 
  Upload, 
  Download, 
  Users, 
  UserCheck,
  FileText,
  AlertCircle,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { generateUserImportTemplate, exportUsersToCSV } from '@/lib/bulk-operations';

interface BulkOperationsPanelProps {
  organizationId: string;
  canManageUsers: boolean;
  canExportData: boolean;
}

export default function BulkOperationsPanel({ 
  organizationId, 
  canManageUsers,
  canExportData 
}: BulkOperationsPanelProps) {
  const [activeTab, setActiveTab] = useState('import');
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvContent, setCsvContent] = useState('');
  const [importResults, setImportResults] = useState<{
    success: boolean;
    totalUsers: number;
    createdUsers: number;
    failedUsers: number;
    errors: Array<{ user: any; error: string }>;
  } | null>(null);
  const [exportType, setExportType] = useState('users');
  const [loading, setLoading] = useState(false);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setCsvFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setCsvContent(e.target?.result as string);
      };
      reader.readAsText(file);
    }
  };

  const handleImportUsers = async () => {
    if (!csvFile) {
      alert('Please select a CSV file');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('csvFile', csvFile);
      formData.append('organizationId', organizationId);
      formData.append('actorId', 'current-user'); // TODO: Get from auth context
      formData.append('actorEmail', 'current-user@example.com'); // TODO: Get from auth context

      const response = await fetch('/api/users-roles/bulk-operations/import-users', {
        method: 'POST',
        body: formData
      });

      const result = await response.json();
      setImportResults(result);
    } catch (error) {
      console.error('Error importing users:', error);
      alert('Failed to import users');
    } finally {
      setLoading(false);
    }
  };

  const handleExportData = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/users-roles/bulk-operations/export?type=${exportType}&organizationId=${organizationId}`
      );

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${exportType}-${organizationId}-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      } else {
        alert('Failed to export data');
      }
    } catch (error) {
      console.error('Error exporting data:', error);
      alert('Failed to export data');
    } finally {
      setLoading(false);
    }
  };

  const downloadTemplate = () => {
    const template = generateUserImportTemplate();
    const blob = new Blob([template], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'user-import-template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Bulk Operations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="import">Import Users</TabsTrigger>
              <TabsTrigger value="export">Export Data</TabsTrigger>
            </TabsList>

            {/* Import Users Tab */}
            <TabsContent value="import" className="space-y-4">
              {!canManageUsers ? (
                <div className="text-center py-8 text-muted-foreground">
                  You don&apos;t have permission to import users
                </div>
              ) : (
                <>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="csv-file">CSV File</Label>
                      <Input
                        id="csv-file"
                        type="file"
                        accept=".csv"
                        onChange={handleFileUpload}
                        className="mt-1"
                      />
                      <p className="text-sm text-muted-foreground mt-1">
                        Upload a CSV file with user data
                      </p>
                    </div>

                    <div className="flex gap-2">
                      <Button variant="outline" onClick={downloadTemplate}>
                        <FileText className="h-4 w-4 mr-2" />
                        Download Template
                      </Button>
                      <Button 
                        onClick={handleImportUsers} 
                        disabled={!csvFile || loading}
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        {loading ? 'Importing...' : 'Import Users'}
                      </Button>
                    </div>

                    {csvContent && (
                      <div>
                        <Label>CSV Preview</Label>
                        <Textarea
                          value={csvContent}
                          readOnly
                          rows={6}
                          className="mt-1 font-mono text-xs"
                        />
                      </div>
                    )}

                    {importResults && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          {importResults.success ? (
                            <CheckCircle className="h-5 w-5 text-green-500" />
                          ) : (
                            <XCircle className="h-5 w-5 text-red-500" />
                          )}
                          <span className="font-medium">
                            Import {importResults.success ? 'Completed' : 'Failed'}
                          </span>
                        </div>
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <span className="font-medium">Total Users:</span>
                            <span className="ml-2">{importResults.totalUsers}</span>
                          </div>
                          <div>
                            <span className="font-medium">Created:</span>
                            <span className="ml-2 text-green-600">{importResults.createdUsers}</span>
                          </div>
                          <div>
                            <span className="font-medium">Failed:</span>
                            <span className="ml-2 text-red-600">{importResults.failedUsers}</span>
                          </div>
                        </div>
                        {importResults.errors.length > 0 && (
                          <div>
                            <Label>Errors:</Label>
                            <div className="mt-1 max-h-32 overflow-y-auto">
                              {importResults.errors.map((error, index) => (
                                <div key={index} className="text-sm text-red-600 py-1">
                                  {error.user?.email}: {error.error}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </>
              )}
            </TabsContent>

            {/* Export Data Tab */}
            <TabsContent value="export" className="space-y-4">
              {!canExportData ? (
                <div className="text-center py-8 text-muted-foreground">
                  You don&apos;t have permission to export data
                </div>
              ) : (
                <>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="export-type">Export Type</Label>
                      <Select value={exportType} onValueChange={setExportType}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="users">Users</SelectItem>
                          <SelectItem value="groups">Groups</SelectItem>
                          <SelectItem value="operating-units">Operating Units</SelectItem>
                          <SelectItem value="organizations">Organizations</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="bg-muted/50 p-4 rounded-lg">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="h-4 w-4 text-blue-500 mt-0.5" />
                        <div className="text-sm">
                          <p className="font-medium">Export Information</p>
                          <p className="text-muted-foreground mt-1">
                            The exported CSV will include all relevant data with organization hierarchy.
                            Users export requires organization filtering.
                          </p>
                        </div>
                      </div>
                    </div>

                    <Button 
                      onClick={handleExportData} 
                      disabled={loading}
                      className="w-full"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      {loading ? 'Exporting...' : `Export ${exportType}`}
                    </Button>
                  </div>
                </>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* CSV Template Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">CSV Template Format</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">User Import Template</h4>
              <div className="bg-muted p-3 rounded-md">
                <code className="text-sm">
                  email,firstName,lastName,organizationId,operatingUnitId,groupIds
                </code>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                Required fields: email, firstName, lastName, organizationId, operatingUnitId
                <br />
                Optional fields: groupIds (semicolon-separated)
              </p>
            </div>

            <div>
              <h4 className="font-medium mb-2">Example Data</h4>
              <div className="bg-muted p-3 rounded-md">
                <code className="text-sm">
                  john.doe@example.com,John,Doe,org-1,ou-1,group-1;group-2
                </code>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
