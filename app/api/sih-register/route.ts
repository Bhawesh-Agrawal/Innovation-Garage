import { NextResponse } from "next/server";
import { google } from "googleapis";

export const runtime = "nodejs";

// ─────────────────────────────────────────────────────────────────────────────
// CONFIG
// ─────────────────────────────────────────────────────────────────────────────
const ALLOWED_NITW_DOMAINS = ["nitw.ac.in", "student.nitw.ac.in"];
// ─────────────────────────────────────────────────────────────────────────────
// CORS — only allow requests from our own domain
// ─────────────────────────────────────────────────────────────────────────────
const ALLOWED_ORIGINS = [
  process.env.NEXT_PUBLIC_APP_URL || "",
  "http://localhost:3000",
  "http://localhost:3001",
  "https://ignitw.in",
  "https://www.ignitw.in",
  "http://ignitw.in",
  "http://www.ignitw.in",
].filter(Boolean);

function corsHeaders(origin: string | null) {
  const allowed =
    !origin || ALLOWED_ORIGINS.includes(origin) || ALLOWED_ORIGINS.length === 0
      ? origin || "*"
      : null;
  if (!allowed) return null;
  return {
    "Access-Control-Allow-Origin": allowed,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

export async function OPTIONS(req: Request) {
  const origin = req.headers.get("origin");
  const headers = corsHeaders(origin);
  if (!headers) return new Response(null, { status: 403 });
  return new Response(null, { status: 204, headers });
}

// ─────────────────────────────────────────────────────────────────────────────
// RATE LIMITING — IP based + Google account based
// ─────────────────────────────────────────────────────────────────────────────
const ipRateMap = new Map<string, { count: number; resetAt: number }>();
const accountRateMap = new Map<string, { count: number; resetAt: number }>();
const IP_LIMIT = 5;
const ACCOUNT_LIMIT = 1; // one registration per Google account
const WINDOW_MS = 60 * 60 * 1000; // 1 hour

const IS_DEV = process.env.NODE_ENV === "development";

function checkIpLimit(ip: string): boolean {
  if (IS_DEV) return true; // skip in dev
  const now = Date.now();
  const entry = ipRateMap.get(ip);
  if (!entry || now > entry.resetAt) {
    ipRateMap.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }
  if (entry.count >= IP_LIMIT) return false;
  entry.count++;
  return true;
}

function checkAccountLimit(googleSub: string): boolean {
  if (IS_DEV) return true; // skip in dev — allow unlimited test submissions
  const now = Date.now();
  const entry = accountRateMap.get(googleSub);
  if (!entry || now > entry.resetAt) {
    accountRateMap.set(googleSub, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }
  if (entry.count >= ACCOUNT_LIMIT) return false;
  entry.count++;
  return true;
}

// ─────────────────────────────────────────────────────────────────────────────
// GOOGLE ID TOKEN VERIFICATION (via Google's tokeninfo endpoint)
// No private key required — uses Google's public key infrastructure.
// ─────────────────────────────────────────────────────────────────────────────
type GoogleTokenPayload = {
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

async function verifyGoogleToken(token: string): Promise<GoogleTokenPayload | null> {
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

// ─────────────────────────────────────────────────────────────────────────────
// VALIDATION HELPERS
// ─────────────────────────────────────────────────────────────────────────────
const isValidEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
const isValidPhone = (p: string) => /^[6-9]\d{9}$/.test(p.replace(/\s/g, ""));
// Strip all HTML tags + dangerous chars (prevent XSS / injection)
const sanitize = (s: string) =>
  s.replace(/<[^>]*>/g, "").replace(/[<>"'`]/g, "").trim().slice(0, 2000);

function err(message: string, status = 400) {
  return NextResponse.json({ success: false, error: message }, { status });
}

// ─────────────────────────────────────────────────────────────────────────────
// GOOGLE SERVICE ACCOUNT CONFIG & AUTH
// ─────────────────────────────────────────────────────────────────────────────
function getGoogleAuth() {
  const jsonString = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (!jsonString) {
    throw new Error("Missing GOOGLE_SERVICE_ACCOUNT_JSON in environment variables.");
  }
  
  let credentials;
  try {
    credentials = JSON.parse(jsonString);
  } catch (e) {
    throw new Error("Failed to parse GOOGLE_SERVICE_ACCOUNT_JSON. Ensure it is valid JSON.");
  }

  return new google.auth.GoogleAuth({
    credentials: {
      client_email: credentials.client_email,
      private_key: credentials.private_key,
    },
    scopes: [
      "https://www.googleapis.com/auth/spreadsheets",
      "https://www.googleapis.com/auth/drive.file",
    ],
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// DIRECT GOOGLE APIS HELPERS
// ─────────────────────────────────────────────────────────────────────────────
async function uploadBomToDrive(file: File, teamName: string): Promise<string> {
  const auth = getGoogleAuth();
  const drive = google.drive({ version: "v3", auth });
  const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
  
  if (!folderId) throw new Error("Missing GOOGLE_DRIVE_FOLDER_ID");

  const buffer = await file.arrayBuffer();
  // Using Buffer to construct a stream
  const { Readable } = require("stream");
  const stream = Readable.from(Buffer.from(buffer));

  const res = await drive.files.create({
    requestBody: {
      name: `BOM_${teamName}_${Date.now()}.pdf`,
      parents: [folderId],
    },
    media: {
      mimeType: file.type,
      body: stream,
    },
    fields: "id, webViewLink",
  });
  
  // Set permissions so anyone with the link can view (optional, but useful if organisers want to click it directly)
  if (res.data.id) {
    try {
      await drive.permissions.create({
        fileId: res.data.id,
        requestBody: { role: "reader", type: "anyone" }
      });
    } catch(e) {
      console.warn("Failed to set public permission on PDF, it will remain private to the Service Account/Folder.", e);
    }
  }

  return res.data.webViewLink || "";
}

async function submitToSheet(rowData: Record<string, string>): Promise<void> {
  const auth = getGoogleAuth();
  const sheets = google.sheets({ version: "v4", auth });
  const sheetId = process.env.GOOGLE_SHEET_ID;
  
  if (!sheetId) throw new Error("Missing GOOGLE_SHEET_ID");

  const keys = Object.keys(rowData);
  const values = Object.values(rowData);

  // Check if sheet is empty (needs headers)
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range: "A1:Z1",
  });

  const needsHeaders = !response.data.values || response.data.values.length === 0;

  const resource = {
    values: needsHeaders ? [keys, values] : [values],
  };

  await sheets.spreadsheets.values.append({
    spreadsheetId: sheetId,
    range: "A1",
    valueInputOption: "USER_ENTERED",
    insertDataOption: "INSERT_ROWS",
    requestBody: resource,
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// POST — MAIN HANDLER
// ─────────────────────────────────────────────────────────────────────────────
export async function POST(req: Request) {
  const origin = req.headers.get("origin");
  const headers = corsHeaders(origin) ?? {};

  // ── 1. CORS CHECK ────────────────────────────────────────────────────────
  if (origin && corsHeaders(origin) === null) {
    return NextResponse.json(
      { success: false, error: "Forbidden origin" },
      { status: 403, headers }
    );
  }

  // ── 2. IP RATE LIMIT ─────────────────────────────────────────────────────
  const forwardedFor = req.headers.get("x-forwarded-for") ?? "unknown";
  const ip = forwardedFor.split(",")[0].trim();

  if (!checkIpLimit(ip)) {
    return NextResponse.json(
      {
        success: false,
        error:
          "Too many submission attempts from your network (max 5/hour). Contact ig@nitw.ac.in if you believe this is wrong.",
      },
      { status: 429, headers }
    );
  }

  // ── 3. PARSE FORM DATA ───────────────────────────────────────────────────
  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid form data." },
      { status: 400, headers }
    );
  }

  const get = (key: string) => ((formData.get(key) as string) || "").trim();

  // ── 4. HONEYPOT CHECK (silent discard for bots) ──────────────────────────
  const honeypot = get("website");
  if (honeypot) {
    // Bot filled the hidden field — silently pretend success
    console.warn(`Honeypot triggered from IP: ${ip}`);
    return NextResponse.json({ success: true }, { status: 200, headers });
  }

  // ── 5. EXTRACT SECURITY TOKENS ───────────────────────────────────────────
  const idToken = get("idToken");

  // ── 6. (Removed reCAPTCHA) ───────────────────────────────────────────────

  // ── 7. GOOGLE ID TOKEN VERIFICATION ─────────────────────────────────────
  let tokenPayload = null;
  if (process.env.NODE_ENV === "development" && idToken === "dev_bypass_token") {
    tokenPayload = {
      sub: "dev_user_sub",
      email: "dev@nitw.ac.in",
      email_verified: true,
      hd: "nitw.ac.in",
      name: "Dev User",
      exp: Math.floor(Date.now() / 1000) + 3600,
      aud: "dev",
      iss: "accounts.google.com"
    } as any;
  } else {
    tokenPayload = await verifyGoogleToken(idToken);
  }

  if (!tokenPayload) {
    return NextResponse.json(
      {
        success: false,
        error:
          "Authentication failed. Please sign out and sign in again with your NITW Google account.",
      },
      { status: 401, headers }
    );
  }

  // ── 8. TOKEN EXPIRATION CHECK ────────────────────────────────────────────
  const nowSeconds = Math.floor(Date.now() / 1000);
  if (nowSeconds > tokenPayload.exp) {
    return NextResponse.json(
      {
        success: false,
        error:
          "Your session has expired. Please refresh the page and sign in again.",
      },
      { status: 401, headers }
    );
  }

  // ── 9. NITW DOMAIN CHECK ─────────────────────────────────────────────────
  const emailDomain = tokenPayload.email.split("@")[1] || "";
  const hdClaim = tokenPayload.hd || emailDomain; // `hd` is present for GSuite/Workspace accounts

  const isNitwDomain =
    ALLOWED_NITW_DOMAINS.includes(emailDomain) ||
    ALLOWED_NITW_DOMAINS.includes(hdClaim);

  if (!isNitwDomain) {
    return NextResponse.json(
      {
        success: false,
        error: `Access denied. Only NITW email accounts (nitw.ac.in or student.nitw.ac.in) are allowed. You authenticated with: ${tokenPayload.email}`,
      },
      { status: 403, headers }
    );
  }

  // ── 10. PER-ACCOUNT RATE LIMIT (one registration per Google account) ─────
  const googleSub = tokenPayload.sub;
  if (!checkAccountLimit(googleSub)) {
    return NextResponse.json(
      {
        success: false,
        error:
          "This Google account has already been used to submit a registration in the past hour. Each account can only register one team. Contact ig@nitw.ac.in if this is an error.",
      },
      { status: 429, headers }
    );
  }

  // ── 11. EXTRACT FORM FIELDS ──────────────────────────────────────────────
  const teamName = get("teamName");
  const track = get("track");
  const teamSize = "6"; // Hardcoded for backend compatibility
  const hasFemale = "Yes"; // Hardcoded for backend compatibility
  const theme = get("theme");
  const ps1Type = get("ps1Type");
  const ps1Id = get("ps1Id");
  const ps2Type = get("ps2Type");
  const ps2Id = get("ps2Id");
  const inspiration = get("inspiration");
  const approach = get("approach");
  const facultyMentor = get("facultyMentor");
  const consent = get("consent");
  const memberCount = parseInt(get("memberCount") || "0");

  // Leader
  const leaderName = get("leaderName");
  const leaderRoll = get("leaderRoll");
  const leaderYear = get("leaderYear");
  const leaderEmail = get("leaderEmail");
  const leaderPhone = get("leaderPhone");
  const leaderGender = get("leaderGender");

  // BOM
  const bomFileEntry = formData.get("bom");
  const bomFile =
    bomFileEntry instanceof File && bomFileEntry.size > 0 ? bomFileEntry : null;

  // Members
  const memberData: Record<string, string>[] = [];
  for (let i = 1; i <= memberCount; i++) {
    memberData.push({
      name: get(`member${i}Name`),
      roll: get(`member${i}Roll`),
      year: get(`member${i}Year`),
      email: get(`member${i}Email`),
      gender: get(`member${i}Gender`),
    });
  }

  // ── 12. SERVER-SIDE FIELD VALIDATION ────────────────────────────────────
  if (!teamName || teamName.length < 2 || teamName.length > 80)
    return err("Team name must be 2–80 characters.", 400);
  if (!["Software", "Hardware"].includes(track))
    return err("Please select a valid track.", 400);
  if (memberCount !== 5)
    return err("Exactly 5 members must be provided.", 400);

  const hasAnyFemale = leaderGender === "Female" || memberData.some(m => m.gender === "Female");
  if (!hasAnyFemale)
    return err("At least one female member is mandatory. Your team cannot register.", 400);
  if (!theme) return err("Please select a theme.", 400);
  if (!["Software", "Hardware"].includes(ps1Type))
    return err("Please select Software or Hardware for your first PS.", 400);
  if (!ps1Id) return err("First PS ID is required.", 400);
  if (!inspiration || inspiration.length < 10)
    return err("Please describe your inspiration (min 10 characters).", 400);
  if (!approach || approach.length < 10)
    return err("Please describe your approach (min 10 characters).", 400);
  if (consent !== "Yes") return err("Consent is required.", 400);

  // Leader
  if (!leaderName) return err("Team Leader full name is required.", 400);
  if (!leaderRoll) return err("Team Leader roll number is required.", 400);
  if (!leaderYear) return err("Team Leader year and department is required.", 400);
  if (!leaderEmail || !isValidEmail(leaderEmail))
    return err("Team Leader email is invalid.", 400);
  if (!leaderPhone || !isValidPhone(leaderPhone))
    return err("Team Leader phone must be a valid 10-digit Indian mobile number.", 400);
  if (!leaderGender) return err("Team Leader gender is required.", 400);

  // Members
  for (let i = 0; i < memberData.length; i++) {
    const m = memberData[i];
    const n = i + 1;
    if (!m.name) return err(`Member ${n}: Full name is required.`, 400);
    if (!m.roll) return err(`Member ${n}: Roll number is required.`, 400);
    if (!m.year) return err(`Member ${n}: Year and department is required.`, 400);
    if (!m.email || !isValidEmail(m.email))
      return err(`Member ${n}: Email address is invalid.`, 400);
    if (!m.gender) return err(`Member ${n}: Gender is required.`, 400);
  }

  // BOM for hardware teams
  const isHardware = ps1Type === "Hardware" || ps2Type === "Hardware";
  if (isHardware) {
    if (!bomFile) return err("Hardware teams must upload a BOM PDF.", 400);
    if (bomFile.type !== "application/pdf")
      return err("BOM must be a PDF file.", 400);
    if (bomFile.size > 15 * 1024 * 1024)
      return err("BOM file size must be under 15 MB.", 400);
  }

  // ── 13. CREDENTIAL CHECK ─────────────────────────────────────────────────
  if (!process.env.GOOGLE_SERVICE_ACCOUNT_JSON || !process.env.GOOGLE_SHEET_ID || !process.env.GOOGLE_DRIVE_FOLDER_ID) {
    console.error("Missing Google API credentials in env");
    return NextResponse.json(
      {
        success: false,
        error:
          "Server configuration error. Please contact ig@nitw.ac.in",
      },
      { status: 500, headers }
    );
  }

  // ── 14. UPLOAD BOM TO GOOGLE DRIVE ───────────────────────────────────────
  let bomDriveUrl = "";
  if (isHardware && bomFile) {
    try {
      bomDriveUrl = await uploadBomToDrive(bomFile, sanitize(teamName));
    } catch (e) {
      console.error("BOM upload error:", e);
      return NextResponse.json(
        { success: false, error: "Failed to upload BOM PDF. Please try again." },
        { status: 500, headers }
      );
    }
  }

  // ── 15. BUILD SHEET ROW ───────────────────────────────────────────────────
  const timestamp = new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });

  const rowData: Record<string, string> = {
    Timestamp: timestamp,
    "Submission IP": ip,
    "Authenticated Email": tokenPayload.email, // from verified token, not user input
    "Google Sub ID": googleSub,               // unique identifier (not exposed to users)
    "Team Name": sanitize(teamName),
    "Team Size": teamSize,
    "Has Female Member": hasFemale,
    "Leader Name": sanitize(leaderName),
    "Leader Roll": sanitize(leaderRoll),
    "Leader Year & Dept": sanitize(leaderYear),
    "Leader Email": sanitize(leaderEmail),
    "Leader Phone": sanitize(leaderPhone),
    "Leader Gender": sanitize(leaderGender),
  };

  for (let i = 0; i < 5; i++) {
    const m = memberData[i];
    const lbl = `Member ${i + 1}`;
    rowData[`${lbl} Name`] = m ? sanitize(m.name) : "";
    rowData[`${lbl} Roll`] = m ? sanitize(m.roll) : "";
    rowData[`${lbl} Year & Dept`] = m ? sanitize(m.year) : "";
    rowData[`${lbl} Email`] = m ? sanitize(m.email) : "";
    rowData[`${lbl} Gender`] = m ? sanitize(m.gender) : "";
  }

  rowData["Theme"] = sanitize(theme);
  rowData["PS1 Type"] = ps1Type;
  rowData["PS1 ID"] = sanitize(ps1Id);
  rowData["PS2 Type"] = ps2Type;
  rowData["PS2 ID"] = sanitize(ps2Id);
  rowData["Inspiration"] = sanitize(inspiration);
  rowData["Approach"] = sanitize(approach);
  rowData["BOM Drive URL"] = bomDriveUrl;
  rowData["Faculty Mentor"] = sanitize(facultyMentor);
  rowData["Consent"] = consent;

  // ── 16. SUBMIT TO GOOGLE SHEET ────────────────────────────────────────────
  try {
    await submitToSheet(rowData);
  } catch (e) {
    console.error("Sheet submission error:", e);
    return NextResponse.json(
      {
        success: false,
        error:
          "Failed to save your registration. Please try again in a moment. If this persists, contact ig@nitw.ac.in",
      },
      { status: 500, headers }
    );
  }

  return NextResponse.json({ success: true }, { status: 200, headers });
}
