import { describe, expect, it, beforeEach } from "vitest";


describe("database connection - graceful degradation", () => {
  beforeEach(() => {
    delete process.env.COGNODB_URI;
    delete process.env.COGNODB_USERNAME;
    delete process.env.COGNODB_PASSWORD;
  });

  it("getDriver() returns null when credentials are missing, instead of throwing", async () => {
    const { getDriver } = await import("../database/connection.js");
    expect(getDriver()).toBeNull();
  });

  it("runQuery() rejects with DatabaseUnavailableError (not a raw driver error)", async () => {
    const { runQuery, DatabaseUnavailableError } = await import("../database/connection.js");
    await expect(runQuery("MATCH (n) RETURN n")).rejects.toBeInstanceOf(DatabaseUnavailableError);
  });

  it("checkDatabaseConnection() reports ok:false without throwing", async () => {
    const { checkDatabaseConnection } = await import("../database/connection.js");
    const result = await checkDatabaseConnection();
    expect(result.ok).toBe(false);
    expect(result.message).toBeTruthy();
  });
});
