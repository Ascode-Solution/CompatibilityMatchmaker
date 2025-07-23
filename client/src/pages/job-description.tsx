import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { FileText, Plus } from "lucide-react";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { FileUpload } from "@/components/upload/file-upload";
import { jobDescriptionApi, resumeApi, analysisApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

const jobDescriptionSchema = z.object({
  title: z.string().min(1, "Job title is required"),
  company: z.string().optional(),
  description: z.string().min(50, "Job description must be at least 50 characters"),
  experienceLevel: z.string().optional(),
  education: z.string().optional(),
});

type JobDescriptionForm = z.infer<typeof jobDescriptionSchema>;

export default function JobDescription() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [activeTab, setActiveTab] = useState("text");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<JobDescriptionForm>({
    resolver: zodResolver(jobDescriptionSchema),
    defaultValues: {
      title: "",
      company: "",
      description: "",
      experienceLevel: "",
      education: "",
    },
  });

  const { data: resumes = [] } = useQuery({
    queryKey: ["/api/resumes"],
    queryFn: resumeApi.getAll,
  });

  const createJobDescriptionMutation = useMutation({
    mutationFn: jobDescriptionApi.create,
    onSuccess: async (jobDescription) => {
      queryClient.invalidateQueries({ queryKey: ["/api/job-descriptions"] });
      
      // If there's a resume, automatically start analysis
      if (resumes.length > 0) {
        const latestResume = resumes[resumes.length - 1];
        
        try {
          const analysis = await analysisApi.analyze(latestResume.id, jobDescription.id);
          
          toast({
            title: "Analysis completed!",
            description: `Match score: ${analysis.overallScore}%`,
          });
          
          setLocation(`/analysis-result/${analysis.id}`);
        } catch (error) {
          toast({
            title: "Job description saved",
            description: "Analysis failed. Please try again from the dashboard.",
            variant: "destructive",
          });
          setLocation("/");
        }
      } else {
        toast({
          title: "Job description saved!",
          description: "Upload a resume to start analysis.",
        });
        setLocation("/upload-resume");
      }
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save job description. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: JobDescriptionForm) => {
    createJobDescriptionMutation.mutate(data);
  };

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    // TODO: Implement file parsing for job descriptions
    toast({
      title: "File upload",
      description: "File upload for job descriptions coming soon. Please use text input for now.",
    });
  };

  const wordCount = form.watch("description")?.split(/\s+/).filter(word => word.length > 0).length || 0;

  return (
    <div className="min-h-screen bg-neutral-light">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <main className="lg:ml-64 min-h-screen">
        <Header 
          title="Job Description" 
          subtitle="Add a job description to analyze compatibility"
          onMenuClick={() => setSidebarOpen(true)}
        />

        <section className="p-6">
          <div className="max-w-3xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle className="text-xl font-semibold text-neutral-dark">Job Description</CardTitle>
                <p className="text-gray-600">
                  Enter the job description details to analyze compatibility with your resume
                </p>
              </CardHeader>
              <CardContent>
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="text">Manual Entry</TabsTrigger>
                    <TabsTrigger value="file">Upload File</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="text" className="mt-6">
                    <Form {...form}>
                      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="title"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Job Title *</FormLabel>
                                <FormControl>
                                  <Input placeholder="e.g. Senior Frontend Developer" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name="company"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Company</FormLabel>
                                <FormControl>
                                  <Input placeholder="e.g. TechCorp Inc." {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="experienceLevel"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Experience Level</FormLabel>
                                <FormControl>
                                  <Input placeholder="e.g. 3-5 years" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name="education"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Education</FormLabel>
                                <FormControl>
                                  <Input placeholder="e.g. Bachelor's in Computer Science" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <FormField
                          control={form.control}
                          name="description"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Job Description *</FormLabel>
                              <FormControl>
                                <Textarea
                                  placeholder="Paste the complete job description here..."
                                  className="min-h-[200px] resize-none"
                                  {...field}
                                />
                              </FormControl>
                              <div className="flex justify-between items-center mt-2">
                                <FormMessage />
                                <span className="text-sm text-gray-500">{wordCount} words</span>
                              </div>
                            </FormItem>
                          )}
                        />

                        <div className="flex justify-end space-x-4">
                          <Button type="button" variant="outline" onClick={() => setLocation("/")}>
                            Cancel
                          </Button>
                          <Button 
                            type="submit" 
                            disabled={createJobDescriptionMutation.isPending}
                            className="bg-primary hover:bg-primary-dark"
                          >
                            {createJobDescriptionMutation.isPending ? (
                              "Processing..."
                            ) : (
                              <>
                                <Plus className="mr-2 h-4 w-4" />
                                Save & Analyze
                              </>
                            )}
                          </Button>
                        </div>
                      </form>
                    </Form>
                  </TabsContent>
                  
                  <TabsContent value="file" className="mt-6">
                    <div className="space-y-6">
                      <FileUpload
                        onFileSelect={handleFileSelect}
                        onFileRemove={() => setSelectedFile(null)}
                        selectedFile={selectedFile}
                        accept=".pdf,.docx,.txt"
                        maxSize={10}
                      />
                      
                      <div className="text-center text-sm text-gray-500">
                        <p>File upload for job descriptions is coming soon.</p>
                        <p>Please use the "Manual Entry" tab for now.</p>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            {/* Example Card */}
            <Card className="mt-6 bg-gradient-to-br from-primary/5 to-secondary/5 border-primary/20">
              <CardContent className="p-6">
                <h3 className="font-semibold text-neutral-dark mb-3">Tips for better matching</h3>
                <ul className="text-sm text-gray-600 space-y-2">
                  <li>• Include specific technical skills and tools required</li>
                  <li>• Mention years of experience needed</li>
                  <li>• List educational requirements</li>
                  <li>• Include both required and preferred qualifications</li>
                  <li>• Be specific about technologies and frameworks</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>
    </div>
  );
}
