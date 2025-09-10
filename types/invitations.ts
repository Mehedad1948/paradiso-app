import { User } from './user';

export interface invitation {
  id: number;
  invitedBy: Pick<User, 'avatar' | 'email' | 'id' >;
  email:string;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
}
