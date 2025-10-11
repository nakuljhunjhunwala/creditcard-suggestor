import { useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSessionStore } from '../store/useSessionStore';
import { Card, CardContent } from '../components/ui/card';
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

  // Prefer job progress if available, fall back to session values
  const effectiveProgress = Math.max(
    0,
    Math.min(
      jobStatus?.activeJob?.progress ?? jobStatus?.sessionProgress ?? session.progress ?? 0,
      100
    )
  );

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
            Analysing your rewards
          </h1>
          <p className="text-sm md:text-base text-gray-400">
            Please wait while we show how much you have missed
          </p>
        </div>

        {/* Main Progress Card */}
        <Card className="rounded-lg shadow-sm bg-gray-900 border-gray-800">
          <CardContent className="pt-8 pb-8 px-6 md:px-8">
            {/* Animated Icon */}
            <div className="flex justify-center mb-8">
              {jobStatus?.activeJob?.status === 'failed' ? (
                <AlertCircle className="h-16 w-16 md:h-20 md:w-20 text-red-500" />
              ) : jobStatus?.activeJob?.status === 'completed' ? (
                <CheckCircle2 className="h-16 w-16 md:h-20 md:w-20 text-green-500" />
              ) : (
                <Loader2 className="h-16 w-16 md:h-20 md:w-20 text-purple-500 animate-spin" />
              )}
            </div>

            {/* Status Text */}
            <div className="text-center mb-8">
              <h2 className="text-lg md:text-xl font-bold mb-2 text-white">
                {currentStep?.title || 'Processing...'}
              </h2>
              <p className="text-sm text-gray-400">
                {currentStep?.description || 'Please wait while we process your data'}
              </p>
            </div>

            {/* Progress Bar */}
            <div className="space-y-3 mb-6">
              <div className="flex justify-between text-xs font-bold">
                <span className="text-gray-400">Progress</span>
                <span className="text-white">{effectiveProgress}%</span>
              </div>
              <Progress value={effectiveProgress} className="h-2 bg-gray-800" />
            </div>

            {/* Error Display */}
            {(error || (jobStatus?.activeJob?.status === 'failed' && jobStatus?.activeJob?.errorMessage)) && (
              <div className="p-4 bg-red-900/20 border border-red-800 rounded-lg mb-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-red-400 text-sm">Processing Error</p>
                    <p className="text-xs text-red-300 break-words mt-1">
                      {jobStatus?.activeJob?.errorMessage || error?.message || 'Request failed with status code 429'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Session Stats */}
            {session.totalTransactions && !error && jobStatus?.activeJob?.status !== 'failed' && (
              <div className="grid grid-cols-2 gap-4 pt-6 border-t border-gray-800">
                <div className="text-center p-3 bg-gray-800/50 rounded-lg">
                  <p className="text-3xl font-bold text-purple-400">
                    {session.totalTransactions}
                  </p>
                  <p className="text-xs font-semibold text-gray-400 mt-2">Transactions</p>
                </div>
                <div className="text-center p-3 bg-gray-800/50 rounded-lg">
                  <p className="text-3xl font-bold text-purple-400">
                    {session.categorizedCount || 0}
                  </p>
                  <p className="text-xs font-semibold text-gray-400 mt-2">Categorized</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
