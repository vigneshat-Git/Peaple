import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect } from "react";
import { ArrowRight, Heart, MessageCircle, Users, Zap, Globe, Shield } from "lucide-react";

const LandingPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  // Redirect to home if already logged in
  useEffect(() => {
    if (isAuthenticated) {
      navigate("/feed");
    }
  }, [isAuthenticated, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/50">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-7xl mx-auto px-4 lg:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">P</span>
            </div>
            <span className="font-bold text-xl">Peaple</span>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={() => navigate("/login")}>
              Sign In
            </Button>
            <Button onClick={() => navigate("/register")}>
              Get Started
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 lg:px-6 py-20 lg:py-32">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <div className="space-y-6">
              <h1 className="text-5xl lg:text-6xl font-bold leading-tight">
                Connect, Share, and Grow Together
              </h1>
              <p className="text-xl text-muted-foreground leading-relaxed">
                Peaple is a community-driven platform where users share stories, ideas, and perspectives. Join vibrant communities, engage in meaningful discussions, and discover content that matters to you.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button size="lg" onClick={() => navigate("/register")} className="gap-2">
                Start Exploring <ArrowRight className="w-5 h-5" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => navigate("/login")}
                className="gap-2"
              >
                Sign In to Your Account
              </Button>
            </div>
            <div className="flex items-center gap-6 pt-4 border-t">
              <div>
                <p className="text-2xl font-bold">100K+</p>
                <p className="text-sm text-muted-foreground">Active Users</p>
              </div>
              <div>
                <p className="text-2xl font-bold">50K+</p>
                <p className="text-sm text-muted-foreground">Communities</p>
              </div>
              <div>
                <p className="text-2xl font-bold">1M+</p>
                <p className="text-sm text-muted-foreground">Posts Shared</p>
              </div>
            </div>
          </div>
          <div className="hidden lg:flex items-center justify-center">
            <div className="relative w-full aspect-square bg-gradient-to-br from-primary/20 to-primary/5 rounded-3xl border flex items-center justify-center">
              <div className="text-center space-y-4">
                <Globe className="w-24 h-24 mx-auto text-primary opacity-50" />
                <p className="text-muted-foreground">Your Community Awaits</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="max-w-7xl mx-auto px-4 lg:px-6 py-20 border-t">
        <div className="space-y-12">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-4xl font-bold">Why Choose Peaple?</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Discover what makes Peaple the ultimate platform for community engagement
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="p-8 rounded-xl border bg-card hover:bg-accent/50 transition-colors">
              <Heart className="w-12 h-12 text-primary mb-4" />
              <h3 className="text-xl font-bold mb-3">Meaningful Connections</h3>
              <p className="text-muted-foreground">
                Connect with like-minded people who share your interests, passions, and perspectives across thousands of communities.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="p-8 rounded-xl border bg-card hover:bg-accent/50 transition-colors">
              <MessageCircle className="w-12 h-12 text-primary mb-4" />
              <h3 className="text-xl font-bold mb-3">Engaging Discussions</h3>
              <p className="text-muted-foreground">
                Share your voice, vote on content, comment thoughtfully, and participate in conversations that matter to you.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="p-8 rounded-xl border bg-card hover:bg-accent/50 transition-colors">
              <Users className="w-12 h-12 text-primary mb-4" />
              <h3 className="text-xl font-bold mb-3">Diverse Communities</h3>
              <p className="text-muted-foreground">
                Explore and create communities on any topic—from hobbies and tech to current events and everything in between.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="p-8 rounded-xl border bg-card hover:bg-accent/50 transition-colors">
              <Zap className="w-12 h-12 text-primary mb-4" />
              <h3 className="text-xl font-bold mb-3">Real-Time Updates</h3>
              <p className="text-muted-foreground">
                Stay up-to-date with trending posts, comments, and community activity as it happens in real-time.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="p-8 rounded-xl border bg-card hover:bg-accent/50 transition-colors">
              <Shield className="w-12 h-12 text-primary mb-4" />
              <h3 className="text-xl font-bold mb-3">Safe Environment</h3>
              <p className="text-muted-foreground">
                Enjoy a secure platform with community moderation, user profiles, and reputation systems that keep it welcoming.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="p-8 rounded-xl border bg-card hover:bg-accent/50 transition-colors">
              <Globe className="w-12 h-12 text-primary mb-4" />
              <h3 className="text-xl font-bold mb-3">Global Reach</h3>
              <p className="text-muted-foreground">
                Connect with people from around the world, share diverse perspectives, and expand your horizons every day.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="max-w-7xl mx-auto px-4 lg:px-6 py-20 border-t">
        <div className="space-y-12">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-4xl font-bold">How Peaple Works</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Get started in minutes and join a thriving community
            </p>
          </div>
          <div className="grid md:grid-cols-4 gap-6">
            {[
              { num: "1", title: "Create Account", desc: "Sign up with email or Google to get started instantly" },
              { num: "2", title: "Join Communities", desc: "Browse and join communities that match your interests" },
              { num: "3", title: "Share Content", desc: "Post your thoughts, photos, and ideas with the community" },
              { num: "4", title: "Engage & Connect", desc: "Vote, comment, and build relationships with others" },
            ].map((step, idx) => (
              <div key={idx} className="space-y-4">
                <div className="w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center font-bold text-lg">
                  {step.num}
                </div>
                <div>
                  <h3 className="font-bold text-lg mb-2">{step.title}</h3>
                  <p className="text-sm text-muted-foreground">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-7xl mx-auto px-4 lg:px-6 py-20 border-t">
        <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-2xl p-12 border text-center space-y-6">
          <h2 className="text-4xl font-bold">Ready to Join the Community?</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Start connecting with millions of people sharing their passions and ideas. Your community is waiting.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6">
            <Button size="lg" onClick={() => navigate("/register")} className="gap-2">
              Create Free Account <ArrowRight className="w-5 h-5" />
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate("/login")}>
              Already a Member? Sign In
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-muted/50 mt-20">
        <div className="max-w-7xl mx-auto px-4 lg:px-6 py-12">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="font-bold mb-4">Peaple</h3>
              <p className="text-sm text-muted-foreground">Connect, share, and grow with communities.</p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground">Features</a></li>
                <li><a href="#" className="hover:text-foreground">Communities</a></li>
                <li><a href="#" className="hover:text-foreground">Trending</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground">About</a></li>
                <li><a href="#" className="hover:text-foreground">Blog</a></li>
                <li><a href="#" className="hover:text-foreground">Careers</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground">Privacy</a></li>
                <li><a href="#" className="hover:text-foreground">Terms</a></li>
                <li><a href="#" className="hover:text-foreground">Contact</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t pt-8 text-center text-sm text-muted-foreground">
            <p>&copy; 2024 Peaple. All rights reserved. | Connect. Share. Grow Together.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
