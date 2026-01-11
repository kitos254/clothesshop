import { Users, GraduationCap, Code, Heart, ShoppingBag } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import Footer from '@/components/Footer';

interface TeamMember {
  name: string;
  regNumber: string;
  index: number;
}

const teamMembers: TeamMember[] = [
  { name: 'Mark Motiso Mosoti', regNumber: 'J31/4341/2022', index: 1 },
  { name: 'Kelvin Nguwa', regNumber: 'J31/4317/2022', index: 2 },
  { name: 'Elvis Kiplimo', regNumber: 'J31/3586/2021', index: 3 },
  { name: 'Patrick Mutua', regNumber: 'J31/4336/2022', index: 4 },
  { name: 'Emmanuel Kiprono', regNumber: 'J31/4331/2022', index: 5 },
  { name: 'Collins Toroitich', regNumber: 'J31/4333/2022', index: 6 },
];

const AboutPage = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <main className="pt-16">
        {/* Hero Section */}
        <div className="bg-gradient-to-br from-primary via-primary/90 to-primary/80 text-white">
          <div className="container mx-auto px-4 py-16 md:py-24">
            <div className="max-w-3xl mx-auto text-center">
              <Badge className="bg-white/20 text-white hover:bg-white/30 mb-4">
                SIT 402 - E-Commerce
              </Badge>
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                Group 2 Project
              </h1>
              <p className="text-xl text-white/80 mb-6">
                A modern e-commerce platform built with passion and dedication
              </p>
              <div className="flex items-center justify-center gap-2">
                <ShoppingBag className="h-6 w-6" />
                <span className="text-2xl font-semibold">NewRan</span>
              </div>
            </div>
          </div>
        </div>

        {/* Project Description */}
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-3xl mx-auto">
            <Card className="shadow-lg -mt-16 relative z-10">
              <CardContent className="p-8">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Code className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold">About This Project</h2>
                    <p className="text-sm text-muted-foreground">Class Assignment</p>
                  </div>
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  NewRan is a full-stack e-commerce platform developed as part of the SIT 402 E-Commerce 
                  course. This project demonstrates modern web development practices including React.js 
                  for the frontend, Node.js with Express for the backend, and MongoDB for data storage. 
                  The platform features user authentication, product management, shopping cart functionality, 
                  wishlist management, and a complete checkout system with order tracking.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Team Section */}
        <div className="container mx-auto px-4 py-12">
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
              <Users className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-3xl font-bold mb-2">Meet Our Team</h2>
            <p className="text-muted-foreground max-w-lg mx-auto">
              The talented individuals behind this e-commerce platform
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {teamMembers.map((member) => (
              <Card 
                key={member.regNumber} 
                className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
              >
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center text-white font-bold text-xl flex-shrink-0 group-hover:scale-110 transition-transform">
                      {member.name.split(' ').map(n => n[0]).slice(0, 2).join('')}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="text-xs">
                          #{member.index}
                        </Badge>
                      </div>
                      <h3 className="font-semibold text-lg truncate">{member.name}</h3>
                      <p className="text-sm text-muted-foreground font-mono">
                        {member.regNumber}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Course Info */}
        <div className="bg-muted/50 py-12">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto">
              <Card>
                <CardContent className="p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <GraduationCap className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold">Course Information</h2>
                      <p className="text-sm text-muted-foreground">Academic Details</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm text-muted-foreground">Course Code</p>
                        <p className="font-medium">SIT 402</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Course Title</p>
                        <p className="font-medium">E-Commerce</p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm text-muted-foreground">Group</p>
                        <p className="font-medium">Group 2</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Project Type</p>
                        <p className="font-medium">Full-Stack E-Commerce Platform</p>
                      </div>
                    </div>
                  </div>

                  <Separator className="my-6" />

                  <div>
                    <p className="text-sm text-muted-foreground mb-3">Technologies Used</p>
                    <div className="flex flex-wrap gap-2">
                      {['React.js', 'TypeScript', 'Node.js', 'Express', 'MongoDB', 'Tailwind CSS', 'Vite', 'JWT Auth'].map((tech) => (
                        <Badge key={tech} variant="secondary">
                          {tech}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Footer Quote */}
        <div className="container mx-auto px-4 py-12">
          <div className="text-center">
            <p className="text-muted-foreground flex items-center justify-center gap-2">
              Built with <Heart className="h-4 w-4 text-red-500 fill-red-500" /> by Group 2
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default AboutPage;
