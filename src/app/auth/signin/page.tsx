/**
 * Sign In Page
 * Simple, clean PIN-based authentication
 */

'use client';

import { useState, useRef, useEffect } from 'react';
import { signIn } from 'next-auth/react';
import Link from 'next/link';

// Quick PIN Input Component
function QuickPinInput({ onPinComplete, disabled }: { onPinComplete: (pin: string) => void; disabled: boolean }) {
  const [pin, setPin] = useState(['', '', '', '']);
  const inputRefs = [useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null)];

  useEffect(() => {
    inputRefs[0].current?.focus();
  }, [inputRefs]);

  const handleChange = (index: number, value: string) => {
    if (value.length > 1) return; // Only allow single digit
    if (value && !/^\d$/.test(value)) return; // Only allow numbers

    const newPin = [...pin];
    newPin[index] = value;
    setPin(newPin);

    // Auto-focus next input
    if (value && index < 3) {
      inputRefs[index + 1].current?.focus();
    }

    // Call onPinComplete when all 4 digits are filled
    if (newPin.every(digit => digit !== '') && index === 3) {
      onPinComplete(newPin.join(''));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !pin[index] && index > 0) {
      inputRefs[index - 1].current?.focus();
    }
    if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs[index - 1].current?.focus();
    }
    if (e.key === 'ArrowRight' && index < 3) {
      inputRefs[index + 1].current?.focus();
    }
  };

  return (
    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
      {pin.map((digit, index) => (
        <input
          key={index}
          ref={inputRefs[index]}
          type="text"
          value={digit}
          onChange={(e) => handleChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          disabled={disabled}
          style={{
            width: '50px',
            height: '50px',
            textAlign: 'center',
            fontSize: '20px',
            fontWeight: 'bold',
            border: '2px solid #d1d5db',
            borderRadius: '8px',
            outline: 'none',
            transition: 'border-color 0.2s',
            opacity: disabled ? 0.5 : 1
          }}
          onFocus={(e) => (e.target as HTMLElement).style.borderColor = '#667eea'}
          onBlur={(e) => (e.target as HTMLElement).style.borderColor = '#d1d5db'}
          maxLength={1}
        />
      ))}
    </div>
  );
}

