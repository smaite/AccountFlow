import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/layout/header";
import DocumentUpload from "@/components/ai/document-upload";
import DocumentReviewModal from "@/components/ai/document-review-modal";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Receipt, File, Eye, CheckCircle, Clock, AlertCircle } from "lucide-react";
import type { AiDocument } from "@shared/schema";

export default function AiDocuments() {
  const [selectedDocument, setSelectedDocument] = useState<AiDocument | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const { data: documents = [], isLoading } = useQuery<AiDocument[]>({
    queryKey: ["/api/ai-documents"],
  });

  const handleDocumentReview = (document: AiDocument) => {
    setSelectedDocument(document);
    setModalOpen(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'failed':
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
      case 'approved':
        return <CheckCircle className="w-4 h-4" />;
      case 'processing':
        return <Clock className="w-4 h-4" />;
      case 'failed':
      case 'rejected':
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  const getDocumentIcon = (documentType: string) => {
    switch (documentType) {
      case 'invoice':
        return <File className="w-6 h-6 text-blue-600" />;
      case 'receipt':
        return <Receipt className="w-6 h-6 text-green-600" />;
      default:
        return <FileText className="w-6 h-6 text-gray-600" />;
    }
  };

  const formatCurrency = (amount: string | null) => {
    if (!amount) return "N/A";
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(parseFloat(amount));
  };

  return (
    <>
      <Header title="AI Document Processing" />
      
      <main className="flex-1 overflow-y-auto bg-gray-50 p-6">
        {/* Upload Section */}
        <div className="mb-8">
          <DocumentUpload />
        </div>

        {/* Documents List */}
        <Card>
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Processed Documents</h3>
          </div>
          <CardContent className="p-6">
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                <p className="text-gray-600">Loading documents...</p>
              </div>
            ) : documents && documents.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {documents.map((doc: AiDocument) => (
                  <Card key={doc.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center space-x-2">
                          {getDocumentIcon(doc.documentType || 'receipt')}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {doc.filename}
                            </p>
                            <p className="text-xs text-gray-500">
                              {new Date(doc.createdAt!).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <Badge 
                          variant="secondary" 
                          className={`${getStatusColor(doc.status || 'processing')} flex items-center space-x-1`}
                        >
                          {getStatusIcon(doc.status || 'processing')}
                          <span className="capitalize ml-1">{doc.status || 'Processing'}</span>
                        </Badge>
                      </div>

                      {doc.amount || doc.vendor ? (
                        <div className="space-y-2 mb-4">
                          {doc.amount && (
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-500">Amount:</span>
                              <span className="font-medium">{formatCurrency(doc.amount)}</span>
                            </div>
                          )}
                          {doc.vendor && (
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-500">Vendor:</span>
                              <span className="font-medium truncate">{doc.vendor}</span>
                            </div>
                          )}
                          {doc.category && (
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-500">Category:</span>
                              <span className="font-medium">{doc.category}</span>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-center py-4">
                          <p className="text-sm text-gray-500">
                            {doc.status === 'processing' ? 'Processing...' : 'No data extracted'}
                          </p>
                        </div>
                      )}

                      <div className="flex space-x-2">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="flex-1"
                          onClick={() => handleDocumentReview(doc)}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          Review
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No documents yet</h3>
                <p className="text-gray-500 mb-6">
                  Upload your first receipt or invoice to get started with AI processing
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      <DocumentReviewModal 
        document={selectedDocument}
        open={modalOpen}
        onOpenChange={setModalOpen}
      />
    </>
  );
}
