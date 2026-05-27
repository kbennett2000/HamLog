import axios from 'axios';
import config from '../config';
import type { Contact, ContactInfo } from '../types/qso';

const client = axios.create({
  baseURL: config.ApiBaseUrl,
});

const authHeaders = () => ({
  headers: { Authorization: `Bearer ${config.ApiKey}` },
});

interface CreateQsoData {
  date: string;
  time: string;
  callsign: string;
  frequency: string;
  notes: string;
  received: string;
  sent: string;
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
  const res = await client.post('/qsos', data, authHeaders());
  return res.data;
}

export async function createPotaQso(qsoId: number, parkId: string, qsoType: string): Promise<{ id: number }> {
  const res = await client.post(`/qsos/${qsoId}/pota`, { parkId, qsoType }, authHeaders());
  return res.data;
}

export async function createContestQso(qsoId: number, contestId: string, qsoNumber: string, exchangeData: string): Promise<{ id: number }> {
  const res = await client.post(`/qsos/${qsoId}/contest`, { contestId, qsoNumber, exchangeData }, authHeaders());
  return res.data;
}

export async function deleteQso(id: number): Promise<{ deleted: boolean }> {
  const res = await client.delete(`/qsos/${id}`, authHeaders());
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
  const res = await client.post('/contact-info', data, authHeaders());
  return res.data;
}
