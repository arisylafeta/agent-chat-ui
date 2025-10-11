import { NextRequest, NextResponse } from 'next/server';

/**
 * Sentry tunnel endpoint to bypass ad blockers and CORS issues.
 * Proxies error reports from the frontend to Sentry's ingest API.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const { searchParams } = new URL(request.url);
    
    const orgId = searchParams.get('o');
    const projectId = searchParams.get('p');
    const region = searchParams.get('r') || 'us';
    
    if (!orgId || !projectId) {
      return NextResponse.json(
        { error: 'Missing organization or project ID' },
        { status: 400 }
      );
    }
    
    // Construct Sentry ingest URL
    const sentryUrl = `https://o${orgId}.ingest.${region}.sentry.io/api/${projectId}/envelope/`;
    
    // Forward the request to Sentry
    const response = await fetch(sentryUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-sentry-envelope',
      },
      body,
    });
    
    // Return Sentry's response
    return new NextResponse(response.body, {
      status: response.status,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('[Sentry Tunnel] Error forwarding to Sentry:', error);
    return NextResponse.json(
      { error: 'Failed to forward error to Sentry' },
      { status: 500 }
    );
  }
}
