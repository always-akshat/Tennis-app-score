import { Link } from 'react-router-dom';
import { Button, Card, CardContent } from '@/components/ui';

export function HomePage() {
  return (
    <div className="space-y-8">
      {/* Hero section */}
      <div className="text-center py-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Real-Time Sports Scoring
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
          Track tennis, pickleball, and more with live scores that update instantly.
          Perfect for tournaments, clubs, and recreational play.
        </p>
        <div className="flex justify-center gap-4">
          <Link to="/tournaments">
            <Button size="lg">View Tournaments</Button>
          </Link>
        </div>
      </div>

      {/* Features */}
      <div className="grid md:grid-cols-3 gap-6">
        <FeatureCard
          title="Live Scoring"
          description="Update scores in real-time. Spectators see changes instantly on their devices."
          icon={
            <svg
              className="w-8 h-8"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
          }
        />
        <FeatureCard
          title="Multiple Sports"
          description="Support for tennis, pickleball, and more. Each with accurate scoring rules."
          icon={
            <svg
              className="w-8 h-8"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
              />
            </svg>
          }
        />
        <FeatureCard
          title="Tournament Ready"
          description="Organize brackets, track matches, and manage player registrations."
          icon={
            <svg
              className="w-8 h-8"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
              />
            </svg>
          }
        />
      </div>

      {/* Khel Sathi - Social Impact Section */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-800 rounded-2xl p-8 text-white">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-primary-200 text-sm font-medium uppercase tracking-wider mb-2">
            Khel Sathi - Sports for Social Good
          </p>
          <h2 className="text-3xl font-bold mb-4">
            Every Child Deserves a Chance to Play
          </h2>
          <p className="text-primary-100 mb-6">
            We're using sports to drive social change across India. From Dharavi to the Sundarbans,
            from Kutch to Manipur - our volunteers are building a more equal, healthier nation
            through grassroots sports programs.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
            <div className="bg-white/10 rounded-lg p-3 backdrop-blur-sm">
              <p className="text-2xl font-bold">1,495</p>
              <p className="text-xs text-primary-200">Youth Reached</p>
            </div>
            <div className="bg-white/10 rounded-lg p-3 backdrop-blur-sm">
              <p className="text-2xl font-bold">58%</p>
              <p className="text-xs text-primary-200">Girls Participation</p>
            </div>
            <div className="bg-white/10 rounded-lg p-3 backdrop-blur-sm">
              <p className="text-2xl font-bold">8</p>
              <p className="text-xs text-primary-200">Communities</p>
            </div>
            <div className="bg-white/10 rounded-lg p-3 backdrop-blur-sm">
              <p className="text-2xl font-bold">7</p>
              <p className="text-xs text-primary-200">States</p>
            </div>
          </div>
          <div className="flex justify-center gap-4 flex-wrap">
            <Link
              to="/impact"
              className="inline-flex items-center px-6 py-3 rounded-lg bg-white text-primary-700 font-semibold hover:bg-primary-50 transition-colors"
            >
              View Impact Dashboard
            </Link>
            <Link
              to="/impact/volunteer"
              className="inline-flex items-center px-6 py-3 rounded-lg bg-primary-500 text-white font-semibold hover:bg-primary-400 transition-colors border border-primary-400"
            >
              Become a Volunteer
            </Link>
          </div>
        </div>
      </div>

      {/* Supported sports */}
      <div className="text-center py-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Supported Sports</h2>
        <div className="flex justify-center gap-8 flex-wrap">
          <SportBadge name="Tennis" />
          <SportBadge name="Pickleball" />
          <SportBadge name="Padel" comingSoon />
          <SportBadge name="Badminton" comingSoon />
        </div>
      </div>
    </div>
  );
}

interface FeatureCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
}

function FeatureCard({ title, description, icon }: FeatureCardProps) {
  return (
    <Card>
      <CardContent className="text-center py-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary-100 text-primary-600 mb-4">
          {icon}
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
        <p className="text-gray-600">{description}</p>
      </CardContent>
    </Card>
  );
}

interface SportBadgeProps {
  name: string;
  comingSoon?: boolean;
}

function SportBadge({ name, comingSoon }: SportBadgeProps) {
  return (
    <div
      className={`px-6 py-3 rounded-lg font-medium ${
        comingSoon
          ? 'bg-gray-100 text-gray-500'
          : 'bg-primary-100 text-primary-700'
      }`}
    >
      {name}
      {comingSoon && (
        <span className="block text-xs mt-0.5 opacity-75">Coming soon</span>
      )}
    </div>
  );
}
