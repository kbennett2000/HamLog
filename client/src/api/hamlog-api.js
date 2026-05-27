import axios from 'axios';
import config from '../config';

const client = axios.create({
  baseURL: config.ApiBaseUrl,
});

const authHeaders = () => ({
  headers: { Authorization: `Bearer ${config.ApiKey}` },
});

export async function getQsos() {
  const res = await client.get('/qsos');
  return res.data;
}

export async function getQsosByCallsign(callsign) {
  const res = await client.get('/qsos', { params: { callsign } });
  return res.data.Contacts;
}

export async function getQsosByPark(park) {
  const res = await client.get('/qsos', { params: { park } });
  return res.data.Contacts;
}

export async function createQso(data) {
  const res = await client.post('/qsos', data, authHeaders());
  return res.data;
}

export async function createPotaQso(qsoId, parkId, qsoType) {
  const res = await client.post(`/qsos/${qsoId}/pota`, { parkId, qsoType }, authHeaders());
  return res.data;
}

export async function createContestQso(qsoId, contestId, qsoNumber, exchangeData) {
  const res = await client.post(`/qsos/${qsoId}/contest`, { contestId, qsoNumber, exchangeData }, authHeaders());
  return res.data;
}

export async function deleteQso(id) {
  const res = await client.delete(`/qsos/${id}`, authHeaders());
  return res.data;
}

export async function getContactInfo(callsign) {
  const res = await client.get(`/contact-info/${callsign}`);
  return res.data.Contacts;
}

export async function contactInfoExists(callsign) {
  const res = await client.get(`/contact-info/${callsign}/exists`);
  return res.data.exists;
}

export async function createContactInfo(data) {
  const res = await client.post('/contact-info', data, authHeaders());
  return res.data;
}
