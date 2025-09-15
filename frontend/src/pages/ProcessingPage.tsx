import { useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSessionStore } from '../store/useSessionStore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Progress } from '../components/ui/progress';
import { 
  FileText, 
  Search, 
  Tags, 
  Target, 
  CheckCircle2, 
  AlertCircle,
  Loader2
} from 'lucide-react';

const PROCESSING_STEPS = {
  uploading: { icon: FileText, title: 'File Upload', description: 'Uploading your PDF statement' },
  extracting: { icon: FileText, title: 'Extracting Data', description: 'Reading transactions from your statement' },
  categorizing: { icon: Tags, title: 'Categorizing Transactions', description: 'Organizing your spending by category' },
  mcc_discovery: { icon: Search, title: 'MCC Discovery', description: 'Identifying merchant categories' },
  analyzing: { icon: Target, title: 'Generating Recommendations', description: 'Finding the best credit cards for you' },
  completed: { icon: CheckCircle2, title: 'Analysis Complete', description: 'Your recommendations are ready!' },
  failed: { icon: AlertCircle, title: 'Processing Failed', description: 'Something went wrong during analysis' }
};

export function ProcessingPage() {
  const navigate = useNavigate();
  const { sessionToken } = useParams();
  const pollingStartedRef = useRef(false);
  const { 
    session, 
    jobStatus, 
    fetchSessionStatus,
    pollJobStatus, 
    stopPolling,
    error 
  } = useSessionStore();

  useEffect(() => {
    if (!sessionToken) {
      navigate('/');
      return;
    }

    // Only start polling once
    if (!pollingStartedRef.current) {
      pollingStartedRef.current = true;
      
      // First fetch the session status if we don't have it
      if (!session || session.sessionToken !== sessionToken) {
        fetchSessionStatus(sessionToken).then(() => {
          // Then start polling for job status
          pollJobStatus();
        });
      } else {
        // Start polling for job status
        pollJobStatus();
      }
    }
  }, [sessionToken, navigate]); // Removed problematic dependencies

  useEffect(() => {
    // Redirect to results when job is completed
    if (jobStatus?.activeJob?.status === 'completed') {
      navigate(`/results/${sessionToken}`);
    }
    // Reset polling flag when job is completed or failed
    if (jobStatus?.activeJob?.status === 'completed' || jobStatus?.activeJob?.status === 'failed') {
      pollingStartedRef.current = false;
      stopPolling(); // Explicitly stop polling
    }
  }, [jobStatus?.activeJob?.status, navigate, sessionToken, stopPolling]);

  // Cleanup effect - stop polling when component unmounts
  useEffect(() => {
    return () => {
      stopPolling();
      pollingStartedRef.current = false;
    };
  }, [stopPolling]);

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="flex items-center justify-center p-6">
            <div className="flex items-center gap-3">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>Loading session...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Determine current step based on job status, fallback to session status
  const currentStatus = jobStatus?.activeJob?.status === 'failed' ? 'failed' : 
                       jobStatus?.activeJob?.currentStep || 
                       session.status;
  const currentStep = PROCESSING_STEPS[currentStatus as keyof typeof PROCESSING_STEPS];
  const StepIcon = currentStep?.icon || Loader2;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-4">Processing Your Statement</h1>
            <p className="text-muted-foreground">
              We're analyzing your spending patterns and generating personalized recommendations
            </p>
          </div>

          {/* Main Progress Card */}
          <Card className="mb-8">
            <CardHeader className="text-center pb-4">
              <div className="flex justify-center mb-4">
                {jobStatus?.activeJob?.status === 'failed' ? (
                  <AlertCircle className="h-16 w-16 text-red-600" />
                ) : jobStatus?.activeJob?.status === 'completed' ? (
                  <CheckCircle2 className="h-16 w-16 text-green-500" />
                ) : (
                  <StepIcon className={`h-16 w-16 text-blue-600 ${!['completed', 'failed'].includes(jobStatus?.activeJob?.status || '') ? 'animate-pulse' : ''}`} />
                )}
              </div>
              <CardTitle className="text-2xl">
                {currentStep?.title || 'Processing...'}
              </CardTitle>
              <CardDescription className="text-lg">
                {currentStep?.description || 'Please wait while we process your data'}
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-6">
              {/* Progress Bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Progress</span>
                  <span>{session.progress}%</span>
                </div>
                <Progress value={session.progress} className="h-3" />
              </div>

              {/* Current Step Info */}
              {jobStatus?.activeJob?.currentStep && (
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500">Current Step</p>
                  <p className="font-medium">{jobStatus.activeJob.currentStep}</p>
                </div>
              )}

              {/* Error Display */}
              {(error || (jobStatus?.activeJob?.status === 'failed' && jobStatus?.activeJob?.errorMessage)) && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center gap-3">
                    <AlertCircle className="h-5 w-5 text-red-600" />
                    <div>
                      <p className="font-medium text-red-800">Processing Error</p>
                      <p className="text-sm text-red-600">
                        {jobStatus?.activeJob?.errorMessage || error?.message || 'Request failed with status code 429'}
                      </p>
                      {jobStatus?.activeJob?.errorMessage === 'AI service configuration error' && (
                        <p className="text-xs text-red-500 mt-1">
                          The AI service needs to be configured with a valid API key. Please contact support.
                        </p>
                      )}
                      {error?.message?.includes('429') && (
                        <p className="text-xs text-red-500 mt-1">
                          Rate limit exceeded. The system is polling too frequently. Please wait a moment.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Session Stats */}
              {session.totalTransactions && (
                <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-primary">{session.totalTransactions}</p>
                    <p className="text-sm text-muted-foreground">Transactions Found</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600">{session.categorizedCount || 0}</p>
                    <p className="text-sm text-muted-foreground">Categorized</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Processing Steps */}
          <Card>
            <CardHeader>
              <CardTitle>Processing Steps</CardTitle>
              <CardDescription>
                Track the progress of your statement analysis
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(PROCESSING_STEPS).map(([stepKey, step]) => {
                  if (stepKey === 'failed') return null; // Don't show failed step in normal flow
                  
                  const StepIcon = step.icon;
                  let stepStatus: 'pending' | 'current' | 'completed' | 'failed' = 'pending';
                  
                  if (session.status === stepKey) {
                    stepStatus = 'current';
                  } else if (session.status === 'failed') {
                    stepStatus = 'failed';
                  } else {
                    const stepOrder = ['uploading', 'extracting', 'categorizing', 'mcc_discovery', 'analyzing', 'completed'];
                    const currentIndex = stepOrder.indexOf(session.status);
                    const thisIndex = stepOrder.indexOf(stepKey);
                    
                    if (thisIndex < currentIndex || session.status === 'completed') {
                      stepStatus = 'completed';
                    }
                  }

                  return (
                    <div
                      key={stepKey}
                      className={`flex items-center gap-4 p-3 rounded-lg transition-colors ${
                        stepStatus === 'current' 
                          ? 'bg-primary/10 border border-primary/20' 
                          : stepStatus === 'completed'
                          ? 'bg-green-50 border border-green-200 dark:bg-green-950 dark:border-green-800'
                          : 'bg-muted/30'
                      }`}
                    >
                      <div className={`
                        flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center
                        ${stepStatus === 'current' 
                          ? 'bg-primary text-primary-foreground animate-pulse' 
                          : stepStatus === 'completed'
                          ? 'bg-green-500 text-white'
                          : stepStatus === 'failed'
                          ? 'bg-destructive text-destructive-foreground'
                          : 'bg-muted text-muted-foreground'
                        }
                      `}>
                        <StepIcon className="h-5 w-5" />
                      </div>
                      
                      <div className="flex-1">
                        <p className={`font-medium ${
                          stepStatus === 'current' ? 'text-primary' : 
                          stepStatus === 'completed' ? 'text-green-700 dark:text-green-300' : 
                          'text-foreground'
                        }`}>
                          {step.title}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {step.description}
                        </p>
                      </div>
                      
                      {stepStatus === 'current' && (
                        <Loader2 className="h-5 w-5 animate-spin text-primary" />
                      )}
                      
                      {stepStatus === 'completed' && (
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Tips Card */}
          <Card className="mt-8">
            <CardHeader>
              <CardTitle className="text-lg">💡 Did You Know?</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <p>• Our AI analyzes over 500 different merchant categories to provide accurate spending insights</p>
                <p>• We compare your spending patterns against hundreds of credit cards to find the best matches</p>
                <p>• The analysis considers signup bonuses, annual fees, and ongoing rewards to calculate potential savings</p>
                <p>• Your data is processed securely and automatically deleted after analysis</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