export default function SignInPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    pin: ''
  });
  const [showQuickPin, setShowQuickPin] = useState(false);
  const [selectedEmail, setSelectedEmail] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const result = await signIn('credentials', {
        email: formData.email,
        pin: formData.pin,
        redirect: false
      });

      if (result?.error) {
        setError('Invalid email or PIN');
      } else if (result?.ok) {
        // Force a hard redirect to avoid state issues
        window.location.href = '/';
      }
    } catch {
      // Error already handled in UI
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickSignIn = (email: string) => {
    setSelectedEmail(email);
    setShowQuickPin(true);
    setFormData({ email, pin: '' });
  };

  const handleQuickPinSubmit = async (pin: string) => {
    if (pin.length !== 4) return;
    
    setError('');
    setIsLoading(true);

    try {
      const result = await signIn('credentials', {
        email: selectedEmail,
        pin: pin,
        redirect: false
      });

      if (result?.error) {
        setError('Invalid PIN');
      } else if (result?.ok) {
        // Force a hard redirect to avoid state issues
        window.location.href = '/';
      }
    } catch {
      // Error already handled in UI
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '20px'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '12px',
        padding: '40px',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
        width: '100%',
        maxWidth: '400px'
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{
            width: '60px',
            height: '60px',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 24px auto'
          }}>
            <span style={{ color: 'white', fontSize: '24px', fontWeight: 'bold' }}>$</span>
          </div>
          <h1 style={{ 
            fontSize: '28px', 
            fontWeight: 'bold', 
            color: '#1f2937', 
            margin: '0 0 8px 0' 
          }}>
            Astral Money
          </h1>
          <p style={{ color: '#6b7280', fontSize: '16px', margin: '0' }}>
            Enter your email and 4-digit PIN
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div style={{
            background: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '8px',
            padding: '12px',
            marginBottom: '20px',
            color: '#dc2626',
            fontSize: '14px',
            textAlign: 'center'
          }}>
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ 
              display: 'block', 
              fontSize: '14px', 
              fontWeight: '500', 
              color: '#374151',
              marginBottom: '6px'
            }}>
              Email Address
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              required
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '16px',
                outline: 'none',
                transition: 'border-color 0.2s',
                boxSizing: 'border-box'
              }}
              placeholder="Enter your email"
              onFocus={(e) => e.target.style.borderColor = '#667eea'}
              onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
            />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{ 
              display: 'block', 
              fontSize: '14px', 
              fontWeight: '500', 
              color: '#374151',
              marginBottom: '6px'
            }}>
              4-Digit PIN
            </label>
            <input
              type="password"
              value={formData.pin}
              onChange={(e) => {
                const value = e.target.value.replace(/[^0-9]/g, '');
                if (value.length <= 4) {
                  setFormData(prev => ({ ...prev, pin: value }));
                }
              }}
              maxLength={4}
              required
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '20px',
                textAlign: 'center',
                letterSpacing: '8px',
                outline: 'none',
                transition: 'border-color 0.2s',
                boxSizing: 'border-box'
              }}
              placeholder="••••"
              onFocus={(e) => e.target.style.borderColor = '#667eea'}
              onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
            />
          </div>

          <button
            type="submit"
            disabled={isLoading || formData.pin.length !== 4}
            style={{
              width: '100%',
              padding: '12px',
              background: formData.pin.length === 4 ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : '#9ca3af',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: formData.pin.length === 4 ? 'pointer' : 'not-allowed',
              opacity: isLoading ? 0.7 : 1,
              transition: 'all 0.2s'
            }}
          >
            {isLoading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        {/* Quick Sign-In Buttons */}
        <div style={{
          marginTop: '24px',
          padding: '16px',
          background: '#f3f4f6',
          borderRadius: '8px'
        }}>
          <div style={{ fontWeight: '600', marginBottom: '12px', fontSize: '14px', color: '#4b5563' }}>
            Quick Sign-In:
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <button
              type="button"
              onClick={() => handleQuickSignIn('test@astral.money')}
              style={{
                padding: '8px 12px',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '13px',
                cursor: 'pointer',
                transition: 'opacity 0.2s'
              }}
              onMouseOver={(e) => (e.target as HTMLElement).style.opacity = '0.9'}
              onMouseOut={(e) => (e.target as HTMLElement).style.opacity = '1'}
            >
              📧 Test User
            </button>
            <button
              type="button"
              onClick={() => handleQuickSignIn('demo@astral.money')}
              style={{
                padding: '8px 12px',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '13px',
                cursor: 'pointer',
                transition: 'opacity 0.2s'
              }}
              onMouseOver={(e) => (e.target as HTMLElement).style.opacity = '0.9'}
              onMouseOut={(e) => (e.target as HTMLElement).style.opacity = '1'}
            >
              📧 Demo User
            </button>
            <button
              type="button"
              onClick={() => handleQuickSignIn('user@astral.money')}
              style={{
                padding: '8px 12px',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '13px',
                cursor: 'pointer',
                transition: 'opacity 0.2s'
              }}
              onMouseOver={(e) => (e.target as HTMLElement).style.opacity = '0.9'}
              onMouseOut={(e) => (e.target as HTMLElement).style.opacity = '1'}
            >
              📧 Sample User
            </button>
          </div>
          <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '8px', textAlign: 'center' }}>
            🔐 All accounts use PIN: 7347
          </div>
        </div>

        {/* Footer */}
        <div style={{ textAlign: 'center', marginTop: '20px' }}>
          <span style={{ fontSize: '14px', color: '#6b7280' }}>
            Don't have an account?{' '}
            <Link 
              href="/auth/signup" 
              style={{ color: '#667eea', textDecoration: 'none', fontWeight: '500' }}
            >
              Sign up here
            </Link>
          </span>
        </div>
      </div>

      {/* Quick PIN Modal */}
      {showQuickPin && (
        <div style={{
          position: 'fixed',
          top: '0',
          left: '0',
          right: '0',
          bottom: '0',
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: '1000'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '32px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            width: '320px',
            maxWidth: '90vw'
          }}>
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: '600', margin: '0 0 8px 0', color: '#1f2937' }}>
                Enter PIN
              </h2>
              <p style={{ fontSize: '14px', color: '#6b7280', margin: '0' }}>
                {selectedEmail}
              </p>
            </div>

            {error && (
              <div style={{
                background: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: '8px',
                padding: '12px',
                marginBottom: '20px',
                color: '#dc2626',
                fontSize: '14px',
                textAlign: 'center'
              }}>
                {error}
              </div>
            )}

            <QuickPinInput
              onPinComplete={handleQuickPinSubmit}
              disabled={isLoading}
            />

            <div style={{ display: 'flex', gap: '8px', marginTop: '24px' }}>
              <button
                type="button"
                onClick={() => {
                  setShowQuickPin(false);
                  setSelectedEmail('');
                  setError('');
                }}
                style={{
                  flex: '1',
                  padding: '10px',
                  background: '#f3f4f6',
                  color: '#4b5563',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '14px',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}