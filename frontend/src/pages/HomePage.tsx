import { useNavigate } from 'react-router-dom';
import { useSessionStore } from '../store/useSessionStore';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Upload, Target, BarChart3, ArrowRight } from 'lucide-react';
import { useEffect } from 'react';

export function HomePage() {
  const navigate = useNavigate();
  const { createSession, isLoading, error, clearError } = useSessionStore();

  useEffect(() => {
    // Clear any existing error when component mounts
    clearError();
  }, [clearError]);

  const handleStartAnalysis = async () => {
    try {
      await createSession();
      const { session } = useSessionStore.getState();
      if (session) {
        navigate(`/upload/${session.sessionToken}`);
      }
    } catch (error) {
      console.error('Failed to create session:', error);
    }
  };

  const features = [
    {
      icon: Upload,
      title: 'Upload Statement',
      description: 'Upload your credit card PDF statement securely'
    },
    {
      icon: BarChart3,
      title: 'Smart Analysis',
      description: 'AI-powered transaction categorization and spending insights'
    },
    {
      icon: Target,
      title: 'Personalized Recommendations',
      description: 'Get credit card recommendations based on your spending patterns'
    }
  ];

  return (
    <div className="min-h-screen bg-black">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-20 md:py-32 text-center">
        {/* Main Headline */}
        <h1 className="text-4xl md:text-7xl font-bold mb-8 text-white leading-tight">
          Not using the right{' '}
          <span className="bg-gradient-to-r from-purple-400 via-purple-500 to-blue-500 bg-clip-text text-transparent">
            credit card?
          </span>
        </h1>
        
        {/* First Subheading */}
        <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto">
          Let your spending pick the right one for you.
        </p>

        {/* Divider */}
        <div className="w-24 h-px bg-gray-600 mx-auto mb-8"></div>

        {/* Second Subheading */}
        <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto">
          Know how much you're losing.
        </p>

        {/* Divider */}
        <div className="w-24 h-px bg-gray-600 mx-auto mb-8"></div>

        {/* Highlighted Text */}
        <p className="text-lg md:text-xl font-semibold text-cyan-400 mb-6">
          Zero sales. 100% personalised. All under a minute.
        </p>

        {/* Description */}
        <p className="text-base md:text-lg text-gray-400 mb-10 max-w-2xl mx-auto">
          Upload your credit card statement to get personalised credit card suggestions.
        </p>
        
        {/* CTA Button */}
        <Button 
          size="lg" 
          onClick={handleStartAnalysis}
          disabled={isLoading}
          className="text-lg px-10 py-6 bg-gradient-to-r from-purple-500 to-purple-700 hover:from-purple-600 hover:to-purple-800 text-white font-semibold rounded-full shadow-lg transition-all"
        >
          {isLoading ? 'Creating Session...' : (
            <>
              Find My Card <ArrowRight className="ml-2 h-5 w-5 inline" />
            </>
          )}
        </Button>
        
        {error && (
          <div className="mt-6 text-red-400 text-sm">
            {error.message}
          </div>
        )}
      </div>

      {/* Features Section */}
      <div className="bg-gray-950 border-t border-gray-800">
        <div className="container mx-auto px-4 py-16">
          <h2 className="text-3xl font-bold text-center mb-12 text-white">
            How It Works
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="text-center bg-gray-900 border-gray-800 text-white">
                <CardHeader>
                  <div className="flex justify-center mb-4">
                    <feature.icon className="h-12 w-12 text-purple-400" />
                  </div>
                  <CardTitle className="text-white">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-base text-gray-400">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
}
