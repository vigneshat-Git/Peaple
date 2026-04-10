import jwt from 'jsonwebtoken';

if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is not set');
}

export const signToken = (payload: object, expiresIn: string = '1h') => {
  return jwt.sign(payload, process.env.JWT_SECRET as string, { expiresIn } as any);
};

export const verifyToken = (token: string) => {
  return jwt.verify(token, process.env.JWT_SECRET as string);
};
