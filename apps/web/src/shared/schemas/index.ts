import { z } from 'zod';

export const walletSchema = z.object({
  balance: z.number().int().min(0), // Coin, bilangan bulat, non-withdrawable
  version: z.number().int().min(0),
});

export * from './pagination.js';
export * from './auth.js';
export * from './profile.js';
export * from './activity.js';
export * from './places.js';
export * from './chat.js';
export * from './meeting.js';
export * from './wallet.js';
export * from './notifications.js';
export * from './reports.js';


