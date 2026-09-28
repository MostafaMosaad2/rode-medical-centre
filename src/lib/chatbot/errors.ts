/** The server has no model API key. Local FAQs can still be answered. */
export class ChatNotConfiguredError extends Error {
  constructor() {
    super("Chat model is not configured");
    this.name = "ChatNotConfiguredError";
  }
}

/** The model request failed. Safe to retry. Do not attach response bodies. */
export class ChatUpstreamError extends Error {
  constructor() {
    super("Chat upstream failed");
    this.name = "ChatUpstreamError";
  }
}
