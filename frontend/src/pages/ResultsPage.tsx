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
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

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
      }));
      if (recRows.length) {
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(recRows), 'Recommendations');
      }

      // Transactions sheet (limited columns for clarity)
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <Card className="bg-white border-green-200 shadow-sm hover:shadow-md transition-all duration-200">
                <CardContent className="flex items-center p-4">
                  <div className="bg-green-500 p-2 rounded-full mr-3 shadow-sm">
                    <DollarSign className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="text-xl font-bold text-green-700">
                      {session.totalSpend ? formatCurrency(Number(session.totalSpend)) : 'N/A'}
                    </p>
                    <p className="text-xs font-medium text-green-600">Total Spend</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white border-blue-200 shadow-sm hover:shadow-md transition-all duration-200">
                <CardContent className="flex items-center p-4">
                  <div className="bg-blue-500 p-2 rounded-full mr-3 shadow-sm">
                    <PieChart className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="text-xl font-bold text-blue-700">
                      {session.topCategory || 'Other'}
                    </p>
                    <p className="text-xs font-medium text-blue-600">Top Category</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white border-purple-200 shadow-sm hover:shadow-md transition-all duration-200">
                <CardContent className="flex items-center p-4">
                  <div className="bg-purple-500 p-2 rounded-full mr-3 shadow-sm">
                    <TrendingUp className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="text-xl font-bold text-purple-700">
                      {session.totalTransactions || '0'}
                    </p>
                    <p className="text-xs font-medium text-purple-600">Categorized</p>
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
                <div className="grid grid-cols-1 gap-4">
                  {recommendations.slice(0, 5).map((rec, index) => (
                    <div key={rec.card?.id || index} className="border rounded-xl p-4 hover:shadow-md transition-shadow flex flex-row gap-4 overflow-hidden">
                      <div className="flex-shrink-0">
                        <CreditCardVisual title={rec.card?.name || `Card ${rec.rank}`} issuer={rec.card?.issuer} network={rec.card?.network} rank={rec.rank} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold text-foreground truncate">{rec.card?.name || `Card ${rec.rank}`}</h3>
                        <p className="text-sm text-muted-foreground truncate">{rec.card?.issuer} • {rec.card?.network}</p>
                        {rec.card?.description && (
                          <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{rec.card.description}</p>
                        )}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3">
                          <div className="border rounded-lg p-2">
                            <p className="text-xs text-muted-foreground">Annual Fee</p>
                            <p className="font-medium truncate">{rec.card?.annualFee ? formatCurrency(Number(rec.card.annualFee)) : 'N/A'}</p>
                          </div>
                          <div className="border rounded-lg p-2">
                            <p className="text-xs text-muted-foreground">Bonus</p>
                            <p className="font-medium truncate">{rec.card?.signupBonus ? `${Number(rec.card.signupBonus).toLocaleString()} pts` : 'N/A'}</p>
                          </div>
                          <div className="border rounded-lg p-2">
                            <p className="text-xs text-muted-foreground">Score</p>
                            <p className="font-medium">{rec.score}/100</p>
                          </div>
                          <div className="border rounded-lg p-2">
                            <p className="text-xs text-muted-foreground">Match</p>
                            <p className="font-medium">{Number.isFinite(rec.confidenceScore) ? Math.round(rec.confidenceScore * 100) : 0}%</p>
                          </div>
                        </div>
                        {rec.card?.applyUrl && (
                          <div className="mt-3">
                            <Button className="w-full sm:w-auto" onClick={() => window.open(rec.card!.applyUrl, '_blank')}>
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
                <div className="overflow-x-auto">
                  <div className="space-y-2 min-w-full">
                    {transactions.map((transaction) => (
                      <div key={transaction.id} className="flex items-center justify-between p-3 rounded-lg border bg-card">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="font-medium text-foreground truncate max-w-[60%]">{transaction.description}</p>
                            <p className={`font-semibold ${Number(transaction.amount) >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                              {formatCurrency(Math.abs(Number(transaction.amount)))}
                            </p>
                          </div>
                          <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                            <span className="flex items-center gap-1 whitespace-nowrap">
                              <Calendar className="h-3.5 w-3.5" />
                              {new Date(transaction.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </span>
                            {transaction.merchant && (
                              <span className="flex items-center gap-1 truncate max-w-[150px]">
                                <Building2 className="h-3.5 w-3.5 flex-shrink-0" />
                                <span className="truncate">{transaction.merchant}</span>
                              </span>
                            )}
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                              transaction.categoryName === 'Other' ? 'bg-gray-100 text-gray-700' : 'bg-blue-100 text-blue-700'
                            }`}>
                              {transaction.categoryName || 'Uncategorized'}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
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
                  <div className="flex flex-col items-center gap-6">
                    <div className="w-[180px] h-[180px] flex-shrink-0">
                      <DonutChart
                      slices={analysis.categoryAnalysis.slice(0, 6).map((c, i) => ({
                        label: c.category,
                        value: Math.max(0, Math.min(100, c.percentage)),
                        color: ['#2563eb', '#7c3aed', '#16a34a', '#f59e0b', '#ef4444', '#0ea5e9'][i % 6]
                      }))}
                      />
                    </div>
                    <div className="w-full grid gap-x-4 gap-y-2">
                      {analysis.categoryAnalysis.slice(0, 6).map((category, index) => (
                        <div key={index} className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-1">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: ['#2563eb', '#7c3aed', '#16a34a', '#f59e0b', '#ef4444', '#0ea5e9'][index % 6] }}></div>
                            <span className="truncate">{category.category}</span>
                          </div>
                          <span className="text-muted-foreground ml-1">{category.percentage}%</span>
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
