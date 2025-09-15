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
  Building2,
  Award,
  TrendingDown
} from 'lucide-react';
import { CreditCardVisual } from '../components/CreditCardVisual';
import { DonutChart } from '../components/DonutChart';

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
    error,
    currentPage,
    totalPages
  } = useSessionStore();

  useEffect(() => {
    if (!sessionToken) {
      navigate('/');
      return;
    }

    // First fetch session status, then fetch other data
    const loadData = async () => {
      try {
        await fetchSessionStatus(sessionToken);
        await Promise.all([
          fetchTransactions(1),
          fetchRecommendations(),
          fetchAnalysis()
        ]);
      } catch (error) {
        console.error('Failed to load data:', error);
      }
    };

    loadData();
  }, [sessionToken, navigate, fetchSessionStatus, fetchTransactions, fetchRecommendations, fetchAnalysis]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  const handleExportReport = () => {
    const reportData = {
      sessionInfo: {
        sessionToken,
        totalSpend: session?.totalSpend,
        totalTransactions: session?.totalTransactions,
        topCategory: session?.topCategory,
        analysisDate: new Date().toLocaleDateString('en-IN')
      },
      transactions: transactions || [],
      recommendations: recommendations || [],
      analysis: analysis || {}
    };

    const dataStr = JSON.stringify(reportData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `credit-card-analysis-${sessionToken?.slice(-8)}-${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  if (isLoading || !session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <Card className="w-full max-w-md">
          <CardContent className="flex items-center justify-center p-8">
            <div className="flex items-center gap-3">
              <RefreshCw className="h-6 w-6 animate-spin text-blue-600" />
              <span className="text-lg">Loading your analysis...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 via-white to-orange-50">
        <Card className="w-full max-w-md border-red-200">
          <CardContent className="p-8 text-center">
            <div className="text-red-600 mb-4">
              <TrendingDown className="h-12 w-12 mx-auto" />
            </div>
            <h2 className="text-xl font-semibold text-red-800 mb-2">Analysis Error</h2>
            <p className="text-red-600 mb-4">{error.message}</p>
            <Button onClick={() => navigate('/')} variant="outline">
              Start New Analysis
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handlePrevPage = () => {
    if (currentPage > 1) {
      fetchTransactions(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < (totalPages || 1)) {
      fetchTransactions(currentPage + 1);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 md:px-6 py-6 md:py-8 max-w-[110rem]">
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
          <Button 
            variant="outline" 
            className="flex items-center gap-2"
            onClick={handleExportReport}
          >
            <Download className="h-4 w-4" />
            Export Report
          </Button>
        </div>

        {/* Title Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-semibold text-foreground">Your Credit Card Analysis</h1>
          <p className="text-muted-foreground mt-1">Insights and recommendations based on your spending.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main column */}
          <div className="lg:col-span-9 space-y-8">
            {/* Summary Cards (placed after header row) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
            <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 hover:shadow-lg transition-all duration-300 hover:scale-105">
              <CardContent className="flex items-center p-6">
                <div className="bg-green-500 p-3 rounded-full mr-4 shadow-lg">
                  <DollarSign className="h-8 w-8 text-white" />
                </div>
                <div>
                  <p className="text-3xl font-bold text-green-700">
                    {session.totalSpend ? formatCurrency(Number(session.totalSpend)) : 'N/A'}
                  </p>
                  <p className="text-sm font-medium text-green-600">Total Spend</p>
                  <p className="text-xs text-green-500">Across {session.totalTransactions} transactions</p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 hover:shadow-lg transition-all duration-300 hover:scale-105">
              <CardContent className="flex items-center p-6">
                <div className="bg-blue-500 p-3 rounded-full mr-4 shadow-lg">
                  <PieChart className="h-8 w-8 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-blue-700">
                    {session.topCategory || 'Other'}
                  </p>
                  <p className="text-sm font-medium text-blue-600">Top Category</p>
                  <p className="text-xs text-blue-500">Your highest spending area</p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 hover:shadow-lg transition-all duration-300 hover:scale-105">
              <CardContent className="flex items-center p-6">
                <div className="bg-purple-500 p-3 rounded-full mr-4 shadow-lg">
                  <TrendingUp className="h-8 w-8 text-white" />
                </div>
                <div>
                  <p className="text-3xl font-bold text-purple-700">{session.categorizedCount || 0}</p>
                  <Progress value={100} className="w-full mt-2" />
                  <p className="text-sm font-medium text-purple-600 mt-1">Categorized</p>
                  <p className="text-xs text-purple-500">100% categorized</p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200 hover:shadow-lg transition-all duration-300 hover:scale-105">
              <CardContent className="flex items-center p-6">
                <div className="bg-yellow-500 p-3 rounded-full mr-4 shadow-lg">
                  <Star className="h-8 w-8 text-white" />
                </div>
                <div>
                  <p className="text-3xl font-bold text-yellow-700">
                    {recommendations ? recommendations.length : 0}
                  </p>
                  <p className="text-sm font-medium text-yellow-600">Recommendations</p>
                  <p className="text-xs text-yellow-500">Cards matched to your profile</p>
                </div>
              </CardContent>
            </Card>
            </div>

            {/* Credit Card Recommendations */}
          {recommendations && recommendations.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-6 w-6" />
                  Recommended Credit Cards
                </CardTitle>
                <CardDescription>
                  Based on your spending patterns, these cards offer the best value for you
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {recommendations.slice(0, 8).map((rec, index) => (
                    <div key={rec.card?.id || index} className="border rounded-xl p-5 hover:shadow-sm transition-shadow grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <CreditCardVisual title={rec.card?.name || `Card ${rec.rank}`} issuer={rec.card?.issuer} network={rec.card?.network} rank={rec.rank} />
                      <div>
                        <h3 className="text-lg font-semibold text-foreground">{rec.card?.name || `Card ${rec.rank}`}</h3>
                        <p className="text-sm text-muted-foreground">{rec.card?.issuer} • {rec.card?.network}</p>
                        {rec.card?.description && (
                          <p className="text-sm text-muted-foreground mt-3 line-clamp-3">{rec.card.description}</p>
                        )}
                        <div className="grid grid-cols-2 gap-4 mt-4">
                          <div className="border rounded-lg p-3">
                            <p className="text-xs text-muted-foreground">Annual Fee</p>
                            <p className="font-medium">{rec.card?.annualFee ? formatCurrency(Number(rec.card.annualFee)) : 'N/A'}</p>
                          </div>
                          <div className="border rounded-lg p-3">
                            <p className="text-xs text-muted-foreground">Signup Bonus</p>
                            <p className="font-medium">{rec.card?.signupBonus ? `${Number(rec.card.signupBonus).toLocaleString()} pts` : 'N/A'}</p>
                          </div>
                          <div className="border rounded-lg p-3">
                            <p className="text-xs text-muted-foreground">Score</p>
                            <p className="font-medium">{rec.score}/100</p>
                          </div>
                          <div className="border rounded-lg p-3">
                            <p className="text-xs text-muted-foreground">Confidence</p>
                            <p className="font-medium">{Number.isFinite(rec.confidenceScore) ? Math.round(rec.confidenceScore * 100) : 0}%</p>
                          </div>
                        </div>
                        {rec.card?.applyUrl && (
                          <div className="mt-5">
                            <Button className="w-full" onClick={() => window.open(rec.card!.applyUrl, '_blank')}>
                              Apply Now
                              <ExternalLink className="h-4 w-4 ml-2" />
                            </Button>
                          </div>
                        )}
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
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-6 w-6" />
                  Transactions
                </CardTitle>
                <CardDescription>
                  Page {currentPage} of {totalPages}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {transactions.map((transaction) => (
                    <div key={transaction.id} className="flex items-center justify-between p-4 rounded-lg border bg-card">
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <p className="font-medium text-foreground">{transaction.description}</p>
                          <p className={`font-semibold ${Number(transaction.amount) >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                            {formatCurrency(Math.abs(Number(transaction.amount)))}
                          </p>
                        </div>
                        <div className="mt-1 flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5" />
                            {new Date(transaction.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </span>
                          {transaction.merchant && (
                            <span className="flex items-center gap-1">
                              <Building2 className="h-3.5 w-3.5" />
                              {transaction.merchant}
                            </span>
                          )}
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                            transaction.categoryName === 'Other' ? 'bg-gray-100 text-gray-700' : 'bg-blue-100 text-blue-700'
                          }`}>
                            {transaction.categoryName || 'Uncategorized'}
                          </span>
                          {transaction.subCategoryName && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] bg-purple-100 text-purple-700 font-medium">
                              {transaction.subCategoryName}
                            </span>
                          )}
                          {transaction.mccCode && (
                            <span className="text-[10px] font-mono bg-gray-100 px-1.5 py-0.5 rounded border">
                              MCC: {transaction.mccCode}
                            </span>
                          )}
                          {transaction.confidence && (
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
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

                {/* Pagination Controls */}
                <div className="mt-4 flex items-center justify-between">
                  <Button variant="outline" size="sm" onClick={handlePrevPage} disabled={currentPage <= 1}>
                    Previous
                  </Button>
                  <span className="text-sm text-muted-foreground">Page {currentPage} of {totalPages}</span>
                  <Button variant="outline" size="sm" onClick={handleNextPage} disabled={currentPage >= (totalPages || 1)}>
                    Next
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
          </div>

          {/* Sidebar column */}
          <div className="lg:col-span-3 space-y-6">
            {/* KPI cards moved above chart on sidebar for better hierarchy on large screens */}
            <div className="hidden lg:grid grid-cols-1 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">Total Spend</p>
                      <p className="mt-1 text-xl font-semibold">{session.totalSpend ? formatCurrency(Number(session.totalSpend)) : 'N/A'}</p>
                    </div>
                    <DollarSign className="h-6 w-6 text-foreground/60" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">Top Category</p>
                      <p className="mt-1 font-semibold">{session.topCategory || 'N/A'}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="w-full">
                      <p className="text-xs text-muted-foreground">Categorized</p>
                      <Progress value={session.totalTransactions ? (session.categorizedCount || 0) / session.totalTransactions * 100 : 0} className="mt-2 h-2" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
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
                  <div className="flex items-start gap-4">
                    <div className="min-w-[140px] w-[45%] sm:w-[160px]">
                      <DonutChart
                      slices={analysis.categoryAnalysis.slice(0, 6).map((c, i) => ({
                        label: c.category,
                        value: Math.max(0, Math.min(100, c.percentage)),
                        color: ['#2563eb', '#7c3aed', '#16a34a', '#f59e0b', '#ef4444', '#0ea5e9'][i % 6]
                      }))}
                      />
                    </div>
                    <div className="flex-1 space-y-2 min-w-0">
                      {analysis.categoryAnalysis.slice(0, 6).map((category, index) => (
                        <div key={index} className="flex items-center justify-between text-sm">
                          <span className="truncate max-w-[55%]">{category.category}</span>
                          <span className="text-muted-foreground">{category.percentage}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
