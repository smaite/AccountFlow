import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ImageAnalysisResult {
  description: string;
  tags: string[];
  objects: string[];
  text: string;
  colors: Array<{name: string, hex: string}>;
  confidence: number;
}

interface ImageAnalyzerProps {
  onAnalysisComplete?: (result: ImageAnalysisResult) => void;
}

export default function ImageAnalyzer({ onAnalysisComplete }: ImageAnalyzerProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<ImageAnalysisResult | null>(null);
  const [activeTab, setActiveTab] = useState<string>("description");
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      
      // Create a preview URL for the selected image
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(selectedFile);
      
      // Reset previous analysis
      setAnalysisResult(null);
    }
  };

  const handleAnalyze = async () => {
    if (!file) return;
    
    setIsAnalyzing(true);
    
    try {
      const formData = new FormData();
      formData.append('image', file);
      
      const response = await fetch('/api/image-analysis', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error('Failed to analyze image');
      }
      
      const result = await response.json();
      setAnalysisResult(result);
      
      if (onAnalysisComplete) {
        onAnalysisComplete(result);
      }
      
      toast({
        title: "Analysis Complete",
        description: "Image has been successfully analyzed",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to analyze image",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const resetForm = () => {
    setFile(null);
    setImagePreview(null);
    setAnalysisResult(null);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>AI Image Analyzer</CardTitle>
        <CardDescription>
          Upload any image to extract information using AI
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="image">Upload Image</Label>
              <Input
                id="image"
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                disabled={isAnalyzing}
              />
            </div>
            
            {imagePreview && (
              <div className="relative aspect-video rounded-md overflow-hidden border">
                <img 
                  src={imagePreview} 
                  alt="Preview" 
                  className="object-contain w-full h-full"
                />
              </div>
            )}
            
            <div className="flex justify-between">
              <Button variant="outline" onClick={resetForm} disabled={isAnalyzing || !file}>
                Reset
              </Button>
              <Button onClick={handleAnalyze} disabled={isAnalyzing || !file}>
                {isAnalyzing ? <><Spinner className="mr-2" /> Analyzing...</> : "Analyze Image"}
              </Button>
            </div>
          </div>
          
          {analysisResult && (
            <div className="border rounded-md overflow-hidden">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid grid-cols-4 w-full">
                  <TabsTrigger value="description">Description</TabsTrigger>
                  <TabsTrigger value="tags">Tags</TabsTrigger>
                  <TabsTrigger value="text">Text</TabsTrigger>
                  <TabsTrigger value="colors">Colors</TabsTrigger>
                </TabsList>
                
                <ScrollArea className="h-[300px] p-4">
                  <TabsContent value="description" className="space-y-4 mt-2">
                    <div>
                      <h4 className="text-sm font-medium mb-2">Description</h4>
                      <p className="text-sm">{analysisResult.description}</p>
                    </div>
                    
                    <div>
                      <h4 className="text-sm font-medium mb-2">Objects Detected</h4>
                      <div className="flex flex-wrap gap-2">
                        {analysisResult.objects.map((object, index) => (
                          <Badge key={index} variant="outline">{object}</Badge>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="text-sm font-medium mb-2">Confidence</h4>
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div 
                          className="bg-blue-600 h-2.5 rounded-full" 
                          style={{ width: `${analysisResult.confidence * 100}%` }}
                        ></div>
                      </div>
                      <p className="text-xs text-right mt-1">{(analysisResult.confidence * 100).toFixed(1)}%</p>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="tags" className="mt-2">
                    <h4 className="text-sm font-medium mb-2">Tags</h4>
                    <div className="flex flex-wrap gap-2">
                      {analysisResult.tags.map((tag, index) => (
                        <Badge key={index}>{tag}</Badge>
                      ))}
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="text" className="mt-2">
                    <h4 className="text-sm font-medium mb-2">Text Detected</h4>
                    {analysisResult.text ? (
                      <div className="p-3 bg-gray-50 rounded border">
                        <p className="text-sm whitespace-pre-wrap">{analysisResult.text}</p>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">No text detected in the image</p>
                    )}
                  </TabsContent>
                  
                  <TabsContent value="colors" className="mt-2">
                    <h4 className="text-sm font-medium mb-2">Color Palette</h4>
                    <div className="grid grid-cols-2 gap-2">
                      {analysisResult.colors.map((color, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <div 
                            className="w-6 h-6 rounded border" 
                            style={{ backgroundColor: color.hex }}
                          ></div>
                          <span className="text-sm">{color.name}</span>
                          <span className="text-xs text-gray-500">{color.hex}</span>
                        </div>
                      ))}
                    </div>
                  </TabsContent>
                </ScrollArea>
              </Tabs>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
} 