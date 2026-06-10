import { useState, useEffect, useRef } from "react";
import { Upload, FileText, Loader2, CheckCircle, AlertCircle, RotateCcw } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { PayslipExtractor, ExtractedPayslipData } from "@/services/payslipExtractor";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Employee {
  id: string;
  first_name: string;
  last_name: string;
  employee_number: string;
}

interface PayslipModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const PayslipModal = ({ isOpen, onClose, onSuccess }: PayslipModalProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState("");
  const [period, setPeriod] = useState("");
  const [payDate, setPayDate] = useState("");
  const [netPay, setNetPay] = useState("");
  const [grossPay, setGrossPay] = useState("");
  const [tax, setTax] = useState("");
  const [ni, setNi] = useState("");
  const [pension, setPension] = useState("");
  const [otherDeductions, setOtherDeductions] = useState("");
  const [status, setStatus] = useState("pending");
  const [extractedData, setExtractedData] = useState<ExtractedPayslipData | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      fetchEmployees();
    }
  }, [isOpen]);

  const fetchEmployees = async () => {
    try {
      const { data, error } = await supabase
        .from('employees')
        .select('id, first_name, last_name, employee_number')
        .eq('status', 'active')
        .order('first_name');

      if (error) {
        console.error('Error fetching employees:', error);
        return;
      }

      setEmployees(data || []);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleFileSelect = async (selectedFile: File) => {
    if (!selectedFile.type.includes('pdf')) {
      toast({
        title: "Invalid file type",
        description: "Please select a PDF file.",
        variant: "destructive",
      });
      return;
    }

    if (selectedFile.size > 10 * 1024 * 1024) { // 10MB limit
      toast({
        title: "File too large",
        description: "Please select a file smaller than 10MB.",
        variant: "destructive",
      });
      return;
    }

    setFile(selectedFile);
    await extractPayslipData(selectedFile);
  };

  const extractPayslipData = async (file: File) => {
    setIsExtracting(true);
    setUploadProgress(30);

    try {
      const data = await PayslipExtractor.extractFromPDF(file);
      setExtractedData(data);
      setUploadProgress(70);

      // Auto-populate form fields
      if (data.period) setPeriod(data.period);
      if (data.payDate) setPayDate(data.payDate);
      if (data.netPay) setNetPay(data.netPay.toString());
      if (data.grossPay) setGrossPay(data.grossPay.toString());
      if (data.tax) setTax(data.tax.toString());
      if (data.ni) setNi(data.ni.toString());
      if (data.pension) setPension(data.pension.toString());
      if (data.otherDeductions) setOtherDeductions(data.otherDeductions.toString());

      // Try to match employee by name
      if (data.employeeName) {
        const matchedEmployee = employees.find(emp => 
          `${emp.first_name} ${emp.last_name}`.toLowerCase().includes(data.employeeName!.toLowerCase())
        );
        if (matchedEmployee) {
          setSelectedEmployeeId(matchedEmployee.id);
        }
      }

      setUploadProgress(100);
      
      toast({
        title: "Extraction complete",
        description: `Extracted data with ${Math.round(data.confidence * 100)}% confidence`,
        variant: data.confidence > 0.6 ? "default" : "destructive",
      });
    } catch (error) {
      console.error('Extraction error:', error);
      toast({
        title: "Extraction failed",
        description: "Unable to extract data from PDF. Please fill the form manually.",
        variant: "destructive",
      });
    } finally {
      setIsExtracting(false);
    }
  };

  const handleReExtract = async () => {
    if (file) {
      await extractPayslipData(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedEmployeeId || !period) {
      toast({
        title: "Missing information",
        description: "Please select an employee and enter a period.",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);

    try {
      let fileUrl: string | null = null;

      // Upload file if present
      if (file) {
        fileUrl = await PayslipExtractor.uploadPayslipFile(file, selectedEmployeeId);
        if (!fileUrl) {
          throw new Error('Failed to upload file');
        }
      }

      // Parse period to extract month and year
      let month = new Date().getMonth() + 1;
      let year = new Date().getFullYear();
      
      if (period) {
        const periodMatch = period.match(/(\d{1,2})\/(\d{4})|(\w+)\s+(\d{4})/i);
        if (periodMatch) {
          if (periodMatch[1] && periodMatch[2]) {
            month = parseInt(periodMatch[1]);
            year = parseInt(periodMatch[2]);
          } else if (periodMatch[3] && periodMatch[4]) {
            const monthNames = ['january', 'february', 'march', 'april', 'may', 'june',
                              'july', 'august', 'september', 'october', 'november', 'december'];
            const monthIndex = monthNames.indexOf(periodMatch[3].toLowerCase());
            if (monthIndex !== -1) {
              month = monthIndex + 1;
              year = parseInt(periodMatch[4]);
            }
          }
        }
      }

      // Create payslip record with required fields
      const payslipData = {
        employee_id: selectedEmployeeId,
        month: month,
        year: year,
        period,
        pay_date: payDate || null,
        net_pay: netPay ? parseFloat(netPay) : 0,
        gross_pay: grossPay ? parseFloat(grossPay) : 0,
        tax: tax ? parseFloat(tax) : 0,
        ni: ni ? parseFloat(ni) : 0,
        pension: pension ? parseFloat(pension) : 0,
        other_deductions: otherDeductions ? parseFloat(otherDeductions) : 0,
        status,
        file_url: fileUrl,
        extracted_data: extractedData ? JSON.stringify(extractedData) : null,
        extraction_confidence: extractedData?.confidence || 0
      };

      const { data, error } = await supabase
        .from('payslips')
        .insert(payslipData)
        .select();

      if (error) {
        toast({
          title: "Database Error",
          description: `Failed to create payslip: ${error.message}`,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Success",
        description: "Payslip uploaded successfully.",
      });

      onSuccess();
      resetForm();
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to upload payslip.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const resetForm = () => {
    setFile(null);
    setSelectedEmployeeId("");
    setPeriod("");
    setPayDate("");
    setNetPay("");
    setGrossPay("");
    setTax("");
    setNi("");
    setPension("");
    setOtherDeductions("");
    setStatus("pending");
    setExtractedData(null);
    setUploadProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const getConfidenceBadge = (confidence: number) => {
    if (confidence >= 0.8) return <Badge className="bg-success text-success-foreground">High Confidence</Badge>;
    if (confidence >= 0.5) return <Badge variant="secondary">Medium Confidence</Badge>;
    return <Badge variant="destructive">Low Confidence</Badge>;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary text-primary-foreground">
              <Upload className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-xl">Upload Payslip</DialogTitle>
              <DialogDescription>
                Upload a payslip PDF and let AI extract the information automatically
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* File Upload Section */}
          <Card className="border-dashed border-2 border-primary/20 hover:border-primary/40 transition-colors">
            <CardContent className="p-6">
              <div className="text-center space-y-4">
                {!file ? (
                  <div className="relative">
                    <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <FileText className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Click to upload or drag and drop</p>
                      <p className="text-xs text-muted-foreground">PDF files only, max 10MB</p>
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf"
                      onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    />
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-center gap-3">
                      <FileText className="h-6 w-6 text-primary" />
                      <span className="font-medium">{file.name}</span>
                      {extractedData && getConfidenceBadge(extractedData.confidence)}
                    </div>
                    
                    {isExtracting ? (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span className="text-sm">Extracting data...</span>
                        </div>
                        <Progress value={uploadProgress} className="w-full" />
                      </div>
                    ) : extractedData ? (
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-success" />
                        <span className="text-sm text-success">Extraction complete</span>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={handleReExtract}
                          className="ml-2"
                        >
                          <RotateCcw className="h-3 w-3 mr-1" />
                          Re-extract
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 text-warning" />
                        <span className="text-sm text-warning">Extraction failed</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Form Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="employee">Employee *</Label>
                <Select value={selectedEmployeeId} onValueChange={setSelectedEmployeeId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select employee" />
                  </SelectTrigger>
                  <SelectContent>
                    {employees.map(emp => (
                      <SelectItem key={emp.id} value={emp.id}>
                        {emp.first_name} {emp.last_name} ({emp.employee_number})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="period">Period *</Label>
                <Select value={period} onValueChange={setPeriod}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select month" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 12 }, (_, i) => {
                      const date = new Date(new Date().getFullYear(), i, 1);
                      const monthYear = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
                      return (
                        <SelectItem key={i} value={monthYear}>
                          {monthYear}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="payDate">Pay Date</Label>
                <Input
                  id="payDate"
                  type="date"
                  value={payDate}
                  onChange={(e) => setPayDate(e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="status">Status</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="processing">Processing</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="grossPay">Gross Pay (£)</Label>
                <Input
                  id="grossPay"
                  type="number"
                  step="0.01"
                  value={grossPay}
                  onChange={(e) => setGrossPay(e.target.value)}
                  placeholder="0.00"
                />
              </div>

              <div>
                <Label htmlFor="netPay">Net Pay (£)</Label>
                <Input
                  id="netPay"
                  type="number"
                  step="0.01"
                  value={netPay}
                  onChange={(e) => setNetPay(e.target.value)}
                  placeholder="0.00"
                />
              </div>

              <div>
                <Label htmlFor="tax">Tax (£)</Label>
                <Input
                  id="tax"
                  type="number"
                  step="0.01"
                  value={tax}
                  onChange={(e) => setTax(e.target.value)}
                  placeholder="0.00"
                />
              </div>

              <div>
                <Label htmlFor="ni">National Insurance (£)</Label>
                <Input
                  id="ni"
                  type="number"
                  step="0.01"
                  value={ni}
                  onChange={(e) => setNi(e.target.value)}
                  placeholder="0.00"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="pension">Pension (£)</Label>
              <Input
                id="pension"
                type="number"
                step="0.01"
                value={pension}
                onChange={(e) => setPension(e.target.value)}
                placeholder="0.00"
              />
            </div>

            <div>
              <Label htmlFor="otherDeductions">Other Deductions (£)</Label>
              <Input
                id="otherDeductions"
                type="number"
                step="0.01"
                value={otherDeductions}
                onChange={(e) => setOtherDeductions(e.target.value)}
                placeholder="0.00"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isUploading || !selectedEmployeeId || !period}
              className="bg-primary hover:bg-primary/90"
            >
              {isUploading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Upload Payslip
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};