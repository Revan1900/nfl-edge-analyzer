export const Footer = () => {
  return (
    <footer className="bg-primary text-primary-foreground mt-16">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-center md:text-left">
            <p className="text-sm font-semibold mb-2">
              Built by{" "}
              <a 
                href="https://ai-arcade.dynamicaihub.com/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-secondary hover:underline transition-colors"
              >
                Dynamic AI HUB
              </a>
            </p>
            <p className="text-xs text-primary-foreground/70">
              Informational analysis only • Not betting advice • 18+ where legal
            </p>
          </div>
          
          <div className="flex gap-6 text-xs">
            <a href="#" className="hover:text-secondary transition-colors">About</a>
            <a href="#" className="hover:text-secondary transition-colors">Disclaimers</a>
            <a href="#" className="hover:text-secondary transition-colors">Responsible Gaming</a>
          </div>
        </div>
      </div>
    </footer>
  );
};
