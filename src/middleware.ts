import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Rate limiting storage (in-memory, resets on server restart)
// For production, consider using Redis or similar
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

// Rate limit configuration per endpoint type
const RATE_LIMITS = {
  auth: { maxRequests: 5, windowMs: 60 * 1000 }, // 5 requests per minute for login/signup
  vocabulary: { maxRequests: 30, windowMs: 60 * 1000 }, // 30 word additions per minute
  import: { maxRequests: 3, windowMs: 60 * 1000 }, // 3 imports per minute
  feedback: { maxRequests: 3, windowMs: 60 * 1000 }, // 3 feedback per minute
  api: { maxRequests: 100, windowMs: 60 * 1000 }, // 100 requests per minute for general API
};

function getRateLimitKey(ip: string, endpoint: string): string {
  return `${ip}:${endpoint}`;
}

function checkRateLimit(ip: string, endpoint: string, config: { maxRequests: number; windowMs: number }): { allowed: boolean; remaining: number } {
  const key = getRateLimitKey(ip, endpoint);
  const now = Date.now();
  const record = rateLimitStore.get(key);

  if (!record || now > record.resetTime) {
    rateLimitStore.set(key, { count: 1, resetTime: now + config.windowMs });
    return { allowed: true, remaining: config.maxRequests - 1 };
  }

  if (record.count >= config.maxRequests) {
    return { allowed: false, remaining: 0 };
  }

  record.count++;
  return { allowed: true, remaining: config.maxRequests - record.count };
}

// Clean up old entries periodically (every 5 minutes)
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of rateLimitStore.entries()) {
    if (now > value.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}, 5 * 60 * 1000);

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

  // Rate limiting for auth endpoints
  const isAuthEndpoint = path === '/api/auth/login' || path === '/api/auth/signup';
  if (isAuthEndpoint && request.method === 'POST') {
    const rateLimit = checkRateLimit(ip, 'auth', RATE_LIMITS.auth);

    if (!rateLimit.allowed) {
      console.warn(JSON.stringify({
        level: 'SECURITY',
        type: 'RATE_LIMIT_EXCEEDED',
        timestamp: new Date().toISOString(),
        ip,
        path,
        userAgent,
      }));
      return new Response(JSON.stringify({ error: 'Too many requests. Please try again later.' }), {
        status: 429,
        headers: { 'Content-Type': 'application/json', 'Retry-After': '60' }
      });
    }
  }

  // Rate limiting for vocabulary POST (word additions)
  if (path === '/api/vocabulary' && request.method === 'POST') {
    const rateLimit = checkRateLimit(ip, 'vocabulary', RATE_LIMITS.vocabulary);

    if (!rateLimit.allowed) {
      console.warn(JSON.stringify({
        level: 'SECURITY',
        type: 'RATE_LIMIT_EXCEEDED',
        endpoint: 'vocabulary',
        timestamp: new Date().toISOString(),
        ip,
        userAgent,
      }));
      return new Response(JSON.stringify({ error: 'Too many word additions. Please slow down.' }), {
        status: 429,
        headers: { 'Content-Type': 'application/json', 'Retry-After': '60' }
      });
    }
  }

  // Rate limiting for import endpoint
  if (path === '/api/vocabulary/import' && request.method === 'POST') {
    const rateLimit = checkRateLimit(ip, 'import', RATE_LIMITS.import);

    if (!rateLimit.allowed) {
      console.warn(JSON.stringify({
        level: 'SECURITY',
        type: 'RATE_LIMIT_EXCEEDED',
        endpoint: 'import',
        timestamp: new Date().toISOString(),
        ip,
        userAgent,
      }));
      return new Response(JSON.stringify({ error: 'Too many import requests. Please wait.' }), {
        status: 429,
        headers: { 'Content-Type': 'application/json', 'Retry-After': '60' }
      });
    }
  }

  // Rate limiting for feedback endpoint
  if (path === '/api/feedback' && request.method === 'POST') {
    const rateLimit = checkRateLimit(ip, 'feedback', RATE_LIMITS.feedback);

    if (!rateLimit.allowed) {
      console.warn(JSON.stringify({
        level: 'SECURITY',
        type: 'RATE_LIMIT_EXCEEDED',
        endpoint: 'feedback',
        timestamp: new Date().toISOString(),
        ip,
        userAgent,
      }));
      return new Response(JSON.stringify({ error: 'Too many feedback submissions. Please wait.' }), {
        status: 429,
        headers: { 'Content-Type': 'application/json', 'Retry-After': '60' }
      });
    }
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