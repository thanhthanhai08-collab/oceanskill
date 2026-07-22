begin;

alter table public.platform_skill_drafts
  add column faq_question_en_1 text not null default '',
  add column faq_answer_en_1 text not null default '',
  add column faq_question_en_2 text not null default '',
  add column faq_answer_en_2 text not null default '',
  add column faq_question_en_3 text not null default '',
  add column faq_answer_en_3 text not null default '',
  add column faq_question_vi_1 text not null default '',
  add column faq_answer_vi_1 text not null default '',
  add column faq_question_vi_2 text not null default '',
  add column faq_answer_vi_2 text not null default '',
  add column faq_question_vi_3 text not null default '',
  add column faq_answer_vi_3 text not null default '',
  add column faqs_touched boolean not null default false;

update public.platform_skill_drafts draft
set
  faq_question_en_1 = coalesce((select question from public.skill_faqs where skill_id = draft.skill_id and locale = 'en' and sort_order = 1), ''),
  faq_answer_en_1 = coalesce((select answer from public.skill_faqs where skill_id = draft.skill_id and locale = 'en' and sort_order = 1), ''),
  faq_question_en_2 = coalesce((select question from public.skill_faqs where skill_id = draft.skill_id and locale = 'en' and sort_order = 2), ''),
  faq_answer_en_2 = coalesce((select answer from public.skill_faqs where skill_id = draft.skill_id and locale = 'en' and sort_order = 2), ''),
  faq_question_en_3 = coalesce((select question from public.skill_faqs where skill_id = draft.skill_id and locale = 'en' and sort_order = 3), ''),
  faq_answer_en_3 = coalesce((select answer from public.skill_faqs where skill_id = draft.skill_id and locale = 'en' and sort_order = 3), ''),
  faq_question_vi_1 = coalesce((select question from public.skill_faqs where skill_id = draft.skill_id and locale = 'vi' and sort_order = 1), ''),
  faq_answer_vi_1 = coalesce((select answer from public.skill_faqs where skill_id = draft.skill_id and locale = 'vi' and sort_order = 1), ''),
  faq_question_vi_2 = coalesce((select question from public.skill_faqs where skill_id = draft.skill_id and locale = 'vi' and sort_order = 2), ''),
  faq_answer_vi_2 = coalesce((select answer from public.skill_faqs where skill_id = draft.skill_id and locale = 'vi' and sort_order = 2), ''),
  faq_question_vi_3 = coalesce((select question from public.skill_faqs where skill_id = draft.skill_id and locale = 'vi' and sort_order = 3), ''),
  faq_answer_vi_3 = coalesce((select answer from public.skill_faqs where skill_id = draft.skill_id and locale = 'vi' and sort_order = 3), '');

alter table public.platform_skill_drafts
  add constraint platform_skill_drafts_faq_lengths_check check (
    char_length(faq_question_en_1) between 0 and 300 and char_length(faq_answer_en_1) between 0 and 1200
    and char_length(faq_question_en_2) between 0 and 300 and char_length(faq_answer_en_2) between 0 and 1200
    and char_length(faq_question_en_3) between 0 and 300 and char_length(faq_answer_en_3) between 0 and 1200
    and char_length(faq_question_vi_1) between 0 and 300 and char_length(faq_answer_vi_1) between 0 and 1200
    and char_length(faq_question_vi_2) between 0 and 300 and char_length(faq_answer_vi_2) between 0 and 1200
    and char_length(faq_question_vi_3) between 0 and 300 and char_length(faq_answer_vi_3) between 0 and 1200
  );

create or replace function private.sync_platform_skill_draft_faqs()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_locale text;
  v_order smallint;
  v_question text;
  v_answer text;
begin
  if not new.faqs_touched then return new; end if;

  foreach v_locale in array array['en', 'vi'] loop
    for v_order in 1..3 loop
      v_question := case
        when v_locale = 'en' and v_order = 1 then trim(new.faq_question_en_1)
        when v_locale = 'en' and v_order = 2 then trim(new.faq_question_en_2)
        when v_locale = 'en' and v_order = 3 then trim(new.faq_question_en_3)
        when v_locale = 'vi' and v_order = 1 then trim(new.faq_question_vi_1)
        when v_locale = 'vi' and v_order = 2 then trim(new.faq_question_vi_2)
        else trim(new.faq_question_vi_3)
      end;
      v_answer := case
        when v_locale = 'en' and v_order = 1 then trim(new.faq_answer_en_1)
        when v_locale = 'en' and v_order = 2 then trim(new.faq_answer_en_2)
        when v_locale = 'en' and v_order = 3 then trim(new.faq_answer_en_3)
        when v_locale = 'vi' and v_order = 1 then trim(new.faq_answer_vi_1)
        when v_locale = 'vi' and v_order = 2 then trim(new.faq_answer_vi_2)
        else trim(new.faq_answer_vi_3)
      end;

      if (v_question = '') <> (v_answer = '') then
        raise exception 'platform_skill_faq_incomplete';
      elsif v_question = '' then
        delete from public.skill_faqs
        where skill_id = new.skill_id and locale = v_locale and sort_order = v_order;
      else
        insert into public.skill_faqs(skill_id, locale, question, answer, sort_order, is_published)
        values (new.skill_id, v_locale, v_question, v_answer, v_order, true)
        on conflict (skill_id, locale, sort_order) do update set
          question = excluded.question,
          answer = excluded.answer,
          is_published = true,
          updated_at = now();
      end if;
    end loop;
  end loop;
  return new;
end;
$$;

drop trigger if exists platform_skill_drafts_publish_faqs on public.platform_skill_drafts;
create trigger platform_skill_drafts_publish_faqs
before update of status on public.platform_skill_drafts
for each row
when (old.status = 'review' and new.status = 'published')
execute function private.sync_platform_skill_draft_faqs();

revoke all on function private.sync_platform_skill_draft_faqs()
from public, anon, authenticated;

drop policy if exists skill_faqs_select_public on public.skill_faqs;
create policy skill_faqs_select_public on public.skill_faqs
for select to anon, authenticated
using (
  is_published = true
  and exists (
    select 1 from public.skills
    where skills.id = skill_id
      and skills.status = 'active'
      and skills.visibility = 'public'
  )
);

commit;
