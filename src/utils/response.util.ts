export function okResponse<T>(data: T) {
  return { success: true, data };
}

export function failResponse(message: string) {
  return { success: false, message };
}
