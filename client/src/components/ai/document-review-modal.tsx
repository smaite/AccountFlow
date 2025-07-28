import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { AiDocument } from "@shared/schema";

interface DocumentReviewModalProps {
  document: AiDocument | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function DocumentReviewModal({ document, open, onOpenChange }: DocumentReviewModalProps) {
  const [formData, setFormData] = useState({
    amount: "",
    vendor: "",
    category: "",
    description: "",
    documentDate: "",
  });

  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Update form data when document changes
  useState(() => {
    if (document && document.extractedData) {
      try {
        const extracted = JSON.parse(document.extractedData);
        setFormData({
          amount: document.amount || extracted.amount?.toString() || "",
          vendor: document.vendor || extracted.vendor || "",
          category: document.category || extracted.category || "",
          description: document.description || extracted.description || "",
          documentDate: document.documentDate 
            ? new Date(document.documentDate).toISOString().split('T')[0]
            : extracted.date || "",
        });
      } catch (e) {
        console.error("Failed to parse extracted data:", e);
      }
    }
  });

  const updateMutation = useMutation({
    mutationFn: async (data: { status: string; [key: string]: any }) => {
      if (!document) return;
      const response = await apiRequest('PATCH', `/api/ai-documents/${document.id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/ai-documents'] });
      onOpenChange(false);
      toast({
        title: "Document updated",
        description: "Document has been processed successfully",
      });
    },
    onError: () => {
      toast({
        title: "Update failed",
        description: "Failed to update document",
        variant: "destructive",
      });
    }
  });

  const handleApprove = () => {
    updateMutation.mutate({
      status: "approved",
      amount: formData.amount,
      vendor: formData.vendor,
      category: formData.category,
      description: formData.description,
      documentDate: formData.documentDate ? new Date(formData.documentDate) : undefined,
    });
  };

  const handleReject = () => {
    updateMutation.mutate({
      status: "rejected"
    });
  };

  if (!document) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Review AI Extracted Data</DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Document Preview */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">Document Preview</h4>
            <div className="border rounded-lg p-4 bg-gray-50 h-64 flex items-center justify-center">
              {document.originalData && document.originalData.startsWith('data:image') ? (
                <img 
                  src={document.originalData} 
                  alt="Uploaded document" 
                  className="max-w-full max-h-full object-contain rounded"
                />
              ) : (
                <div className="text-center">
                  <div className="w-12 h-12 bg-gray-300 rounded mx-auto mb-2 flex items-center justify-center">
                    <span className="text-gray-500">📄</span>
                  </div>
                  <p className="text-gray-500 text-sm">{document.filename}</p>
                </div>
              )}
            </div>
          </div>
          
          {/* Extracted Data Form */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">Extracted Information</h4>
            <div className="space-y-4">
              <div>
                <Label htmlFor="amount">Amount</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                />
              </div>
              
              <div>
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.documentDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, documentDate: e.target.value }))}
                />
              </div>
              
              <div>
                <Label htmlFor="vendor">Vendor</Label>
                <Input
                  id="vendor"
                  value={formData.vendor}
                  onChange={(e) => setFormData(prev => ({ ...prev, vendor: e.target.value }))}
                />
              </div>
              
              <div>
                <Label htmlFor="category">Category</Label>
                <Select value={formData.category} onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Office Supplies">Office Supplies</SelectItem>
                    <SelectItem value="Travel">Travel</SelectItem>
                    <SelectItem value="Meals & Entertainment">Meals & Entertainment</SelectItem>
                    <SelectItem value="Equipment">Equipment</SelectItem>
                    <SelectItem value="Software">Software</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                />
              </div>
            </div>
          </div>
        </div>
        
        <DialogFooter className="flex space-x-3">
          <Button 
            onClick={handleApprove} 
            disabled={updateMutation.isPending}
            className="flex-1"
          >
            {updateMutation.isPending ? "Processing..." : "Approve & Save"}
          </Button>
          <Button 
            variant="outline"
            onClick={handleReject} 
            disabled={updateMutation.isPending}
            className="flex-1"
          >
            Reject
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
