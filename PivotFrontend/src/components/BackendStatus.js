import React, { useEffect, useState } from 'react';
import { getBackendUrl, pingBackend } from '../backend';

const indicatorStyle = (ok) => ({
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  padding: '4px 8px',
  borderRadius: 12,
  fontSize: 12,
  background: ok ? '#e6ffed' : '#fff5f5',
  color: ok ? '#18794e' : '#c92a2a',
  border: `1px solid ${ok ? '#abf5d1' : '#ffc9c9'}`,
});

export default function BackendStatus() {
  const [status, setStatus] = useState('checking');
  const [message, setMessage] = useState('');

  useEffect(() => {
    let mounted = true;
    pingBackend()
      .then((data) => {
        if (!mounted) return;
        setStatus('ok');
        setMessage(data?.message || 'Backend is running');
      })
      .catch((err) => {
        if (!mounted) return;
        setStatus('error');
        setMessage(err.message);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const ok = status === 'ok';
  const url = getBackendUrl();

  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
      <div style={indicatorStyle(ok)}>
        <span style={{ width: 8, height: 8, borderRadius: 8, background: ok ? '#2f9e44' : '#fa5252' }} />
        <span>{ok ? 'Backend connected' : status === 'checking' ? 'Checking backend…' : 'Backend unreachable'}</span>
      </div>
      <a href={url} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: '#0b7285' }}>
        {url}
      </a>
    </div>
  );
}


