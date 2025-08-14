import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import { ArrowLeft, Download, Share2, CheckCircle, AlertCircle, Lightbulb } from "lucide-react";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { ScoreCircle } from "@/components/analysis/score-circle";
import { SectionScores } from "@/components/analysis/section-scores";
import { MissingSkills } from "@/components/analysis/missing-skills";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { analysisApi } from "@/lib/api";
import { formatDistanceToNow } from "date-fns";
import { jsPDF } from "jspdf";

export default function AnalysisResult() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [, params] = useRoute("/analysis-result/:id");
  const analysisId = params?.id ? parseInt(params.id) : null;

  const { data: analyses = [], isLoading } = useQuery({
    queryKey: ["/api/analysis/history"],
    queryFn: analysisApi.getHistory,
  });

  const analysis = analyses.find(a => a.id === analysisId);

  const getMatchBadge = (score: number) => {
    if (score >= 80) return { 
      label: "High Match", 
      className: "bg-success/10 text-success border-success/20",
      icon: CheckCircle 
    };
    if (score >= 60) return { 
      label: "Medium Match", 
      className: "bg-warning/10 text-warning border-warning/20",
      icon: AlertCircle 
    };
    return { 
      label: "Low Match", 
      className: "bg-error/10 text-error border-error/20",
      icon: AlertCircle 
    };
  };

  const handleExport = () => {
    if (!analysis) return;

    const exportData = {
      jobTitle: analysis.jobTitle,
      company: analysis.company,
      analysisDate: new Date(analysis.createdAt).toLocaleDateString(),
      overallScore: analysis.overallScore,
      sectionScores: {
        skills: analysis.skillsScore,
        experience: analysis.experienceScore,
        education: analysis.educationScore,
      },
      missingSkills: analysis.missingSkills,
      recommendations: analysis.recommendations,
    };

    // Create PDF
    const doc = new jsPDF();
    let y = 10;
    doc.setFontSize(16);
    doc.text(`Resume Analysis Report`, 10, y);
    y += 10;
    doc.setFontSize(12);
    doc.text(`Job Title: ${exportData.jobTitle}`, 10, y);
    y += 8;
    if (exportData.company) {
      doc.text(`Company: ${exportData.company}`, 10, y);
      y += 8;
    }
    doc.text(`Analysis Date: ${exportData.analysisDate}`, 10, y);
    y += 8;
    doc.text(`Overall Match Score: ${exportData.overallScore}%`, 10, y);
    y += 10;
    doc.text(`Section Scores:`, 10, y);
    y += 8;
    doc.text(`  Skills: ${exportData.sectionScores.skills}%`, 10, y);
    y += 8;
    doc.text(`  Experience: ${exportData.sectionScores.experience}%`, 10, y);
    y += 8;
    doc.text(`  Education: ${exportData.sectionScores.education}%`, 10, y);
    y += 10;
    doc.text(`Missing Skills:`, 10, y);
    y += 8;
    if (exportData.missingSkills && exportData.missingSkills.length > 0) {
      exportData.missingSkills.forEach((skill: string) => {
        doc.text(`- ${skill}`, 12, y);
        y += 7;
      });
    } else {
      doc.text(`None`, 12, y);
      y += 7;
    }
    y += 3;
    doc.text(`Recommendations:`, 10, y);
    y += 8;
    if (exportData.recommendations && exportData.recommendations.length > 0) {
      exportData.recommendations.forEach((rec: string) => {
        doc.text(`- ${rec}`, 12, y);
        y += 7;
      });
    } else {
      doc.text(`None`, 12, y);
      y += 7;
    }
    doc.save(`resume-analysis-${analysis.jobTitle.replace(/\s+/g, '-').toLowerCase()}.pdf`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-light">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main className="lg:ml-64 min-h-screen">
          <Header 
            title="Analysis Result" 
            onMenuClick={() => setSidebarOpen(true)}
          />
          <section className="p-6">
            <div className="text-center py-12">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600">Loading analysis...</p>
            </div>
          </section>
        </main>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="min-h-screen bg-neutral-light">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main className="lg:ml-64 min-h-screen">
          <Header 
            title="Analysis Result" 
            onMenuClick={() => setSidebarOpen(true)}
          />
          <section className="p-6">
            <Card className="max-w-md mx-auto">
              <CardContent className="pt-6">
                <div className="text-center">
                  <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">Analysis Not Found</h2>
                  <p className="text-gray-600 mb-4">
                    The analysis you're looking for doesn't exist or has been deleted.
                  </p>
                  <Button asChild>
                    <Link href="/">Return to Dashboard</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </section>
        </main>
      </div>
    );
  }

  const matchBadge = getMatchBadge(analysis.overallScore);

  return (
    <div className="min-h-screen bg-neutral-light">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <main className="lg:ml-64 min-h-screen">
        <Header 
          title="Analysis Result" 
          subtitle={`${analysis.jobTitle} • ${analysis.company || 'Unknown Company'}`}
          onMenuClick={() => setSidebarOpen(true)}
        />

        <section className="p-6">
          <div className="max-w-6xl mx-auto">
            {/* Back Navigation */}
            <div className="mb-6">
              <Button variant="ghost" asChild className="mb-4">
                <Link href="/match-history">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Match History
                </Link>
              </Button>
            </div>

            {/* Header Card */}
            <Card className="mb-8">
              <CardContent className="p-8">
                <div className="flex items-start justify-between">
                  <div>
                    <h1 className="text-3xl font-bold text-neutral-dark mb-2">
                      {analysis.jobTitle}
                    </h1>
                    {analysis.company && (
                      <p className="text-xl text-gray-600 mb-4">{analysis.company}</p>
                    )}
                    <p className="text-sm text-gray-500">
                      Analyzed {formatDistanceToNow(new Date(analysis.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                  <div className="flex space-x-3">
                    <Button variant="outline" onClick={handleExport}>
                      <Download className="mr-2 h-4 w-4" />
                      Export
                    </Button>
                    <Button variant="outline">
                      <Share2 className="mr-2 h-4 w-4" />
                      Share
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Overall Score */}
              <div className="lg:col-span-1">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-center">Overall Match</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center">
                      <ScoreCircle score={analysis.overallScore} size="lg" />
                      <div className="mt-6">
                        <Badge className={`${matchBadge.className} px-4 py-2`}>
                          <matchBadge.icon className="mr-2 h-4 w-4" />
                          {matchBadge.label}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Section Breakdown */}
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Section Analysis</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <SectionScores 
                      skillsScore={analysis.skillsScore}
                      experienceScore={analysis.experienceScore}
                      educationScore={analysis.educationScore}
                    />
                  </CardContent>
                </Card>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
              {/* Missing Skills */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <AlertCircle className="mr-2 h-5 w-5 text-error" />
                    Skills Gap Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <MissingSkills skills={analysis.missingSkills || []} />
                  {analysis.missingSkills && analysis.missingSkills.length > 0 && (
                    <div className="mt-4 p-4 bg-error/5 rounded-lg border border-error/20">
                      <p className="text-sm text-gray-600">
                        Focus on developing these skills to improve your match score. 
                        Consider taking online courses or working on projects that involve these technologies.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Recommendations */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Lightbulb className="mr-2 h-5 w-5 text-warning" />
                    Improvement Recommendations
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {analysis.recommendations && analysis.recommendations.length > 0 ? (
                    <ul className="space-y-3">
                      {analysis.recommendations.map((recommendation, index) => (
                        <li key={index} className="flex items-start space-x-3">
                          <div className="flex-shrink-0 w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center mt-0.5">
                            <span className="text-xs font-medium text-primary">{index + 1}</span>
                          </div>
                          <p className="text-sm text-gray-700">{recommendation}</p>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-gray-500">No specific recommendations available.</p>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Score Breakdown Details */}
            <Card className="mt-8">
              <CardHeader>
                <CardTitle>Detailed Score Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center p-6 bg-success/5 rounded-lg border border-success/20">
                    <div className="text-3xl font-bold text-success mb-2">{analysis.skillsScore}%</div>
                    <h3 className="font-semibold text-neutral-dark mb-2">Skills Match</h3>
                    <p className="text-sm text-gray-600">
                      How well your technical skills align with the job requirements
                    </p>
                  </div>
                  
                  <div className="text-center p-6 bg-warning/5 rounded-lg border border-warning/20">
                    <div className="text-3xl font-bold text-warning mb-2">{analysis.experienceScore}%</div>
                    <h3 className="font-semibold text-neutral-dark mb-2">Experience Match</h3>
                    <p className="text-sm text-gray-600">
                      How your work experience matches the role requirements
                    </p>
                  </div>
                  
                  <div className="text-center p-6 bg-primary/5 rounded-lg border border-primary/20">
                    <div className="text-3xl font-bold text-primary mb-2">{analysis.educationScore}%</div>
                    <h3 className="font-semibold text-neutral-dark mb-2">Education Match</h3>
                    <p className="text-sm text-gray-600">
                      How your educational background fits the position
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Action Items */}
            <Card className="mt-8 bg-gradient-to-br from-primary/5 to-secondary/5 border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CheckCircle className="mr-2 h-5 w-5 text-success" />
                  Next Steps
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold text-neutral-dark mb-2">Immediate Actions</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Update your resume with relevant keywords</li>
                      <li>• Highlight matching experience more prominently</li>
                      <li>• Add specific project examples</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold text-neutral-dark mb-2">Long-term Development</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Learn the missing technical skills</li>
                      <li>• Gain relevant project experience</li>
                      <li>• Consider relevant certifications</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>
    </div>
  );
}
