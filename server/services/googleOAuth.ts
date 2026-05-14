import crypto from "crypto";

type GoogleProfile = {
  sub?: string;
  email?: string;
  name?: string;
  picture?: string;
};

function requiredEnv(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`MISSING_${name}`);
  return v;
}

export function isGoogleConfigured() {
  return Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET && process.env.GOOGLE_REDIRECT_URI);
}

export function createGoogleAuthState() {
  return crypto.randomBytes(16).toString("hex");
}

export function buildGoogleAuthUrl(state: string) {
  const clientId = requiredEnv("GOOGLE_CLIENT_ID");
  const redirectUri = requiredEnv("GOOGLE_REDIRECT_URI");

  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "openid email profile");
  url.searchParams.set("state", state);
  url.searchParams.set("access_type", "offline");
  url.searchParams.set("prompt", "consent");
  return url.toString();
}

export async function exchangeCodeForProfile(input: { code: string }) {
  const clientId = requiredEnv("GOOGLE_CLIENT_ID");
  const clientSecret = requiredEnv("GOOGLE_CLIENT_SECRET");
  const redirectUri = requiredEnv("GOOGLE_REDIRECT_URI");

  const tokenResp = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code: input.code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });

  if (!tokenResp.ok) throw new Error(`GOOGLE_TOKEN_EXCHANGE_${tokenResp.status}`);
  const tokenJson = (await tokenResp.json()) as { access_token?: string };
  if (!tokenJson.access_token) throw new Error("GOOGLE_NO_ACCESS_TOKEN");

  const profileResp = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
    headers: { authorization: `Bearer ${tokenJson.access_token}` },
  });
  if (!profileResp.ok) throw new Error(`GOOGLE_PROFILE_${profileResp.status}`);
  const profile = (await profileResp.json()) as GoogleProfile;
  return profile;
}

