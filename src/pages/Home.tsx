import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { TrendingUp, BarChart3, Shield, Zap } from 'lucide-react';
import { useEffect } from 'react';

const Home = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted">
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="max-w-4xl mx-auto space-y-8">
          <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
            NFL Analytics Pro
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground">
            Calibrated probabilities, transparent edge detection, and real‑time data synthesis
          </p>
          <p className="text-lg text-muted-foreground">
            Built for informed analysis, not guarantees
          </p>
          <div className="flex gap-4 justify-center mt-8">
            <Button 
              size="lg" 
              onClick={() => navigate('/register')}
              className="text-lg px-8"
            >
              Get Started
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              onClick={() => navigate('/login')}
              className="text-lg px-8"
            >
              Sign In
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="bg-card border border-border rounded-lg p-6 space-y-3">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-xl font-bold">Edge Detection</h3>
            <p className="text-muted-foreground">
              Real-time edge analysis between model probabilities and market odds
            </p>
          </div>

          <div className="bg-card border border-border rounded-lg p-6 space-y-3">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-xl font-bold">Live Odds</h3>
            <p className="text-muted-foreground">
              Up-to-date odds from The Odds API with 30-minute refresh cycles
            </p>
          </div>

          <div className="bg-card border border-border rounded-lg p-6 space-y-3">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <Shield className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-xl font-bold">Calibrated Models</h3>
            <p className="text-muted-foreground">
              Deterministic baseline models with transparent confidence bands
            </p>
          </div>

          <div className="bg-card border border-border rounded-lg p-6 space-y-3">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <Zap className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-xl font-bold">AI Insights</h3>
            <p className="text-muted-foreground">
              Real-time injury reports, weather data, and key factor analysis
            </p>
          </div>
        </div>
      </section>

      {/* Disclaimer Section */}
      <section className="container mx-auto px-4 py-8">
        <div className="bg-muted border border-border rounded-lg p-6 text-center">
          <p className="text-sm text-muted-foreground">
            <strong>Disclaimer:</strong> Informational analysis and estimated probabilities only. 
            Not betting advice. No guarantees. Please gamble responsibly.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-8 border-t border-border">
        <div className="text-center text-sm text-muted-foreground">
          <p>
            Built by{' '}
            <a 
              href="https://ai-arcade.dynamicaihub.com/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              Dynamic AI HUB
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Home;
