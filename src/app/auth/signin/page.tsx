/**
 * Enhanced Sign In Page
 * Modern, clean design with improved UX
 */

'use client';

import { useState, useRef, useEffect } from 'react';
import { signIn } from 'next-auth/react';
import Link from 'next/link';

// Enhanced PIN Input Component with better visual feedback
function PinInput({ 
  onPinComplete, 
  disabled, 
  error 
}: { 
  onPinComplete: (pin: string) => void; 
  disabled: boolean;
  error?: boolean;
}) {
  const [pin, setPin] = useState(['', '', '', '']);
  const inputRefs = [
    useRef<HTMLInputElement>(null), 
    useRef<HTMLInputElement>(null), 
    useRef<HTMLInputElement>(null), 
    useRef<HTMLInputElement>(null)
  ];

  useEffect(() => {
    inputRefs[0].current?.focus();
  }, []);

  useEffect(() => {
    if (error) {
      setPin(['', '', '', '']);
      inputRefs[0].current?.focus();
    }
  }, [error]);

  const handleChange = (index: number, value: string) => {
    if (value.length > 1) return;
    if (value && !/^\d$/.test(value)) return;

    const newPin = [...pin];
    newPin[index] = value;
    setPin(newPin);

    // Auto-focus next input
    if (value && index < 3) {
      inputRefs[index + 1].current?.focus();
    }

    // Submit when complete
    if (newPin.every(digit => digit !== '')) {
      onPinComplete(newPin.join(''));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace') {
      if (!pin[index] && index > 0) {
        const newPin = [...pin];
        newPin[index - 1] = '';
        setPin(newPin);
        inputRefs[index - 1].current?.focus();
      } else {
        const newPin = [...pin];
        newPin[index] = '';
        setPin(newPin);
      }
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').slice(0, 4);
    if (/^\d+$/.test(pastedData)) {
      const newPin = pastedData.split('').concat(['', '', '', '']).slice(0, 4);
      setPin(newPin);
      if (pastedData.length === 4) {
        onPinComplete(pastedData);
      } else {
        inputRefs[pastedData.length]?.current?.focus();
      }
    }
  };

  return (
    <div style={{ 
      display: 'flex', 
      gap: '12px', 
      justifyContent: 'center',
      marginBottom: '8px'
    }}>
      {pin.map((digit, index) => (
        <input
          key={index}
          ref={inputRefs[index]}
          type="text"
          inputMode="numeric"
          pattern="[0-9]"
          maxLength={1}
          value={digit}
          onChange={(e) => handleChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onPaste={index === 0 ? handlePaste : undefined}
          disabled={disabled}
          style={{
            width: '56px',
            height: '56px',
            textAlign: 'center',
            fontSize: '24px',
            fontWeight: '600',
            border: error ? '2px solid #ef4444' : '2px solid #e5e7eb',
            borderRadius: '12px',
            outline: 'none',
            transition: 'all 0.2s',
            background: digit ? '#f9fafb' : 'white',
            opacity: disabled ? 0.5 : 1,
            cursor: disabled ? 'not-allowed' : 'text'
          }}
          onFocus={(e) => {
            if (!error) {
              e.target.style.borderColor = '#6366f1';
              e.target.style.boxShadow = '0 0 0 3px rgba(99, 102, 241, 0.1)';
            }
          }}
          onBlur={(e) => {
            if (!error) {
              e.target.style.borderColor = '#e5e7eb';
              e.target.style.boxShadow = 'none';
            }
          }}
        />
      ))}
    </div>
  );
}

export default function SignInPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPinEntry, setShowPinEntry] = useState(false);
  const [showDemoNotice, setShowDemoNotice] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    pin: ''
  });

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.email) {
      setShowPinEntry(true);
    }
  };

  const handlePinComplete = async (pin: string) => {
    setError('');
    setIsLoading(true);

    try {
      const result = await signIn('credentials', {
        email: formData.email,
        pin: pin,
        redirect: false
      });

      if (result?.error) {
        setError('Invalid PIN. Please try again.');
        setFormData(prev => ({ ...prev, pin: '' }));
      } else if (result?.ok) {
        window.location.href = '/';
      }
    } catch {
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoAccess = async () => {
    // Set demo account credentials
    setFormData({ email: 'demo@astral.money', pin: '0000' });
    setShowDemoNotice(true);
    setIsLoading(true);
    setError('');
    
    // Auto-login with demo credentials after a brief delay
    setTimeout(async () => {
      try {
        const result = await signIn('credentials', {
          email: 'demo@astral.money',
          pin: '0000',
          redirect: false
        });

        if (result?.error) {
          setError('Demo account not available. Please try again later.');
          setIsLoading(false);
          setShowDemoNotice(false);
        } else if (result?.ok) {
          window.location.href = '/';
        }
      } catch {
        setError('An error occurred accessing the demo account');
        setIsLoading(false);
        setShowDemoNotice(false);
      }
    }, 1500); // Brief delay to show the demo notice
  };

  const resetForm = () => {
    setShowPinEntry(false);
    setFormData({ email: '', pin: '' });
    setError('');
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #ec4899 100%)',
      padding: '20px',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Animated Background Elements */}
      <div style={{
        position: 'absolute',
        top: '-50%',
        left: '-50%',
        width: '200%',
        height: '200%',
        background: 'radial-gradient(circle at 20% 80%, rgba(99, 102, 241, 0.1) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(236, 72, 153, 0.1) 0%, transparent 50%), radial-gradient(circle at 40% 40%, rgba(139, 92, 246, 0.1) 0%, transparent 50%)'
      }} />

      <div style={{
        background: 'rgba(255, 255, 255, 0.98)',
        backdropFilter: 'blur(20px)',
        borderRadius: '24px',
        padding: '48px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        width: '100%',
        maxWidth: '440px',
        position: 'relative'
      }}>
        {/* Logo and Header */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{
            width: '80px',
            height: '80px',
            background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
            borderRadius: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 28px auto',
            boxShadow: '0 10px 25px -5px rgba(99, 102, 241, 0.25)',
            transform: 'rotate(-5deg)',
            transition: 'transform 0.3s ease'
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'rotate(0deg) scale(1.05)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'rotate(-5deg) scale(1)'}
          >
            <span style={{ 
              color: 'white', 
              fontSize: '36px', 
              fontWeight: 'bold',
              transform: 'rotate(5deg)'
            }}>$</span>
          </div>
          
          <h1 style={{ 
            fontSize: '32px', 
            fontWeight: '800', 
            background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            margin: '0 0 12px 0',
            letterSpacing: '-0.5px'
          }}>
            Astral Money
          </h1>
          <p style={{ 
            color: '#6b7280', 
            fontSize: '16px', 
            margin: '0',
            fontWeight: '400'
          }}>
            {showPinEntry ? 'Enter your secure PIN' : 'Welcome back to your financial hub'}
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div style={{
            background: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)',
            border: '1px solid #fecaca',
            borderRadius: '12px',
            padding: '14px',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            <span style={{ fontSize: '18px' }}>⚠️</span>
            <span style={{ color: '#dc2626', fontSize: '14px', fontWeight: '500' }}>
              {error}
            </span>
          </div>
        )}

        {/* Main Content */}
        {!showPinEntry ? (
          <>
            {/* Email Form */}
            <form onSubmit={handleEmailSubmit}>
              <div style={{ marginBottom: '24px' }}>
                <label style={{ 
                  display: 'block', 
                  fontSize: '14px', 
                  fontWeight: '600', 
                  color: '#374151',
                  marginBottom: '8px',
                  letterSpacing: '0.025em'
                }}>
                  Email Address
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  required
                  disabled={isLoading}
                  style={{
                    width: '100%',
                    padding: '14px 16px',
                    border: '2px solid #e5e7eb',
                    borderRadius: '12px',
                    fontSize: '16px',
                    outline: 'none',
                    transition: 'all 0.2s',
                    boxSizing: 'border-box',
                    background: 'white'
                  }}
                  placeholder="your@email.com"
                  onFocus={(e) => {
                    e.target.style.borderColor = '#6366f1';
                    e.target.style.boxShadow = '0 0 0 3px rgba(99, 102, 241, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#e5e7eb';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>

              <button
                type="submit"
                disabled={isLoading || !formData.email}
                style={{
                  width: '100%',
                  padding: '14px',
                  background: formData.email ? 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)' : '#e5e7eb',
                  color: formData.email ? 'white' : '#9ca3af',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: formData.email ? 'pointer' : 'not-allowed',
                  transition: 'all 0.2s',
                  transform: 'translateY(0)',
                  boxShadow: formData.email ? '0 4px 6px -1px rgba(99, 102, 241, 0.2)' : 'none'
                }}
                onMouseEnter={(e) => {
                  if (formData.email) {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(99, 102, 241, 0.3)';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = formData.email ? '0 4px 6px -1px rgba(99, 102, 241, 0.2)' : 'none';
                }}
              >
                Continue to PIN
              </button>
            </form>

            {/* Divider */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              margin: '32px 0',
              gap: '16px'
            }}>
              <div style={{ flex: 1, height: '1px', background: '#e5e7eb' }} />
              <span style={{ 
                fontSize: '12px', 
                color: '#9ca3af', 
                fontWeight: '500',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>Or</span>
              <div style={{ flex: 1, height: '1px', background: '#e5e7eb' }} />
            </div>

            {/* Demo Access */}
            <button
              type="button"
              onClick={handleDemoAccess}
              disabled={isLoading}
              style={{
                width: '100%',
                padding: '16px',
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '12px',
                boxShadow: '0 4px 6px -1px rgba(16, 185, 129, 0.2)',
                transform: 'translateY(0)',
                position: 'relative',
                overflow: 'hidden'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(16, 185, 129, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(16, 185, 129, 0.2)';
              }}
            >
              <span style={{ fontSize: '20px' }}>🚀</span>
              <span>Try Demo Account (PIN: 0000)</span>
              <span style={{
                position: 'absolute',
                top: '-8px',
                right: '-24px',
                background: '#fbbf24',
                color: '#78350f',
                fontSize: '11px',
                fontWeight: '700',
                padding: '2px 20px',
                transform: 'rotate(45deg)',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}>NEW</span>
            </button>
            
            {/* Our Monies Account Button */}
            <button
              type="button"
              onClick={() => {
                setFormData({ email: 'ourmonies@astral.money', pin: '7347' });
                setShowPinEntry(true);
              }}
              disabled={isLoading}
              style={{
                width: '100%',
                padding: '16px',
                background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                opacity: isLoading ? 0.7 : 1,
                transition: 'all 0.3s ease',
                marginTop: '12px',
                boxShadow: '0 4px 14px rgba(59, 130, 246, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
              onMouseEnter={(e) => {
                if (!isLoading) {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 8px 20px rgba(59, 130, 246, 0.5)';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 14px rgba(59, 130, 246, 0.4)';
              }}
            >
              <span style={{ fontSize: '20px' }}>💳</span>
              <span>Our Monies (PIN: 7347)</span>
            </button>
          </>
        ) : (
          /* PIN Entry Screen */
          <div>
            <div style={{ 
              marginBottom: '24px',
              textAlign: 'center'
            }}>
              <p style={{ 
                fontSize: '14px', 
                color: '#6b7280',
                marginBottom: '8px'
              }}>
                Signing in as
              </p>
              <p style={{ 
                fontSize: '16px', 
                fontWeight: '600',
                color: '#111827',
                background: '#f3f4f6',
                padding: '8px 12px',
                borderRadius: '8px',
                display: 'inline-block'
              }}>
                {formData.email}
              </p>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <PinInput 
                onPinComplete={handlePinComplete}
                disabled={isLoading}
                error={!!error}
              />
              {!error && (
                <p style={{ 
                  textAlign: 'center', 
                  fontSize: '13px', 
                  color: '#9ca3af',
                  marginTop: '8px'
                }}>
                  Enter your 4-digit PIN
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={resetForm}
              disabled={isLoading}
              style={{
                width: '100%',
                padding: '12px',
                background: 'transparent',
                color: '#6b7280',
                border: '2px solid #e5e7eb',
                borderRadius: '12px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#9ca3af';
                e.currentTarget.style.color = '#4b5563';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#e5e7eb';
                e.currentTarget.style.color = '#6b7280';
              }}
            >
              Use Different Email
            </button>
          </div>
        )}

        {/* Footer */}
        <div style={{ 
          textAlign: 'center', 
          marginTop: '32px',
          paddingTop: '24px',
          borderTop: '1px solid #e5e7eb'
        }}>
          <span style={{ fontSize: '14px', color: '#6b7280' }}>
            New to Astral Money?{' '}
            <Link 
              href="/auth/signup" 
              style={{ 
                color: '#6366f1', 
                textDecoration: 'none', 
                fontWeight: '600',
                transition: 'color 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = '#4f46e5'}
              onMouseLeave={(e) => e.currentTarget.style.color = '#6366f1'}
            >
              Create an account
            </Link>
          </span>
        </div>

        {/* Loading/Demo Overlay */}
        {(isLoading || showDemoNotice) && (
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(255, 255, 255, 0.95)',
            borderRadius: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
            gap: '16px',
            backdropFilter: 'blur(8px)'
          }}>
            <div style={{
              width: '48px',
              height: '48px',
              border: '3px solid #e5e7eb',
              borderTop: showDemoNotice ? '3px solid #10b981' : '3px solid #6366f1',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }} />
            {showDemoNotice && (
              <>
                <p style={{ 
                  color: '#059669', 
                  fontSize: '18px',
                  fontWeight: '700'
                }}>
                  Loading Demo Account
                </p>
                <div style={{
                  background: '#ecfdf5',
                  border: '1px solid #6ee7b7',
                  borderRadius: '8px',
                  padding: '12px 24px',
                  textAlign: 'center'
                }}>
                  <p style={{ 
                    color: '#047857', 
                    fontSize: '13px',
                    margin: '0 0 4px 0'
                  }}>
                    <strong>Demo Credentials:</strong>
                  </p>
                  <p style={{ 
                    color: '#065f46', 
                    fontSize: '12px',
                    margin: '0'
                  }}>
                    Email: demo@astral.money | PIN: 0000
                  </p>
                </div>
              </>
            )}
            {!showDemoNotice && (
              <p style={{ 
                color: '#6b7280', 
                fontSize: '14px',
                fontWeight: '500'
              }}>
                Authenticating...
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}