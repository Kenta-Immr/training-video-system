declare module 'jwt-decode' {
  export interface JwtPayload {
    exp?: number
    iat?: number
    nbf?: number
    [key: string]: any
  }

  export default function jwtDecode<T = JwtPayload>(token: string): T
  export function jwtDecode<T = JwtPayload>(token: string): T
}