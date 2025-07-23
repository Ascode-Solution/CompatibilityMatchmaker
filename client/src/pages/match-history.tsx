import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { Eye, Trash2, Download, Filter, Search, Calendar } from "lucide-react";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { analysisApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow, format } from "date-fns";

export default function MatchHistory() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterScore, setFilterScore] = useState("all");
  const [sortBy, setSortBy] = useState("date");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: analyses = [], isLoading } = useQuery({
    queryKey: ["/api/analysis/history"],
    queryFn: analysisApi.getHistory,
  });

  const deleteMutation = useMutation({
    mutationFn: analysisApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/analysis/history"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({
        title: "Analysis deleted",
        description: "The analysis has been removed from your history.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete analysis. Please try again.",
        variant: "destructive",
      });
    },
  });

  const getMatchBadge = (score: number) => {
    if (score >= 80) return { 
      label: "High Match", 
      className: "bg-success/10 text-success border-success/20" 
    };
    if (score >= 60) return { 
      label: "Medium Match", 
      className: "bg-warning/10 text-warning border-warning/20" 
    };
    return { 
      label: "Low Match", 
      className: "bg-error/10 text-error border-error/20" 
    };
  };

  const handleDelete = (id: number) => {
    deleteMutation.mutate(id);
  };

  const handleExportAll = () => {
    const exportData = analyses.map(analysis => ({
      jobTitle: analysis.jobTitle,
      company: analysis.company,
      analysisDate: format(new Date(analysis.createdAt), 'yyyy-MM-dd'),
      overallScore: analysis.overallScore,
      skillsScore: analysis.skillsScore,
      experienceScore: analysis.experienceScore,
      educationScore: analysis.educationScore,
      missingSkills: analysis.missingSkills,
      recommendations: analysis.recommendations,
    }));

    const csvContent = [
      'Job Title,Company,Date,Overall Score,Skills Score,Experience Score,Education Score,Missing Skills,Recommendations',
      ...exportData.map(row => 
        `"${row.jobTitle}","${row.company || ''}","${row.analysisDate}",${row.overallScore},${row.skillsScore},${row.experienceScore},${row.educationScore},"${(row.missingSkills || []).join('; ')}","${(row.recommendations || []).join('; ')}"`)
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `resume-match-history-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Filter and sort analyses
  const filteredAnalyses = analyses
    .filter(analysis => {
      const matchesSearch = 
        analysis.jobTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (analysis.company || '').toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesFilter = 
        filterScore === "all" ||
        (filterScore === "high" && analysis.overallScore >= 80) ||
        (filterScore === "medium" && analysis.overallScore >= 60 && analysis.overallScore < 80) ||
        (filterScore === "low" && analysis.overallScore < 60);

      return matchesSearch && matchesFilter;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "score":
          return b.overallScore - a.overallScore;
        case "title":
          return a.jobTitle.localeCompare(b.jobTitle);
        case "date":
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });

  return (
    <div className="min-h-screen bg-neutral-light">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <main className="lg:ml-64 min-h-screen">
        <Header 
          title="Match History" 
          subtitle="View and manage your resume compatibility analyses"
          onMenuClick={() => setSidebarOpen(true)}
        />

        <section className="p-6">
          <div className="max-w-7xl mx-auto">
            {/* Filters and Actions */}
            <Card className="mb-6">
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
                  <div className="flex flex-col sm:flex-row gap-4 flex-1">
                    <div className="relative flex-1 max-w-sm">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        placeholder="Search by job title or company..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    
                    <Select value={filterScore} onValueChange={setFilterScore}>
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="Filter by score" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Matches</SelectItem>
                        <SelectItem value="high">High Match (80%+)</SelectItem>
                        <SelectItem value="medium">Medium Match (60-79%)</SelectItem>
                        <SelectItem value="low">Low Match (&lt;60%)</SelectItem>
                      </SelectContent>
                    </Select>
                    
                    <Select value={sortBy} onValueChange={setSortBy}>
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="Sort by" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="date">Recent First</SelectItem>
                        <SelectItem value="score">Highest Score</SelectItem>
                        <SelectItem value="title">Job Title A-Z</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={handleExportAll} disabled={analyses.length === 0}>
                      <Download className="mr-2 h-4 w-4" />
                      Export CSV
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Results */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl font-semibold text-neutral-dark">
                    Analysis History
                  </CardTitle>
                  <div className="text-sm text-gray-500">
                    {filteredAnalyses.length} of {analyses.length} analyses
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="text-center py-12">
                    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading analysis history...</p>
                  </div>
                ) : filteredAnalyses.length === 0 ? (
                  <div className="text-center py-12">
                    {analyses.length === 0 ? (
                      <>
                        <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">No analyses yet</h3>
                        <p className="text-gray-600 mb-4">
                          Upload a resume and job description to start analyzing compatibility.
                        </p>
                        <Button asChild>
                          <Link href="/upload-resume">Start Analysis</Link>
                        </Button>
                      </>
                    ) : (
                      <>
                        <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">No matches found</h3>
                        <p className="text-gray-600">
                          Try adjusting your search terms or filters.
                        </p>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Job Title</TableHead>
                          <TableHead>Company</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Match Score</TableHead>
                          <TableHead>Skills</TableHead>
                          <TableHead>Experience</TableHead>
                          <TableHead>Education</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredAnalyses.map((analysis) => {
                          const matchBadge = getMatchBadge(analysis.overallScore);
                          return (
                            <TableRow key={analysis.id}>
                              <TableCell>
                                <div>
                                  <div className="font-medium text-neutral-dark">
                                    {analysis.jobTitle}
                                  </div>
                                  {analysis.missingSkills && analysis.missingSkills.length > 0 && (
                                    <div className="text-xs text-error mt-1">
                                      {analysis.missingSkills.length} missing skills
                                    </div>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell className="text-gray-600">
                                {analysis.company || 'Not specified'}
                              </TableCell>
                              <TableCell className="text-gray-500">
                                <div>
                                  <div>{format(new Date(analysis.createdAt), 'MMM d, yyyy')}</div>
                                  <div className="text-xs text-gray-400">
                                    {formatDistanceToNow(new Date(analysis.createdAt), { addSuffix: true })}
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center space-x-3">
                                  <Progress value={analysis.overallScore} className="w-16 h-2" />
                                  <span className="font-medium text-neutral-dark min-w-[3rem]">
                                    {analysis.overallScore}%
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <span className="text-sm font-medium">
                                  {analysis.skillsScore}%
                                </span>
                              </TableCell>
                              <TableCell>
                                <span className="text-sm font-medium">
                                  {analysis.experienceScore}%
                                </span>
                              </TableCell>
                              <TableCell>
                                <span className="text-sm font-medium">
                                  {analysis.educationScore}%
                                </span>
                              </TableCell>
                              <TableCell>
                                <Badge className={matchBadge.className}>
                                  {matchBadge.label}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end space-x-2">
                                  <Button variant="ghost" size="sm" asChild>
                                    <Link href={`/analysis-result/${analysis.id}`}>
                                      <Eye className="h-4 w-4" />
                                    </Link>
                                  </Button>
                                  
                                  <Dialog>
                                    <DialogTrigger asChild>
                                      <Button 
                                        variant="ghost" 
                                        size="sm"
                                        disabled={deleteMutation.isPending}
                                      >
                                        <Trash2 className="h-4 w-4 text-gray-400 hover:text-error" />
                                      </Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                      <DialogHeader>
                                        <DialogTitle>Delete Analysis</DialogTitle>
                                        <DialogDescription>
                                          Are you sure you want to delete the analysis for "{analysis.jobTitle}"? 
                                          This action cannot be undone.
                                        </DialogDescription>
                                      </DialogHeader>
                                      <DialogFooter>
                                        <Button variant="outline">Cancel</Button>
                                        <Button 
                                          onClick={() => handleDelete(analysis.id)}
                                          className="bg-error hover:bg-error/90"
                                        >
                                          Delete
                                        </Button>
                                      </DialogFooter>
                                    </DialogContent>
                                  </Dialog>
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </section>
      </main>
    </div>
  );
}
