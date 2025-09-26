import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Progress } from '../components/ui/progress';
import { Separator } from '../components/ui/separator';
import { RecommendationCard } from '../components/RecommendationCard';
import { DonutChart } from '../components/DonutChart';
import { SavingsBreakdownChart } from '../components/SavingsBreakdownChart';
import { CardComparison } from '../components/CardComparison';
import { RecommendationSummary } from '../components/RecommendationSummary';
import { apiClient } from '../services/api';
import type { RecommendationResponse, CreditCardRecommendation } from '../types';
import {
  TrendingUp,
  DollarSign,
  CreditCard,
  Target,
  Clock,
  Users,
  BarChart3,
  PieChart,
  Filter,
  Download,
  Share2,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Star,
  Zap,
  Award,
  ShoppingCart,
  Car,
  Plane,
  Coffee,
  Home,
  Smartphone
} from 'lucide-react';

export const EnhancedResultsPage: React.FC = () => {
  const { sessionToken } = useParams<{ sessionToken: string }>();
  const navigate = useNavigate();
  
  const [data, setData] = useState<RecommendationResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
  const [selectedCards, setSelectedCards] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState('recommendations');
  const [filters, setFilters] = useState({
    creditScore: '',
    maxAnnualFee: '',
    preferredNetwork: '',
    includeBusinessCards: false
  });

  useEffect(() => {
    if (!sessionToken) {
      navigate('/');
      return;
    }
    loadRecommendations();
  }, [sessionToken, navigate]);

  const loadRecommendations = async (customFilters?: typeof filters) => {
    if (!sessionToken) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const filtersToUse = customFilters || filters;
      const options = {
        ...(filtersToUse.creditScore && { creditScore: filtersToUse.creditScore }),
        ...(filtersToUse.maxAnnualFee && { maxAnnualFee: parseInt(filtersToUse.maxAnnualFee) }),
        ...(filtersToUse.preferredNetwork && { preferredNetwork: filtersToUse.preferredNetwork }),
        includeBusinessCards: filtersToUse.includeBusinessCards
      };

      const response = await apiClient.getRecommendations(sessionToken, options);
      setData(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load recommendations');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleExpand = (cardId: string) => {
    const newExpanded = new Set(expandedCards);
    if (newExpanded.has(cardId)) {
      newExpanded.delete(cardId);
    } else {
      newExpanded.add(cardId);
    }
    setExpandedCards(newExpanded);
  };

  const handleCompare = (cardId: string) => {
    const newSelected = new Set(selectedCards);
    if (newSelected.has(cardId)) {
      newSelected.delete(cardId);
    } else if (newSelected.size < 3) {
      newSelected.add(cardId);
    }
    setSelectedCards(newSelected);
  };

  const handleApplyFilters = () => {
    loadRecommendations(filters);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, React.ReactNode> = {
      'E-commerce & Online Shopping': <ShoppingCart className="w-5 h-5" />,
      'Dining & Food Delivery': <Coffee className="w-5 h-5" />,
      'Fuel & Automotive': <Car className="w-5 h-5" />,
      'Travel & Tourism': <Plane className="w-5 h-5" />,
      'Home & Lifestyle': <Home className="w-5 h-5" />,
      'Utilities & Digital Services': <Smartphone className="w-5 h-5" />,
    };
    return icons[category] || <Target className="w-5 h-5" />;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading your personalized recommendations...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <Card className="p-8 text-center max-w-md">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Something went wrong</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={() => loadRecommendations()}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
        </Card>
      </div>
    );
  }

  const { recommendations, summary, criteria, analysis, sessionSummary } = data;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Your Credit Card Recommendations
              </h1>
              <p className="text-gray-600 mt-1">
                Based on your spending of {formatCurrency(sessionSummary.totalSpend)} across {sessionSummary.totalTransactions} transactions
              </p>
            </div>
            
            <div className="flex items-center space-x-3">
              <Button variant="outline" size="sm">
                <Share2 className="w-4 h-4 mr-2" />
                Share
              </Button>
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
              <Button onClick={() => loadRecommendations()}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Top Recommendation Summary */}
        {recommendations.length > 0 && (
          <div className="mb-8">
            <RecommendationSummary
              summary={summary}
              topRecommendation={recommendations[0]}
              totalSpending={sessionSummary.totalSpend}
            />
          </div>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="p-6 bg-gradient-to-br from-green-500 to-green-600 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm">Potential Savings</p>
                <p className="text-2xl font-bold">
                  {formatCurrency(summary.potentialSavings)}
                </p>
                <p className="text-green-100 text-xs">per year</p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-200" />
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm">Average Score</p>
                <p className="text-2xl font-bold">
                  {summary.averageScore.toFixed(0)}/100
                </p>
                <p className="text-blue-100 text-xs">match quality</p>
              </div>
              <Target className="w-8 h-8 text-blue-200" />
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-purple-500 to-purple-600 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm">Cards Analyzed</p>
                <p className="text-2xl font-bold">{data.totalCards}</p>
                <p className="text-purple-100 text-xs">from top banks</p>
              </div>
              <CreditCard className="w-8 h-8 text-purple-200" />
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-orange-500 to-orange-600 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100 text-sm">Confidence</p>
                <p className="text-2xl font-bold">{summary.confidenceLevel}</p>
                <p className="text-orange-100 text-xs">recommendation</p>
              </div>
              <CheckCircle className="w-8 h-8 text-orange-200" />
            </div>
          </Card>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Filters */}
            <Card className="p-6">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                <Filter className="w-4 h-4 mr-2" />
                Refine Results
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Credit Score
                  </label>
                  <select
                    value={filters.creditScore}
                    onChange={(e) => setFilters({...filters, creditScore: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded-md text-sm"
                  >
                    <option value="">Any</option>
                    <option value="excellent">Excellent (750+)</option>
                    <option value="good">Good (700-749)</option>
                    <option value="fair">Fair (650-699)</option>
                    <option value="poor">Poor (&lt;650)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Max Annual Fee
                  </label>
                  <select
                    value={filters.maxAnnualFee}
                    onChange={(e) => setFilters({...filters, maxAnnualFee: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded-md text-sm"
                  >
                    <option value="">Any</option>
                    <option value="0">Free</option>
                    <option value="500">Under ₹500</option>
                    <option value="1000">Under ₹1,000</option>
                    <option value="2500">Under ₹2,500</option>
                    <option value="5000">Under ₹5,000</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Preferred Network
                  </label>
                  <select
                    value={filters.preferredNetwork}
                    onChange={(e) => setFilters({...filters, preferredNetwork: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded-md text-sm"
                  >
                    <option value="">Any</option>
                    <option value="visa">Visa</option>
                    <option value="mastercard">Mastercard</option>
                    <option value="rupay">RuPay</option>
                    <option value="amex">American Express</option>
                    <option value="diners">Diners Club</option>
                  </select>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="businessCards"
                    checked={filters.includeBusinessCards}
                    onChange={(e) => setFilters({...filters, includeBusinessCards: e.target.checked})}
                    className="mr-2"
                  />
                  <label htmlFor="businessCards" className="text-sm text-gray-700">
                    Include Business Cards
                  </label>
                </div>

                <Button onClick={handleApplyFilters} className="w-full">
                  Apply Filters
                </Button>
              </div>
            </Card>

            {/* Spending Breakdown */}
            {analysis && analysis.spendingDistribution && analysis.spendingDistribution.length > 0 && (
              <Card className="p-6">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                  <PieChart className="w-4 h-4 mr-2" />
                  Spending Breakdown
                </h3>
                
                <div className="space-y-3">
                  {analysis.spendingDistribution.slice(0, 5).map((category, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        {getCategoryIcon(category.categoryName)}
                        <span className="text-sm font-medium text-gray-700">
                          {category.categoryName}
                        </span>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-bold text-gray-900">
                          {formatCurrency(category.totalAmount)}
                        </div>
                        <div className="text-xs text-gray-500">
                          {category.percentage.toFixed(1)}%
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-4">
                  <DonutChart
                    slices={analysis.spendingDistribution.slice(0, 5).map(cat => ({
                      label: cat.categoryName,
                      value: cat.percentage,
                      color: `hsl(${Math.random() * 360}, 70%, 50%)`
                    }))}
                  />
                </div>
              </Card>
            )}

            {/* Quick Stats */}
            <Card className="p-6">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                <BarChart3 className="w-4 h-4 mr-2" />
                Quick Stats
              </h3>
              
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Processing Time</span>
                  <span className="text-sm font-medium">{data.processingTimeMs}ms</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Categories Analyzed</span>
                  <span className="text-sm font-medium">{summary.categoriesAnalyzed}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Top Category</span>
                  <span className="text-sm font-medium">{sessionSummary.topCategory}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Generated</span>
                  <span className="text-sm font-medium">
                    {new Date(data.generatedAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-6">
                <TabsTrigger value="recommendations">
                  Recommendations ({recommendations.length})
                </TabsTrigger>
                <TabsTrigger value="comparison" disabled={selectedCards.size === 0}>
                  Compare ({selectedCards.size})
                </TabsTrigger>
                <TabsTrigger value="insights">
                  Insights
                </TabsTrigger>
              </TabsList>

              <TabsContent value="recommendations" className="space-y-6">
                {recommendations.length === 0 ? (
                  <Card className="p-8 text-center">
                    <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      No recommendations found
                    </h3>
                    <p className="text-gray-600 mb-4">
                      Try adjusting your filters to see more options.
                    </p>
                    <Button onClick={() => {
                      setFilters({
                        creditScore: '',
                        maxAnnualFee: '',
                        preferredNetwork: '',
                        includeBusinessCards: false
                      });
                      loadRecommendations();
                    }}>
                      Reset Filters
                    </Button>
                  </Card>
                ) : (
                  recommendations.map((recommendation) => (
                    <RecommendationCard
                      key={recommendation.cardId}
                      recommendation={recommendation}
                      isExpanded={expandedCards.has(recommendation.cardId)}
                      onToggleExpand={() => handleToggleExpand(recommendation.cardId)}
                      onCompare={handleCompare}
                      showComparison={true}
                    />
                  ))
                )}
              </TabsContent>

              <TabsContent value="comparison">
                <CardComparison
                  recommendations={recommendations}
                  selectedCardIds={Array.from(selectedCards)}
                  onRemoveCard={(cardId) => {
                    const newSelected = new Set(selectedCards);
                    newSelected.delete(cardId);
                    setSelectedCards(newSelected);
                  }}
                />
              </TabsContent>

              <TabsContent value="insights">
                <div className="space-y-6">
                  <Card className="p-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                      <Zap className="w-5 h-5 mr-2 text-yellow-500" />
                      Key Insights
                    </h3>
                    
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-3">Your Spending Profile</h4>
                        <ul className="space-y-2 text-sm text-gray-700">
                          <li className="flex items-start">
                            <CheckCircle className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                            Primary spending category: {sessionSummary.topCategory}
                          </li>
                          <li className="flex items-start">
                            <CheckCircle className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                            Average transaction: {formatCurrency(analysis?.averageTransactionAmount || 0)}
                          </li>
                          <li className="flex items-start">
                            <CheckCircle className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                            Total transactions analyzed: {sessionSummary.totalTransactions}
                          </li>
                        </ul>
                      </div>

                      <div>
                        <h4 className="font-semibold text-gray-900 mb-3">Optimization Opportunities</h4>
                        <ul className="space-y-2 text-sm text-gray-700">
                          <li className="flex items-start">
                            <Award className="w-4 h-4 text-blue-500 mr-2 mt-0.5 flex-shrink-0" />
                            Annual savings potential: {formatCurrency(summary.potentialSavings)}
                          </li>
                          <li className="flex items-start">
                            <Star className="w-4 h-4 text-purple-500 mr-2 mt-0.5 flex-shrink-0" />
                            Best match confidence: {summary.confidenceLevel}
                          </li>
                          <li className="flex items-start">
                            <Target className="w-4 h-4 text-orange-500 mr-2 mt-0.5 flex-shrink-0" />
                            Cards perfectly matched: {recommendations.filter(r => r.score >= 80).length}
                          </li>
                        </ul>
                      </div>
                    </div>
                  </Card>

                  <Card className="p-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-4">
                      Recommendation Summary
                    </h3>
                    <p className="text-gray-700 leading-relaxed">
                      {summary.topRecommendation}
                    </p>
                  </Card>

                  {/* Savings Breakdown for Top Recommendation */}
                  {recommendations.length > 0 && recommendations[0].benefitBreakdown.length > 0 && (
                    <SavingsBreakdownChart
                      breakdown={recommendations[0].benefitBreakdown}
                      totalSavings={recommendations[0].potentialSavings}
                    />
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
};
