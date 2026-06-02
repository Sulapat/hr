import jwt from "jsonwebtoken";
import { Role } from "@prisma/client";

const SECRET = process.env.JWT_SECRET || "fallback_secret";
const EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

export interface JWTPayload {
  id: string;
  email: string;
  role: Role;
}

export const signToken = (payload: JWTPayload): string => {
  return jwt.sign(payload, SECRET, { expiresIn: EXPIRES_IN } as jwt.SignOptions);
};

export const verifyToken = (token: string): JWTPayload => {
  return jwt.verify(token, SECRET) as JWTPayload;
};
