import { ReactNode } from "react";
import { Card } from "@/components/ui/card";

interface FeatureCardProps {
  icon: ReactNode;
  title: string;
  description: string;
}

export const FeatureCard = ({ icon, title, description }: FeatureCardProps) => {
  return (
    <Card className="p-8 bg-card border-border hover:border-primary/50 transition-all duration-300 group hover:shadow-[0_0_30px_hsl(351_83%_54%/0.15),0_10px_40px_hsl(351_83%_54%/0.1)] hover:-translate-y-1 cursor-pointer">
      <div className="mb-4 text-primary group-hover:scale-110 transition-transform duration-300 group-hover:drop-shadow-[0_0_8px_hsl(351_83%_54%/0.6)]">
        {icon}
      </div>
      <h3 className="text-xl font-semibold mb-3 text-foreground">{title}</h3>
      <p className="text-muted-foreground leading-relaxed">{description}</p>
    </Card>
  );
};
