import "server-only";

function required(name: string) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing required server environment variable: ${name}`);
  return value;
}

export const serverEnv = {
  get supabaseUrl() { return required("NEXT_PUBLIC_SUPABASE_URL"); },
  get supabaseServiceRoleKey() { return required("SUPABASE_SERVICE_ROLE_KEY"); },
  get sepayWebhookSecret() { return required("SEPAY_WEBHOOK_SECRET"); },
  get sepayBankAccountNumber() { return required("SEPAY_BANK_ACCOUNT_NUMBER"); },
  get sepayBankName() { return required("SEPAY_BANK_NAME"); }
};
