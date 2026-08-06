import { describe, expect, it } from "vitest";
import {
  boardClientStatus,
  CLIENT_STATUS_ORDER,
  clientStatusSelectOptions,
} from "./types";

describe("client pipeline statuses", () => {
  it("excludes kickoff and execucao from board order", () => {
    expect(CLIENT_STATUS_ORDER).toEqual([
      "oportunidade",
      "aguardando_informacoes",
      "testes",
      "melhorias",
      "finalizado",
      "cancelado",
    ]);
    expect(CLIENT_STATUS_ORDER).not.toContain("kickoff");
    expect(CLIENT_STATUS_ORDER).not.toContain("execucao");
  });

  it("maps legacy statuses into visible columns", () => {
    expect(boardClientStatus("kickoff")).toBe("oportunidade");
    expect(boardClientStatus("execucao")).toBe("testes");
    expect(boardClientStatus("oportunidade")).toBe("oportunidade");
    expect(boardClientStatus("melhorias")).toBe("melhorias");
  });

  it("keeps legacy status in select when current value is removed from board", () => {
    expect(clientStatusSelectOptions("kickoff")[0]).toBe("kickoff");
    expect(clientStatusSelectOptions("oportunidade")).toEqual(
      CLIENT_STATUS_ORDER,
    );
  });
});
