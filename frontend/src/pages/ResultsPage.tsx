import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSessionStore } from '../store/useSessionStore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Separator } from '../components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { 
  CreditCard, 
  PieChart, 
  DollarSign, 
  ExternalLink,
  ArrowLeft,
  Download,
  RefreshCw,
  Calendar,
  Building2,
  Award,
  Star,
  Target,
  BarChart3,
  Activity,
  Zap,
  Shield,
  CheckCircle,
  XCircle,
  AlertCircle,
  ThumbsUp,
  ThumbsDown,
  ArrowUpRight,
  ArrowDownRight,
  Eye,
  Info,
  Users,
  CreditCardIcon as CreditCardIcon,
  Trophy
} from 'lucide-react';
import { DonutChart } from '../components/DonutChart';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  color: 'blue' | 'green' | 'purple' | 'orange' | 'red';
}

function MetricCard({ title, value, icon, trend, color }: MetricCardProps) {
  const colorClasses = {
    blue: 'border-blue-200 bg-blue-50/50',
    green: 'border-green-200 bg-green-50/50',
    purple: 'border-purple-200 bg-purple-50/50',
    orange: 'border-orange-200 bg-orange-50/50',
    red: 'border-red-200 bg-red-50/50'
  };

  const iconColorClasses = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    purple: 'bg-purple-500',
    orange: 'bg-orange-500',
    red: 'bg-red-500'
  };

  return (
    <Card className={`${colorClasses[color]} hover:shadow-lg transition-all duration-300 hover:scale-105`}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            {trend && (
              <div className="flex items-center space-x-1">
                {trend.isPositive ? (
                  <ArrowUpRight className="h-4 w-4 text-green-600" />
                ) : (
                  <ArrowDownRight className="h-4 w-4 text-red-600" />
                )}
                <span className={`text-sm font-medium ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
                  {Math.abs(trend.value)}%
                </span>
              </div>
            )}
          </div>
          <div className={`${iconColorClasses[color]} p-3 rounded-full shadow-lg`}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface RecommendationCardProps {
  recommendation: any;
  index: number;
  formatCurrency: (amount: number) => string;
}

function RecommendationCard({ recommendation: rec, index, formatCurrency }: RecommendationCardProps) {
  const [showDetails, setShowDetails] = useState(false);

  const rankColors = {
    1: 'bg-gradient-to-r from-yellow-400 to-orange-500',
    2: 'bg-gradient-to-r from-gray-300 to-gray-500',
    3: 'bg-gradient-to-r from-amber-600 to-yellow-700'
  };

  const rankIcons = {
    1: '🏆',
    2: '🥈',
    3: '🥉'
  };

  return (
    <Card className="hover:shadow-xl transition-all duration-300 group border-l-4 border-l-blue-500">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className={`
              ${index < 3 ? rankColors[index + 1 as keyof typeof rankColors] : 'bg-gradient-to-r from-blue-500 to-purple-600'} 
              w-12 h-12 rounded-full flex items-center justify-center text-white font-bold shadow-lg
            `}>
              {index < 3 ? rankIcons[index + 1 as keyof typeof rankIcons] : `#${rec.rank}`}
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                {rec.card?.name || `Card ${rec.rank}`}
              </h3>
              <p className="text-gray-600">{rec.card?.issuer} • {rec.card?.network}</p>
            </div>
          </div>
          <div className="text-right">
            <div className="flex items-center space-x-2 mb-1">
              <Star className="h-4 w-4 text-yellow-500 fill-current" />
              <span className="font-bold text-lg">{rec.score}/100</span>
            </div>
            <Badge variant={rec.score >= 80 ? "default" : rec.score >= 60 ? "secondary" : "outline"}>
              {rec.score >= 80 ? 'Excellent' : rec.score >= 60 ? 'Good' : 'Fair'} Match
            </Badge>
          </div>
        </div>

        <div className="mb-4">
          <p className="text-gray-700 font-medium mb-2">Why this card?</p>
          <p className="text-gray-600 text-sm leading-relaxed">{rec.primaryReason}</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div className="bg-gray-50 p-3 rounded-lg text-center">
            <p className="text-xs text-gray-500 mb-1">Annual Fee</p>
            <p className="font-semibold text-gray-900">
              {rec.card?.annualFee ? formatCurrency(Number(rec.card.annualFee)) : 'FREE'}
            </p>
          </div>
          <div className="bg-gray-50 p-3 rounded-lg text-center">
            <p className="text-xs text-gray-500 mb-1">Signup Bonus</p>
            <p className="font-semibold text-gray-900">
              {rec.card?.signupBonus ? `${Number(rec.card.signupBonus).toLocaleString()} pts` : 'None'}
            </p>
          </div>
          <div className="bg-gray-50 p-3 rounded-lg text-center">
            <p className="text-xs text-gray-500 mb-1">Potential Savings</p>
            <p className="font-semibold text-green-600">
              {rec.potentialSavings ? formatCurrency(rec.potentialSavings) : 'TBD'}
            </p>
          </div>
          <div className="bg-gray-50 p-3 rounded-lg text-center">
            <p className="text-xs text-gray-500 mb-1">Confidence</p>
            <p className="font-semibold text-blue-600">
              {Number.isFinite(rec.confidenceScore) ? Math.round(rec.confidenceScore * 100) : 0}%
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowDetails(!showDetails)}
            className="flex items-center space-x-2"
          >
            <Eye className="h-4 w-4" />
            <span>{showDetails ? 'Hide' : 'Show'} Details</span>
          </Button>
          
          {rec.card?.applyUrl && (
            <Button 
              onClick={() => window.open(rec.card!.applyUrl, '_blank')}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              Apply Now
              <ExternalLink className="h-4 w-4 ml-2" />
            </Button>
          )}
        </div>

        {showDetails && (
          <div className="mt-4 pt-4 border-t border-gray-200 space-y-4">
            {rec.pros && rec.pros.length > 0 && (
              <div>
                <h4 className="font-semibold text-green-700 mb-2 flex items-center">
                  <ThumbsUp className="h-4 w-4 mr-2" />
                  Pros
                </h4>
                <ul className="space-y-1">
                  {rec.pros.map((pro: string, idx: number) => (
                    <li key={idx} className="flex items-start space-x-2 text-sm text-gray-600">
                      <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>{pro}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {rec.cons && rec.cons.length > 0 && (
              <div>
                <h4 className="font-semibold text-red-700 mb-2 flex items-center">
                  <ThumbsDown className="h-4 w-4 mr-2" />
                  Cons
                </h4>
                <ul className="space-y-1">
                  {rec.cons.map((con: string, idx: number) => (
                    <li key={idx} className="flex items-start space-x-2 text-sm text-gray-600">
                      <XCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                      <span>{con}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {rec.benefitBreakdown && rec.benefitBreakdown.length > 0 && (
              <div>
                <h4 className="font-semibold text-blue-700 mb-2 flex items-center">
                  <Target className="h-4 w-4 mr-2" />
                  Benefit Breakdown
                </h4>
                <div className="space-y-2">
                  {rec.benefitBreakdown.map((benefit: any, idx: number) => (
                    <div key={idx} className="bg-blue-50 p-3 rounded-lg">
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-gray-900">{benefit.category}</span>
                        <span className="text-sm text-gray-600">
                          {benefit.cardRate}% earning rate
                        </span>
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        Spent: {formatCurrency(benefit.spentAmount)} → 
                        Earned: {formatCurrency(benefit.dollarValue)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface TransactionRowProps {
  transaction: any;
  formatCurrency: (amount: number) => string;
}

function TransactionRow({ transaction, formatCurrency }: TransactionRowProps) {
  const isCredit = Number(transaction.amount) < 0;
  const amount = Math.abs(Number(transaction.amount));

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0 space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-gray-900 truncate pr-4">{transaction.description}</h4>
              <div className="flex items-center space-x-2">
                <span className={`font-bold text-lg ${isCredit ? 'text-green-600' : 'text-red-600'}`}>
                  {isCredit ? '+' : '-'}{formatCurrency(amount)}
                </span>
              </div>
            </div>
            
            <div className="flex items-center space-x-4 text-sm text-gray-500">
              <span className="flex items-center space-x-1">
                <Calendar className="h-4 w-4" />
                <span>{new Date(transaction.date).toLocaleDateString('en-IN', { 
                  day: 'numeric', 
                  month: 'short', 
                  year: 'numeric' 
                })}</span>
              </span>
              
              {transaction.merchant && (
                <span className="flex items-center space-x-1">
                  <Building2 className="h-4 w-4" />
                  <span className="truncate max-w-32">{transaction.merchant}</span>
                </span>
              )}

              <Badge 
                variant={transaction.categoryName === 'Other' ? 'secondary' : 'default'}
                className="text-xs"
              >
                {transaction.categoryName || 'Uncategorized'}
              </Badge>

              {transaction.confidence && (
                <span className="flex items-center space-x-1">
                  <Shield className="h-4 w-4" />
                  <span>{Math.round(Number(transaction.confidence) * 100)}%</span>
                </span>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

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

  const [activeTab, setActiveTab] = useState('overview');

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
    try {
      const wb = XLSX.utils.book_new();

      // Session Info sheet
      const sessionInfo = [
        ['Session Token', session?.sessionToken || sessionToken || ''],
        ['Analysis Date', new Date().toLocaleString('en-IN')],
        ['Total Spend', session?.totalSpend ?? ''],
        ['Total Transactions', session?.totalTransactions ?? ''],
        ['Categorized Count', session?.categorizedCount ?? ''],
        ['Top Category', session?.topCategory ?? ''],
      ];
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(sessionInfo), 'Session');

      // Recommendations sheet
      const recRows = (recommendations || []).map((r) => ({
        Rank: r.rank,
        Card: r.card?.name || '',
        Issuer: r.card?.issuer || '',
        Network: r.card?.network || '',
        AnnualFee: r.card?.annualFee ?? '',
        SignupBonusPts: r.card?.signupBonus ?? '',
        Score: r.score,
        MatchConfidencePct: Number.isFinite(r.confidenceScore) ? Math.round(r.confidenceScore * 100) : 0,
        PrimaryReason: r.primaryReason,
        PotentialSavings: r.potentialSavings || 0,
      }));
      if (recRows.length) {
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(recRows), 'Recommendations');
      }

      // Transactions sheet
      const txRows = (transactions || []).map((t) => ({
        Date: new Date(t.date).toLocaleDateString('en-IN'),
        Description: t.description,
        Merchant: t.merchant || '',
        Amount: t.amount,
        Category: t.categoryName || '',
        SubCategory: t.subCategoryName || '',
        MCC: t.mccCode || '',
        ConfidencePct: t.confidence != null ? Math.round(Number(t.confidence) * 100) : '',
      }));
      if (txRows.length) {
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(txRows), 'Transactions');
      }

      // Category Analysis sheet
      const catRows = (analysis?.categoryAnalysis || []).map((c) => ({
        Category: c.category,
        Percentage: c.percentage,
        Amount: c.amount,
        Transactions: c.transactionCount,
      }));
      if (catRows.length) {
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(catRows), 'Spending Breakdown');
      }

      const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const filename = `credit-card-analysis-${sessionToken?.slice(-8) || 'export'}-${new Date().toISOString().split('T')[0]}.xlsx`;
      const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      saveAs(blob, filename);
    } catch (err) {
      console.error('Failed to export excel:', err);
    }
  };

  if (isLoading || !session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <Card className="w-full max-w-md shadow-2xl">
          <CardContent className="flex flex-col items-center justify-center p-8 space-y-4">
            <div className="relative">
              <RefreshCw className="h-12 w-12 animate-spin text-blue-600" />
              <div className="absolute inset-0 h-12 w-12 rounded-full border-2 border-blue-200 border-t-transparent animate-spin"></div>
            </div>
            <div className="text-center space-y-2">
              <h2 className="text-xl font-semibold text-gray-900">Analyzing Your Data</h2>
              <p className="text-gray-600">Please wait while we process your financial information...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 via-white to-orange-50">
        <Card className="w-full max-w-md border-red-200 shadow-2xl">
          <CardContent className="p-8 text-center space-y-4">
            <div className="text-red-600 mb-4">
              <AlertCircle className="h-16 w-16 mx-auto" />
            </div>
            <h2 className="text-2xl font-bold text-red-800">Analysis Error</h2>
            <p className="text-red-600">{error.message}</p>
            <div className="space-y-2 pt-4">
              <Button onClick={() => navigate('/')} className="w-full">
              Start New Analysis
            </Button>
              <Button onClick={() => window.location.reload()} variant="outline" className="w-full">
                Try Again
              </Button>
            </div>
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

  const categorizationRate = session.totalTransactions ? (session.categorizedCount || 0) / session.totalTransactions * 100 : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50">
        {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="container mx-auto px-4 md:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            onClick={() => navigate('/')}
                className="flex items-center space-x-2 hover:bg-gray-100"
          >
                <ArrowLeft className="h-5 w-5" />
                <span>New Analysis</span>
          </Button>
              <Separator orientation="vertical" className="h-6" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Credit Card Analysis</h1>
                <p className="text-sm text-gray-600">Session: {sessionToken?.slice(-8)}</p>
              </div>
            </div>
          <Button 
            variant="outline" 
              className="flex items-center space-x-2"
            onClick={handleExportReport}
          >
            <Download className="h-4 w-4" />
              <span>Export Report</span>
          </Button>
          </div>
        </div>
        </div>

      <div className="container mx-auto px-4 md:px-6 py-8 max-w-7xl">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <MetricCard
            title="Total Spending"
            value={session.totalSpend ? formatCurrency(Number(session.totalSpend)) : '₹0'}
            icon={<DollarSign className="h-6 w-6 text-white" />}
            color="green"
          />
          <MetricCard
            title="Transactions"
            value={session.totalTransactions || 0}
            icon={<CreditCard className="h-6 w-6 text-white" />}
            color="blue"
          />
          <MetricCard
            title="Top Category"
            value={session.topCategory || 'Other'}
            icon={<PieChart className="h-6 w-6 text-white" />}
            color="purple"
          />
          <MetricCard
            title="Categorization Rate"
            value={`${Math.round(categorizationRate)}%`}
            icon={<Activity className="h-6 w-6 text-white" />}
            color="orange"
          />
        </div>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:w-fit lg:grid-cols-4">
            <TabsTrigger value="overview" className="flex items-center space-x-2">
              <BarChart3 className="h-4 w-4" />
              <span>Overview</span>
            </TabsTrigger>
            <TabsTrigger value="recommendations" className="flex items-center space-x-2">
              <Award className="h-4 w-4" />
              <span>Recommendations</span>
            </TabsTrigger>
            <TabsTrigger value="transactions" className="flex items-center space-x-2">
              <CreditCardIcon className="h-4 w-4" />
              <span>Transactions</span>
            </TabsTrigger>
            <TabsTrigger value="insights" className="flex items-center space-x-2">
              <Zap className="h-4 w-4" />
              <span>Insights</span>
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Spending Breakdown */}
              <div className="lg:col-span-2">
                <Card className="h-full">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <PieChart className="h-6 w-6" />
                      <span>Spending Breakdown</span>
                    </CardTitle>
                    <CardDescription>
                      How your money was spent across different categories
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {analysis && analysis.categoryAnalysis && analysis.categoryAnalysis.length > 0 ? (
                      <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="flex justify-center">
                            <div className="w-64 h-64">
                              <DonutChart
                                slices={analysis.categoryAnalysis.slice(0, 6).map((c, i) => ({
                                  label: c.category,
                                  value: Math.max(0, Math.min(100, Math.abs(c.percentage))),
                                  color: ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4'][i % 6]
                                }))}
                              />
                            </div>
                          </div>
                          <div className="space-y-3">
                            {analysis.categoryAnalysis.slice(0, 6).map((category, index) => (
                              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                <div className="flex items-center space-x-3">
                                  <div 
                                    className="w-4 h-4 rounded-full" 
                                    style={{ backgroundColor: ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4'][index % 6] }}
                                  ></div>
                                  <span className="font-medium text-gray-900">{category.category}</span>
                                </div>
                                <div className="text-right">
                                  <div className="font-bold text-gray-900">{formatCurrency(Number(category.amount))}</div>
                                  <div className="text-sm text-gray-600">{Math.abs(category.percentage).toFixed(1)}%</div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                  </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <PieChart className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No spending data available</p>
                  </div>
                    )}
                </CardContent>
              </Card>
              </div>

              {/* Quick Stats */}
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Info className="h-5 w-5" />
                      <span>Quick Stats</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Average Transaction</span>
                      <span className="font-semibold">
                        {session.totalTransactions && session.totalSpend ? 
                          formatCurrency(Number(session.totalSpend) / session.totalTransactions) : 
                          'N/A'
                        }
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Largest Purchase</span>
                      <span className="font-semibold">
                        {transactions && transactions.length > 0 ? 
                          formatCurrency(Math.max(...transactions.map(t => Number(t.amount)))) : 
                          'N/A'
                        }
                      </span>
                  </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Analysis Period</span>
                      <span className="font-semibold">
                        {transactions && transactions.length > 0 ? 
                          `${Math.ceil((new Date(Math.max(...transactions.map(t => new Date(t.date).getTime()))).getTime() - 
                                       new Date(Math.min(...transactions.map(t => new Date(t.date).getTime()))).getTime()) / 
                                      (1000 * 60 * 60 * 24))} days` : 
                          'N/A'
                        }
                      </span>
                  </div>
                </CardContent>
              </Card>

                {recommendations && recommendations.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <Trophy className="h-5 w-5" />
                        <span>Top Recommendation</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="text-center">
                        <div className="w-16 h-16 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-3">
                          <span className="text-2xl">🏆</span>
                        </div>
                        <h3 className="font-bold text-lg">{recommendations[0]?.card?.name}</h3>
                        <p className="text-gray-600 text-sm">{recommendations[0]?.card?.issuer}</p>
                        <div className="mt-2">
                          <Badge className="bg-green-100 text-green-800">
                            Score: {recommendations[0]?.score}/100
                          </Badge>
                  </div>
                  </div>
                      <Button 
                        className="w-full" 
                        onClick={() => setActiveTab('recommendations')}
                      >
                        View All Recommendations
                      </Button>
                </CardContent>
              </Card>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Recommendations Tab */}
          <TabsContent value="recommendations" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Award className="h-6 w-6" />
                  <span>Credit Card Recommendations</span>
                </CardTitle>
                <CardDescription>
                  Personalized recommendations based on your spending patterns and preferences
                </CardDescription>
              </CardHeader>
            </Card>

            {recommendations && recommendations.length > 0 ? (
              <div className="space-y-6">
                {recommendations.map((rec, index) => (
                  <RecommendationCard
                    key={rec.card?.id || index}
                    recommendation={rec}
                    index={index}
                    formatCurrency={formatCurrency}
                  />
                  ))}
                </div>
            ) : (
              <Card>
                <CardContent className="text-center py-12">
                  <Award className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-600 mb-2">No Recommendations Available</h3>
                  <p className="text-gray-500 mb-4">
                    We're still analyzing your data. Please check back in a few moments.
                  </p>
                  <Button onClick={() => window.location.reload()} variant="outline">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                  </Button>
              </CardContent>
            </Card>
          )}
          </TabsContent>

          {/* Transactions Tab */}
          <TabsContent value="transactions" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <CreditCardIcon className="h-6 w-6" />
                    <span>Transaction History</span>
                  </div>
                  <Badge variant="secondary">
                    Page {currentPage} of {totalPages}
                  </Badge>
                </CardTitle>
                <CardDescription>
                  Detailed view of all your transactions with categorization and insights
                </CardDescription>
              </CardHeader>
            </Card>

            {transactions && transactions.length > 0 ? (
              <div className="space-y-4">
                    {transactions.map((transaction) => (
                  <TransactionRow
                    key={transaction.id}
                    transaction={transaction}
                    formatCurrency={formatCurrency}
                  />
                ))}

                {/* Pagination */}
                <Card>
                  <CardContent className="flex items-center justify-between p-4">
                    <Button 
                      variant="outline" 
                      onClick={handlePrevPage} 
                      disabled={currentPage <= 1}
                    >
                    Previous
                  </Button>
                    <span className="text-sm text-gray-600">
                      Page {currentPage} of {totalPages} • {session.totalTransactions} total transactions
                    </span>
                    <Button 
                      variant="outline" 
                      onClick={handleNextPage} 
                      disabled={currentPage >= (totalPages || 1)}
                    >
                    Next
                  </Button>
              </CardContent>
            </Card>
          </div>
            ) : (
              <Card>
                <CardContent className="text-center py-12">
                  <CreditCardIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-600 mb-2">No Transactions Found</h3>
                  <p className="text-gray-500">
                    We couldn't find any transaction data for this session.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Insights Tab */}
          <TabsContent value="insights" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Zap className="h-6 w-6" />
                    <span>Spending Insights</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
                      <CheckCircle className="h-5 w-5 text-blue-600" />
                      <span className="text-sm">
                        Your spending is well categorized ({Math.round(categorizationRate)}% accuracy)
                      </span>
                    </div>
                    
                    {session.topCategory && (
                      <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
                        <Target className="h-5 w-5 text-green-600" />
                        <span className="text-sm">
                          Most spending in {session.topCategory} - look for cards with bonus rewards in this category
                        </span>
                      </div>
                    )}

                    {recommendations && recommendations.length > 0 && recommendations[0].score >= 80 && (
                      <div className="flex items-center space-x-3 p-3 bg-yellow-50 rounded-lg">
                        <Star className="h-5 w-5 text-yellow-600" />
                        <span className="text-sm">
                          Excellent match found! Consider applying for {recommendations[0].card?.name}
                        </span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Users className="h-6 w-6" />
                    <span>Optimization Tips</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="p-3 border-l-4 border-blue-500 bg-gray-50">
                      <h4 className="font-semibold text-gray-900 mb-1">💳 Card Strategy</h4>
                      <p className="text-sm text-gray-600">
                        Consider using different cards for different spending categories to maximize rewards
                      </p>
                    </div>
                    
                    <div className="p-3 border-l-4 border-green-500 bg-gray-50">
                      <h4 className="font-semibold text-gray-900 mb-1">📊 Track Spending</h4>
                      <p className="text-sm text-gray-600">
                        Regular analysis helps identify the best cards for your changing spending patterns
                      </p>
                    </div>

                    <div className="p-3 border-l-4 border-purple-500 bg-gray-50">
                      <h4 className="font-semibold text-gray-900 mb-1">🎯 Focus Areas</h4>
                      <p className="text-sm text-gray-600">
                        Look for signup bonuses and category multipliers that match your top spending categories
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Monthly Spending Trend */}
            {analysis?.monthlySpending && analysis.monthlySpending.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <BarChart3 className="h-6 w-6" />
                    <span>Monthly Spending Trend</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {analysis.monthlySpending.map((month, index) => (
                      <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <Calendar className="h-5 w-5 text-gray-600" />
                          <span className="font-medium">
                            {new Date(month.month).toLocaleDateString('en-IN', { 
                              month: 'long', 
                              year: 'numeric' 
                            })}
                          </span>
                    </div>
                        <div className="text-right">
                          <div className="font-bold">{formatCurrency(month.amount)}</div>
                          <div className="text-sm text-gray-600">{month.transactionCount} transactions</div>
                        </div>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}