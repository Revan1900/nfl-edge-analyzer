import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { TodaysGames } from "@/components/TodaysGames";
import { Disclaimer } from "@/components/Disclaimer";
import { Footer } from "@/components/Footer";
import { RefreshCountdown } from "@/components/RefreshCountdown";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Hero />
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <Disclaimer />
          <RefreshCountdown />
        </div>
      </div>
      <TodaysGames />
      <Footer />
    </div>
  );
};

export default Index;
