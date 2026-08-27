export interface JwtPayload {
  sub: string;
  email: string;
  businessId: string | null;
  role: string | null;
  isSuperAdmin: boolean;
}
