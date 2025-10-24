import { Button } from "@/components/ui/button";
import { ArrowRight, TrendingUp, Target, BarChart3 } from "lucide-react";
import heroImage from "@/assets/hero-analytics.jpg";

export const Hero = () => {
  return (
    <section className="relative overflow-hidden">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        <img 
          src={heroImage} 
          alt="NFL Analytics Platform" 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-primary/95 via-primary/85 to-accent/90" />
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 py-24 md:py-32">
        <div className="max-w-3xl animate-slide-up">
          <h1 className="text-5xl md:text-6xl font-bold text-primary-foreground mb-6 leading-tight">
            AI-Powered NFL Game Analysis
          </h1>
          <p className="text-xl text-primary-foreground/90 mb-8 leading-relaxed">
            Calibrated probabilities, transparent edge detection, and real-time data synthesis. 
            Built for informed analysis, not guarantees.
          </p>

          {/* Features */}
          <div className="grid md:grid-cols-3 gap-4 mb-8">
            <div className="flex items-start gap-3 bg-primary-foreground/10 backdrop-blur-sm p-4 rounded-lg">
              <TrendingUp className="h-6 w-6 text-secondary flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold text-primary-foreground mb-1">Edge Detection</h3>
                <p className="text-sm text-primary-foreground/80">Compare model probabilities vs implied odds</p>
              </div>
            </div>
            <div className="flex items-start gap-3 bg-primary-foreground/10 backdrop-blur-sm p-4 rounded-lg">
              <Target className="h-6 w-6 text-secondary flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold text-primary-foreground mb-1">Calibrated Models</h3>
                <p className="text-sm text-primary-foreground/80">Historical accuracy tracking with confidence bands</p>
              </div>
            </div>
            <div className="flex items-start gap-3 bg-primary-foreground/10 backdrop-blur-sm p-4 rounded-lg">
              <BarChart3 className="h-6 w-6 text-secondary flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold text-primary-foreground mb-1">Real-Time Updates</h3>
                <p className="text-sm text-primary-foreground/80">Refreshed every 30 minutes with injury & weather data</p>
              </div>
            </div>
          </div>

          <Button size="lg" className="bg-secondary hover:bg-secondary/90 text-secondary-foreground shadow-glow">
            View Today's Games
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </div>
    </section>
  );
};
