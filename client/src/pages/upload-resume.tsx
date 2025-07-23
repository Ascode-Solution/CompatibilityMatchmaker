import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { FileUpload } from "@/components/upload/file-upload";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { resumeApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

export default function UploadResume() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const uploadMutation = useMutation({
    mutationFn: resumeApi.upload,
    onSuccess: (resume) => {
      queryClient.invalidateQueries({ queryKey: ["/api/resumes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      
      toast({
        title: "Resume uploaded successfully!",
        description: `${resume.filename} has been processed and analyzed.`,
      });
      
      setSelectedFile(null);
      setLocation("/job-description");
    },
    onError: (error) => {
      toast({
        title: "Upload failed",
        description: "Failed to upload resume. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
  };

  const handleFileRemove = () => {
    setSelectedFile(null);
  };

  const handleUpload = () => {
    if (selectedFile) {
      // Simulate upload progress
      setUploadProgress(0);
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 100);

      uploadMutation.mutate(selectedFile, {
        onSettled: () => {
          clearInterval(progressInterval);
          setUploadProgress(100);
        },
      });
    }
  };

  return (
    <div className="min-h-screen bg-neutral-light">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <main className="lg:ml-64 min-h-screen">
        <Header 
          title="Upload Resume" 
          subtitle="Upload your resume to analyze compatibility with job descriptions"
          onMenuClick={() => setSidebarOpen(true)}
        />

        <section className="p-6">
          <div className="max-w-2xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle className="text-xl font-semibold text-neutral-dark">Resume Upload</CardTitle>
                <p className="text-gray-600">
                  Upload your resume in PDF, DOCX, or TXT format. Our AI will extract and analyze 
                  your skills, experience, and education.
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <FileUpload
                    onFileSelect={handleFileSelect}
                    onFileRemove={handleFileRemove}
                    selectedFile={selectedFile}
                    isUploading={uploadMutation.isPending}
                    uploadProgress={uploadProgress}
                    accept=".pdf,.docx,.txt"
                    maxSize={10}
                  />

                  {selectedFile && !uploadMutation.isPending && (
                    <div className="flex justify-end space-x-4">
                      <Button variant="outline" onClick={handleFileRemove}>
                        Cancel
                      </Button>
                      <Button onClick={handleUpload} className="bg-primary hover:bg-primary-dark">
                        Upload Resume
                      </Button>
                    </div>
                  )}

                  {uploadMutation.isPending && (
                    <div className="text-center py-4">
                      <p className="text-sm text-gray-600">
                        Processing your resume... This may take a few moments.
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Tips Card */}
            <Card className="mt-6 bg-gradient-to-br from-primary/5 to-secondary/5 border-primary/20">
              <CardContent className="p-6">
                <h3 className="font-semibold text-neutral-dark mb-3">Tips for better analysis</h3>
                <ul className="text-sm text-gray-600 space-y-2">
                  <li>• Ensure your resume includes a clear skills section</li>
                  <li>• List your work experience with specific technologies and tools</li>
                  <li>• Include education details and relevant certifications</li>
                  <li>• Use standard section headings like "Experience", "Skills", "Education"</li>
                  <li>• Avoid overly creative formatting that might affect text extraction</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>
    </div>
  );
}
