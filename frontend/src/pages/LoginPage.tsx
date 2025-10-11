// /frontend/src/pages/LoginPage.tsx

import { useState, FormEvent, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { supabase } from '../services/supabaseClient';
import { useAuth } from '../hooks/AuthContext';

// (modalStyles remain the same)
const modalStyles = {
  container: { display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#f0f2f5' },
  modal: { padding: '40px', background: 'white', borderRadius: '8px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', width: '100%', maxWidth: '400px', textAlign: 'center' as const },
  title: { marginBottom: '24px', fontSize: '24px', fontWeight: 'bold' },
  input: { width: '100%', padding: '12px', marginBottom: '16px', borderRadius: '4px', border: '1px solid #ddd', fontSize: '16px' },
  button: { width: '100%', padding: '12px', border: 'none', borderRadius: '4px', background: '#007bff', color: 'white', fontSize: '16px', cursor: 'pointer', opacity: 1 },
  buttonDisabled: { background: '#aaa', cursor: 'not-allowed' },
  toggle: { marginTop: '20px', fontSize: '14px' },
  toggleLink: { color: '#007bff', cursor: 'pointer', fontWeight: 'bold' },
};


const LoginPage = () => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState(''); // 👈 1. Add state for the full name
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const handleLogin = async () => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Logged in successfully!');
      navigate('/dashboard');
    }
  };

  const handleSignUp = async () => {
    // Basic validation
    if (!fullName.trim()) {
        toast.error("Please enter your full name.");
        return;
    }
    
    // 👇 2. Add the `options.data` object to the signUp call
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        }
      }
    });

    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Account created! Please check your email to verify.');
      setMode('login');
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (mode === 'login') {
      await handleLogin();
    } else {
      await handleSignUp();
    }

    setIsLoading(false);
  };

  return (
    <div style={modalStyles.container}>
      <div style={modalStyles.modal}>
        <h2 style={modalStyles.title}>
          {mode === 'login' ? 'Welcome Back' : 'Create an Account'}
        </h2>
        <form onSubmit={handleSubmit}>
          {/* 👇 3. Conditionally render the Full Name input */}
          {mode === 'register' && (
            <input
              type="text"
              placeholder="Full Name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              style={modalStyles.input}
              required
            />
          )}
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={modalStyles.input}
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={modalStyles.input}
            required
            minLength={6}
          />
          <button
            type="submit"
            disabled={isLoading}
            style={{
              ...modalStyles.button,
              ...(isLoading ? modalStyles.buttonDisabled : {}),
            }}
          >
            {isLoading ? 'Loading...' : mode === 'login' ? 'Login' : 'Register'}
          </button>
        </form>
        <p style={modalStyles.toggle}>
          {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
          <span onClick={() => setMode(mode === 'login' ? 'register' : 'login')} style={modalStyles.toggleLink}>
            {mode === 'login' ? 'Register' : 'Login'}
          </span>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;