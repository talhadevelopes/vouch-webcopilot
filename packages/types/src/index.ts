export type ApiEnvelope<T> =
  | {
      status: "success";
      message: string;
      data: T;
    }
  | {
      status: "error";
      message: string;
      error: {
        code: string;
        details?: unknown;
      };
    };

export type User = {
  id: string;
  email: string;
  name: string;
};

export type HistoryItem = {
  id: string;
  inputUrl: string;
  aiResponse: string | null;
  proof: string | null;
  biasScore: number | null;
  shareId: string | null;
  createdAt: string;
};

export type LoginResponse = {
  user: User;
  accessToken: string;
  refreshToken: string;
};
