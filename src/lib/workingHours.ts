import { Group } from './api'

export interface WorkingHoursValidation {
  isValid: boolean
  reason?: string
  currentTime: string
  allowedHours?: string
  allowedDays?: string[]
}

/**
 * 現在時刻が勤務時間内かどうかをチェック
 */
export function validateWorkingHours(group?: Group): WorkingHoursValidation {
  const now = new Date()
  const currentTime = now.toLocaleTimeString('ja-JP', { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: false 
  })
  const currentDay = now.getDay() // 0=日曜, 1=月曜, ..., 6=土曜
  
  // グループの勤務時間設定がない場合は常に許可
  if (!group?.workingHours) {
    return {
      isValid: true,
      currentTime
    }
  }
  
  const { startTime, endTime, workingDays } = group.workingHours
  
  // 勤務日チェック
  if (workingDays && workingDays.length > 0) {
    if (!workingDays.includes(currentDay)) {
      const dayNames = ['日', '月', '火', '水', '木', '金', '土']
      const allowedDayNames = workingDays.map(day => dayNames[day])
      
      return {
        isValid: false,
        reason: `本日は勤務日ではありません`,
        currentTime,
        allowedDays: allowedDayNames
      }
    }
  }
  
  // 勤務時間チェック
  if (startTime && endTime) {
    const currentMinutes = timeToMinutes(currentTime)
    const startMinutes = timeToMinutes(startTime)
    let endMinutes = timeToMinutes(endTime)
    
    // 終了時間が開始時間より早い場合（例：22:00-06:00）は翌日処理
    if (endMinutes <= startMinutes) {
      endMinutes += 24 * 60 // 翌日の時間に変換
      
      // 現在時刻が開始時間より前の場合、翌日の時刻として計算
      if (currentMinutes < startMinutes) {
        const adjustedCurrentMinutes = currentMinutes + 24 * 60
        if (adjustedCurrentMinutes < startMinutes || adjustedCurrentMinutes > endMinutes) {
          return {
            isValid: false,
            reason: `勤務時間外です`,
            currentTime,
            allowedHours: `${startTime}〜${endTime}`
          }
        }
      } else if (currentMinutes < startMinutes || currentMinutes > endMinutes) {
        return {
          isValid: false,
          reason: `勤務時間外です`,
          currentTime,
          allowedHours: `${startTime}〜${endTime}`
        }
      }
    } else {
      // 通常の時間範囲（例：09:00-18:00）
      if (currentMinutes < startMinutes || currentMinutes > endMinutes) {
        return {
          isValid: false,
          reason: `勤務時間外です`,
          currentTime,
          allowedHours: `${startTime}〜${endTime}`
        }
      }
    }
  }
  
  return {
    isValid: true,
    currentTime,
    allowedHours: startTime && endTime ? `${startTime}〜${endTime}` : undefined
  }
}

/**
 * 現在日付が研修期間内かどうかをチェック
 */
export function validateTrainingPeriod(group?: Group): WorkingHoursValidation {
  const now = new Date()
  const currentDate = now.toISOString().split('T')[0] // YYYY-MM-DD
  const currentTime = now.toLocaleTimeString('ja-JP', { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: false 
  })
  
  // グループの研修期間設定がない場合は常に許可
  if (!group?.trainingPeriod) {
    return {
      isValid: true,
      currentTime
    }
  }
  
  const { startDate, endDate } = group.trainingPeriod
  
  if (startDate && currentDate < startDate) {
    return {
      isValid: false,
      reason: `研修期間開始前です（開始日: ${formatDate(startDate)}）`,
      currentTime
    }
  }
  
  if (endDate && currentDate > endDate) {
    return {
      isValid: false,
      reason: `研修期間終了後です（終了日: ${formatDate(endDate)}）`,
      currentTime
    }
  }
  
  return {
    isValid: true,
    currentTime
  }
}

/**
 * 勤務時間と研修期間の両方をチェック
 */
export function validateAccess(group?: Group): WorkingHoursValidation {
  // 研修期間チェック
  const trainingValidation = validateTrainingPeriod(group)
  if (!trainingValidation.isValid) {
    return trainingValidation
  }
  
  // 勤務時間チェック
  return validateWorkingHours(group)
}

// ヘルパー関数
function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number)
  return hours * 60 + minutes
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}