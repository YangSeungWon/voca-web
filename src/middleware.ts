import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Suspicious patterns for security monitoring
const SUSPICIOUS_PATTERNS = [
  '__proto__',
  'constructor.prototype',
  'Object.prototype',
  'child_process',
  'execSync',
  'spawnSync',
];

// Paths that don't exist in this app - honeypot for attackers
const HONEYPOT_PATHS = [
  '/wp-admin',
  '/wp-login',
  '/wordpress',
  '/phpmyadmin',
  '/admin.php',
  '/.env',
  '/.git',
  '/config.php',
  '/xmlrpc.php',
  '/wp-content',
  '/wp-includes',
  '/.well-known/security.txt',
  '/actuator',
  '/api/v1/admin',
  '/graphql',
  '/console',
  '/debug',
  '/trace',
  '/metrics',
  '/swagger',
];

// Suspicious User-Agents (scanners, bots)
const SUSPICIOUS_UA_PATTERNS = [
  /sqlmap/i,
  /nikto/i,
  /nmap/i,
  /masscan/i,
  /zgrab/i,
  /gobuster/i,
  /dirbuster/i,
  /nuclei/i,
  /wpscan/i,
  /joomla/i,
  /drupal/i,
];

export async function middleware(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0] ||
             request.headers.get('x-real-ip') ||
             'unknown';
  const userAgent = request.headers.get('user-agent') || 'unknown';
  const path = request.nextUrl.pathname;

  // Block prototype pollution attacks (CVE-2025-55182)
  if (request.method === 'POST' || request.method === 'PUT' || request.method === 'PATCH') {
    try {
      const body = await request.clone().text();
      const isSuspicious = SUSPICIOUS_PATTERNS.some(pattern => body.includes(pattern));

      if (isSuspicious) {
        console.warn(JSON.stringify({
          level: 'SECURITY',
          type: 'PROTO_POLLUTION_ATTEMPT',
          timestamp: new Date().toISOString(),
          ip,
          method: request.method,
          path,
          userAgent,
        }));
        return new Response('Forbidden', { status: 403 });
      }
    } catch {
      // Body parsing failed, continue
    }
  }

  // Log suspicious path traversal attempts
  if (path.includes('..') || path.includes('%2e%2e')) {
    console.warn(JSON.stringify({
      level: 'SECURITY',
      type: 'PATH_TRAVERSAL_ATTEMPT',
      timestamp: new Date().toISOString(),
      ip,
      path,
      userAgent,
    }));
    return new Response('Forbidden', { status: 403 });
  }

  // Honeypot: Log and block requests to non-existent attack targets
  const isHoneypot = HONEYPOT_PATHS.some(hp =>
    path.toLowerCase().startsWith(hp.toLowerCase())
  );
  if (isHoneypot) {
    console.warn(JSON.stringify({
      level: 'SECURITY',
      type: 'HONEYPOT_TRIGGERED',
      timestamp: new Date().toISOString(),
      ip,
      path,
      userAgent,
    }));
    // Return 404 to not reveal it's a honeypot
    return new Response('Not Found', { status: 404 });
  }

  // Block known scanner User-Agents
  const isSuspiciousUA = SUSPICIOUS_UA_PATTERNS.some(pattern => pattern.test(userAgent));
  if (isSuspiciousUA) {
    console.warn(JSON.stringify({
      level: 'SECURITY',
      type: 'SCANNER_BLOCKED',
      timestamp: new Date().toISOString(),
      ip,
      path,
      userAgent,
    }));
    return new Response('Forbidden', { status: 403 });
  }

  // Handle CORS for API routes
  if (request.nextUrl.pathname.startsWith('/api/')) {
    const response = NextResponse.next();
    
    // Allow Chrome extension origin
    const origin = request.headers.get('origin');
    const allowedOrigins = [
      'chrome-extension://*',
      'https://voca.ysw.kr',
      'http://localhost:3000',
      'http://localhost:7024',
      'capacitor://localhost',
      'https://localhost'
    ];

    if (origin && (origin.startsWith('chrome-extension://') || origin.startsWith('capacitor://') || allowedOrigins.includes(origin))) {
      response.headers.set('Access-Control-Allow-Origin', origin);
    } else if (!origin) {
      // Allow requests without origin (e.g., from the extension background script)
      response.headers.set('Access-Control-Allow-Origin', '*');
    }
    
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-User-Id');
    response.headers.set('Access-Control-Max-Age', '86400');
    
    // Handle preflight requests
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 200, headers: response.headers });
    }
    
    return response;
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    // API routes
    '/api/:path*',
    // Honeypot paths (security)
    '/wp-:path*',
    '/wordpress/:path*',
    '/phpmyadmin/:path*',
    '/admin.php',
    '/.env',
    '/.git/:path*',
    '/config.php',
    '/xmlrpc.php',
    '/actuator/:path*',
    '/graphql/:path*',
    '/console/:path*',
    '/debug/:path*',
    '/swagger/:path*',
  ]
};