import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const GoogleCallback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const handleGoogleCallback = () => {
      const urlParams = new URLSearchParams(window.location.search);
      const error = urlParams.get('error');
      
      if (error) {
        // Handle error
        window.opener?.postMessage({
          type: 'GOOGLE_AUTH_ERROR',
          error: error
        }, window.location.origin);
        window.close();
        return;
      }

      // Get the ID token from the URL fragment or hash
      const hash = window.location.hash;
      const params = new URLSearchParams(hash.substring(1)); // Remove # and parse
      const idToken = params.get('id_token');
      
      if (idToken) {
        // Send success message to parent window
        window.opener?.postMessage({
          type: 'GOOGLE_AUTH_SUCCESS',
          token: idToken
        }, window.location.origin);
        window.close();
      } else {
        // No token found
        window.opener?.postMessage({
          type: 'GOOGLE_AUTH_ERROR',
          error: 'No authentication token received'
        }, window.location.origin);
        window.close();
      }
    };

    handleGoogleCallback();
  }, [navigate]);

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
