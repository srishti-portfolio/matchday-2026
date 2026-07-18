import { describe, it, expect, vi } from "vitest";
import { screen, fireEvent } from "@testing-library/react";
import { renderWithI18n } from "../test/renderWithProviders.jsx";
import AuthScreen from "./AuthScreen.jsx";
import { UserProvider } from "../context/UserContext.jsx";

/**
 * UserProvider calls /api/health on mount to choose database vs demo mode.
 * Mocking the API keeps these tests offline and deterministic, and stops the
 * post-render state update that React warns about ("not wrapped in act(...)").
 */
vi.mock("../api.js", () => ({
  ApiError: class ApiError extends Error {},
  fetchHealth: () => Promise.resolve({ ok: true, aiConfigured: false, dbConfigured: false }),
  fetchProfile: () => Promise.resolve({ user: null, attended: [] }),
  login: () => Promise.reject(new Error("offline")),
  register: () => Promise.reject(new Error("offline")),
  patchProfile: () => Promise.reject(new Error("offline")),
  postAttended: () => Promise.resolve({ attended: [] }),
  getToken: () => null,
  setToken: () => {},
}));

/** Render inside the provider and wait for its mount effect to settle. */
async function renderAuth() {
  const utils = renderWithI18n(
    <UserProvider>
      <AuthScreen language="English" onLanguageChange={() => {}} />
    </UserProvider>
  );
  await screen.findAllByRole("button", { name: /^Create account$/i });
  return utils;
}

describe("AuthScreen", () => {
  it("renders the create-account form by default", async () => {
    await renderAuth();
    expect(screen.getByText(/Preferred language/i)).toBeInTheDocument();
  });

  it("offers both create-account and sign-in", async () => {
    await renderAuth();
    expect(screen.getAllByRole("button", { name: /^Create account$/i }).length).toBeGreaterThan(0);
    expect(screen.getByRole("button", { name: /^Sign in$/i })).toBeInTheDocument();
  });

  it("shows a validation error on empty submit", async () => {
    await renderAuth();
    const buttons = screen.getAllByRole("button", { name: /^Create account$/i });
    fireEvent.click(buttons[buttons.length - 1]); // the submit button
    expect(await screen.findByText(/Enter a name and password/i)).toBeInTheDocument();
  });

  it("hides the language selector in sign-in mode", async () => {
    await renderAuth();
    fireEvent.click(screen.getByRole("button", { name: /^Sign in$/i }));
    expect(screen.queryByText(/Preferred language/i)).not.toBeInTheDocument();
  });

  it("starts with empty fields (no prefilled values)", async () => {
    await renderAuth();
    expect(screen.getByPlaceholderText(/Alex Rivera/i)).toHaveValue("");
  });
});
