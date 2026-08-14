export type NotificationType =
  | "deposit"
  | "withdrawal"
  | "game"
  | "wallet"
  | "system";

export interface INotification {
  userId: string;

  title: string;

  message: string;

  type: NotificationType;

  read: boolean;

  data?: Record<string, string>;
}