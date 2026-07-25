export function getImdadConfig() {
  const baseUrl = (process.env.IMDAD_BASE_URL ?? "").replace(/\/$/, "");
  const username = process.env.IMDAD_USERNAME ?? "";
  const password = process.env.IMDAD_PASSWORD ?? "";

  if (!baseUrl || !username || !password) {
    throw new Error(
      "IMDAD is not configured. Set IMDAD_BASE_URL, IMDAD_USERNAME, and IMDAD_PASSWORD in .env.local",
    );
  }

  return { baseUrl, username, password };
}
