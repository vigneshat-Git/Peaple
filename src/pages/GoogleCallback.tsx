import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

const GoogleCallback = () => {
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const handleCallback = () => {
      const error = searchParams.get('error');
      const token = searchParams.get('token');
      const userJson = searchParams.get('user');

      console.log('[GoogleCallback] Params:', { error: !!error, token: !!token, userJson: !!userJson });
      console.log('[GoogleCallback] opener exists:', !!window.opener);

      if (error) {
        console.log('[GoogleCallback] Sending error message');
        window.opener?.postMessage({
          type: 'GOOGLE_AUTH_ERROR',
          error: error
        }, '*');
        window.close();
        return;
      }

      if (token && userJson) {
        try {
          const user = JSON.parse(decodeURIComponent(userJson));
          console.log('[GoogleCallback] Sending success message');
          // Send success message to parent window
          window.opener?.postMessage({
            type: 'GOOGLE_AUTH_SUCCESS',
            token: token,
            user: user
          }, '*');
        } catch (e) {
          console.log('[GoogleCallback] Parse error:', e);
          window.opener?.postMessage({
            type: 'GOOGLE_AUTH_ERROR',
            error: 'Failed to parse user data'
          }, '*');
        }
        window.close();
      } else {
        console.log('[GoogleCallback] No token found');
        // No token found
        window.opener?.postMessage({
          type: 'GOOGLE_AUTH_ERROR',
          error: 'No authentication token received'
        }, '*');
        window.close();
      }
    };

    handleCallback();
  }, [searchParams]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h2 className="text-xl font-semibold mb-2">Completing authentication...</h2>
        <p className="text-muted-foreground">This window will close automatically.</p>
      </div>
    </div>
  );
};

export default GoogleCallback;
