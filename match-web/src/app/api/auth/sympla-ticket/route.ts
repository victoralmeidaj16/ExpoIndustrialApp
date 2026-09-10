export const runtime = 'nodejs';

const ALLOWED_ORIGINS = new Set([
  'https://expo-industrial-sul.vercel.app',
  'http://localhost:3000',
  'http://localhost:8081',
]);

function corsHeaders(request: Request): HeadersInit {
  const origin = request.headers.get('origin') ?? '';
  return {
    'Access-Control-Allow-Origin': ALLOWED_ORIGINS.has(origin) ? origin : 'https://expo-industrial-sul.vercel.app',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    Vary: 'Origin',
  };
}

function json(request: Request, body: object, status: number) {
  return Response.json(body, { status, headers: corsHeaders(request) });
}

export async function OPTIONS(request: Request) {
  return new Response(null, { status: 204, headers: corsHeaders(request) });
}

// QR de crachá é compartilhável e não comprova posse da conta de e-mail.
export async function POST(request: Request) {
  return json(request, { error: 'Entre ou crie sua conta com e-mail e senha. O QR do ingresso não substitui a senha.' }, 403);
}
