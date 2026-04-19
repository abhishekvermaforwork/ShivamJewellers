'use client';

import { useEffect, useState } from 'react';
import useSWR, { useSWRConfig } from 'swr';
import { fetchMe } from '@/services/auth.service';
import { api, getApiErrorMessage } from '@/services/api';

export default function SettingsPage() {
  const { mutate } = useSWRConfig();
  const { data: me, isLoading } = useSWR('auth-me', fetchMe, { dedupingInterval: 60_000 });

  const [businessName, setBusinessName] = useState('');
  const [invoicePrefix, setInvoicePrefix] = useState('INV');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [taxNumber, setTaxNumber] = useState('');
  const [bankDetails, setBankDetails] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const p = me?.businessProfile as Record<string, string> | null | undefined;
    if (!p || hydrated) return;
    setBusinessName(p.businessName || '');
    setInvoicePrefix(p.invoicePrefix || 'INV');
    setAddress(p.address || '');
    setPhone(p.phone || '');
    setEmail(p.email || '');
    setTaxNumber(p.taxNumber || '');
    setBankDetails(p.bankDetails || '');
    setHydrated(true);
  }, [me, hydrated]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setMessage('');
    setSaving(true);
    try {
      await api.patch('/auth/profile', {
        businessName,
        invoicePrefix,
        address,
        phone,
        email,
        taxNumber,
        bankDetails,
      });
      await mutate('auth-me');
      setMessage('Saved successfully.');
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  if (isLoading && !me) return <p className="text-gray-500">Loading…</p>;

  return (
    <>
      <div className="page-header">
        <h1>Settings</h1>
      </div>
      <p className="mb-6 text-sm text-gray-600">Business profile used on invoices and PDFs.</p>
      {message ? (
        <div className="mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
          {message}
        </div>
      ) : null}
      {error ? (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      ) : null}
      <form onSubmit={onSubmit} className="max-w-xl rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <label className="mb-1 block text-sm font-medium text-gray-700">Business name *</label>
        <input
          className="form-input mb-4"
          value={businessName}
          onChange={(e) => setBusinessName(e.target.value)}
          required
        />
        <label className="mb-1 block text-sm font-medium text-gray-700">Invoice prefix</label>
        <input className="form-input mb-4" value={invoicePrefix} onChange={(e) => setInvoicePrefix(e.target.value)} />
        <label className="mb-1 block text-sm font-medium text-gray-700">Address</label>
        <textarea className="form-input mb-4" rows={3} value={address} onChange={(e) => setAddress(e.target.value)} />
        <label className="mb-1 block text-sm font-medium text-gray-700">Phone</label>
        <input className="form-input mb-4" value={phone} onChange={(e) => setPhone(e.target.value)} />
        <label className="mb-1 block text-sm font-medium text-gray-700">Email</label>
        <input type="email" className="form-input mb-4" value={email} onChange={(e) => setEmail(e.target.value)} />
        <label className="mb-1 block text-sm font-medium text-gray-700">GST / Tax number</label>
        <input className="form-input mb-4" value={taxNumber} onChange={(e) => setTaxNumber(e.target.value)} />
        <label className="mb-1 block text-sm font-medium text-gray-700">Bank details</label>
        <textarea
          className="form-input mb-6"
          rows={3}
          value={bankDetails}
          onChange={(e) => setBankDetails(e.target.value)}
        />
        <button type="submit" className="btn-primary" disabled={saving}>
          {saving ? 'Saving…' : 'Save'}
        </button>
      </form>
    </>
  );
}
