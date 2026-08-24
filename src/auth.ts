import { createServerFn } from "@tanstack/react-start";
import { setCookie } from "@tanstack/react-start/server";
import { env } from "cloudflare:workers";
import { registerUser, getUserByEmail } from "./db";

export const authenticate = createServerFn({ method: "POST" })
  .validator((data: { email: string; password: string }) => data)
  .handler(async ({ data }) => {
    const existing = await getUserByEmail(env, data.email);

    if (existing) {
      if (existing.password !== data.password) {
        throw new Error("Wrong password");
      }
      setCookie("zupona_session", data.email, {
        httpOnly: true,
        path: "/",
        maxAge: 60 * 60 * 24 * 30,
      });
      return { status: "signed_in", email: data.email };
    }

    await registerUser(env, data.email, data.password);
    setCookie("zupona_session", data.email, {
      httpOnly: true,
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });
    return { status: "signed_up", email: data.email };
  });
