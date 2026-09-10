import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Shield, Map, AlertTriangle, Users } from "lucide-react";
import heroImage from "@/assets/hero-road.jpg";

const Landing = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-8 w-8 text-primary" />
            <span className="text-xl font-bold text-foreground">Road Safety Portal</span>
          </div>
          <Button onClick={() => navigate("/auth")} variant="default">
            Sign In
          </Button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative h-[500px] overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={heroImage}
            alt="Highway infrastructure"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-primary/90 to-primary/70" />
        </div>
        <div className="relative container mx-auto px-4 h-full flex items-center">
          <div className="max-w-2xl text-white">
            <h1 className="text-5xl font-bold mb-4">
              Report Road Damage, Save Lives
            </h1>
            <p className="text-xl mb-8 text-white/95">
              Help keep our roads safe by reporting potholes and damaged roads. Your reports help traffic officials respond faster.
            </p>
            <Button
              onClick={() => navigate("/auth")}
              size="lg"
              variant="secondary"
              className="text-lg"
            >
              Get Started
            </Button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12 text-foreground">
            How It Works
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-card p-6 rounded-lg shadow-md border">
              <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <Map className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-foreground">Upload Location</h3>
              <p className="text-muted-foreground">
                Capture the exact GPS location of damaged roads with our integrated mapping system.
              </p>
            </div>

            <div className="bg-card p-6 rounded-lg shadow-md border">
              <div className="h-12 w-12 bg-secondary/10 rounded-lg flex items-center justify-center mb-4">
                <AlertTriangle className="h-6 w-6 text-secondary" />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-foreground">Report Damage</h3>
              <p className="text-muted-foreground">
                Upload photos and describe the damage level to help officials prioritize repairs.
              </p>
            </div>

            <div className="bg-card p-6 rounded-lg shadow-md border">
              <div className="h-12 w-12 bg-accent/10 rounded-lg flex items-center justify-center mb-4">
                <Users className="h-6 w-6 text-accent" />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-foreground">Track Progress</h3>
              <p className="text-muted-foreground">
                Officials review and mark issues as solved. Track all reports on an interactive map.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-4">Ready to Make Roads Safer?</h2>
          <p className="text-xl mb-8 text-primary-foreground/90">
            Join thousands of citizens helping improve road safety in your area.
          </p>
          <Button
            onClick={() => navigate("/auth")}
            size="lg"
            variant="secondary"
            className="text-lg"
          >
            Create Account
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-card border-t py-8">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p>© 2025 Road Safety Portal. A Government of India Initiative.</p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
