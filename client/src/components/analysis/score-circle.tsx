interface ScoreCircleProps {
  score: number;
  size?: "sm" | "md" | "lg";
}

export function ScoreCircle({ score, size = "lg" }: ScoreCircleProps) {
  const circumference = 2 * Math.PI * 15.9155;
  const strokeDasharray = `${(score / 100) * circumference}, ${circumference}`;
  
  const sizeClasses = {
    sm: "w-16 h-16",
    md: "w-20 h-20", 
    lg: "w-24 h-24"
  };
  
  const textSizes = {
    sm: "text-lg",
    md: "text-xl",
    lg: "text-2xl"
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-success";
    if (score >= 60) return "text-warning";
    return "text-error";
  };

  return (
    <div className={`${sizeClasses[size]} mx-auto relative`}>
      <svg className={`${sizeClasses[size]} transform -rotate-90`} viewBox="0 0 36 36">
        <path 
          className="text-gray-200" 
          stroke="currentColor" 
          strokeWidth="3" 
          fill="none"
          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
        />
        <path 
          className={getScoreColor(score)} 
          stroke="currentColor" 
          strokeWidth="3" 
          fill="none" 
          strokeLinecap="round"
          strokeDasharray={strokeDasharray}
          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className={`${textSizes[size]} font-bold text-neutral-dark`}>{score}%</span>
      </div>
    </div>
  );
}
