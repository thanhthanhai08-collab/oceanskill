begin;

alter table public.blog_posts
  drop constraint if exists blog_posts_cover_image_path_check;
alter table public.blog_posts
  add constraint blog_posts_cover_image_path_check
  check (
    cover_image_path is null or (
      length(cover_image_path) between 6 and 505
      and cover_image_path ~ '^blog/[a-z0-9][a-z0-9._/-]*$'
    )
  );

alter table public.blog_post_drafts
  drop constraint if exists blog_post_drafts_cover_image_path_check;
alter table public.blog_post_drafts
  add constraint blog_post_drafts_cover_image_path_check
  check (
    cover_image_path is null or (
      length(cover_image_path) between 6 and 505
      and cover_image_path ~ '^blog/[a-z0-9][a-z0-9._/-]*$'
    )
  );

commit;
