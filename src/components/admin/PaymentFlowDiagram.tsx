import { motion } from 'framer-motion';
import { User, CreditCard, Building2, Store, ArrowRight, DollarSign } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { usePlatformStats } from '@/hooks/useData';

export const PaymentFlowDiagram = () => {
  const { data: stats } = usePlatformStats();

  // Default commission rate
  const avgCommission = 15;

  const steps = [
    {
      icon: User,
      label: 'Customer',
      description: 'Books service',
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/20',
    },
    {
      icon: CreditCard,
      label: 'Payment',
      description: 'Online / Cash',
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/20',
    },
    {
      icon: Building2,
      label: 'Platform',
      description: `${avgCommission}% commission`,
      color: 'text-primary',
      bgColor: 'bg-primary/20',
      amount: `Rs. ${stats?.platformEarnings?.toLocaleString() || '0'}`,
    },
    {
      icon: Store,
      label: 'Vendor',
      description: 'Receives payout',
      color: 'text-success',
      bgColor: 'bg-success/20',
      amount: `Rs. ${((stats?.totalRevenue || 0) - (stats?.platformEarnings || 0)).toLocaleString()}`,
    },
  ];

  return (
    <Card className="glass-card border-border/50">
      <CardHeader>
        <CardTitle className="font-serif flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-primary" />
          Payment Flow
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4">
          {steps.map((step, index) => (
            <div key={step.label} className="flex items-center gap-2 sm:gap-4">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: index * 0.1 }}
                className="flex flex-col items-center"
              >
                <div className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl ${step.bgColor} flex items-center justify-center mb-2`}>
                  <step.icon className={`h-6 w-6 sm:h-7 sm:w-7 ${step.color}`} />
                </div>
                <p className="font-medium text-sm text-center">{step.label}</p>
                <p className="text-xs text-muted-foreground text-center">{step.description}</p>
                {step.amount && (
                  <p className={`text-sm font-semibold mt-1 ${step.color}`}>
                    {step.amount}
                  </p>
                )}
              </motion.div>
              
              {index < steps.length - 1 && (
                <ArrowRight className="h-5 w-5 text-muted-foreground hidden sm:block" />
              )}
            </div>
          ))}
        </div>
        
        {/* Summary */}
        <div className="mt-6 p-4 bg-muted/30 rounded-xl grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-xs text-muted-foreground">Total Revenue</p>
            <p className="text-lg font-bold text-foreground">
              Rs. {stats?.totalRevenue?.toLocaleString() || '0'}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Platform Share</p>
            <p className="text-lg font-bold text-primary">
              Rs. {stats?.platformEarnings?.toLocaleString() || '0'}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Vendor Payouts</p>
            <p className="text-lg font-bold text-success">
              Rs. {((stats?.totalRevenue || 0) - (stats?.platformEarnings || 0)).toLocaleString()}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
