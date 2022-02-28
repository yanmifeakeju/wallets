export interface UserData {
  username: string;
  password: string;
}

type Account = {
  id: int;
  user_id: string;
  balance: number;
  created_at: Date;
  updated_at: Date;
};

type User = {
  id: string;
  username: string;
  created_at: Date;
  updated_at: Date;
};

export interface WalletResponse {
  success: boolean;
  message: string;
  code: number;
  data?: Account | User | Transaction;
}
