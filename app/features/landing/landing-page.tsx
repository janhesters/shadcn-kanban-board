import { Description } from './description';
import { FAQ } from './faq';
import { Footer } from './footer';
import { Header } from './header';
import { Hero } from './hero';
import { InstallationInstructions } from './installation-instructions';

export default function LandingPage() {
  return (
    <div className="overflow-hidden">
      <Header />

      <main className="container mx-auto">
        <Hero />
        <InstallationInstructions />
        <Description />
        <FAQ />
      </main>

      <Footer />
    </div>
  );
}
