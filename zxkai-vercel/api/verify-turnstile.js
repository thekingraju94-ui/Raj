export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const { token } = req.body;

  if (!token) {
    return res.status(400).json({ success: false, error: 'Token is required' });
  }

  const secretKey = process.env.TURNSTILE_SECRET_KEY;

  if (!secretKey) {
    return res.status(500).json({ success: false, error: 'Server configuration error' });
  }

  try {
    const formData = new URLSearchParams();
    formData.append('secret', secretKey);
    formData.append('response', token);

    const verifyResponse = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formData.toString(),
    });

    const result = await verifyResponse.json();

    if (result.success) {
      return res.status(200).json({ success: true });
    } else {
      return res.status(403).json({
        success: false,
        error: 'Verification failed',
        'error-codes': result['error-codes'] || [],
      });
    }
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Verification request failed' });
  }
}
