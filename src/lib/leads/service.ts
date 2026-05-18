import { createServiceClient } from '../supabase/client';

export interface LeadData {
  name?: string;
  email: string;
  company?: string;
  triggerMessage: string;
  conversation: Array<{ role: string; content: string }>;
}

export async function saveLead(data: LeadData): Promise<void> {
  const client = createServiceClient();
  const { error } = await client.from('leads').insert({
    name: data.name ?? null,
    email: data.email,
    company: data.company ?? null,
    trigger_message: data.triggerMessage,
    conversation: data.conversation,
  });
  if (error) throw new Error(`Failed to save lead: ${error.message}`);
}
