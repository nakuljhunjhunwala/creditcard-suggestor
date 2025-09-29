import React from 'react';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Separator } from './ui/separator';
import type { CreditCardRecommendation } from '../types';
import { 
  Star, 
  CreditCard, 
  DollarSign, 
  TrendingUp, 
  Award, 
  Shield, 
  Zap,
  X,
  CheckCircle,
  XCircle,
  Minus
} from 'lucide-react';

interface CardComparisonProps {
  recommendations: CreditCardRecommendation[];
  selectedCardIds: string[];
  onRemoveCard: (cardId: string) => void;
  className?: string;
}

export const CardComparison: React.FC<CardComparisonProps> = ({
  recommendations,
  selectedCardIds,
  onRemoveCard,
  className = ''
}) => {
  const selectedCards = recommendations.filter(rec => 
    selectedCardIds.includes(rec.cardId)
  );

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  const getComparisonIcon = (value: number, values: number[], isHigherBetter: boolean = true) => {
    const max = Math.max(...values);
    const min = Math.min(...values);
    
    if (values.length === 1) return <Minus className="w-4 h-4 text-gray-400" />;
    
    if (isHigherBetter) {
      if (value === max) return <CheckCircle className="w-4 h-4 text-green-500" />;
      if (value === min) return <XCircle className="w-4 h-4 text-red-500" />;
    } else {
      if (value === min) return <CheckCircle className="w-4 h-4 text-green-500" />;
      if (value === max) return <XCircle className="w-4 h-4 text-red-500" />;
    }
    
    return <Minus className="w-4 h-4 text-yellow-500" />;
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-50';
    if (score >= 60) return 'text-blue-600 bg-blue-50';
    if (score >= 40) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  if (selectedCards.length === 0) {
    return (
      <Card className={`p-8 text-center ${className}`}>
        <CreditCard className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          No Cards Selected for Comparison
        </h3>
        <p className="text-gray-600">
          Select up to 3 credit cards from your recommendations to compare them side by side.
        </p>
      </Card>
    );
  }

  const scores = selectedCards.map(card => card.score);
  const savings = selectedCards.map(card => card.potentialSavings || 0);
  const annualFees = selectedCards.map(card => card.card.feeStructure.annualFee);
  const signupBonuses = selectedCards.map(card => card.signupBonusValue || 0);
  const customerRatings = selectedCards.map(card => card.card.customerSatisfactionScore);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">
          Card Comparison ({selectedCards.length})
        </h2>
        <p className="text-gray-600">
          Compare features, benefits, and costs side by side
        </p>
      </div>

      {/* Comparison Table */}
      <div className="grid gap-6" style={{ gridTemplateColumns: `repeat(${selectedCards.length}, 1fr)` }}>
        {selectedCards.map((recommendation) => {
          const { card } = recommendation;
          
          return (
            <Card key={card.id} className="overflow-hidden">
              {/* Card Header */}
              <div className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h3 className="font-bold text-lg text-gray-900">{card.name}</h3>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onRemoveCard(card.id)}
                        className="text-gray-400 hover:text-red-500"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-gray-600 mb-2">
                      <span>{card.issuer.name}</span>
                      <span>•</span>
                      <span>{card.network.name}</span>
                    </div>
                    {card.isLifetimeFree && (
                      <Badge variant="secondary" className="bg-green-100 text-green-800">
                        <Zap className="w-3 h-3 mr-1" />
                        Lifetime Free
                      </Badge>
                    )}
                  </div>
                  <div className="text-center">
                    <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getScoreColor(recommendation.score)}`}>
                      #{recommendation.rank}
                    </div>
                  </div>
                </div>

                {/* Key Metrics */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="text-center p-3 bg-white rounded-lg">
                    <div className="flex items-center justify-center mb-1">
                      <TrendingUp className="w-4 h-4 text-green-600 mr-1" />
                      {getComparisonIcon(recommendation.potentialSavings || 0, savings, true)}
                    </div>
                    <div className="font-bold text-green-600">
                      {formatCurrency(recommendation.potentialSavings || 0)}
                    </div>
                    <div className="text-xs text-gray-600">Annual Savings</div>
                  </div>
                  <div className="text-center p-3 bg-white rounded-lg">
                    <div className="flex items-center justify-center mb-1">
                      <Star className="w-4 h-4 text-blue-600 mr-1" />
                      {getComparisonIcon(recommendation.score, scores, true)}
                    </div>
                    <div className="font-bold text-blue-600">
                      {recommendation.score.toFixed(0)}
                    </div>
                    <div className="text-xs text-gray-600">Match Score</div>
                  </div>
                </div>
              </div>

              {/* Detailed Comparison */}
              <div className="p-6 space-y-6">
                {/* Fees */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                    <DollarSign className="w-4 h-4 mr-2" />
                    Fees & Costs
                  </h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Annual Fee</span>
                      <div className="flex items-center space-x-2">
                        {getComparisonIcon(card.feeStructure.annualFee, annualFees, false)}
                        <span className="font-medium">
                          {formatCurrency(card.feeStructure.annualFee)}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Joining Fee</span>
                      <span className="font-medium">
                        {formatCurrency(card.feeStructure.joiningFee || 0)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Foreign Transaction</span>
                      <span className="font-medium">
                        {formatPercentage(card.feeStructure.foreignTransactionFee || 0)}
                      </span>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Rewards */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                    <Award className="w-4 h-4 mr-2" />
                    Rewards & Benefits
                  </h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Base Reward Rate</span>
                      <span className="font-medium">
                        {formatPercentage(card.rewardStructure.baseRewardRate)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Welcome Bonus</span>
                      <div className="flex items-center space-x-2">
                        {getComparisonIcon(recommendation.signupBonusValue || 0, signupBonuses, true)}
                        <span className="font-medium">
                          {recommendation.signupBonusValue ? formatCurrency(recommendation.signupBonusValue) : 'N/A'}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Reward Currency</span>
                      <span className="font-medium capitalize">
                        {card.rewardStructure.rewardCurrency.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Performance */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                    <Shield className="w-4 h-4 mr-2" />
                    Performance
                  </h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Customer Rating</span>
                      <div className="flex items-center space-x-2">
                        {getComparisonIcon(card.customerSatisfactionScore, customerRatings, true)}
                        <span className="font-medium">
                          {card.customerSatisfactionScore.toFixed(1)}/5
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Popularity Score</span>
                      <span className="font-medium">
                        {card.popularityScore}/100
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Confidence</span>
                      <span className="font-medium">
                        {(recommendation.confidenceScore * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Top Benefits */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Top Benefits</h4>
                  <ul className="space-y-1">
                    {recommendation.pros.slice(0, 3).map((pro, proIndex) => (
                      <li key={proIndex} className="flex items-start text-sm">
                        <CheckCircle className="w-3 h-3 text-green-500 mt-1 mr-2 flex-shrink-0" />
                        <span className="text-gray-700">{pro}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Top Concerns */}
                {recommendation.cons.length > 0 && (
                  <>
                    <Separator />
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-3">Key Considerations</h4>
                      <ul className="space-y-1">
                        {recommendation.cons.slice(0, 2).map((con, conIndex) => (
                          <li key={conIndex} className="flex items-start text-sm">
                            <XCircle className="w-3 h-3 text-red-500 mt-1 mr-2 flex-shrink-0" />
                            <span className="text-gray-700">{con}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </>
                )}

                {/* Action Button */}
                <div className="pt-4">
                  <Button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                    Apply for {card.name}
                  </Button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Summary */}
      <Card className="p-6 bg-gradient-to-r from-gray-50 to-gray-100">
        <h3 className="font-semibold text-gray-900 mb-4">Comparison Summary</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-lg font-bold text-green-600">
              {formatCurrency(Math.max(...savings))}
            </div>
            <div className="text-sm text-gray-600">Highest Savings</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-blue-600">
              {Math.max(...scores).toFixed(0)}
            </div>
            <div className="text-sm text-gray-600">Best Match Score</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-purple-600">
              {formatCurrency(Math.min(...annualFees))}
            </div>
            <div className="text-sm text-gray-600">Lowest Annual Fee</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-orange-600">
              {Math.max(...customerRatings).toFixed(1)}/5
            </div>
            <div className="text-sm text-gray-600">Highest Rating</div>
          </div>
        </div>
      </Card>
    </div>
  );
};
