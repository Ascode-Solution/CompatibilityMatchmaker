import { Progress } from "@/components/ui/progress";

interface SectionScoresProps {
  skillsScore: number;
  experienceScore: number;
  educationScore: number;
}

export function SectionScores({ skillsScore, experienceScore, educationScore }: SectionScoresProps) {
  const sections = [
    { 
      name: "Skills", 
      score: skillsScore, 
      color: skillsScore >= 80 ? "bg-success" : skillsScore >= 60 ? "bg-warning" : "bg-error" 
    },
    { 
      name: "Experience", 
      score: experienceScore, 
      color: experienceScore >= 80 ? "bg-success" : experienceScore >= 60 ? "bg-warning" : "bg-error" 
    },
    { 
      name: "Education", 
      score: educationScore, 
      color: educationScore >= 80 ? "bg-primary" : educationScore >= 60 ? "bg-warning" : "bg-error" 
    },
  ];

  return (
    <div className="space-y-4">
      {sections.map((section) => (
        <div key={section.name}>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">{section.name}</span>
            <span className="text-sm font-semibold text-neutral-dark">{section.score}%</span>
          </div>
          <Progress value={section.score} className="h-2" />
        </div>
      ))}
    </div>
  );
}
