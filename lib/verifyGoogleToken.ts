// Google ID Token verification via Google's public tokeninfo endpoint.
// No private key required — uses Google's public key infrastructure.

export type GoogleTokenPayload = {
  sub: string;       // Unique Google user ID
  email: string;
  email_verified: boolean;
  hd?: string;       // Hosted domain (e.g. "nitw.ac.in")
  name: string;
  picture?: string;
  exp: number;       // Expiration timestamp (seconds)
  aud: string;       // Must match our Client ID
  iss: string;       // Must be Google
};

export async function verifyGoogleToken(token: string): Promise<GoogleTokenPayload | null> {
  if (!token) return null;
  try {
    const res = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(token)}`,
      { next: { revalidate: 0 } }
    );
    if (!res.ok) return null;
    const payload = await res.json() as GoogleTokenPayload;

    // Verify issuer
    if (!["accounts.google.com", "https://accounts.google.com"].includes(payload.iss)) {
      return null;
    }

    // Verify audience matches our Client ID (if configured)
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (clientId && payload.aud !== clientId) {
      console.error("Token audience mismatch:", payload.aud, "expected:", clientId);
      return null;
    }

    // Verify email is confirmed by Google
    if (!payload.email_verified) return null;

    return payload;
  } catch {
    return null;
  }
}
