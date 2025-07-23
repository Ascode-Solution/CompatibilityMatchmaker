import { BarChart3, Target, Trophy, AlertTriangle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface StatsCardsProps {
  stats: {
    totalAnalyses: number;
    averageMatch: number;
    highMatches: number;
    skillsGaps: number;
  };
}

export function StatsCards({ stats }: StatsCardsProps) {
  const cards = [
    {
      title: "Total Analyses",
      value: stats.totalAnalyses,
      icon: BarChart3,
      color: "text-primary",
      bgColor: "bg-primary/10",
      trend: "+12%",
      trendLabel: "from last month",
      trendColor: "text-success",
    },
    {
      title: "Average Match",
      value: `${stats.averageMatch}%`,
      icon: Target,
      color: "text-success",
      bgColor: "bg-success/10",
      trend: "+5%",
      trendLabel: "improvement",
      trendColor: "text-success",
    },
    {
      title: "High Matches",
      value: stats.highMatches,
      icon: Trophy,
      color: "text-warning",
      bgColor: "bg-warning/10",
      trend: "+2",
      trendLabel: "this week",
      trendColor: "text-success",
    },
    {
      title: "Skills Gaps",
      value: stats.skillsGaps,
      icon: AlertTriangle,
      color: "text-error",
      bgColor: "bg-error/10",
      trend: "-1",
      trendLabel: "since last analysis",
      trendColor: "text-error",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {cards.map((card) => (
        <Card key={card.title} className="border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">{card.title}</p>
                <p className="text-2xl font-bold text-neutral-dark">{card.value}</p>
              </div>
              <div className={`w-12 h-12 ${card.bgColor} rounded-lg flex items-center justify-center`}>
                <card.icon className={`${card.color} text-xl`} />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <span className={card.trendColor}>{card.trend}</span>
              <span className="text-gray-500 ml-2">{card.trendLabel}</span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
