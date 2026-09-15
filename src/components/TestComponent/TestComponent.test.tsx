import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import TestComponent from "./TestComponent";

describe("Prueba unitaria de TestComponent", () => {
  it("debe mostrar el nombre recibido", () => {
    render(<TestComponent name="Mishelle" />);

    expect(screen.getByText("Hola, Mishelle")).toBeTruthy();
  });
});