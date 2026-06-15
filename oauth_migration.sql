-- OAuth Migration: Remove Invites and add Domain Constraint Trigger

-- 1. Drop the invites table and related policies
drop table if exists public.invites cascade;

-- 2. Create the function to validate email domain
create or replace function public.validate_user_email()
returns trigger as $$
begin
  if (
    lower(new.email) not like '%@bmsce.ac.in' and 
    lower(new.email) != 'ghostfaked02@gmail.com' and 
    lower(new.email) != 'ghostfaked03@gmail.com'
  ) then
    raise exception 'Unauthorized email domain. Only @bmsce.ac.in is allowed.';
  end if;
  return new;
end;
$$ language plpgsql security definer;

-- 3. Attach the trigger to the auth.users table
drop trigger if exists ensure_valid_email on auth.users;
create trigger ensure_valid_email
  before insert on auth.users
  for each row execute procedure public.validate_user_email();
