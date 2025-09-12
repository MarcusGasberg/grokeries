import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CountUp } from "@/components/count-up";
import {
  ShoppingCart,
  Users,
  ChefHat,
  Zap,
  ArrowRight,
  Star,
  Target,
  Rocket,
} from "lucide-react";

export const Route = createFileRoute("/")({
  component: LandingPage,
});

export function LandingPage() {
  const features = [
    {
      icon: <Users className="w-8 h-8" />,
      title: "TEAM SHOPPING",
      description: "COLLABORATE WITH FAMILY & FRIENDS ON SHARED LISTS",
    },
    {
      icon: <ChefHat className="w-8 h-8" />,
      title: "RECIPE INTEGRATION",
      description: "ADD INGREDIENTS FROM RECIPES DIRECTLY TO YOUR LIST",
    },
    {
      icon: <Zap className="w-8 h-8" />,
      title: "REAL-TIME SYNC",
      description: "INSTANT UPDATES ACROSS ALL DEVICES & TEAM MEMBERS",
    },
  ];

  const stats = [
    { number: 10, label: "ACTIVE USERS", suffix: "+" },
    { number: 10, label: "LISTS CREATED", suffix: "+" },
    { number: 100, label: "ITEMS CONQUERED", suffix: "+" },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-4 mb-8 p-6 bg-primary text-primary-foreground border-4 border-primary shadow-[12px_12px_0px_0px_rgba(249,115,22,1)]">
            <div className="p-3 bg-accent border-2 border-accent-foreground">
              <ShoppingCart className="w-12 h-12 text-accent-foreground" />
            </div>
            <div>
              <h1 className="text-6xl font-black font-sans tracking-tight uppercase">
                GROCERY
              </h1>
              <h2 className="text-5xl font-black font-sans tracking-tight uppercase">
                DESTROYER
              </h2>
            </div>
          </div>

          <p className="text-2xl font-black font-sans uppercase tracking-wide text-foreground mb-4">
            THE ULTIMATE COLLABORATIVE
          </p>
          <p className="text-3xl font-black font-sans uppercase tracking-wide text-primary mb-8">
            GROCERY & RECIPE DOMINATION PLATFORM
          </p>

          <p className="text-lg font-bold font-serif max-w-2xl mx-auto mb-12 text-muted-foreground">
            BRUTALLY EFFICIENT SHOPPING WITH YOUR TEAM. ADD RECIPES, SHARE
            LISTS, CONQUER GROCERIES TOGETHER.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link to="/register">
              <Button
                size="lg"
                className="bg-accent hover:bg-accent/90 text-accent-foreground font-black font-sans uppercase tracking-wide text-lg px-8 py-6 border-4 border-accent shadow-[8px_8px_0px_0px_rgba(31,41,55,1)] hover:shadow-[4px_4px_0px_0px_rgba(31,41,55,1)] transition-all"
              >
                <Rocket className="w-6 h-6 mr-3" />
                START DESTROYING
                <ArrowRight className="w-6 h-6 ml-3" />
              </Button>
            </Link>

            <Link to="/groceries">
              <Button
                variant="outline"
                size="lg"
                className="font-black font-sans uppercase tracking-wide text-lg px-8 py-6 border-4 border-primary hover:bg-primary hover:text-primary-foreground shadow-[4px_4px_0px_0px_rgba(249,115,22,1)] hover:shadow-[2px_2px_0px_0px_rgba(249,115,22,1)] transition-all bg-transparent"
              >
                TRY DEMO
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          {stats.map((stat, index) => (
            <Card
              key={index}
              className="border-4 border-primary shadow-[6px_6px_0px_0px_rgba(31,41,55,1)] bg-accent text-accent-foreground"
            >
              <CardContent className="p-8 text-center">
                <div className="text-4xl font-black font-mono mb-2">
                  <CountUp
                    end={stat.number}
                    duration={1000 + (index + 1) * Math.random() * 500}
                    className="inline"
                  />
                  {stat.suffix}
                </div>
                <div className="text-sm font-black font-sans uppercase tracking-wide">
                  {stat.label}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Features Section */}
        <div className="mb-16">
          <h3 className="text-4xl font-black font-sans uppercase text-center mb-12 tracking-wide">
            DOMINATION FEATURES
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card
                key={index}
                className="border-4 border-primary shadow-[6px_6px_0px_0px_rgba(31,41,55,1)] hover:shadow-[3px_3px_0px_0px_rgba(31,41,55,1)] transition-all hover:bg-card/90"
              >
                <CardContent className="p-8 text-center">
                  <div className="inline-flex p-4 bg-accent text-accent-foreground border-2 border-accent-foreground mb-6">
                    {feature.icon}
                  </div>
                  <h4 className="text-xl font-black font-sans uppercase mb-4 tracking-wide">
                    {feature.title}
                  </h4>
                  <p className="font-bold font-serif text-muted-foreground">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* How It Works */}
        <div className="mb-16">
          <h3 className="text-4xl font-black font-sans uppercase text-center mb-12 tracking-wide">
            DESTRUCTION PROCESS
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              {
                step: "01",
                title: "CREATE TEAM",
                desc: "INVITE FAMILY & FRIENDS",
              },
              {
                step: "02",
                title: "ADD RECIPES",
                desc: "IMPORT INGREDIENTS INSTANTLY",
              },
              {
                step: "03",
                title: "COLLABORATE",
                desc: "REAL-TIME LIST UPDATES",
              },
              {
                step: "04",
                title: "DOMINATE",
                desc: "CONQUER GROCERY SHOPPING",
              },
            ].map((item, index) => (
              <Card
                key={index}
                className="border-4 border-accent shadow-[4px_4px_0px_0px_rgba(31,41,55,1)] bg-accent text-accent-foreground"
              >
                <CardContent className="p-6 text-center">
                  <div className="text-3xl font-black font-mono mb-3">
                    {item.step}
                  </div>
                  <h4 className="text-lg font-black font-sans uppercase mb-2 tracking-wide">
                    {item.title}
                  </h4>
                  <p className="text-sm font-bold font-serif">{item.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <Card className="border-4 border-primary shadow-[8px_8px_0px_0px_rgba(249,115,22,1)] bg-primary text-primary-foreground">
          <CardContent className="p-12 text-center">
            <Target className="w-16 h-16 mx-auto mb-6" />
            <h3 className="text-4xl font-black font-sans uppercase mb-4 tracking-wide">
              READY TO DESTROY?
            </h3>
            <p className="text-xl font-bold font-serif mb-8 max-w-2xl mx-auto">
              JOIN THOUSANDS OF TEAMS ALREADY DOMINATING THEIR GROCERY SHOPPING
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/register">
                <Button
                  size="lg"
                  className="bg-accent hover:bg-accent/90 text-accent-foreground font-black font-sans uppercase tracking-wide text-lg px-8 py-6 border-4 border-accent shadow-[6px_6px_0px_0px_rgba(31,41,55,1)] hover:shadow-[3px_3px_0px_0px_rgba(31,41,55,1)] transition-all"
                >
                  <Star className="w-6 h-6 mr-3" />
                  START FREE TODAY
                </Button>
              </Link>

              <Link to="/login">
                <Button
                  variant="outline"
                  size="lg"
                  className="bg-primary-foreground text-primary font-black font-sans uppercase tracking-wide text-lg px-8 py-6 border-4 border-primary-foreground hover:bg-primary-foreground/90 shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] hover:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] transition-all"
                >
                  EXISTING USER? LOGIN
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
