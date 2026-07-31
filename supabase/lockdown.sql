-- Verrouillage : lecture publique (anon) partout, écriture réservée aux comptes staff (authenticated)

drop policy if exists "orders insert" on orders;
drop policy if exists "orders update" on orders;
drop policy if exists "orders delete" on orders;

create policy "orders insert (staff)" on orders for insert to authenticated with check (true);
create policy "orders update (staff)" on orders for update to authenticated using (true) with check (true);
create policy "orders delete (staff)" on orders for delete to authenticated using (true);

drop policy if exists "menu write" on menu;
drop policy if exists "menu insert" on menu;

create policy "menu write (staff)" on menu for update to authenticated using (true) with check (true);
create policy "menu insert (staff)" on menu for insert to authenticated with check (true);

revoke execute on function next_order_code() from anon;

drop policy if exists "menu images public insert" on storage.objects;
drop policy if exists "menu images public update" on storage.objects;
drop policy if exists "menu images public delete" on storage.objects;

create policy "menu images staff insert" on storage.objects for insert to authenticated with check (bucket_id = 'menu-images');
create policy "menu images staff update" on storage.objects for update to authenticated using (bucket_id = 'menu-images');
create policy "menu images staff delete" on storage.objects for delete to authenticated using (bucket_id = 'menu-images');
