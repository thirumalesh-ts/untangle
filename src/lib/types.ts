export type Role = "system" | "user" | "assistant";
export type MessageContent = Array<string | Record<string, unknown>>;

export type ChatMessage = {
  role: Role;
  message: MessageContent;
};

export type ValidatorError = {
  validator: string;
  response: ChatMessage;
  errors: Array<string>;
  createdAt: Date;
}

export type ChatThread = {
  promptID: string;
  tag?: string;
  messages: ChatMessage[];
  messagesAt: Date;
  validatorErrors?:  Array<ValidatorError>
  response?: ChatMessage;
  responseAt?: Date;
  args?: Record<string, unknown>;
  schema?: Record<string, unknown>;
};

export type Session = {
  id: string;
  name?: string;
  description?: string;
  threads: Record<string, ChatThread>;
};
