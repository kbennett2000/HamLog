import axios from 'axios';
import config from '../config';
import type { Contact, ContactInfo } from '../types/qso';

const client = axios.create({
  baseURL: config.ApiBaseUrl,
});

client.interceptors.request.use(cfg => {
  const token = localStorage.getItem('hamlog_token');
  if (token) {
    cfg.headers.Authorization = `Bearer ${token}`;
  }
  return cfg;
});

client.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401 && !err.config.url?.includes('/auth/')) {
      localStorage.removeItem('hamlog_token');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

interface AuthResponse {
  token: string;
  user: { id: number; username: string; callsign: string };
}

interface UserProfile {
  userId: number;
  username: string;
  callsign: string;
}

export async function loginUser(username: string, password: string): Promise<AuthResponse> {
  const res = await client.post('/auth/login', { username, password });
  return res.data;
}

export async function registerUser(username: string, password: string, callsign: string): Promise<AuthResponse> {
  const res = await client.post('/auth/register', { username, password, callsign });
  return res.data;
}

export async function getMe(token?: string): Promise<UserProfile> {
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  const res = await client.get('/auth/me', { headers });
  return res.data;
}

interface CreateQsoData {
  date: string;
  time: string;
  callsign: string;
  frequency: string;
  notes: string;
  received: string;
  sent: string;
  mode?: string;
  band?: string;
}

interface CreateContactInfoData {
  callsign: string;
  name: string;
  street: string;
  city: string;
  state: string;
  addressCountry: string;
  latitude: string;
  longitude: string;
  itu: string;
  grid: string;
  qth: string;
  country: string;
}

export async function getQsos(): Promise<Contact[]> {
  const res = await client.get('/qsos');
  return res.data;
}

export async function getQsosByCallsign(callsign: string): Promise<Contact[]> {
  const res = await client.get('/qsos', { params: { callsign } });
  return res.data.Contacts;
}

export async function getQsosByPark(park: string): Promise<Contact[]> {
  const res = await client.get('/qsos', { params: { park } });
  return res.data.Contacts;
}

export async function createQso(data: CreateQsoData): Promise<{ id: number }> {
  const res = await client.post('/qsos', data);
  return res.data;
}

export async function createPotaQso(qsoId: number, parkId: string, qsoType: string): Promise<{ id: number }> {
  const res = await client.post(`/qsos/${qsoId}/pota`, { parkId, qsoType });
  return res.data;
}

export async function createContestQso(qsoId: number, contestId: string, qsoNumber: string, exchangeData: string): Promise<{ id: number }> {
  const res = await client.post(`/qsos/${qsoId}/contest`, { contestId, qsoNumber, exchangeData });
  return res.data;
}

export async function deleteQso(id: number): Promise<{ deleted: boolean }> {
  const res = await client.delete(`/qsos/${id}`);
  return res.data;
}

export async function getContactInfo(callsign: string): Promise<ContactInfo[]> {
  const res = await client.get(`/contact-info/${callsign}`);
  return res.data.Contacts;
}

export async function contactInfoExists(callsign: string): Promise<boolean> {
  const res = await client.get(`/contact-info/${callsign}/exists`);
  return res.data.exists;
}

export async function createContactInfo(data: CreateContactInfoData): Promise<{ id?: number; skipped?: boolean }> {
  const res = await client.post('/contact-info', data);
  return res.data;
}

export async function exportAdif(park?: string): Promise<void> {
  const params = park ? { park } : {};
  const res = await client.get('/qsos/export', { params, responseType: 'blob' });
  const url = URL.createObjectURL(res.data);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'hamlog-export.adi';
  a.click();
  URL.revokeObjectURL(url);
}

export async function importAdif(file: File): Promise<{ imported: number; ids: number[] }> {
  const formData = new FormData();
  formData.append('file', file);
  const res = await client.post('/qsos/import', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
}
