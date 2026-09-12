import type { DecisionRequest, DecisionResponse, HourlyForecast, Recommendation } from '@/lib/types'

function pickSeries(forecast: DecisionRequest['forecast']): HourlyForecast[] {
  return forecast.combined || forecast.solar || forecast.wind || []
}

export function runDecisionEngine(payload: DecisionRequest): DecisionResponse {
  const series = pickSeries(payload.forecast)
  const { exportLimitMW, loadRequirementMW } = payload.operatingRequirement

  const recommendations: Recommendation[] = []
  const timeline: DecisionResponse['timeline'] = []

  let currentWindow: { start: string; end: string; status: Recommendation['status'] } | null = null

  for (const hour of series) {
    let status: Recommendation['status'] = 'normal'
    let action: Recommendation['action'] = 'normal-operation'
    let reason = 'Forecast generation is within the configured operating band.'
    let thresholdMW = exportLimitMW
    let deltaMW = 0

    if (hour.expectedMW > exportLimitMW) {
      status = 'surplus'
      deltaMW = Math.round((hour.expectedMW - exportLimitMW) * 10) / 10
      thresholdMW = exportLimitMW
      if (payload.storage.availableMWh > 0) {
        action = 'charge-storage'
        reason = `Forecast ${hour.expectedMW} MW exceeds export limit ${exportLimitMW} MW by ${deltaMW} MW — route surplus into available storage.`
      } else if (payload.flexibleLoad.shiftableMW > 0) {
        action = 'shift-load'
        reason = `Forecast ${hour.expectedMW} MW exceeds export limit ${exportLimitMW} MW by ${deltaMW} MW — shift flexible load into this window.`
      } else {
        action = 'curtail'
        reason = `Forecast ${hour.expectedMW} MW exceeds export limit ${exportLimitMW} MW by ${deltaMW} MW with no storage or flexible load available — curtailment recommended.`
      }
    } else if (hour.expectedMW < loadRequirementMW) {
      status = 'shortfall'
      thresholdMW = loadRequirementMW
      deltaMW = Math.round((loadRequirementMW - hour.expectedMW) * 10) / 10
      if (payload.storage.maxDischargeMW > 0) {
        action = 'prepare-discharge'
        reason = `Forecast ${hour.expectedMW} MW is below load requirement ${loadRequirementMW} MW by ${deltaMW} MW — prepare battery discharge.`
      } else {
        action = 'activate-backup'
        reason = `Forecast ${hour.expectedMW} MW is below load requirement ${loadRequirementMW} MW by ${deltaMW} MW — activate backup generation.`
      }
    }

    timeline.push({ time: hour.time, status })

    if (!currentWindow || currentWindow.status !== status) {
      if (currentWindow) {
        recommendations.push({
          windowStart: currentWindow.start,
          windowEnd: currentWindow.end,
          status: currentWindow.status,
          action: recommendations.length > 0 ? recommendations[recommendations.length - 1].action : action,
          reason,
          numbers: { forecastMW: hour.expectedMW, thresholdMW, deltaMW },
        })
      }
      currentWindow = { start: hour.time, end: hour.time, status }
    } else {
      currentWindow.end = hour.time
    }

    if (status !== 'normal') {
      const last = recommendations[recommendations.length - 1]
      if (!last || last.windowStart !== currentWindow.start) {
        recommendations.push({
          windowStart: currentWindow.start,
          windowEnd: currentWindow.end,
          status,
          action,
          reason,
          numbers: { forecastMW: hour.expectedMW, thresholdMW, deltaMW },
        })
      } else {
        last.windowEnd = currentWindow.end
      }
    }
  }

  const overallStatus: DecisionResponse['status'] = recommendations.some((r) => r.status === 'shortfall')
    ? 'shortfall'
    : recommendations.some((r) => r.status === 'surplus')
      ? 'surplus'
      : 'normal'

  return {
    status: overallStatus,
    recommendations: recommendations.filter((r) => r.status !== 'normal'),
    timeline,
  }
}