module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { code, redirectUri } = req.body || {};
  if (!code || !redirectUri) {
    return res.status(400).json({ error: 'Missing OAuth code or redirect URI' });
  }

  const requestOrigin = req.headers.origin;
  let callbackUrl;

  try {
    callbackUrl = new URL(redirectUri);
  } catch {
    return res.status(400).json({ error: 'Invalid redirect URI' });
  }

  if (
    !requestOrigin ||
    callbackUrl.pathname !== '/auth/callback' ||
    callbackUrl.origin !== requestOrigin
  ) {
    return res.status(400).json({ error: 'Redirect URI is not allowed' });
  }

  const clientId = process.env.GITHUB_CLIENT_ID;
  const clientSecret = process.env.GITHUB_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return res.status(500).json({ error: 'GitHub OAuth is not configured' });
  }

  try {
    const githubResponse = await fetch(
      'https://github.com/login/oauth/access_token',
      {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          code,
          redirect_uri: redirectUri,
        }),
      }
    );

    const tokenData = await githubResponse.json();

    if (!githubResponse.ok || tokenData.error || !tokenData.access_token) {
      return res.status(502).json({
        error: tokenData.error_description || 'GitHub token exchange failed',
      });
    }

    return res.status(200).json({
      accessToken: tokenData.access_token,
      tokenType: tokenData.token_type,
      scope: tokenData.scope,
    });
  } catch {
    return res.status(502).json({ error: 'Unable to contact GitHub' });
  }
};
