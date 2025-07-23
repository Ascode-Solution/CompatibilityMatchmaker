import { Badge } from "@/components/ui/badge";

interface MissingSkillsProps {
  skills: string[];
}

export function MissingSkills({ skills }: MissingSkillsProps) {
  if (skills.length === 0) {
    return (
      <div className="text-center py-4">
        <p className="text-sm text-gray-500">No missing skills identified</p>
      </div>
    );
  }

  return (
    <div>
      <h3 className="text-sm font-semibold text-gray-700 mb-3">Missing Skills</h3>
      <div className="flex flex-wrap gap-2">
        {skills.map((skill, index) => (
          <Badge 
            key={index} 
            variant="destructive" 
            className="px-2 py-1 bg-error/10 text-error text-xs"
          >
            {skill}
          </Badge>
        ))}
      </div>
    </div>
  );
}
