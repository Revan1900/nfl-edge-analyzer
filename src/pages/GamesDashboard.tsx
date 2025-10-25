import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { TodaysGames } from '@/components/TodaysGames';
import { RefreshCountdown } from '@/components/RefreshCountdown';
import { Disclaimer } from '@/components/Disclaimer';

const GamesDashboard = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">Games & Predictions</h1>
            <p className="text-muted-foreground">
              Real-time odds, model probabilities, and edge detection
            </p>
          </div>
          <RefreshCountdown />
        </div>
        
        <Disclaimer />
      </div>

      <TodaysGames />

      <Footer />
    </div>
  );
};

export default GamesDashboard;
