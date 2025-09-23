import React, { useState } from 'react';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Progress } from './ui/progress';
import { Separator } from './ui/separator';
import type { CreditCardRecommendation } from '../types';
import { 
  TrendingUp, 
  TrendingDown, 
  Star, 
  CreditCard, 
  DollarSign, 
  Calendar,
  Shield,
  Award,
  Info,
  ChevronDown,
  ChevronUp,
  Zap,
  Target,
  BarChart3
} from 'lucide-react';

interface RecommendationCardProps {
  recommendation: CreditCardRecommendation;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
  onCompare?: (cardId: string) => void;
  showComparison?: boolean;
}

export const RecommendationCard: React.FC<RecommendationCardProps> = ({
  recommendation,
  isExpanded = false,
  onToggleExpand,
  onCompare,
  showComparison = false
}) => {
  const [activeTab, setActiveTab] = useState('overview');
  const { card } = recommendation;

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-50';
    if (score >= 60) return 'text-blue-600 bg-blue-50';
    if (score >= 40) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600';
    if (confidence >= 0.6) return 'text-blue-600';
    if (confidence >= 0.4) return 'text-yellow-600';
    return 'text-red-600';
  };

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

  return (
    <Card className="w-full overflow-hidden transition-all duration-300 hover:shadow-lg border-l-4 border-l-blue-500">
      {/* Header */}
      <div className="p-6 pb-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-4">
            {/* Rank Badge */}
            <div className="flex-shrink-0">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
                #{recommendation.rank}
              </div>
            </div>

            {/* Card Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2 mb-2">
                <h3 className="text-xl font-bold text-gray-900 truncate">
                  {card.name}
                </h3>
                {card.isLifetimeFree && (
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    <Zap className="w-3 h-3 mr-1" />
                    Lifetime Free
                  </Badge>
                )}
              </div>
              
              <div className="flex items-center space-x-4 text-sm text-gray-600 mb-2">
                <span className="flex items-center">
                  <CreditCard className="w-4 h-4 mr-1" />
                  {card.issuer.name}
                </span>
                <span className="flex items-center">
                  <Shield className="w-4 h-4 mr-1" />
                  {card.network.name}
                </span>
                <span className="flex items-center">
                  <Star className="w-4 h-4 mr-1" />
                  {card.customerSatisfactionScore.toFixed(1)}/5
                </span>
              </div>

              <p className="text-sm text-gray-700 mb-3">
                {recommendation.primaryReason}
              </p>
            </div>
          </div>

          {/* Score */}
          <div className="flex-shrink-0 text-right">
            <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getScoreColor(recommendation.score)}`}>
              <Target className="w-4 h-4 mr-1" />
              {recommendation.score.toFixed(0)}
            </div>
            <div className={`text-xs mt-1 ${getConfidenceColor(recommendation.confidenceScore)}`}>
              {(recommendation.confidenceScore * 100).toFixed(0)}% confidence
            </div>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <div className="flex items-center justify-center mb-1">
              <TrendingUp className="w-4 h-4 text-green-600" />
            </div>
            <div className="text-lg font-bold text-green-700">
              {formatCurrency(recommendation.annualSavings || recommendation.potentialSavings)}
            </div>
            <div className="text-xs text-green-600">Annual Savings</div>
            <div className="text-[10px] text-green-500 mt-1">
              Statement: {formatCurrency(recommendation.statementSavings || 0)}
            </div>
          </div>

          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <div className="flex items-center justify-center mb-1">
              <DollarSign className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-lg font-bold text-blue-700">
              {formatCurrency(recommendation.annualEarnings || recommendation.yearlyEstimate)}
            </div>
            <div className="text-xs text-blue-600">Annual Earnings</div>
            <div className="text-[10px] text-blue-500 mt-1">
              Statement: {formatCurrency(recommendation.statementEarnings || 0)}
            </div>
          </div>

          <div className="text-center p-3 bg-purple-50 rounded-lg">
            <div className="flex items-center justify-center mb-1">
              <Award className="w-4 h-4 text-purple-600" />
            </div>
            <div className="text-lg font-bold text-purple-700">
              {recommendation.signupBonusValue ? formatCurrency(recommendation.signupBonusValue) : 'N/A'}
            </div>
            <div className="text-xs text-purple-600">Welcome Bonus</div>
          </div>

          <div className="text-center p-3 bg-orange-50 rounded-lg">
            <div className="flex items-center justify-center mb-1">
              <Calendar className="w-4 h-4 text-orange-600" />
            </div>
            <div className="text-lg font-bold text-orange-700">
              {recommendation.feeBreakeven ? `${recommendation.feeBreakeven}m` : 'N/A'}
            </div>
            <div className="text-xs text-orange-600">Fee Breakeven</div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between mt-4">
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onToggleExpand}
              className="flex items-center"
            >
              <Info className="w-4 h-4 mr-1" />
              {isExpanded ? 'Less Details' : 'More Details'}
              {isExpanded ? <ChevronUp className="w-4 h-4 ml-1" /> : <ChevronDown className="w-4 h-4 ml-1" />}
            </Button>
            
            {showComparison && onCompare && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onCompare(card.id)}
              >
                <BarChart3 className="w-4 h-4 mr-1" />
                Compare
              </Button>
            )}
          </div>

          <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
            Apply Now
          </Button>
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="border-t bg-gray-50">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4 bg-white border-b">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="breakdown">Breakdown</TabsTrigger>
              <TabsTrigger value="features">Features</TabsTrigger>
              <TabsTrigger value="eligibility">Eligibility</TabsTrigger>
            </TabsList>

            <div className="p-6">
              <TabsContent value="overview" className="mt-0">
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Pros */}
                  <div>
                    <h4 className="font-semibold text-green-700 mb-3 flex items-center">
                      <TrendingUp className="w-4 h-4 mr-2" />
                      Why This Card Works for You
                    </h4>
                    <ul className="space-y-2">
                      {recommendation.pros?.map((pro, index) => (
                        <li key={index} className="flex items-start text-sm">
                          <div className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0" />
                          <span className="text-gray-700">{pro}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Cons */}
                  <div>
                    <h4 className="font-semibold text-red-700 mb-3 flex items-center">
                      <TrendingDown className="w-4 h-4 mr-2" />
                      Things to Consider
                    </h4>
                    <ul className="space-y-2">
                      {recommendation.cons?.map((con, index) => (
                        <li key={index} className="flex items-start text-sm">
                          <div className="w-2 h-2 bg-red-500 rounded-full mt-2 mr-3 flex-shrink-0" />
                          <span className="text-gray-700">{con}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <Separator className="my-6" />

                {/* Fee Structure */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Fee Structure</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-3 bg-white rounded-lg border">
                      <div className="text-lg font-bold text-gray-900">
                        {formatCurrency(card.feeStructure.annualFee)}
                      </div>
                      <div className="text-xs text-gray-600">Annual Fee</div>
                    </div>
                    <div className="text-center p-3 bg-white rounded-lg border">
                      <div className="text-lg font-bold text-gray-900">
                        {formatCurrency(card.feeStructure.joiningFee || 0)}
                      </div>
                      <div className="text-xs text-gray-600">Joining Fee</div>
                    </div>
                    <div className="text-center p-3 bg-white rounded-lg border">
                      <div className="text-lg font-bold text-gray-900">
                        {formatPercentage(card.feeStructure.foreignTransactionFee || 0)}
                      </div>
                      <div className="text-xs text-gray-600">Foreign Transaction</div>
                    </div>
                    <div className="text-center p-3 bg-white rounded-lg border">
                      <div className="text-lg font-bold text-gray-900">
                        {formatPercentage(card.rewardStructure.baseRewardRate)}
                      </div>
                      <div className="text-xs text-gray-600">Base Reward Rate</div>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="breakdown" className="mt-0">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-4">Category-wise Savings Breakdown</h4>
                  <div className="space-y-4">
                    {recommendation.benefitBreakdown?.map((benefit, index) => (
                      <div key={index} className="bg-white p-4 rounded-lg border">
                        <div className="flex items-center justify-between mb-2">
                          <h5 className="font-medium text-gray-900">{benefit.category}</h5>
                          <Badge variant="outline" className="text-green-600 border-green-200">
                            {formatCurrency(benefit.savingsAmount || 0)} saved
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <div className="text-gray-600">Amount Spent</div>
                            <div className="font-medium">{formatCurrency(benefit.spentAmount)}</div>
                          </div>
                          <div>
                            <div className="text-gray-600">Current Rate</div>
                            <div className="font-medium">{formatPercentage(benefit.currentRate)}</div>
                          </div>
                          <div>
                            <div className="text-gray-600">Card Rate</div>
                            <div className="font-medium text-green-600">{formatPercentage(benefit.cardRate)}</div>
                          </div>
                          <div>
                            <div className="text-gray-600">Earnings</div>
                            <div className="font-medium">{formatCurrency(benefit.dollarValue)}</div>
                          </div>
                        </div>

                        <div className="mt-3">
                          <div className="flex justify-between text-xs text-gray-600 mb-1">
                            <span>Reward Rate Comparison</span>
                            <span>{formatPercentage(benefit.cardRate)} vs {formatPercentage(benefit.currentRate)}</span>
                          </div>
                          <Progress 
                            value={(benefit.cardRate / Math.max(benefit.cardRate, benefit.currentRate, 5)) * 100} 
                            className="h-2"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="features" className="mt-0">
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Accelerated Rewards */}
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">Accelerated Rewards</h4>
                    <div className="space-y-3">
                      {card.acceleratedRewards?.map((reward, index) => (
                        <div key={index} className="bg-white p-3 rounded-lg border">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium text-sm">
                              {reward.rewardCategory?.name || 'General'}
                            </span>
                            <Badge variant="secondary">
                              {formatPercentage(reward.rewardRate)}
                            </Badge>
                          </div>
                          <p className="text-xs text-gray-600">{reward.description}</p>
                          {reward.cappingLimit && (
                            <div className="text-xs text-orange-600 mt-1">
                              Cap: {formatCurrency(reward.cappingLimit)} per {reward.cappingPeriod}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Unique Features */}
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">Unique Features</h4>
                    <div className="space-y-2">
                      {card.uniqueFeatures?.map((feature, index) => (
                        <div key={index} className="flex items-center text-sm">
                          <Zap className="w-4 h-4 text-blue-500 mr-2 flex-shrink-0" />
                          <span className="text-gray-700">{feature}</span>
                        </div>
                      ))}
                    </div>

                    {/* Additional Benefits */}
                    {card.additionalBenefits?.length > 0 && (
                      <div className="mt-6">
                        <h5 className="font-medium text-gray-900 mb-3">Additional Benefits</h5>
                        <div className="space-y-2">
                          {card.additionalBenefits?.map((benefit, index) => (
                            <div key={index} className="bg-blue-50 p-3 rounded-lg">
                              <div className="font-medium text-sm text-blue-900 mb-1">
                                {benefit.categoryName}
                              </div>
                              <div className="space-y-1">
                                {benefit.benefits?.map((b, bIndex) => (
                                  <div key={bIndex} className="text-xs text-blue-700">
                                    {b.description}
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="eligibility" className="mt-0">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">Income Requirements</h4>
                    <div className="space-y-3">
                      <div className="bg-white p-3 rounded-lg border">
                        <div className="text-sm text-gray-600">Salaried</div>
                        <div className="font-bold text-lg">
                          {formatCurrency(card.eligibilityRequirements.minimumIncome.salaried)}
                        </div>
                        <div className="text-xs text-gray-500">per annum</div>
                      </div>
                      <div className="bg-white p-3 rounded-lg border">
                        <div className="text-sm text-gray-600">Self-Employed</div>
                        <div className="font-bold text-lg">
                          {formatCurrency(card.eligibilityRequirements.minimumIncome.selfEmployed)}
                        </div>
                        <div className="text-xs text-gray-500">per annum</div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">Other Requirements</h4>
                    <div className="space-y-3">
                      <div className="bg-white p-3 rounded-lg border">
                        <div className="text-sm text-gray-600">Credit Score</div>
                        <div className="font-bold text-lg">
                          {card.eligibilityRequirements.minimumCreditScore}+
                        </div>
                      </div>
                      <div className="bg-white p-3 rounded-lg border">
                        <div className="text-sm text-gray-600">Age Range</div>
                        <div className="font-bold text-lg">
                          {card.eligibilityRequirements.minimumAge} - {card.eligibilityRequirements.maximumAge || 65} years
                        </div>
                      </div>
                    </div>

                    <div className="mt-4">
                      <h5 className="font-medium text-gray-900 mb-2">Employment Types</h5>
                      <div className="flex flex-wrap gap-2">
                        {card.eligibilityRequirements.employmentTypes?.map((type, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {type}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </div>
      )}
    </Card>
  );
};
