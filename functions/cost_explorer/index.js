const AWS = require("aws-sdk")
const moment = require('moment');

const { SECRET_ACCESS_KEY, ACCESS_KEY_ID } = process.env;

moment.defaultFormat = 'YYYY-MM-DD';
moment.defaultFormatUtc = 'YYYY-MM-DD';
const ce = new AWS.CostExplorer({
  accessKeyId: ACCESS_KEY_ID,
  secretAccessKey: SECRET_ACCESS_KEY,
  region: 'us-east-1',
})

/**
 * Round numerical values to max 2 decimal places
 *
 * @param {Number} x
 * @returns {Number}
 */
function normalizeCostValue(x) {
  return Math.floor(Number(x) * 100) / 100;
}

/**
 * Retrieve the AWS Cost Explorer Cost and Usage for various periods
 *
 * @param {*} event
 */
async function getCost(event) {
  const { period = '' } = event;

  if (typeof period !== 'string') return { errorCode: 400, errorMessage: 'Invalid period' };

  const TimePeriod = {}
  switch (period.toUpperCase()) {
    case 'MTD':
      TimePeriod.Start = moment().startOf('month').format();
      TimePeriod.End = moment().add(1, 'days').format();
      break;
    case 'YTD':
      TimePeriod.Start = moment().startOf('year').format();
      TimePeriod.End = moment().add(1, 'days').format();
      break;
    case 'YESTERDAY':
      TimePeriod.Start = moment().subtract(1, 'days').startOf('day').format();
      TimePeriod.End = moment().format();
      break;
    case 'TODAY':
      TimePeriod.Start = moment().startOf('day').format();
      TimePeriod.End = moment().add(1, 'days').format();
      break;
    case 'LASTMONTH':
    default:
      TimePeriod.End = moment().startOf('month').format();
      TimePeriod.Start = moment().subtract(1, 'months').startOf('month').format();
      break;
  }

  const params = {
    Granularity: 'MONTHLY',
    TimePeriod,
    Metrics: ['BLENDED_COST'],
  }
  const { ResultsByTime: results } = await ce.getCostAndUsage(params).promise();
  const Total = results.reduce((t, i) => t + normalizeCostValue(i.Total.BlendedCost.Amount), 0);
  return { Total, Unit: 'USD' };
}

/**
 * Retrieve the AWS Cost Explorer Forecast for various periods
 *
 * @param {*} event
 */
async function getCostForecast(event) {
  const { period = '' } = event;

  if (typeof period !== 'string') return { errorCode: 400, errorMessage: 'Invalid period' };

  const TimePeriod = {}
  switch (period.toUpperCase()) {
    case 'TOMORROW':
      TimePeriod.Start = moment().add(1, 'days').format();
      TimePeriod.End = moment().add(2, 'days').format();
      break;
    case 'YEAR':
      TimePeriod.Start = moment().add(1, 'days').format();
      TimePeriod.End = moment().add(1, 'years').startOf('day').format();
      break;
    case 'MONTH':
    default:
      TimePeriod.Start = moment().add(1, 'days').format();
      TimePeriod.End = moment().add(1, 'months').startOf('day').format();
      break;
  }

  const params = {
    Granularity: 'MONTHLY',
    TimePeriod,
    Metric: 'BLENDED_COST',
    PredictionIntervalLevel: 80,
  }

  const { ForecastResultsByTime: results } = await ce.getCostForecast(params).promise();
  const { Mean, LowerBound, UpperBound } = results.reduce((acc, i) => {
    acc.Mean += normalizeCostValue(i.MeanValue);
    acc.LowerBound += normalizeCostValue(i.PredictionIntervalLowerBound);
    acc.UpperBound += normalizeCostValue(i.PredictionIntervalUpperBound);
    return acc;
  }, { Mean: 0, LowerBound: 0, UpperBound: 0 });
  return {
    Mean: normalizeCostValue(Mean),
    LowerBound: normalizeCostValue(LowerBound),
    UpperBound: normalizeCostValue(UpperBound),
    Unit: 'USD'
  };
}

/**
 * function main handler
 *
 * @param {*} event
 */
async function handler(event) {
  try {
    const { action } = event;
    if (!action) return { errorCode: 400, errorMessage: 'Missing action' };
    if (action.toLowerCase() === 'cost') return getCost(event);
    if (action.toLowerCase() === 'forecast') return getCostForecast(event);
    return { errorCode: 400, errorMessage: 'Invalid action' };
  }
  catch (err) {
    return { errorCode: 500, errorMessage: 'Unknown error: ' + err.message };
  }
};

module.exports.handler = handler;
