import jwt from 'jsonwebtoken';
import crypto from 'crypto';

const getJwtAccessSecret = () => {
  const secret = process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_ACCESS_SECRET is not configured');
  }
  return secret;
};

const getJwtRefreshSecret = () => {
  const secret = process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_REFRESH_SECRET is not configured');
  }
  return secret;
};

export const generateAccessToken = (userId) => {
  return jwt.sign({ id: userId }, getJwtAccessSecret(), {
    expiresIn: process.env.JWT_ACCESS_EXPIRES || '15m',
  });
};

export const generateRefreshToken = (userId) => {
  return jwt.sign({ id: userId }, getJwtRefreshSecret(), {
    expiresIn: process.env.JWT_REFRESH_EXPIRES || '7d',
  });
};

export const generateTokens = (userId) => ({
  accessToken: generateAccessToken(userId),
  refreshToken: generateRefreshToken(userId),
});

export const verifyAccessToken = (token) => {
  return jwt.verify(token, getJwtAccessSecret());
};

export const verifyRefreshToken = (token) => {
  return jwt.verify(token, getJwtRefreshSecret());
};
