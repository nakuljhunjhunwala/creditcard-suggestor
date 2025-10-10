import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { apiClient } from '../services/api';
import type { RecommendationResponse, Transaction } from '../types';
import { 
  RefreshCw,
  AlertCircle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

export const ResultsPage: React.FC = () => {
  const { sessionToken } = useParams<{ sessionToken: string }>();
  const navigate = useNavigate();
  
  const [data, setData] = useState<RecommendationResponse | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState('best-cards');

  useEffect(() => {
    if (!sessionToken) {
      navigate('/');
      return;
    }
    loadData();
  }, [sessionToken, navigate]);

    const loadData = async () => {
    if (!sessionToken) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const [recommendations, transactionsData] = await Promise.all([
        apiClient.getRecommendations(sessionToken),
        apiClient.getTransactions(sessionToken, 1, 100)
      ]);
      
      setData(recommendations);
      setTransactions(transactionsData.items || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading your recommendations...</p>
            </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="p-8 text-center max-w-md w-full">
          <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
          <h2 className="text-xl font-bold text-foreground mb-2">Something went wrong</h2>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={() => loadData()}>
            <RefreshCw className="w-4 h-4 mr-2" />
                Try Again
              </Button>
        </Card>
      </div>
    );
  }

  const { recommendations, sessionSummary } = data;

  return (
    <div className="min-h-screen bg-background">
        {/* Header */}
      <div className="border-b bg-card shadow-sm">
        <div className="container mx-auto px-4 py-8 md:py-12 max-w-5xl">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
            Your Best Credit Cards
          </h1>
          <p className="text-base md:text-lg text-muted-foreground">
            Analysis of {sessionSummary.totalTransactions} transactions
            {sessionSummary.statementStartDate && sessionSummary.statementEndDate && (
              <> • {formatDate(sessionSummary.statementStartDate.toString())} to {formatDate(sessionSummary.statementEndDate.toString())}</>
            )}
          </p>
        </div>
        </div>

      <div className="container mx-auto px-4 py-8 max-w-5xl">
        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full max-w-sm mx-auto grid-cols-2 mb-10">
            <TabsTrigger value="best-cards">
              Best Cards ({recommendations.length})
            </TabsTrigger>
            <TabsTrigger value="transactions">
              Transactions ({transactions.length})
            </TabsTrigger>
          </TabsList>

          {/* Best Cards Tab */}
          <TabsContent value="best-cards" className="space-y-6">
            {recommendations.length === 0 ? (
              <Card className="p-8 text-center">
                <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  No recommendations available
                </h3>
                <p className="text-muted-foreground">
                  We couldn't find suitable card recommendations based on your spending.
                </p>
              </Card>
            ) : (
              recommendations.map((rec) => {
                const isExpanded = expandedCards.has(rec.cardId);
                const card = rec.card;

                return (
                  <Card key={rec.cardId} className="rounded-lg shadow-sm hover:shadow-md transition-all bg-card border">
                    <CardHeader className="pb-6">
                      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-4">
                            <span className="text-lg font-bold text-foreground">
                              #{rec.rank}
                            </span>
                            {rec.cardType && (
                              <span className="text-xs font-medium text-muted-foreground border px-3 py-1 rounded-full bg-muted">
                                {rec.cardType}
                              </span>
                            )}
                          </div>
                          <CardTitle className="text-2xl md:text-3xl font-bold mb-2 text-foreground">
                            {card.name}
                          </CardTitle>
                          <p className="text-sm text-muted-foreground">
                            {card.issuer?.name} • {card.network?.name}
                          </p>
                                </div>
                        <div className="text-left md:text-right">
                          <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">
                            Statement Period Earnings
                          </p>
                          <p className="text-4xl md:text-5xl font-bold text-primary">
                            {formatCurrency(rec.estimatedAnnualCashback)}
                          </p>
                                </div>
                              </div>
                    </CardHeader>

                    <CardContent className="pt-0 space-y-6 border-t">
                      <div className="pt-6 space-y-6">
                        {/* Welcome Bonus - Show first if available */}
                        {rec.signupBonusValue && rec.signupBonusValue > 0 ? (
                          <div className="border-l-4 border-primary pl-4 py-2 bg-muted/50 rounded-r">
                            <p className="text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-wide">Welcome Bonus</p>
                            <p className="text-2xl font-bold text-primary">
                              {formatCurrency(rec.signupBonusValue)}
                            </p>
                          </div>
                        ) : <></>}

                        {/* Primary Reason - Only show if it's not empty or "0" */}
                        {rec.primaryReason && rec.primaryReason !== "0" && rec.primaryReason.trim() !== "" && (
                          <div className="p-4 bg-muted/30 rounded-lg border">
                            <p className="text-base text-foreground leading-relaxed">
                              {rec.primaryReason}
                            </p>
                  </div>
                    )}

                        {/* Fees */}
                        <div className="grid grid-cols-2 gap-4 pt-2">
                          <div className="p-4 bg-muted/30 rounded-lg border">
                            <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">Joining Fee</p>
                            <p className="text-2xl font-bold text-foreground">
                              {formatCurrency(card.feeStructure?.joiningFee || 0)}
                            </p>
                          </div>
                          <div className="p-4 bg-muted/30 rounded-lg border">
                            <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">Annual Fee</p>
                            <p className="text-2xl font-bold text-foreground">
                              {formatCurrency(card.feeStructure?.annualFee || 0)}
                            </p>
                          </div>
              </div>

                        {/* Pros & Cons */}
                        <div className="grid md:grid-cols-2 gap-6 pt-2">
                          <div className="p-4 bg-muted/20 rounded-lg border">
                            <h4 className="text-sm font-bold mb-3 text-foreground uppercase tracking-wide">
                              Advantages
                            </h4>
                            <ul className="space-y-2">
                              {rec.pros.slice(0, 3).map((pro, idx) => (
                                <li key={idx} className="text-sm text-foreground flex items-start gap-2 leading-relaxed">
                                  <span className="text-primary font-bold">•</span>
                                  <span>{pro}</span>
                                </li>
                              ))}
                            </ul>
                    </div>
                          <div className="p-4 bg-muted/20 rounded-lg border">
                            <h4 className="text-sm font-bold mb-3 text-foreground uppercase tracking-wide">
                              Limitations
                            </h4>
                            <ul className="space-y-2">
                              {rec.cons.slice(0, 3).map((con, idx) => (
                                <li key={idx} className="text-sm text-foreground flex items-start gap-2 leading-relaxed">
                                  <span className="text-muted-foreground font-bold">•</span>
                                  <span>{con}</span>
                                </li>
                              ))}
                            </ul>
                  </div>
                        </div>
                  </div>

                      {/* Toggle Button */}
                      <Button 
                        variant="ghost"
                        className="w-full text-sm font-medium hover:bg-muted"
                        onClick={() => handleToggleExpand(rec.cardId)}
                      >
                        {isExpanded ? (
                          <>
                            <ChevronUp className="w-4 h-4 mr-2" />
                            Hide Details
                          </>
                        ) : (
                          <>
                            <ChevronDown className="w-4 h-4 mr-2" />
                            View Details
                          </>
                        )}
                      </Button>

                      {/* Expanded Details */}
                      {isExpanded && (
                        <div className="space-y-8 pt-8 border-t">
                          {/* Category Breakdown */}
                          <div>
                            <h3 className="text-base font-bold mb-4 text-foreground uppercase tracking-wide">
                              Category Earnings Breakdown
                            </h3>
                            <div className="overflow-x-auto border rounded-lg shadow-sm">
                              <table className="w-full text-sm">
                                <thead className="bg-muted border-b">
                                  <tr>
                                    <th className="text-left p-4 font-bold text-foreground">Category</th>
                                    <th className="text-right p-4 font-bold text-foreground">Your Spend</th>
                                    <th className="text-right p-4 font-bold text-foreground">Rate</th>
                                    <th className="text-right p-4 font-bold text-foreground">Earnings</th>
                                    {rec.benefitBreakdown.some(b => b.monthlyCap) && (
                                      <th className="text-right p-4 font-bold text-foreground">Monthly Cap</th>
                                    )}
                                  </tr>
                                </thead>
                                <tbody className="bg-card">
                                  {rec.benefitBreakdown.map((benefit, idx) => (
                                    <tr key={idx} className="border-b last:border-0">
                                      <td className="p-4 text-foreground font-medium">{benefit.category}</td>
                                      <td className="text-right p-4 text-foreground">
                                        {formatCurrency(benefit.spentAmount)}
                                      </td>
                                      <td className="text-right p-4 text-primary font-bold">
                                        {benefit.cardRate}%
                                      </td>
                                      <td className="text-right p-4 font-bold text-primary">
                                        {formatCurrency(benefit.dollarValue)}
                                      </td>
                                      {rec.benefitBreakdown.some(b => b.monthlyCap) && (
                                        <td className="text-right p-4 text-muted-foreground">
                                          {benefit.monthlyCap ? formatCurrency(benefit.monthlyCap) : '—'}
                                        </td>
                                      )}
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
              </div>
            </div>

                          {/* Card Reward Details */}
                          {card.acceleratedRewards && card.acceleratedRewards.length > 0 && (
                            <div>
                              <h3 className="text-base font-bold mb-4 text-foreground uppercase tracking-wide">
                                Card Reward Structure
                              </h3>
                              <div className="overflow-x-auto border rounded-lg shadow-sm">
                                <table className="w-full text-sm">
                                  <thead className="bg-muted border-b">
                                    <tr>
                                      <th className="text-left p-4 font-bold text-foreground">Benefit Category</th>
                                      <th className="text-right p-4 font-bold text-foreground">Rate</th>
                                      <th className="text-right p-4 font-bold text-foreground">Monthly Cap</th>
                                    </tr>
                                  </thead>
                                  <tbody className="bg-card">
                                    {card.acceleratedRewards.slice(0, 5).map((reward: any, idx: number) => (
                                      <tr key={idx} className="border-b last:border-0">
                                        <td className="p-4 text-foreground font-medium">
                                          {reward.rewardCategory?.name || reward.description}
                                        </td>
                                        <td className="text-right p-4 font-bold text-primary">
                                          {reward.rewardRate}%
                                        </td>
                                        <td className="text-right p-4 text-foreground">
                                          {reward.cappingLimit ? formatCurrency(reward.cappingLimit) : '—'}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          )}
                </div>
                      )}
              </CardContent>
            </Card>
                );
              })
          )}
          </TabsContent>

          {/* All Transactions Tab */}
          <TabsContent value="transactions">
            <Card className="rounded-lg shadow-sm bg-card border">
              <CardHeader className="border-b">
                <CardTitle className="text-xl font-bold text-foreground">
                  All Transactions from Your Statement
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted border-b">
                      <tr>
                        <th className="text-left p-4 font-bold text-foreground">Date</th>
                        <th className="text-left p-4 font-bold text-foreground">Merchant</th>
                        <th className="text-left p-4 font-bold text-foreground hidden md:table-cell">Description</th>
                        <th className="text-right p-4 font-bold text-foreground">Amount</th>
                        <th className="text-center p-4 font-bold text-foreground hidden lg:table-cell">MCC</th>
                        <th className="text-left p-4 font-bold text-foreground hidden lg:table-cell">Category</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transactions.map((txn) => (
                        <tr key={txn.id} className="border-b last:border-0 hover:bg-muted/30">
                          <td className="p-4 text-xs text-foreground whitespace-nowrap">
                            {formatDate(txn.date)}
                          </td>
                          <td className="p-4 font-semibold text-foreground">
                            {txn.merchant || '—'}
                          </td>
                          <td className="p-4 hidden md:table-cell text-xs text-muted-foreground max-w-xs truncate">
                            {txn.description}
                          </td>
                          <td className={`text-right p-4 font-bold whitespace-nowrap ${txn.amount >= 0 ? 'text-foreground' : 'text-red-600'}`}>
                            {formatCurrency(txn.amount)}
                          </td>
                          <td className="p-4 hidden lg:table-cell text-center text-xs text-muted-foreground font-mono">
                            {txn.mccCode || '—'}
                          </td>
                          <td className="p-4 hidden lg:table-cell text-foreground font-medium">
                            {txn.categoryName || 'Uncategorized'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {transactions.length === 0 && (
                  <div className="text-center py-16 px-4">
                    <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-base text-muted-foreground">No transactions found</p>
                  </div>
                )}
                </CardContent>
              </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};
