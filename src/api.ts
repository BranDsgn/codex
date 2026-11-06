export async function api(path: string, method = "GET", data?: unknown) {
  const r = await fetch("/api" + path, {
    method,
    headers: { "Content-Type": "application/json" },
    body: data === undefined ? undefined : JSON.stringify(data),
    credentials: "same-origin",
  });
  let result;
  try {
    result = await r.json();
  } catch {
    throw new Error(
      "The server could not be reached. Your change was not saved.",
    );
  }
  if (!r.ok) throw new Error(result.error || "Your change could not be saved.");
  return result;
}
