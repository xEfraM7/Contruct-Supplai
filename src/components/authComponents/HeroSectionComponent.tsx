import { Building2, Users, FileText, TrendingUp } from "lucide-react";
import Image from "next/image";

export function HeroSectionComponent() {
  return (
    <div className="hidden lg:flex flex-1 bg-accent text-accent-foreground relative overflow-hidden items-center justify-center">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fillRule='evenodd'%3E%3Cg fill='%23ffffff' fillOpacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 w-full max-w-2xl px-12 xl:px-16">
        <div className="space-y-8">
          {/* Hero Image Placeholder */}
          <div className="relative h-64 rounded-2xl overflow-hidden bg-primary/10 backdrop-blur-sm border border-accent-foreground/10">
            <Image
              src="/obra-civil-obra-civil.jpg"
              alt="Construction site"
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className="object-cover"
              priority
            />
          </div>

          {/* Hero Text */}
          <div className="space-y-4">
            <h2 className="text-4xl font-bold leading-tight text-balance">
              Manage your construction projects with confidence
            </h2>
            <p className="text-lg text-accent-foreground/80 leading-relaxed">
              Streamline workflows, track progress, and collaborate with your
              team in real-time. Built for construction professionals who demand
              excellence.
            </p>
          </div>

          {/* Feature Grid */}
          <div className="grid grid-cols-2 gap-4 pt-4">
            <div className="flex items-start gap-3 p-4 rounded-lg bg-background/5 backdrop-blur-sm border border-accent-foreground/10">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/20">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">Project Management</h3>
                <p className="text-xs text-accent-foreground/70 mt-1">
                  Track all projects in one place
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 rounded-lg bg-background/5 backdrop-blur-sm border border-accent-foreground/10">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/20">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">Team Collaboration</h3>
                <p className="text-xs text-accent-foreground/70 mt-1">
                  Work together seamlessly
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 rounded-lg bg-background/5 backdrop-blur-sm border border-accent-foreground/10">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/20">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">Document Control</h3>
                <p className="text-xs text-accent-foreground/70 mt-1">
                  Organize all your files
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 rounded-lg bg-background/5 backdrop-blur-sm border border-accent-foreground/10">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/20">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">Real-time Analytics</h3>
                <p className="text-xs text-accent-foreground/70 mt-1">
                  Make data-driven decisions
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
