import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { FileText, Eye, Trash2, CheckCircle, Lightbulb } from "lucide-react";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { StatsCards } from "@/components/stats/stats-cards";
import { ScoreCircle } from "@/components/analysis/score-circle";
import { SectionScores } from "@/components/analysis/section-scores";
import { MissingSkills } from "@/components/analysis/missing-skills";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { statsApi, analysisApi } from "@/lib/api";
import { formatDistanceToNow } from "date-fns";

export default function Dashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/stats"],
    queryFn: statsApi.getUserStats,
  });

  const { data: recentAnalyses = [], isLoading: analysesLoading } = useQuery({
    queryKey: ["/api/analysis/history"],
    queryFn: analysisApi.getHistory,
  });

  const latestAnalysis = recentAnalyses[0];

  const getMatchBadge = (score: number) => {
    if (score >= 80) return { label: "High Match", variant: "default", className: "bg-success/10 text-success" };
    if (score >= 60) return { label: "Medium Match", variant: "secondary", className: "bg-warning/10 text-warning" };
    return { label: "Low Match", variant: "destructive", className: "bg-error/10 text-error" };
  };

  return (
    <div className="min-h-screen bg-neutral-light">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <main className="lg:ml-64 min-h-screen">
        <Header 
          title="Dashboard" 
          subtitle="Analyze resume compatibility with job descriptions"
          onMenuClick={() => setSidebarOpen(true)}
          onNewAnalysis={() => window.location.href = "/upload-resume"}
        />

        <section className="p-6">
          {/* Stats Cards */}
          {!statsLoading && stats && <StatsCards stats={stats} />}

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Upload Section */}
            <div className="lg:col-span-2 space-y-6">
              {/* Resume Upload */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl font-semibold text-neutral-dark">Upload Resume</CardTitle>
                  <p className="text-gray-600">Upload your resume in PDF, DOCX, or TXT format</p>
                </CardHeader>
                <CardContent>
                  <Link href="/upload-resume">
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-primary transition-colors cursor-pointer">
                      <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                        <FileText className="text-primary text-2xl" />
                      </div>
                      <h3 className="text-lg font-medium text-neutral-dark mb-2">Drop your resume here</h3>
                      <p className="text-gray-600 mb-4">or click to browse files</p>
                      <p className="text-sm text-gray-500">Supports PDF, DOCX, TXT (max 10MB)</p>
                    </div>
                  </Link>
                </CardContent>
              </Card>

              {/* Job Description Input */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl font-semibold text-neutral-dark">Job Description</CardTitle>
                  <p className="text-gray-600">Paste the job description or upload a document</p>
                </CardHeader>
                <CardContent>
                  <Link href="/job-description">
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-primary transition-colors">
                      <FileText className="text-gray-400 text-2xl mb-2 mx-auto" />
                      <p className="text-gray-600">Click to add job description</p>
                    </div>
                  </Link>
                </CardContent>
              </Card>

              {/* Analysis Button */}
              <Card>
                <CardContent className="p-6">
                  <Button 
                    className="w-full bg-primary text-white py-4 px-6 text-lg hover:bg-primary-dark" 
                    size="lg"
                    asChild
                  >
                    <Link href="/upload-resume">
                      <span className="flex items-center justify-center space-x-2">
                        <span>Analyze Compatibility</span>
                      </span>
                    </Link>
                  </Button>
                  <p className="text-center text-sm text-gray-500 mt-2">
                    Analysis typically takes 10-30 seconds
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Results Panel */}
            <div className="space-y-6">
              {/* Latest Analysis */}
              {latestAnalysis && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-xl font-semibold text-neutral-dark">Latest Analysis</CardTitle>
                    <p className="text-gray-600">{latestAnalysis.jobTitle}</p>
                  </CardHeader>
                  <CardContent>
                    {/* Overall Score */}
                    <div className="text-center mb-6">
                      <ScoreCircle score={latestAnalysis.overallScore} />
                      <div className="mt-4">
                        <Badge className={getMatchBadge(latestAnalysis.overallScore).className}>
                          <CheckCircle className="mr-2 h-3 w-3" />
                          {getMatchBadge(latestAnalysis.overallScore).label}
                        </Badge>
                      </div>
                    </div>

                    {/* Section Scores */}
                    <SectionScores 
                      skillsScore={latestAnalysis.skillsScore}
                      experienceScore={latestAnalysis.experienceScore}
                      educationScore={latestAnalysis.educationScore}
                    />

                    {/* Missing Skills */}
                    <div className="mt-6 pt-6 border-t">
                      <MissingSkills skills={latestAnalysis.missingSkills || []} />
                    </div>

                    {/* Action Buttons */}
                    <div className="mt-6 pt-6 border-t space-y-2">
                      <Button variant="outline" className="w-full" asChild>
                        <Link href={`/analysis-result/${latestAnalysis.id}`}>
                          View Detailed Analysis
                        </Link>
                      </Button>
                      <Button variant="outline" className="w-full text-primary border-primary/20 hover:bg-primary/10">
                        Export Results
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Quick Tips */}
              {latestAnalysis?.recommendations && (
                <Card className="bg-gradient-to-br from-primary/5 to-secondary/5 border-primary/20">
                  <CardContent className="p-6">
                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Lightbulb className="text-primary h-4 w-4" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-neutral-dark mb-2">Improvement Tips</h3>
                        <ul className="text-sm text-gray-600 space-y-1">
                          {latestAnalysis.recommendations.slice(0, 3).map((tip, index) => (
                            <li key={index}>• {tip}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          {/* Recent Analyses */}
          <div className="mt-8">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl font-semibold text-neutral-dark">Recent Analyses</CardTitle>
                  <Link href="/match-history">
                    <a className="text-primary hover:text-primary-dark text-sm font-medium">View All</a>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                {analysesLoading ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500">Loading analyses...</p>
                  </div>
                ) : recentAnalyses.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No analyses yet. Upload a resume to get started!</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Job Title</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Match Score</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {recentAnalyses.slice(0, 5).map((analysis) => (
                          <TableRow key={analysis.id}>
                            <TableCell>
                              <div>
                                <div className="font-medium text-neutral-dark">{analysis.jobTitle}</div>
                                <div className="text-sm text-gray-500">{analysis.company || 'Unknown Company'}</div>
                              </div>
                            </TableCell>
                            <TableCell className="text-gray-500">
                              {formatDistanceToNow(new Date(analysis.createdAt), { addSuffix: true })}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center space-x-3">
                                <Progress value={analysis.overallScore} className="w-16 h-2" />
                                <span className="font-medium text-neutral-dark">{analysis.overallScore}%</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge className={getMatchBadge(analysis.overallScore).className}>
                                {getMatchBadge(analysis.overallScore).label}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex space-x-2">
                                <Button variant="ghost" size="sm" asChild>
                                  <Link href={`/analysis-result/${analysis.id}`}>
                                    <Eye className="h-4 w-4" />
                                  </Link>
                                </Button>
                                <Button variant="ghost" size="sm">
                                  <Trash2 className="h-4 w-4 text-gray-400" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
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
