import { supabase } from "@/integrations/supabase/client";

export interface ExtractedPayslipData {
  employeeName?: string;
  period?: string;
  payDate?: string;
  grossPay?: number;
  netPay?: number;
  tax?: number;
  ni?: number;
  pension?: number;
  otherDeductions?: number;
  confidence: number;
}

export class PayslipExtractor {
  static async extractFromPDF(file: File): Promise<ExtractedPayslipData> {
    try {
      // Read file as text using PDF.js or similar approach
      const text = await this.readPDFText(file);
      return this.parsePayslipText(text);
    } catch (error) {
      console.error('Error extracting payslip data:', error);
      return { confidence: 0 };
    }
  }

  private static async readPDFText(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const arrayBuffer = e.target?.result as ArrayBuffer;
          // In a real implementation, you would use PDF.js here
          // For now, we'll simulate text extraction
          const text = await this.simulateTextExtraction(arrayBuffer);
          resolve(text);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsArrayBuffer(file);
    });
  }

  private static async simulateTextExtraction(arrayBuffer: ArrayBuffer): Promise<string> {
    // This is a placeholder - in production you'd use PDF.js
    // For demo purposes, return empty string to show the form fields
    return "";
  }

  private static parsePayslipText(text: string): ExtractedPayslipData {
    const data: ExtractedPayslipData = { confidence: 0.0 };
    
    if (!text.trim()) {
      return data;
    }

    let matchCount = 0;
    const totalChecks = 8;

    // Extract employee name
    const nameMatch = text.match(/(?:name|employee):\s*([A-Za-z\s]+)/i);
    if (nameMatch) {
      data.employeeName = nameMatch[1].trim();
      matchCount++;
    }

    // Extract period
    const periodMatch = text.match(/(?:period|pay\s*period):\s*([A-Za-z0-9\s\/\-]+)/i);
    if (periodMatch) {
      data.period = periodMatch[1].trim();
      matchCount++;
    }

    // Extract pay date
    const dateMatch = text.match(/(?:pay\s*date|date\s*paid):\s*(\d{1,2}\/\d{1,2}\/\d{4}|\d{4}-\d{2}-\d{2})/i);
    if (dateMatch) {
      data.payDate = dateMatch[1];
      matchCount++;
    }

    // Extract monetary amounts
    const grossMatch = text.match(/(?:gross\s*pay|gross\s*salary):\s*£?(\d+(?:,\d{3})*(?:\.\d{2})?)/i);
    if (grossMatch) {
      data.grossPay = parseFloat(grossMatch[1].replace(/,/g, ''));
      matchCount++;
    }

    const netMatch = text.match(/(?:net\s*pay|take\s*home):\s*£?(\d+(?:,\d{3})*(?:\.\d{2})?)/i);
    if (netMatch) {
      data.netPay = parseFloat(netMatch[1].replace(/,/g, ''));
      matchCount++;
    }

    const taxMatch = text.match(/(?:tax|paye|income\s*tax):\s*£?(\d+(?:,\d{3})*(?:\.\d{2})?)/i);
    if (taxMatch) {
      data.tax = parseFloat(taxMatch[1].replace(/,/g, ''));
      matchCount++;
    }

    const niMatch = text.match(/(?:national\s*insurance|ni|n\.i\.):\s*£?(\d+(?:,\d{3})*(?:\.\d{2})?)/i);
    if (niMatch) {
      data.ni = parseFloat(niMatch[1].replace(/,/g, ''));
      matchCount++;
    }

    const pensionMatch = text.match(/(?:pension|retirement):\s*£?(\d+(?:,\d{3})*(?:\.\d{2})?)/i);
    if (pensionMatch) {
      data.pension = parseFloat(pensionMatch[1].replace(/,/g, ''));
      matchCount++;
    }

    // Calculate confidence score
    data.confidence = matchCount / totalChecks;

    return data;
  }

  static async uploadPayslipFile(file: File, employeeId: string): Promise<string | null> {
    try {
      const fileName = `${Date.now()}-${file.name}`;
      const filePath = `${employeeId}/${fileName}`;

      const { data, error } = await supabase.storage
        .from('payslips')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error('Error uploading file:', error);
        return null;
      }

      return data.path;
    } catch (error) {
      console.error('Error uploading payslip file:', error);
      return null;
    }
  }

  static async getSignedUrl(filePath: string): Promise<string | null> {
    try {
      const { data, error } = await supabase.storage
        .from('payslips')
        .createSignedUrl(filePath, 3600);

      if (error) {
        console.error('Error creating signed URL:', error);
        return null;
      }

      return data.signedUrl;
    } catch (error) {
      console.error('Error getting signed URL:', error);
      return null;
    }
  }
}