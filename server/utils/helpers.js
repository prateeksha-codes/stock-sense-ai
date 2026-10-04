const generateOrderNumber = (prefix = 'ORD') => {
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `${prefix}-${timestamp}-${random}`;
};

const calculateDaysRemaining = (currentStock, avgDailyDemand) => {
  if (!avgDailyDemand || avgDailyDemand <= 0) return 999;
  return Math.floor(currentStock / avgDailyDemand);
};

const calculateStockRisk = (currentStock, avgDailyDemand, leadTime, minStockLevel) => {
  const daysRemaining = calculateDaysRemaining(currentStock, avgDailyDemand);
  const requiredStock = avgDailyDemand * leadTime;
  
  return {
    currentStock,
    avgDailyDemand,
    leadTimeDays: leadTime,
    minStockLevel,
    daysRemaining,
    requiredStock: Math.ceil(requiredStock),
    isAtRisk: currentStock < requiredStock || currentStock <= minStockLevel,
    riskLevel: currentStock <= minStockLevel ? 'critical' : 
               currentStock < requiredStock ? 'high' : 'low',
    reorderQuantity: Math.ceil(requiredStock - currentStock + minStockLevel)
  };
};

module.exports = {
  generateOrderNumber,
  calculateDaysRemaining,
  calculateStockRisk
};