import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, TrendingUp, Brain, AlertTriangle } from 'lucide-react';

const About = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <h1 className="text-4xl font-bold mb-8">About AI Odds Analytics</h1>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                Our Mission
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                AI Odds Analytics leverages advanced machine learning and real-time data aggregation to provide 
                transparent, data-driven insights into NFL game outcomes. Our platform is designed for informational 
                and educational purposes, helping users understand probability models and market dynamics.
              </p>
              <p className="text-muted-foreground">
                We combine odds data from multiple sources, injury reports, weather conditions, and historical 
                performance to generate calibrated probability predictions. Every prediction includes confidence 
                intervals and uncertainty bands to help users make informed decisions.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                How It Works
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">1. Data Ingestion</h3>
                <p className="text-sm text-muted-foreground">
                  We aggregate odds from The Odds API, injury reports from official sources, weather data from 
                  NOAA/Open-Meteo, and news signals from reputable sports outlets.
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">2. Feature Engineering</h3>
                <p className="text-sm text-muted-foreground">
                  Our system builds features including consensus odds, injury impact scores, weather severity, 
                  rest days, and line movement volatility.
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">3. Prediction Model</h3>
                <p className="text-sm text-muted-foreground">
                  We use logistic regression with calibration to generate probabilities for moneyline, spread, 
                  and total outcomes. The model is continuously evaluated and adjusted based on actual results.
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">4. Narrative Generation</h3>
                <p className="text-sm text-muted-foreground">
                  OpenAI GPT-5 generates human-readable narratives explaining key factors and model reasoning 
                  for each game, with smart caching to manage API costs.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Privacy & Data
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                <strong>No Personal Information:</strong> We collect minimal data. User accounts require only 
                email and password. No tracking cookies, no IP logging, no PII beyond authentication.
              </p>
              <p className="text-muted-foreground">
                <strong>Secure Authentication:</strong> Passwords are hashed with Argon2id. Session tokens are 
                httpOnly and secure. All data transmission uses HTTPS.
              </p>
              <p className="text-muted-foreground">
                <strong>Source Attribution:</strong> All data sources are cited with timestamps. Users can view 
                source URLs and verify data provenance.
              </p>
            </CardContent>
          </Card>

          <Card className="border-warning">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-warning">
                <AlertTriangle className="h-5 w-5" />
                Important Disclaimer
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="font-semibold">FOR INFORMATIONAL AND EDUCATIONAL PURPOSES ONLY</p>
              <p className="text-muted-foreground text-sm">
                This platform provides statistical analysis and probability estimates. It is NOT gambling advice, 
                investment advice, or a recommendation to place wagers. Past model performance does not guarantee 
                future results. Sports outcomes are inherently uncertain.
              </p>
              <p className="text-muted-foreground text-sm">
                If you choose to gamble, please do so responsibly:
              </p>
              <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                <li>Only wager what you can afford to lose</li>
                <li>Set limits and stick to them</li>
                <li>Gambling should never interfere with financial obligations</li>
                <li>Seek help if gambling becomes problematic</li>
              </ul>
              <div className="mt-4 p-4 bg-muted rounded-lg">
                <p className="text-sm font-semibold mb-2">Problem Gambling Resources:</p>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li>National Council on Problem Gambling: 1-800-522-4700</li>
                  <li>Online: <a href="https://www.ncpgambling.org" className="text-primary hover:underline">ncpgambling.org</a></li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Powered By</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Built with Lovable Cloud (Supabase), React, TypeScript, and OpenAI. Data from The Odds API, 
                NOAA/Open-Meteo, and vetted sports news sources.
              </p>
              <p className="text-sm text-muted-foreground">
                Source code and methodology documentation available upon request. Contact us for research 
                inquiries or partnership opportunities.
              </p>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default About;