// TASK-096: xuất file .ics (iCalendar, RFC 5545) thuần client-side — không gọi API lịch thật
// (Google/Outlook/Apple), chỉ tạo nội dung chuẩn để user tự tải về và import vào lịch của họ.

function pad2(n) {
  return String(n).padStart(2, '0')
}

// RFC 5545 yêu cầu ngày dạng YYYYMMDD (all-day event dùng VALUE=DATE, không có giờ/múi giờ).
function toIcsDate(date) {
  return `${date.getFullYear()}${pad2(date.getMonth() + 1)}${pad2(date.getDate())}`
}

// DTSTAMP/UID cần dạng UTC đầy đủ theo chuẩn (YYYYMMDDTHHMMSSZ).
function toIcsUtcStamp(date) {
  return `${date.getUTCFullYear()}${pad2(date.getUTCMonth() + 1)}${pad2(date.getUTCDate())}T${pad2(
    date.getUTCHours()
  )}${pad2(date.getUTCMinutes())}${pad2(date.getUTCSeconds())}Z`
}

// RFC 5545 §3.3.11: escape dấu phẩy/chấm phẩy/backslash, xuống dòng thành literal "\n".
function escapeIcsText(value) {
  return String(value ?? '')
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n')
}

// RFC 5545 §3.1: dòng dài hơn 75 octet phải "fold" — xuống dòng CRLF rồi thụt 1 khoảng trắng.
function foldIcsLine(line) {
  if (line.length <= 75) return line
  let result = line.slice(0, 75)
  let rest = line.slice(75)
  while (rest.length > 0) {
    result += '\r\n ' + rest.slice(0, 74)
    rest = rest.slice(74)
  }
  return result
}

/**
 * Tạo nội dung file .ics hợp lệ (VCALENDAR/VEVENT, RFC 5545) cho 1 sự kiện nhắc việc all-day.
 * @param {{ title: string, description: string, date: string }} params date dạng 'YYYY-MM-DD' (input type="date")
 * @returns {string} nội dung .ics, các dòng nối bằng \r\n theo đúng chuẩn.
 */
export function buildIcsContent({ title, description, date }) {
  if (!date) {
    throw new Error('Thiếu ngày nhắc việc')
  }
  const [year, month, day] = date.split('-').map(Number)
  const eventDate = new Date(year, (month || 1) - 1, day || 1)
  const nextDay = new Date(year, (month || 1) - 1, (day || 1) + 1)
  const now = new Date()

  const uid = `homely-reminder-${eventDate.getTime()}-${Math.random().toString(36).slice(2, 10)}@homely.app`

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Homely//Calendar Export//VI',
    'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${toIcsUtcStamp(now)}`,
    `DTSTART;VALUE=DATE:${toIcsDate(eventDate)}`,
    `DTEND;VALUE=DATE:${toIcsDate(nextDay)}`,
    `SUMMARY:${escapeIcsText(title)}`,
    `DESCRIPTION:${escapeIcsText(description)}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ]

  return lines.map(foldIcsLine).join('\r\n') + '\r\n'
}

// Tải file .ics về máy user — cùng pattern Blob/URL.createObjectURL với exportLayout() ở
// Room3DViewer.jsx (TASK-075), chỉ tham khảo cách làm, không import trực tiếp file đó.
export function downloadIcsFile(content, filename = `homely-nhac-lich-${Date.now()}.ics`) {
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.download = filename
  link.href = url
  link.click()
  URL.revokeObjectURL(url)
}
