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
  Zap,
  Shield,
  TrendingDown
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
        await fetchSessionStatus(sessionToken);
        await Promise.all([
          fetchTransactions(sessionToken),
          fetchRecommendations(sessionToken),
          fetchAnalysis(sessionToken)
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate('/')}
            className="flex items-center gap-2 hover:bg-blue-100 text-blue-700"
          >
            <ArrowLeft className="h-4 w-4" />
            Start New Analysis
          </Button>
          <Button 
            variant="outline" 
            className="flex items-center gap-2 hover:bg-blue-50 border-blue-200"
            onClick={handleExportReport}
          >
            <Download className="h-4 w-4" />
            Export Report
          </Button>
        </div>

        {/* Title Section */}
        <div className="text-center bg-white rounded-2xl p-8 shadow-lg border mb-8">
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Your Credit Card Analysis
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Based on your spending patterns, here are your personalized insights and recommendations
          </p>
        </div>

        <div className="space-y-8">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
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

          {/* Credit Card Recommendations - MAIN FEATURE */}
          {recommendations && recommendations.length > 0 && (
            <Card className="bg-white shadow-xl border-0">
              <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-t-lg">
                <CardTitle className="flex items-center gap-3 text-2xl">
                  <Award className="h-8 w-8" />
                  🏆 Recommended Credit Cards
                </CardTitle>
                <CardDescription className="text-blue-100 text-lg">
                  Based on your spending patterns, these cards offer the best value for you
                </CardDescription>
              </CardHeader>
              <CardContent className="p-8">
                <div className="space-y-8">
                  {recommendations.slice(0, 5).map((rec, index) => (
                    <div key={rec.card?.id || index} className="border-2 border-gray-100 rounded-2xl p-6 hover:border-blue-200 hover:shadow-lg transition-all duration-300">
                      <div className="flex items-start justify-between mb-6">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            <span className="bg-gradient-to-r from-blue-500 to-purple-500 text-white text-lg font-bold px-4 py-2 rounded-full shadow-lg">
                              #{rec.rank}
                            </span>
                            <div>
                              <h3 className="text-2xl font-bold text-gray-800">{rec.card?.name || `Card ${rec.rank}`}</h3>
                              <p className="text-lg text-gray-600">{rec.card?.issuer} • {rec.card?.network}</p>
                            </div>
                          </div>
                          <p className="text-gray-700 mb-4 text-lg">{rec.card?.description || rec.primaryReason}</p>
                          
                          {/* Card Details Grid */}
                          <div className="grid md:grid-cols-4 gap-4 mb-4">
                            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                              <p className="text-sm text-green-600 font-medium">Annual Fee</p>
                              <p className="text-xl font-bold text-green-700">
                                {rec.card?.annualFee ? formatCurrency(Number(rec.card.annualFee)) : 'N/A'}
                              </p>
                            </div>
                            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                              <p className="text-sm text-blue-600 font-medium">Signup Bonus</p>
                              <p className="text-xl font-bold text-blue-700">
                                {rec.card?.signupBonus ? `${Number(rec.card.signupBonus).toLocaleString()} pts` : 'N/A'}
                              </p>
                            </div>
                            <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                              <p className="text-sm text-purple-600 font-medium">Score</p>
                              <p className="text-xl font-bold text-purple-700">{rec.score}/100</p>
                            </div>
                            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                              <p className="text-sm text-yellow-600 font-medium">Credit Req.</p>
                              <p className="text-lg font-bold text-yellow-700 capitalize">{rec.card?.creditRequirement}</p>
                            </div>
                          </div>

                          {/* Pros and Cons */}
                          <div className="grid md:grid-cols-2 gap-6 mb-4">
                            {rec.pros && rec.pros.length > 0 && (
                              <div>
                                <h4 className="font-semibold text-green-700 mb-2 flex items-center gap-2">
                                  <Zap className="h-4 w-4" />
                                  Pros
                                </h4>
                                <ul className="space-y-1">
                                  {rec.pros.map((pro, i) => (
                                    <li key={i} className="text-green-600 text-sm flex items-start gap-2">
                                      <span className="text-green-500 mt-1">•</span>
                                      {pro}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            {rec.cons && rec.cons.length > 0 && (
                              <div>
                                <h4 className="font-semibold text-red-700 mb-2 flex items-center gap-2">
                                  <Shield className="h-4 w-4" />
                                  Cons
                                </h4>
                                <ul className="space-y-1">
                                  {rec.cons.map((con, i) => (
                                    <li key={i} className="text-red-600 text-sm flex items-start gap-2">
                                      <span className="text-red-500 mt-1">•</span>
                                      {con}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Apply Button */}
                      {rec.card?.applyUrl && (
                        <div className="flex justify-end">
                          <Button 
                            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-3 text-lg"
                            onClick={() => window.open(rec.card.applyUrl, '_blank')}
                          >
                            Apply Now
                            <ExternalLink className="h-4 w-4 ml-2" />
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Spending Analysis */}
          {analysis && analysis.categoryAnalysis && analysis.categoryAnalysis.length > 0 && (
            <Card className="bg-white shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-2xl">
                  <PieChart className="h-6 w-6 text-blue-600" />
                  Spending Breakdown
                </CardTitle>
                <CardDescription className="text-lg">
                  Your spending organized by category
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analysis.categoryAnalysis.slice(0, 5).map((category, index) => (
                    <div key={index} className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200">
                      <div>
                        <p className="font-semibold text-lg text-gray-800">{category.category}</p>
                        <p className="text-gray-600">
                          {category.transactionCount} transactions • Total: {formatCurrency(Number(category.amount))}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-xl text-gray-800">{formatCurrency(Number(category.amount))}</p>
                        <p className="text-sm text-gray-600">
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
            <Card className="bg-white shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-2xl">
                  <CreditCard className="h-6 w-6 text-purple-600" />
                  All Transactions ({transactions.length})
                </CardTitle>
                <CardDescription className="text-lg">
                  Complete list of your categorized transactions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {transactions.map((transaction) => (
                    <div key={transaction.id} className="flex items-center justify-between p-5 rounded-xl border-2 border-gray-100 bg-gradient-to-r from-white to-gray-50 hover:border-blue-200 hover:shadow-md transition-all duration-300">
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-3">
                          <p className="font-semibold text-lg text-gray-800">{transaction.description}</p>
                          <p className={`font-bold text-xl ${Number(transaction.amount) >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                            {formatCurrency(Math.abs(Number(transaction.amount)))}
                          </p>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-600 flex-wrap">
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
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            transaction.categoryName === 'Other' 
                              ? 'bg-gray-100 text-gray-700' 
                              : 'bg-blue-100 text-blue-700'
                          }`}>
                            {transaction.categoryName || 'Uncategorized'}
                          </span>
                          {transaction.subCategoryName && (
                            <span className="px-3 py-1 rounded-full text-xs bg-purple-100 text-purple-700 font-medium">
                              {transaction.subCategoryName}
                            </span>
                          )}
                          {transaction.mccCode && (
                            <span className="text-xs font-mono bg-gray-100 px-2 py-1 rounded border">
                              MCC: {transaction.mccCode}
                            </span>
                          )}
                          {transaction.confidence && (
                            <span className={`text-xs px-3 py-1 rounded-full font-medium ${
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
