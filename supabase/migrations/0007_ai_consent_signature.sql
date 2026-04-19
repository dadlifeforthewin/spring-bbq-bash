-- 0007_ai_consent_signature.sql
-- Add 'ai_consent' to the allowed signature_type values.

alter table signatures drop constraint if exists signatures_signature_type_check;

alter table signatures add constraint signatures_signature_type_check
  check (signature_type in ('liability_waiver','photo_consent','ai_consent'));
