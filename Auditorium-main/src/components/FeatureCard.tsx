import { LucideIcon } from "lucide-react";

interface FeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  delay?: number;
}

const FeatureCard = ({ icon: Icon, title, description, delay = 0 }: FeatureCardProps) => {
  return (
    <div 
      className="group p-6 bg-card rounded-xl border border-border shadow-card transition-all duration-500 hover:shadow-card-hover hover:border-primary/30 hover:-translate-y-1"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-start gap-4">
        <div className="p-3 rounded-xl bg-accent/10 text-accent group-hover:bg-accent group-hover:text-accent-foreground transition-all duration-300 group-hover:scale-110">
          <Icon className="w-6 h-6" />
        </div>
        <div>
          <h3 className="font-display font-semibold text-lg text-foreground group-hover:text-primary transition-colors duration-300">
            {title}
          </h3>
          <p className="text-muted-foreground text-sm mt-1">{description}</p>
        </div>
      </div>
    </div>
  );
};

export default FeatureCard;
