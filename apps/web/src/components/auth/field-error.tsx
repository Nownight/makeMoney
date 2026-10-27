type FieldErrorProps = {
  messages?: string[];
};

export function FieldError({ messages }: FieldErrorProps) {
  if (!messages?.length) {
    return null;
  }

  return (
    <p className="text-xs text-destructive" role="alert">
      {messages[0]}
    </p>
  );
}
