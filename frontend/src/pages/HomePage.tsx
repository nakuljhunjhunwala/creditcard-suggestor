import { useNavigate } from 'react-router-dom';
import { useSessionStore } from '../store/useSessionStore';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { CreditCard, Upload, Target, BarChart3 } from 'lucide-react';
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
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16 text-center">
        <CreditCard className="h-16 w-16 text-primary mx-auto mb-8" />
        
        <h1 className="text-4xl md:text-6xl font-bold mb-6 text-foreground">
          Credit Card Optimizer
        </h1>
        
        <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
          Upload your credit card statement and get AI-powered recommendations 
          to maximize your rewards and optimize your spending.
        </p>
        
        <Button 
          size="lg" 
          onClick={handleStartAnalysis}
          disabled={isLoading}
          className="text-lg px-8 py-3 bg-primary text-primary-foreground hover:bg-primary/90"
        >
          {isLoading ? 'Creating Session...' : 'Start Free Analysis'}
        </Button>
        
        {error && (
          <div className="mt-4 text-destructive text-sm">
            {error.message}
          </div>
        )}
      </div>

      {/* Features Section */}
      <div className="bg-muted">
        <div className="container mx-auto px-4 py-16">
          <h2 className="text-3xl font-bold text-center mb-12 text-foreground">
            How It Works
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="text-center bg-card text-card-foreground">
                <CardHeader>
                  <div className="flex justify-center mb-4">
                    <feature.icon className="h-12 w-12 text-primary" />
                  </div>
                  <CardTitle className="text-foreground">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-base text-muted-foreground">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Benefits Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4 text-foreground">Why Choose Our Service?</h2>
          <p className="text-muted-foreground text-lg">
            Get the most out of your credit cards with data-driven insights
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-foreground">🔒 Secure & Private</h3>
            <p className="text-muted-foreground">
              Your financial data is processed securely and never stored permanently. 
              Sessions expire automatically for your privacy.
            </p>
          </div>
          
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-foreground">🤖 AI-Powered Analysis</h3>
            <p className="text-muted-foreground">
              Advanced AI categorizes your spending and identifies optimization 
              opportunities you might have missed.
            </p>
          </div>
          
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-foreground">💡 Actionable Insights</h3>
            <p className="text-muted-foreground">
              Get specific credit card recommendations with detailed breakdowns 
              of potential savings and benefits.
            </p>
          </div>
          
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-foreground">⚡ Fast Results</h3>
            <p className="text-muted-foreground">
              Get your analysis in minutes, not hours. Our efficient processing 
              delivers insights when you need them.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
