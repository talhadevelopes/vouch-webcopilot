import bcrypt from "bcryptjs";

export function hashPassword(rawPassword: string) {
  return bcrypt.hash(rawPassword, 10);
}

export function comparePassword(rawPassword: string, hash: string) {
  return bcrypt.compare(rawPassword, hash);
}
