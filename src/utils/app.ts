export function log (message: string, ...values: any[]) {
  console.log('[MultiFlow] ' + message, ...values)
}

export function clone (value: any) {
  return JSON.parse(JSON.stringify(value))
}
