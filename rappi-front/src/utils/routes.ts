import type { UserRole } from '../types';

export const getHomeRoute = (role: UserRole): string => {
  switch (role) {
    case 'consumer':
      return '/stores';
    case 'store':
      return '/my-store';
    case 'delivery':
      return '/available';
  }
};
