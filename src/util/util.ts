// Utilities functions
export const arrayBufferToBase64Url = (buffer: any): string => {
  // return btoa(String.fromCharCode(...new Uint8Array(buffer)))
  return btoa(String.fromCharCode(buffer))
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
}

export const objectToBase64url = (payload: any) => {
  return arrayBufferToBase64Url(
    new TextEncoder().encode(JSON.stringify(payload)),
  )
}
