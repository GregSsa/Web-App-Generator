begin;

-- Cette fonction est exclusivement appelée par le trigger auth.users.
revoke execute on function public.handle_new_user() from public, anon, authenticated;

create index chapters_manga_owner_idx on public.chapters(manga_id, user_id);
create index manga_categories_category_owner_idx on public.manga_categories(category_id, user_id);
create index manga_categories_manga_owner_idx on public.manga_categories(manga_id, user_id);
create index manga_categories_user_idx on public.manga_categories(user_id);
create index check_logs_manga_owner_idx on public.manga_check_logs(manga_id, user_id);
create index check_logs_user_idx on public.manga_check_logs(user_id);
create index notifications_chapter_owner_idx on public.notifications(chapter_id, user_id);
create index notifications_manga_owner_idx on public.notifications(manga_id, user_id);
create index progress_chapter_owner_idx on public.reading_progress(last_read_chapter_id, user_id);
create index progress_manga_owner_idx on public.reading_progress(manga_id, user_id);

commit;
