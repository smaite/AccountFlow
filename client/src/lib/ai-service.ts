import { apiRequest } from "@/lib/queryClient";

export interface DocumentAnalysisResult {
  amount?: number;
  vendor?: string;
  category?: string;
  description?: string;
  date?: string;
  documentType?: 'receipt' | 'invoice' | 'expense';
}

export class AiService {
  /**
   * Upload and process a document with AI
   */
  static async uploadDocument(file: File): Promise<any> {
    const formData = new FormData();
    formData.append('document', file);
    
    const response = await apiRequest('POST', '/api/ai-documents/upload', formData);
    return response.json();
  }

  /**
   * Get the status of a document processing job
   */
  static async getDocumentStatus(documentId: string): Promise<any> {
    const response = await apiRequest('GET', `/api/ai-documents/${documentId}`);
    return response.json();
  }

  /**
   * Update document with corrected information
   */
  static async updateDocument(documentId: string, data: Partial<DocumentAnalysisResult>): Promise<any> {
    const response = await apiRequest('PATCH', `/api/ai-documents/${documentId}`, data);
    return response.json();
  }

  /**
   * Approve a processed document
   */
  static async approveDocument(documentId: string, finalData: DocumentAnalysisResult): Promise<any> {
    const response = await apiRequest('PATCH', `/api/ai-documents/${documentId}`, {
      ...finalData,
      status: 'approved'
    });
    return response.json();
  }

  /**
   * Reject a processed document
   */
  static async rejectDocument(documentId: string, reason?: string): Promise<any> {
    const response = await apiRequest('PATCH', `/api/ai-documents/${documentId}`, {
      status: 'rejected',
      ...(reason && { rejectionReason: reason })
    });
    return response.json();
  }

  /**
   * Parse extracted data from AI response
   */
  static parseExtractedData(extractedDataString: string): DocumentAnalysisResult | null {
    try {
      return JSON.parse(extractedDataString);
    } catch (error) {
      console.error('Failed to parse extracted data:', error);
      return null;
    }
  }

  /**
   * Validate extracted data
   */
  static validateExtractedData(data: DocumentAnalysisResult): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (data.amount !== undefined && (typeof data.amount !== 'number' || data.amount < 0)) {
      errors.push('Amount must be a positive number');
    }

    if (data.vendor && typeof data.vendor !== 'string') {
      errors.push('Vendor must be a string');
    }

    if (data.date && !this.isValidDate(data.date)) {
      errors.push('Date must be in valid format (YYYY-MM-DD)');
    }

    if (data.category && !this.isValidCategory(data.category)) {
      errors.push('Category must be one of: Office Supplies, Travel, Meals & Entertainment, Equipment, Software, Other');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Check if date string is valid
   */
  private static isValidDate(dateString: string): boolean {
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date.getTime());
  }

  /**
   * Check if category is valid
   */
  private static isValidCategory(category: string): boolean {
    const validCategories = [
      'Office Supplies',
      'Travel', 
      'Meals & Entertainment',
      'Equipment',
      'Software',
      'Other'
    ];
    return validCategories.includes(category);
  }

  /**
   * Format currency for display
   */
  static formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }

  /**
   * Get document type icon
   */
  static getDocumentTypeIcon(documentType?: string): string {
    switch (documentType) {
      case 'invoice':
        return '📄';
      case 'receipt':
        return '🧾';
      default:
        return '📋';
    }
  }

  /**
   * Get processing status display info
   */
  static getStatusDisplayInfo(status: string): { label: string; color: string; icon: string } {
    switch (status) {
      case 'processing':
        return {
          label: 'Processing',
          color: 'bg-blue-100 text-blue-800',
          icon: '⏳'
        };
      case 'completed':
        return {
          label: 'Completed',
          color: 'bg-green-100 text-green-800', 
          icon: '✅'
        };
      case 'approved':
        return {
          label: 'Approved',
          color: 'bg-green-100 text-green-800',
          icon: '✅'
        };
      case 'rejected':
        return {
          label: 'Rejected',
          color: 'bg-red-100 text-red-800',
          icon: '❌'
        };
      case 'failed':
        return {
          label: 'Failed',
          color: 'bg-red-100 text-red-800',
          icon: '⚠️'
        };
      default:
        return {
          label: 'Unknown',
          color: 'bg-gray-100 text-gray-800',
          icon: '❓'
        };
    }
  }
}

export default AiService;
