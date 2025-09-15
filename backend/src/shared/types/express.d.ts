import { User } from '@/modules/user/user.model';

declare global {
  namespace Express {
    interface Request {
      id: string;
      user?: User;
    }
  }
}
