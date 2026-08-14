with pool as (
  select row_number() over () - 1 as i, u from unnest(array[
'https://images.nappy.co/photo/mxUUoYK2LP0JSLeombOgE.jpg?width=1200&quality=80',
'https://images.nappy.co/photo/TimOxIz0PukxQJzWsDDQY.jpg?width=1200&quality=80',
'https://images.nappy.co/photo/YX0xMIVFJyvXagzWqPC71.jpg?width=1200&quality=80',
'https://images.nappy.co/photo/NAFksS7aspsF4cVsW11ZJ.jpg?width=1200&quality=80',
'https://images.nappy.co/photo/1mCmZ8Wuvcy6K7e6Pskew.jpg?width=1200&quality=80',
'https://images.nappy.co/photo/Y8qRRuSmj4Jp9IS8QyG_W.jpg?width=1200&quality=80',
'https://images.nappy.co/photo/DbiVhFj5ot8EKbpsx58DG.jpg?width=1200&quality=80',
'https://images.nappy.co/photo/OHzay15gpm5tHzJD6Hu6A.jpg?width=1200&quality=80',
'https://images.nappy.co/photo/Hu8hP_lV6JtIIHQovctDq.jpg?width=1200&quality=80',
'https://images.nappy.co/photo/bmM7EXVzqlHPtDxYypr1A.jpg?width=1200&quality=80',
'https://images.nappy.co/photo/tVRfNk8L6AQk-uMbUWfL3.jpg?width=1200&quality=80',
'https://images.nappy.co/photo/xTvDRl39ewBr5z5oZLcYt.jpg?width=1200&quality=80',
'https://images.nappy.co/photo/5ChqIJeCtA5-GcyU8IyIz.jpg?width=1200&quality=80',
'https://images.nappy.co/photo/3OGeJ9_Al1g7ERA2fREdQ.jpg?width=1200&quality=80',
'https://images.nappy.co/photo/SmaLpLfpJBaaoIlu7V4Ql.jpg?width=1200&quality=80',
'https://images.nappy.co/photo/p6kn3T44oBqU6AhTqdhZu.jpg?width=1200&quality=80',
'https://images.nappy.co/photo/OgRb8FZ4e4Gk_P9-oI6NK.jpg?width=1200&quality=80',
'https://images.nappy.co/photo/vGTJVTLkMjcycAcNhpwCX.jpg?width=1200&quality=80'
  ]) as u
), g as (select id, (row_number() over (order by created_at)) - 1 as n from gallery_media where file_url ilike '%unsplash%' or thumbnail_url ilike '%unsplash%')
update gallery_media m set file_url = p.u, thumbnail_url = p.u
from g join pool p on p.i = g.n % 18 where m.id = g.id;

with pool as (
  select row_number() over () - 1 as i, u from unnest(array[
'https://images.nappy.co/photo/mxUUoYK2LP0JSLeombOgE.jpg?width=1200&quality=80',
'https://images.nappy.co/photo/TimOxIz0PukxQJzWsDDQY.jpg?width=1200&quality=80',
'https://images.nappy.co/photo/YX0xMIVFJyvXagzWqPC71.jpg?width=1200&quality=80',
'https://images.nappy.co/photo/NAFksS7aspsF4cVsW11ZJ.jpg?width=1200&quality=80',
'https://images.nappy.co/photo/1mCmZ8Wuvcy6K7e6Pskew.jpg?width=1200&quality=80',
'https://images.nappy.co/photo/Y8qRRuSmj4Jp9IS8QyG_W.jpg?width=1200&quality=80',
'https://images.nappy.co/photo/DbiVhFj5ot8EKbpsx58DG.jpg?width=1200&quality=80',
'https://images.nappy.co/photo/OHzay15gpm5tHzJD6Hu6A.jpg?width=1200&quality=80',
'https://images.nappy.co/photo/Hu8hP_lV6JtIIHQovctDq.jpg?width=1200&quality=80',
'https://images.nappy.co/photo/bmM7EXVzqlHPtDxYypr1A.jpg?width=1200&quality=80',
'https://images.nappy.co/photo/tVRfNk8L6AQk-uMbUWfL3.jpg?width=1200&quality=80',
'https://images.nappy.co/photo/xTvDRl39ewBr5z5oZLcYt.jpg?width=1200&quality=80'
  ]) as u
), b as (select id, (row_number() over (order by created_at)) - 1 as n from blog_posts where cover_image_url ilike '%unsplash%')
update blog_posts t set cover_image_url = p.u from b join pool p on p.i = b.n % 12 where t.id = b.id;

with pool as (
  select row_number() over () - 1 as i, u from unnest(array[
'https://images.nappy.co/photo/YX0xMIVFJyvXagzWqPC71.jpg?width=1200&quality=80',
'https://images.nappy.co/photo/TimOxIz0PukxQJzWsDDQY.jpg?width=1200&quality=80',
'https://images.nappy.co/photo/mxUUoYK2LP0JSLeombOgE.jpg?width=1200&quality=80',
'https://images.nappy.co/photo/NAFksS7aspsF4cVsW11ZJ.jpg?width=1200&quality=80',
'https://images.nappy.co/photo/DbiVhFj5ot8EKbpsx58DG.jpg?width=1200&quality=80',
'https://images.nappy.co/photo/Y8qRRuSmj4Jp9IS8QyG_W.jpg?width=1200&quality=80'
  ]) as u
), c as (select id, (row_number() over (order by created_at)) - 1 as n from startup_school_content where cover_image_url ilike '%unsplash%')
update startup_school_content t set cover_image_url = p.u from c join pool p on p.i = c.n % 6 where t.id = c.id;

with pool as (
  select row_number() over () - 1 as i, u from unnest(array[
'https://images.nappy.co/photo/mxUUoYK2LP0JSLeombOgE.jpg?width=1200&quality=80',
'https://images.nappy.co/photo/YX0xMIVFJyvXagzWqPC71.jpg?width=1200&quality=80',
'https://images.nappy.co/photo/OHzay15gpm5tHzJD6Hu6A.jpg?width=1200&quality=80',
'https://images.nappy.co/photo/1mCmZ8Wuvcy6K7e6Pskew.jpg?width=1200&quality=80',
'https://images.nappy.co/photo/Hu8hP_lV6JtIIHQovctDq.jpg?width=1200&quality=80',
'https://images.nappy.co/photo/bmM7EXVzqlHPtDxYypr1A.jpg?width=1200&quality=80'
  ]) as u
), s as (select id, (row_number() over (order by created_at)) - 1 as n from startup_school_programs where cover_image_url ilike '%unsplash%')
update startup_school_programs t set cover_image_url = p.u from s join pool p on p.i = s.n % 6 where t.id = s.id;