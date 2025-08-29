import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, CheckCircle, Loader2 } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function DocumentUpload() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingFiles, setUploadingFiles] = useState<string[]>([]);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('document', file);
      
      const response = await apiRequest('POST', '/api/ai-documents/upload', formData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/ai-documents'] });
      toast({
        title: "Upload successful",
        description: "Document uploaded and processing with AI",
      });
    },
    onError: () => {
      toast({
        title: "Upload failed",
        description: "Failed to upload document",
        variant: "destructive",
      });
    }
  });

  const handleFileUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    for (const file of Array.from(files)) {
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please select a file smaller than 10MB",
          variant: "destructive",
        });
        continue;
      }

      setUploadingFiles(prev => [...prev, file.name]);
      
      try {
        await uploadMutation.mutateAsync(file);
      } finally {
        setUploadingFiles(prev => prev.filter(name => name !== file.name));
      }
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Upload className="w-5 h-5 text-primary mr-2" />
          AI Document Processing
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div 
          className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-primary transition-colors ai-upload-border cursor-pointer"
          onClick={handleFileUpload}
        >
          <div className="mx-auto w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
            <Upload className="text-primary w-6 h-6" />
          </div>
          <p className="text-sm text-gray-600 mb-2">Upload receipts or invoices</p>
          <p className="text-xs text-gray-400 mb-4">AI will extract and categorize data automatically</p>
          <Button onClick={handleFileUpload} disabled={uploadMutation.isPending}>
            Choose Files
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            multiple
            accept="image/*,.pdf"
            onChange={handleFileChange}
          />
        </div>
        
        {/* Processing Status */}
        {uploadingFiles.length > 0 && (
          <div className="mt-6 space-y-3">
            {uploadingFiles.map((filename) => (
              <div key={filename} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200 processing-bg">
                <div className="flex items-center">
                  <Loader2 className="w-4 h-4 text-blue-500 mr-3 animate-spin" />
                  <span className="text-sm text-blue-700">{filename}</span>
                </div>
                <span className="text-xs text-blue-600">Processing...</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
