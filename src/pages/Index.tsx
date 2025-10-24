import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { TodaysGames } from "@/components/TodaysGames";
import { Disclaimer } from "@/components/Disclaimer";
import { Footer } from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Hero />
      <div className="container mx-auto px-4 py-8">
        <Disclaimer />
      </div>
      <TodaysGames />
      <Footer />
    </div>
  );
};

export default Index;
