import { BookOpen, Users, Award, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { LandingHeader } from "@/components/landing/LandingHeader";
import { PublicCourseCard } from "@/components/landing/PublicCourseCard";
import { usePublicCourses } from "@/hooks/usePublicCourses";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

const Landing = () => {
  const { data: courses, isLoading } = usePublicCourses();

  return (
    <div className="min-h-screen bg-background">
      <LandingHeader />

      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 md:py-32">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5" />
        <div className="container relative">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl md:text-6xl">
              Unlock Your Potential with{" "}
              <span className="bg-gradient-hero bg-clip-text text-transparent">
                Expert-Led Courses
              </span>
            </h1>
            <p className="mt-6 text-lg text-muted-foreground md:text-xl">
              Join thousands of learners advancing their careers with our comprehensive 
              skill-building platform. Learn from industry experts at your own pace.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button size="lg" className="bg-gradient-primary hover:opacity-90 gap-2" asChild>
                <Link to="/signup">
                  Start Learning Free
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link to="/login">Already have an account?</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="border-y border-border bg-muted/30 py-12">
        <div className="container">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="flex flex-col items-center text-center">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                <BookOpen className="h-6 w-6 text-primary" />
              </div>
              <div className="text-3xl font-bold text-foreground">{courses?.length || 0}+</div>
              <div className="text-muted-foreground">Available Courses</div>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="h-12 w-12 rounded-full bg-secondary/10 flex items-center justify-center mb-3">
                <Users className="h-6 w-6 text-secondary" />
              </div>
              <div className="text-3xl font-bold text-foreground">10,000+</div>
              <div className="text-muted-foreground">Active Learners</div>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="h-12 w-12 rounded-full bg-warning/10 flex items-center justify-center mb-3">
                <Award className="h-6 w-6 text-warning" />
              </div>
              <div className="text-3xl font-bold text-foreground">500+</div>
              <div className="text-muted-foreground">Certificates Issued</div>
            </div>
          </div>
        </div>
      </section>

      {/* Courses Section */}
      <section className="py-16 md:py-24">
        <div className="container">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold text-foreground md:text-4xl">
              Explore Our Courses
            </h2>
            <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">
              Discover a wide range of courses designed to help you master new skills 
              and advance your career.
            </p>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="rounded-xl border border-border bg-card overflow-hidden">
                  <Skeleton className="aspect-video w-full" />
                  <div className="p-5 space-y-4">
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-2/3" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                </div>
              ))}
            </div>
          ) : courses && courses.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses.map((course) => (
                <PublicCourseCard key={course.id} course={course} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <BookOpen className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-foreground mb-2">
                Courses Coming Soon
              </h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                We're working on bringing you amazing courses. Sign up to be notified 
                when new courses are available!
              </p>
              <Button className="mt-6 bg-gradient-primary hover:opacity-90" asChild>
                <Link to="/signup">Join the Waitlist</Link>
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-24 bg-gradient-to-br from-primary/10 via-background to-secondary/10">
        <div className="container">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold text-foreground md:text-4xl">
              Ready to Start Learning?
            </h2>
            <p className="mt-4 text-muted-foreground">
              Create your free account today and get access to all our courses.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button size="lg" className="bg-gradient-primary hover:opacity-90" asChild>
                <Link to="/signup">Create Free Account</Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link to="/login">Sign In</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="container flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-hero flex items-center justify-center">
              <span className="text-sm font-bold text-white">S</span>
            </div>
            <span className="font-semibold text-foreground">SkillPath</span>
          </div>
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} SkillPath. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
