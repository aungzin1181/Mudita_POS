export interface DeviceInfo {
  os:          string
  device_type: string
  browser:     string
}

export function getDeviceInfo(): DeviceInfo {
  if (typeof window === 'undefined') {
    return { os: 'Unknown', device_type: 'Unknown', browser: 'Unknown' }
  }

  const ua = navigator.userAgent

  let os = 'Unknown'
  if (/Windows/i.test(ua))               os = 'Windows'
  else if (/Android/i.test(ua))          os = 'Android'
  else if (/iPad|iPhone|iPod/i.test(ua)) os = 'iOS'
  else if (/Macintosh|Mac OS/i.test(ua)) os = 'macOS'
  else if (/Linux/i.test(ua))            os = 'Linux'

  let device_type = 'Desktop'
  if (/Mobi|Android/i.test(ua) && !/Tablet|iPad/i.test(ua)) device_type = 'Mobile'
  else if (/Tablet|iPad/i.test(ua))                          device_type = 'Tablet'

  let browser = 'Unknown'
  if (/Edg\//i.test(ua))          browser = 'Edge'
  else if (/OPR|Opera/i.test(ua)) browser = 'Opera'
  else if (/Chrome/i.test(ua))    browser = 'Chrome'
  else if (/Firefox/i.test(ua))   browser = 'Firefox'
  else if (/Safari/i.test(ua))    browser = 'Safari'

  return { os, device_type, browser }
}
