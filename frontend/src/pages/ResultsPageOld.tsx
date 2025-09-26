import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSessionStore } from '../store/useSessionStore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Progress } from '../components/ui/progress';
import { 
  CreditCard, 
  TrendingUp, 
  PieChart, 
  DollarSign, 
  Star,
  ExternalLink,
  ArrowLeft,
  Download,
  RefreshCw,
  Calendar,
  Building2
} from 'lucide-react';

export function ResultsPage() {
  const navigate = useNavigate();
  const { sessionToken } = useParams();
  const { 
    session,
    transactions,
    recommendations,
    analysis,
    fetchSessionStatus,
    fetchTransactions,
    fetchRecommendations,
    fetchAnalysis,
    isLoading,
    error
  } = useSessionStore();

  useEffect(() => {
    if (!sessionToken) {
      navigate('/');
      return;
    }

    // First fetch session status, then fetch other data
    const loadData = async () => {
      try {
        // Fetch session status first
        await fetchSessionStatus(sessionToken);
        
        // Then fetch all other data in parallel
        await Promise.all([
          fetchTransactions(),
          fetchRecommendations(),
          fetchAnalysis()
        ]);
      } catch (error) {
        console.error('Failed to load results data:', error);
      }
    };

    loadData();
  }, [sessionToken, navigate, fetchSessionStatus, fetchTransactions, fetchRecommendations, fetchAnalysis]);

  if (isLoading || !session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="flex items-center justify-center p-6">
            <div className="flex items-center gap-3">
              <RefreshCw className="h-5 w-5 animate-spin" />
              <span>Loading results...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Error Loading Results</CardTitle>
            <CardDescription>
              {error.message || 'Failed to load session results. The session may have expired or does not exist.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Button onClick={() => navigate('/')}>
                Start New Analysis
              </Button>
              <Button variant="outline" onClick={() => window.location.reload()}>
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (session.status !== 'completed') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Analysis Not Complete</CardTitle>
            <CardDescription>
              Your analysis is still processing. Please wait for it to complete.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate(`/processing/${sessionToken}`)}>
              View Processing Status
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Start New Analysis
          </Button>
          
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export Report
            </Button>
          </div>
        </div>

        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-4">Your Credit Card Analysis</h1>
          <p className="text-muted-foreground">
            Based on your spending patterns, here are your personalized insights and recommendations
          </p>
        </div>

        <div className="space-y-8">
          {/* Overview Stats */}
          <div className="grid md:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-green-600" />
                  Total Spend
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">
                  {session.totalSpend ? formatCurrency(Number(session.totalSpend)) : 'N/A'}
                </p>
                <p className="text-sm text-muted-foreground">
                  Across {session.totalTransactions || 0} transactions
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <PieChart className="h-5 w-5 text-blue-600" />
                  Top Category
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xl font-bold">
                  {session.topCategory || 'N/A'}
                </p>
                <p className="text-sm text-muted-foreground">
                  Your highest spending area
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-purple-600" />
                  Categorized
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">
                  {session.categorizedCount || 0}
                </p>
                <Progress 
                  value={session.totalTransactions ? (session.categorizedCount || 0) / session.totalTransactions * 100 : 0} 
                  className="mt-2" 
                />
                <p className="text-sm text-muted-foreground mt-1">
                  {session.totalTransactions ? Math.round((session.categorizedCount || 0) / session.totalTransactions * 100) : 0}% categorized
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Star className="h-5 w-5 text-amber-600" />
                  Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">
                  {recommendations ? recommendations.length : 0}
                </p>
                <p className="text-sm text-muted-foreground">
                  Cards matched to your profile
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Credit Card Recommendations */}
          {recommendations && recommendations.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-6 w-6" />
                  Recommended Credit Cards
                </CardTitle>
                <CardDescription>
                  Based on your spending patterns, these cards offer the best value
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {recommendations.slice(0, 3).map((rec) => (
                    <div key={rec.cardId} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <span className="bg-primary text-primary-foreground text-sm px-2 py-1 rounded">
                              #{rec.rank}
                            </span>
                            <h3 className="text-lg font-semibold">Credit Card {rec.cardId}</h3>
                          </div>
                          <p className="text-muted-foreground">{rec.primaryReason}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-green-600">
                            {formatCurrency(rec.potentialSavings)}
                          </p>
                          <p className="text-sm text-muted-foreground">Potential Savings</p>
                        </div>
                      </div>

                      <div className="grid md:grid-cols-3 gap-4 mb-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Score</p>
                          <p className="font-medium">{rec.score}/100</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Yearly Estimate</p>
                          <p className="font-medium">{formatCurrency(rec.yearlyEstimate)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Confidence</p>
                          <p className="font-medium">{Math.round(rec.confidenceScore * 100)}%</p>
                        </div>
                      </div>

                      {rec.pros && rec.pros.length > 0 && (
                        <div className="mb-4">
                          <p className="text-sm font-medium text-green-700 dark:text-green-300 mb-2">Pros:</p>
                          <ul className="text-sm space-y-1">
                            {rec.pros.slice(0, 3).map((pro, i) => (
                              <li key={i} className="flex items-start gap-2">
                                <span className="text-green-500 mt-1">•</span>
                                <span>{pro}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      <Button className="w-full sm:w-auto">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Learn More
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Spending Analysis */}
          {analysis && analysis.categoryAnalysis && analysis.categoryAnalysis.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-6 w-6" />
                  Spending Breakdown
                </CardTitle>
                <CardDescription>
                  Your spending organized by category
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analysis.categoryAnalysis.slice(0, 5).map((category, index) => (
                    <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <div>
                        <p className="font-medium">{category.category}</p>
                        <p className="text-sm text-muted-foreground">
                          {category.transactionCount} transactions • Total: {formatCurrency(category.amount)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">{formatCurrency(category.amount)}</p>
                        <p className="text-sm text-muted-foreground">
                          {category.percentage}% of total
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* All Transactions */}
          {transactions && transactions.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <CreditCard className="h-6 w-6" />
                      All Transactions ({transactions.length})
                    </CardTitle>
                    <CardDescription>
                      Complete list of your categorized transactions
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {transactions.map((transaction) => (
                    <div key={transaction.id} className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors">
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <p className="font-medium text-lg">{transaction.description}</p>
                          <p className={`font-bold text-lg ${Number(transaction.amount) >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                            {formatCurrency(Math.abs(Number(transaction.amount)))}
                          </p>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {new Date(transaction.date).toLocaleDateString('en-IN', { 
                              day: 'numeric', 
                              month: 'short', 
                              year: 'numeric' 
                            })}
                          </span>
                          {transaction.merchant && (
                            <span className="flex items-center gap-1">
                              <Building2 className="h-4 w-4" />
                              {transaction.merchant}
                            </span>
                          )}
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            transaction.categoryName === 'Other' 
                              ? 'bg-gray-100 text-gray-700' 
                              : 'bg-blue-100 text-blue-700'
                          }`}>
                            {transaction.categoryName || 'Uncategorized'}
                          </span>
                          {transaction.subCategoryName && (
                            <span className="px-2 py-1 rounded-full text-xs bg-purple-100 text-purple-700">
                              {transaction.subCategoryName}
                            </span>
                          )}
                          {transaction.mccCode && (
                            <span className="text-xs font-mono bg-gray-100 px-2 py-1 rounded">
                              MCC: {transaction.mccCode}
                            </span>
                          )}
                          {transaction.confidence && (
                            <span className={`text-xs px-2 py-1 rounded ${
                              Number(transaction.confidence) >= 0.8 
                                ? 'bg-green-100 text-green-700' 
                                : Number(transaction.confidence) >= 0.6 
                                ? 'bg-yellow-100 text-yellow-700' 
                                : 'bg-red-100 text-red-700'
                            }`}>
                              {Math.round(Number(transaction.confidence) * 100)}% confidence
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
