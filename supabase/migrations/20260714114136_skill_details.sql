create table public.skill_details (
  skill_id uuid primary key references public.skills(id) on delete cascade,
  headline text not null check (char_length(headline) between 1 and 180),
  overview text not null check (char_length(overview) between 1 and 1200),
  feature_one_title text not null check (char_length(feature_one_title) between 1 and 120),
  feature_one_description text not null check (char_length(feature_one_description) between 1 and 600),
  feature_two_title text not null check (char_length(feature_two_title) between 1 and 120),
  feature_two_description text not null check (char_length(feature_two_description) between 1 and 600),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.skill_details enable row level security;

create policy skill_details_select_public on public.skill_details for select
to anon, authenticated
using (
  exists (
    select 1 from public.skills s
    where s.id = skill_id and s.status = 'active' and s.visibility = 'public'
  )
);

revoke all on public.skill_details from anon, authenticated;
grant select on public.skill_details to anon, authenticated;

insert into public.skill_details (skill_id, headline, overview, feature_one_title, feature_one_description, feature_two_title, feature_two_description)
select s.id, values_data.headline, values_data.overview, values_data.feature_one_title, values_data.feature_one_description, values_data.feature_two_title, values_data.feature_two_description
from public.skills s
join (values
  ('algorithmic-art', 'Biến thuật toán thành tác phẩm thị giác', 'algorithmic-art giúp agent xây dựng nghệ thuật tạo sinh bằng p5.js với quy tắc hình học, bảng màu có chủ đích và tính ngẫu nhiên có thể tái tạo.', 'Ngẫu nhiên có kiểm soát', 'Dùng seed và tham số để mỗi kết quả có thể tái tạo, tinh chỉnh và phát triển thành nhiều biến thể nhất quán.', 'Tương tác và xuất bản', 'Tạo sketch có điều khiển trực tiếp, phản hồi theo input và sẵn sàng xuất thành artifact để chia sẻ.'),
  ('brand-guidelines', 'Giữ mọi ấn phẩm đúng chuẩn thương hiệu Anthropic', 'brand-guidelines áp dụng hệ màu, typography và nguyên tắc trình bày chính thức của Anthropic vào tài liệu, slide, website và các tài sản truyền thông.', 'Màu sắc và kiểu chữ chuẩn', 'Chọn đúng palette và typography thương hiệu để sản phẩm có diện mạo nhất quán với Anthropic.', 'Đồng bộ trên nhiều định dạng', 'Giữ cùng một ngôn ngữ thị giác khi chuyển nội dung giữa tài liệu, bản trình chiếu và giao diện số.'),
  ('canvas-design', 'Tạo thiết kế tĩnh có bố cục và cá tính rõ ràng', 'canvas-desgin hướng dẫn agent tạo poster, hình minh họa và tác phẩm thị giác nguyên bản cho đầu ra PNG hoặc PDF bằng tư duy thiết kế có hệ thống.', 'Bố cục có chủ đích', 'Xây dựng phân cấp, nhịp điệu, khoảng trắng và typography phù hợp với thông điệp thay vì dùng bố cục mẫu.', 'Đầu ra sẵn sàng sử dụng', 'Hoàn thiện tác phẩm ở định dạng canvas phù hợp để xuất ảnh hoặc PDF với chất lượng trình bày cao.'),
  ('frontend-design', 'Xây dựng giao diện khác biệt và sẵn sàng production', 'frontend-design giúp agent chuyển yêu cầu sản phẩm thành giao diện có định hướng nghệ thuật rõ ràng, responsive và được chăm chút đến từng trạng thái tương tác.', 'Ngôn ngữ thị giác riêng', 'Lựa chọn typography, màu sắc, bố cục và hình ảnh phù hợp với sản phẩm thay vì lặp lại mẫu giao diện AI phổ biến.', 'Triển khai hoàn chỉnh', 'Tạo component responsive, trạng thái tương tác và chi tiết hoàn thiện có thể đưa thẳng vào ứng dụng thực tế.'),
  ('gstack', 'Vận hành trọn vẹn một chu kỳ phát triển phần mềm với AI', 'gstack tổ chức quy trình từ khám phá sản phẩm, lập kế hoạch kỹ thuật và review đến QA, bảo mật, tài liệu và phát hành.', 'Lập kế hoạch và kiểm chứng', 'Biến ý tưởng thành phạm vi rõ ràng, rà soát kiến trúc và kiểm tra giả định trước khi triển khai.', 'Chất lượng trước khi phát hành', 'Kết hợp review, browser QA, kiểm tra bảo mật và đồng bộ tài liệu trước khi ship thay đổi.'),
  ('stitch-skills', 'Đi từ thiết kế Stitch đến giao diện có cấu trúc', 'stitch-skills cung cấp các workflow để tạo màn hình, trích xuất design system và chuyển thiết kế Google Stitch thành component React hoặc React Native.', 'Design system có thể tái sử dụng', 'Phân tích màn hình và gom typography, màu sắc, spacing cùng quy tắc component thành nguồn thiết kế thống nhất.', 'Chuyển thiết kế thành code', 'Tạo hoặc đồng bộ component React và React Native theo thiết kế Stitch cùng các tài sản liên quan.'),
  ('taste-skill', 'Loại bỏ giao diện AI chung chung khỏi sản phẩm', 'taste-skill giúp agent đọc đúng ngữ cảnh, suy ra ngôn ngữ thiết kế phù hợp và tạo landing page, portfolio hoặc bản redesign có cá tính riêng.', 'Suy luận hướng thiết kế', 'Điều chỉnh độ biến thiên, chuyển động và mật độ dựa trên brief thay vì áp một phong cách cố định cho mọi dự án.', 'Kiểm soát anti-slop', 'Phát hiện và loại bỏ bố cục, typography, card và hiệu ứng mang cảm giác rập khuôn của giao diện do AI tạo.')
) as values_data(slug, headline, overview, feature_one_title, feature_one_description, feature_two_title, feature_two_description)
on values_data.slug = s.slug
on conflict (skill_id) do update set
  headline = excluded.headline,
  overview = excluded.overview,
  feature_one_title = excluded.feature_one_title,
  feature_one_description = excluded.feature_one_description,
  feature_two_title = excluded.feature_two_title,
  feature_two_description = excluded.feature_two_description,
  updated_at = now();
