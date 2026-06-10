import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { BookOpen, FileText, Upload, CheckCircle, AlertTriangle, HelpCircle, Calculator } from "lucide-react";

export function ImportGuide() {
  return (
    <div className="space-y-6">
      <Card className="shadow-soft border-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Data Import Guide
          </CardTitle>
          <CardDescription>
            Complete guide to importing your data successfully
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="formats">File Formats</TabsTrigger>
              <TabsTrigger value="modules">Modules</TabsTrigger>
              <TabsTrigger value="troubleshooting">Troubleshooting</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">Getting Started</h3>
                <div className="space-y-4">
                  <div className="flex items-start gap-4 p-4 border rounded-lg">
                    <div className="flex-shrink-0 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-semibold">
                      1
                    </div>
                    <div>
                      <h4 className="font-medium">Choose Your Module</h4>
                      <p className="text-sm text-muted-foreground">
                        Select the type of data you want to import (employees, companies, etc.)
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-4 p-4 border rounded-lg">
                    <div className="flex-shrink-0 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-semibold">
                      2
                    </div>
                    <div>
                      <h4 className="font-medium">Download Template</h4>
                      <p className="text-sm text-muted-foreground">
                        Download the CSV template with the correct column headers and sample data
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-4 p-4 border rounded-lg">
                    <div className="flex-shrink-0 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-semibold">
                      3
                    </div>
                    <div>
                      <h4 className="font-medium">Prepare Your Data</h4>
                      <p className="text-sm text-muted-foreground">
                        Fill in your data using the template format, ensuring all required fields are completed
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-4 p-4 border rounded-lg">
                    <div className="flex-shrink-0 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-semibold">
                      4
                    </div>
                    <div>
                      <h4 className="font-medium">Upload & Validate</h4>
                      <p className="text-sm text-muted-foreground">
                        Upload your CSV file and run validation to check for errors
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-4 p-4 border rounded-lg">
                    <div className="flex-shrink-0 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-semibold">
                      5
                    </div>
                    <div>
                      <h4 className="font-medium">Review & Import</h4>
                      <p className="text-sm text-muted-foreground">
                        Review validation results and proceed with the import if everything looks correct
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="formats" className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">File Format Requirements</h3>
                
                <Alert className="mb-4">
                  <FileText className="h-4 w-4" />
                  <AlertDescription>
                    Only CSV (Comma-Separated Values) files are supported for data import.
                  </AlertDescription>
                </Alert>

                <div className="space-y-4">
                  <Card className="shadow-soft border-0">
                    <CardHeader>
                      <CardTitle className="text-base">CSV Format Guidelines</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-success mt-0.5" />
                        <span className="text-sm">File extension must be .csv</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-success mt-0.5" />
                        <span className="text-sm">Maximum file size: 10MB</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-success mt-0.5" />
                        <span className="text-sm">First row must contain column headers</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-success mt-0.5" />
                        <span className="text-sm">Use commas to separate values</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-success mt-0.5" />
                        <span className="text-sm">Enclose values containing commas in double quotes</span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="shadow-soft border-0">
                    <CardHeader>
                      <CardTitle className="text-base">Data Format Rules</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <h5 className="font-medium mb-2">Dates</h5>
                          <p className="text-sm text-muted-foreground">
                            Use YYYY-MM-DD format (e.g., 2024-03-15)
                          </p>
                        </div>
                        <div>
                          <h5 className="font-medium mb-2">Email Addresses</h5>
                          <p className="text-sm text-muted-foreground">
                            Must be valid email format (e.g., user@domain.com)
                          </p>
                        </div>
                        <div>
                          <h5 className="font-medium mb-2">Numbers</h5>
                          <p className="text-sm text-muted-foreground">
                            Use decimal point for decimals (e.g., 50000.50)
                          </p>
                        </div>
                        <div>
                          <h5 className="font-medium mb-2">Text Fields</h5>
                          <p className="text-sm text-muted-foreground">
                            Avoid special characters that might break parsing
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="modules" className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">Available Import Modules</h3>
                
                <div className="space-y-4">
                  <Card className="shadow-soft border-0">
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <Badge>Employees</Badge>
                        Employee Data Import
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <h5 className="font-medium mb-2 text-destructive">Required Fields</h5>
                          <ul className="text-sm space-y-1 text-muted-foreground">
                            <li>• First Name</li>
                            <li>• Last Name</li>
                            <li>• Email</li>
                            <li>• National Insurance Number</li>
                            <li>• Hire Date</li>
                          </ul>
                        </div>
                        <div>
                          <h5 className="font-medium mb-2 text-blue-600">Lookup Fields</h5>
                          <ul className="text-sm space-y-1 text-muted-foreground">
                            <li>• Manager Name (lookup)</li>
                            <li>• Company Name (lookup)</li>
                            <li>• Department (lookup)</li>
                            <li>• Job Title (lookup)</li>
                          </ul>
                          <Alert className="mt-3">
                            <AlertDescription className="text-xs">
                              Manager Name should be the full name (e.g., "John Smith"). 
                              The system will automatically link to the correct manager by matching first and last names.
                            </AlertDescription>
                          </Alert>
                        </div>
                      </div>
                      <Alert className="mt-4 bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
                        <Calculator className="h-4 w-4 text-green-600" />
                        <AlertDescription className="text-xs text-green-800">
                          <strong>Automatic Leave Calculation:</strong> Leave entitlements are calculated automatically 
                          based on hire date and fiscal year settings. No need to include leave fields in your import.
                        </AlertDescription>
                      </Alert>
                    </CardContent>
                  </Card>

                  <Card className="shadow-soft border-0">
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <Badge>Companies</Badge>
                        Company Data Import
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <h5 className="font-medium mb-2 text-destructive">Required Fields</h5>
                          <ul className="text-sm space-y-1 text-muted-foreground">
                            <li>• Company Name</li>
                          </ul>
                        </div>
                        <div>
                          <h5 className="font-medium mb-2 text-muted-foreground">Optional Fields</h5>
                          <ul className="text-sm space-y-1 text-muted-foreground">
                            <li>• Email</li>
                            <li>• Phone</li>
                            <li>• Address</li>
                            <li>• Website</li>
                            <li>• Registration Number</li>
                          </ul>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="shadow-soft border-0">
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <Badge>Leave Requests</Badge>
                        Leave Request Import
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <h5 className="font-medium mb-2 text-destructive">Required Fields</h5>
                          <ul className="text-sm space-y-1 text-muted-foreground">
                            <li>• Employee Email</li>
                            <li>• Leave Type</li>
                            <li>• Start Date</li>
                            <li>• End Date</li>
                            <li>• Days Requested</li>
                          </ul>
                        </div>
                        <div>
                          <h5 className="font-medium mb-2 text-muted-foreground">Optional Fields</h5>
                          <ul className="text-sm space-y-1 text-muted-foreground">
                            <li>• Reason</li>
                          </ul>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="troubleshooting" className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">Common Issues & Solutions</h3>
                
                <div className="space-y-4">
                  <Card className="shadow-soft border-0">
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-warning" />
                        Validation Errors
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <h5 className="font-medium">Invalid email format</h5>
                        <p className="text-sm text-muted-foreground">
                          Ensure email addresses follow the format: username@domain.com
                        </p>
                      </div>
                      <div>
                        <h5 className="font-medium">Invalid date format</h5>
                        <p className="text-sm text-muted-foreground">
                          Use YYYY-MM-DD format. Example: 2024-03-15 instead of 15/03/2024
                        </p>
                      </div>
                      <div>
                        <h5 className="font-medium">Missing required fields</h5>
                        <p className="text-sm text-muted-foreground">
                          Check that all required fields have values and are not empty
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="shadow-soft border-0">
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <HelpCircle className="h-4 w-4 text-primary" />
                        File Upload Issues
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <h5 className="font-medium">File too large</h5>
                        <p className="text-sm text-muted-foreground">
                          Split large files into smaller chunks of 10MB or less
                        </p>
                      </div>
                      <div>
                        <h5 className="font-medium">Wrong file format</h5>
                        <p className="text-sm text-muted-foreground">
                          Save your file as CSV format, not Excel (.xlsx) or other formats
                        </p>
                      </div>
                      <div>
                        <h5 className="font-medium">Upload fails</h5>
                        <p className="text-sm text-muted-foreground">
                          Check your internet connection and try again. Clear browser cache if needed.
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  <Alert>
                    <HelpCircle className="h-4 w-4" />
                    <AlertDescription>
                      Still having issues? Contact your system administrator for additional support.
                    </AlertDescription>
                  </Alert>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}