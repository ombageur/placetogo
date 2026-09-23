import { z } from 'zod';

export const walletSchema = z.object({
  balance: z.number().int().min(0), // Coin, bilangan bulat, non-withdrawable
  version: z.number().int().min(0),
});

export * from './pagination';
export * from './auth';
export * from './profile';
export * from './activity';
export * from './places';
export * from './chat';
export * from './meeting';
export * from './wallet';
export * from './notifications';
export * from './reports';


