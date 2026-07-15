'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  const navItems = [
    { label: 'Fitur', href: '#features' },
    { label: 'Cara Kerja', href: '#how-it-works' },
    { label: 'Dashboard', href: '#dashboard' },
  ];

  return (
    <header
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        background: '#fff',
        borderBottom: '1px solid #e5e7eb',
      }}
    >
      <div
        style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '0 20px',
          height: '64px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        {/* LOGO */}
        <Link
          href="/"
          style={{ display: 'flex', alignItems: 'center', gap: '10px' }}
        >
          <img
            src="/images/logo.png"
            alt="FinProjek"
            style={{ width: 36, height: 36 }}
          />
          <strong style={{ fontSize: '18px', color: '#111827' }}>
            FinProjek
          </strong>
        </Link>

        {/* DESKTOP MENU */}
        <nav style={{ display: 'flex', gap: '28px' }} className="hidden md:flex">
          {navItems.map((item) => (
            <a
              key={item.label}
              href={item.href}
              style={{
                fontSize: '14px',
                color: '#374151',
                fontWeight: 500,
              }}
            >
              {item.label}
            </a>
          ))}
        </nav>

        {/* ACTION BUTTON */}
        <div className="hidden md:flex" style={{ gap: '12px' }}>
          <Link
            href="/auth/login"
            style={{
              padding: '8px 16px',
              fontSize: '14px',
              borderRadius: '6px',
              border: '1px solid #d1d5db',
              color: '#374151',
            }}
          >
            Login
          </Link>

          <Link
            href="/auth/register"
            style={{
              padding: '8px 16px',
              fontSize: '14px',
              borderRadius: '6px',
              background: '#2563eb',
              color: '#fff',
            }}
          >
            Register
          </Link>
        </div>

        {/* MOBILE BUTTON */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="md:hidden"
          style={{
            padding: '6px',
            borderRadius: '6px',
            border: '1px solid #e5e7eb',
          }}
        >
          {isOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* MOBILE MENU */}
      {isOpen && (
        <div
          style={{
            background: '#fff',
            borderTop: '1px solid #e5e7eb',
            padding: '16px',
          }}
          className="md:hidden"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {navItems.map((item) => (
              <a
                key={item.label}
                href={item.href}
                onClick={() => setIsOpen(false)}
                style={{
                  fontSize: '14px',
                  color: '#374151',
                }}
              >
                {item.label}
              </a>
            ))}

            <hr />

            <Link href="/auth/login">Login</Link>
            <Link href="/auth/register">Register</Link>
          </div>
        </div>
      )}
    </header>
  );
}
