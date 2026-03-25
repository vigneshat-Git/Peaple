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
        console.log('[GoogleCallback] Saving error to localStorage');
        localStorage.setItem('google_auth_error', error);
        window.close();
        return;
      }

      if (token && userJson) {
        try {
          const user = JSON.parse(decodeURIComponent(userJson));
          console.log('[GoogleCallback] Saving success to localStorage');
          localStorage.setItem('google_auth_token', token);
          localStorage.setItem('google_auth_user', JSON.stringify(user));
          localStorage.setItem('google_auth_timestamp', Date.now().toString());
          window.close();
        } catch (e) {
          console.log('[GoogleCallback] Parse error:', e);
          localStorage.setItem('google_auth_error', 'Failed to parse user data');
          window.close();
        }
      } else {
        console.log('[GoogleCallback] No token found');
        localStorage.setItem('google_auth_error', 'No authentication token received');
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
