import Header from "@/components/layout/header";
import ImageAnalyzer from "@/components/image-analysis/ImageAnalyzer";

export default function ImageAnalysisPage() {
  return (
    <>
      <Header title="Image Analysis" />
      
      <main className="flex-1 overflow-y-auto bg-gray-50 p-6">
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900">AI Image Analysis</h2>
          <p className="text-sm text-gray-600">Upload any image to extract information using AI</p>
        </div>
        
        <ImageAnalyzer />
      </main>
    </>
  );
} 