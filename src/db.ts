export async function registerUser(env: Env, email: string, passwordHash: string) {
  const result = await env.DB.prepare(
    "INSERT INTO users (email, password) VALUES (?, ?)"
  )
    .bind(email, passwordHash)
    .run();
  return result;
}

export async function getUserByEmail(env: Env, email: string) {
  const user = await env.DB.prepare(
    "SELECT * FROM users WHERE email = ?"
  )
    .bind(email)
    .first();
  return user;
}