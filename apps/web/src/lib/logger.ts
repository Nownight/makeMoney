type LogLevel = "info" | "warn" | "error";

type LogValue = string | number | boolean | null | undefined;

type LogFields = Record<string, LogValue>;

function serializeError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "string") {
    return error;
  }

  try {
    return JSON.stringify(error);
  } catch {
    return String(error);
  }
}

/**
 * Emits one JSON line per event so logs can be queried by reportId, stage,
 * sourceId, etc. Never pass secrets, full prompts or user email addresses.
 */
export function logEvent(
  level: LogLevel,
  event: string,
  fields: LogFields = {},
): void {
  const entry = {
    ts: new Date().toISOString(),
    level,
    event,
    ...fields,
  };

  const line = JSON.stringify(entry);

  if (level === "error") {
    console.error(line);
    return;
  }

  if (level === "warn") {
    console.warn(line);
    return;
  }

  console.info(line);
}

export function logError(
  event: string,
  error: unknown,
  fields: LogFields = {},
): void {
  logEvent("error", event, { ...fields, error: serializeError(error) });
}
