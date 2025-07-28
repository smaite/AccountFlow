import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Header from "@/components/layout/header";
import RevenueChart from "@/components/charts/revenue-chart";
import DocumentUpload from "@/components/ai/document-upload";
import DocumentReviewModal from "@/components/ai/document-review-modal";
import { 
  DollarSign, 
  CreditCard, 
  TrendingUp, 
  FileText,
  File,
  Plus,
  Box,
  Truck,
  BarChart3,
  Download,
  Receipt,
  CheckCircle,
  Clock,
  ArrowUp,
  ArrowDown
} from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";
import type { AiDocument } from "@shared/schema";

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const [selectedDocument, setSelectedDocument] = useState<AiDocument | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/dashboard/stats"],
  });

  const { data: recentTransactions, isLoading: transactionsLoading } = useQuery({
    queryKey: ["/api/dashboard/recent-transactions"],
    queryFn: async () => {
      const response = await fetch("/api/dashboard/recent-transactions?limit=5");
      return response.json();
    }
  });

  const { data: aiDocuments, isLoading: documentsLoading } = useQuery({
    queryKey: ["/api/ai-documents"],
  });

  const handleDocumentReview = (document: AiDocument) => {
    setSelectedDocument(document);
    setModalOpen(true);
  };

  const handleUploadClick = () => {
    setLocation("/ai-documents");
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
      case 'approved':
        return 'bg-green-50 border-green-200 text-green-700';
      case 'processing':
        return 'bg-blue-50 border-blue-200 text-blue-700';
      case 'failed':
      case 'rejected':
        return 'bg-red-50 border-red-200 text-red-700';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-700';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
      case 'approved':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'processing':
        return <Clock className="w-4 h-4 text-blue-600" />;
      default:
        return <FileText className="w-4 h-4 text-gray-600" />;
    }
  };

  return (
    <>
      <Header title="Dashboard" onUploadClick={handleUploadClick} />
      
      <main className="flex-1 overflow-y-auto bg-gray-50 p-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="stats-card">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 revenue-icon-bg rounded-lg flex items-center justify-center">
                    <DollarSign className="text-green-600 w-5 h-5" />
                  </div>
                </div>
                <div className="ml-4 flex-1">
                  <div>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Revenue</dt>
                    <dd className="text-2xl font-bold text-gray-900">
                      {statsLoading ? "Loading..." : formatCurrency(stats?.totalRevenue || 0)}
                    </dd>
                  </div>
                </div>
                <div className="flex items-center text-sm text-green-600">
                  <ArrowUp className="w-4 h-4 mr-1" />
                  <span>12.5%</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="stats-card">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 expense-icon-bg rounded-lg flex items-center justify-center">
                    <CreditCard className="text-red-600 w-5 h-5" />
                  </div>
                </div>
                <div className="ml-4 flex-1">
                  <div>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Expenses</dt>
                    <dd className="text-2xl font-bold text-gray-900">
                      {statsLoading ? "Loading..." : formatCurrency(stats?.totalExpenses || 0)}
                    </dd>
                  </div>
                </div>
                <div className="flex items-center text-sm text-red-600">
                  <ArrowUp className="w-4 h-4 mr-1" />
                  <span>3.2%</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="stats-card">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 profit-icon-bg rounded-lg flex items-center justify-center">
                    <TrendingUp className="text-blue-600 w-5 h-5" />
                  </div>
                </div>
                <div className="ml-4 flex-1">
                  <div>
                    <dt className="text-sm font-medium text-gray-500 truncate">Net Profit</dt>
                    <dd className="text-2xl font-bold text-gray-900">
                      {statsLoading ? "Loading..." : formatCurrency(stats?.netProfit || 0)}
                    </dd>
                  </div>
                </div>
                <div className="flex items-center text-sm text-green-600">
                  <ArrowUp className="w-4 h-4 mr-1" />
                  <span>18.7%</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="stats-card">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 invoice-icon-bg rounded-lg flex items-center justify-center">
                    <File className="text-amber-600 w-5 h-5" />
                  </div>
                </div>
                <div className="ml-4 flex-1">
                  <div>
                    <dt className="text-sm font-medium text-gray-500 truncate">Pending Invoices</dt>
                    <dd className="text-2xl font-bold text-gray-900">
                      {statsLoading ? "Loading..." : stats?.pendingInvoices || 0}
                    </dd>
                  </div>
                </div>
                <div className="flex items-center text-sm text-amber-600">
                  <Clock className="w-4 h-4 mr-1" />
                  <span>$12,450</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* AI Document Processing Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* AI Upload Widget */}
          <div className="lg:col-span-1">
            <DocumentUpload />
          </div>

          {/* Recent AI Processed Documents */}
          <div className="lg:col-span-2">
            <Card>
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Recent AI Processed Documents</h3>
              </div>
              <CardContent className="p-6">
                {documentsLoading ? (
                  <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                    <p className="text-gray-600">Loading documents...</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {aiDocuments && aiDocuments.length > 0 ? (
                      aiDocuments.slice(0, 3).map((doc: AiDocument) => (
                        <div key={doc.id} className={`flex items-center justify-between p-4 rounded-lg border ${getStatusColor(doc.status || 'processing')}`}>
                          <div className="flex items-center space-x-4">
                            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
                              {getStatusIcon(doc.status || 'processing')}
                            </div>
                            <div>
                              <p className="text-sm font-medium">{doc.filename}</p>
                              <p className="text-xs opacity-75">
                                {doc.amount && doc.vendor ? 
                                  `Amount: ${formatCurrency(parseFloat(doc.amount))} | ${doc.vendor}` :
                                  'Processing...'
                                }
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-3">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize">
                              {doc.status || 'Processing'}
                            </span>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleDocumentReview(doc)}
                            >
                              Review
                            </Button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8">
                        <Receipt className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600">No documents processed yet</p>
                        <p className="text-sm text-gray-400">Upload your first document to get started</p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Charts and Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Revenue Chart */}
          <RevenueChart />

          {/* Recent Transactions */}
          <Card>
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Recent Transactions</h3>
              <Button variant="ghost" size="sm" onClick={() => setLocation("/reports")}>
                View All
              </Button>
            </div>
            <CardContent className="p-6">
              {transactionsLoading ? (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                  <p className="text-gray-600">Loading transactions...</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentTransactions && recentTransactions.length > 0 ? (
                    recentTransactions.map((transaction: any) => (
                      <div key={transaction.id} className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            transaction.type === 'income' ? 'bg-green-100' : 'bg-red-100'
                          }`}>
                            {transaction.type === 'income' ? (
                              <ArrowDown className="w-4 h-4 text-green-600" />
                            ) : (
                              <ArrowUp className="w-4 h-4 text-red-600" />
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{transaction.description}</p>
                            <p className="text-xs text-gray-500">
                              {new Date(transaction.createdAt).toRelativeTimeString?.() || 
                               new Date(transaction.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <span className={`text-sm font-semibold ${
                          transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {transaction.amount > 0 ? '+' : ''}{formatCurrency(transaction.amount)}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">No transactions yet</p>
                      <p className="text-sm text-gray-400">Create your first sale or purchase to see transactions</p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Quick Actions</h3>
          </div>
          <CardContent className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              <Button 
                variant="ghost" 
                className="flex flex-col items-center p-4 h-auto quick-action-hover"
                onClick={() => setLocation("/sales")}
              >
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-3">
                  <File className="text-blue-600 w-6 h-6" />
                </div>
                <span className="text-sm font-medium text-gray-700">Create Invoice</span>
              </Button>

              <Button 
                variant="ghost" 
                className="flex flex-col items-center p-4 h-auto quick-action-hover"
                onClick={() => setLocation("/purchases")}
              >
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-3">
                  <Plus className="text-red-600 w-6 h-6" />
                </div>
                <span className="text-sm font-medium text-gray-700">Add Expense</span>
              </Button>

              <Button 
                variant="ghost" 
                className="flex flex-col items-center p-4 h-auto quick-action-hover"
                onClick={() => setLocation("/products")}
              >
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-3">
                  <Box className="text-green-600 w-6 h-6" />
                </div>
                <span className="text-sm font-medium text-gray-700">Add Product</span>
              </Button>

              <Button 
                variant="ghost" 
                className="flex flex-col items-center p-4 h-auto quick-action-hover"
                onClick={() => setLocation("/suppliers")}
              >
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-3">
                  <Truck className="text-purple-600 w-6 h-6" />
                </div>
                <span className="text-sm font-medium text-gray-700">Add Supplier</span>
              </Button>

              <Button 
                variant="ghost" 
                className="flex flex-col items-center p-4 h-auto quick-action-hover"
                onClick={() => setLocation("/reports")}
              >
                <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-3">
                  <BarChart3 className="text-indigo-600 w-6 h-6" />
                </div>
                <span className="text-sm font-medium text-gray-700">View Reports</span>
              </Button>

              <Button 
                variant="ghost" 
                className="flex flex-col items-center p-4 h-auto quick-action-hover"
                onClick={() => setLocation("/reports")}
              >
                <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mb-3">
                  <Download className="text-gray-600 w-6 h-6" />
                </div>
                <span className="text-sm font-medium text-gray-700">Export Data</span>
              </Button>
            </div>
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
