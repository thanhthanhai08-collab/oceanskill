import {redirect} from "next/navigation";
import TopupFlow, {type TopupPack} from "@/components/dashboard/TopupFlow";
import {getDashboardProfile} from "@/lib/dashboard/profile";
import {createClient} from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const topupLabels = {
  vi: {
    title: "Nạp tiền vào tài khoản", description: "Giao dịch an toàn và nhanh chóng thông qua mạng lưới VietQR", amountTitle: "Số tiền nạp",
    presetTitle: "Chọn gói credit", promoTitle: "Mã khuyến mãi (tùy chọn)", promoPlaceholder: "Ví dụ: NSKILL2024", promoApply: "Áp dụng",
    promoStatus: "Mã ưu đãi đã được ghi nhận. Hệ thống sẽ áp dụng khi chương trình hoạt động", terms: "Tôi đồng ý với quy định thanh toán của OceanSkill và",
    termsLink: "Điều khoản sử dụng", submit: "Xác nhận nạp tiền", submitting: "Đang tạo mã QR", summaryTitle: "Tóm tắt giao dịch",
    amount: "Số tiền nạp", discount: "Giảm giá", fee: "Phí giao dịch", free: "Miễn phí", total: "Tổng thanh toán", receive: "Bạn sẽ nhận được",
    rate: "Credit sẽ được cộng sau khi thanh toán thành công", choosePack: "Chưa có gói credit nào đang hoạt động", error: "Không thể tạo lệnh thanh toán. Hãy thử lại",
    qrTitle: "Quét mã để thanh toán", qrDescription: "Vui lòng dùng ứng dụng ngân hàng hoặc ví điện tử để quét mã VietQR bên dưới", transferContent: "Nội dung chuyển khoản",
    waiting: "Đang chờ thanh toán", close: "Đóng",
  },
  en: {
    title: "Top up your account", description: "Fast and secure payments through VietQR", amountTitle: "Top-up amount", presetTitle: "Choose a credit plan",
    promoTitle: "Promo code (optional)", promoPlaceholder: "Example: NSKILL2024", promoApply: "Apply", promoStatus: "Your promo code has been saved and will apply when available",
    terms: "I agree to OceanSkill's payment policy and", termsLink: "Terms of use", submit: "Confirm top-up", submitting: "Creating QR code", summaryTitle: "Payment summary",
    amount: "Top-up amount", discount: "Discount", fee: "Transaction fee", free: "Free", total: "Total payment", receive: "You will receive",
    rate: "Credits are added after successful payment", choosePack: "No active credit plans are available", error: "Unable to create payment order. Please try again",
    qrTitle: "Scan to pay", qrDescription: "Use your banking app or e-wallet to scan the VietQR code below", transferContent: "Transfer content", waiting: "Waiting for payment", close: "Close",
  },
} as const;

const copy = {
  vi: {
    title: "Nạp tiền vào tài khoản",
    description: "Giao dịch an toàn và nhanh chóng thông qua mạng lưới VietQR.",
    amountTitle: "Nhập số tiền nạp",
    presetTitle: "Chọn gói credit",
    promoTitle: "Mã khuyến mãi (Tùy chọn)",
    promoPlaceholder: "VD: NSKILL2024",
    promoApply: "Áp dụng",
    promoStatus: "Mã ưu đãi đã được ghi nhận. Hệ thống sẽ áp dụng khi chương trình khuyến mãi hoạt động.",
    terms: "Tôi đồng ý với quy định thanh toán của OceanSkill và",
    termsLink: "Điều khoản sử dụng",
    submit: "Đồng ý nạp tiền",
    submitting: "Đang tạo mã QR...",
    summaryTitle: "Tóm tắt giao dịch",
    amount: "Số tiền nạp:",
    discount: "Giảm giá:",
    fee: "Phí giao dịch:",
    free: "Miễn phí",
    total: "Tổng thanh toán",
    receive: "Bạn sẽ nhận được",
    rate: "Credit sẽ được cộng sau khi thanh toán thành công.",
    choosePack: "Chưa có gói credit nào đang hoạt động.",
    error: "Không thể tạo lệnh thanh toán. Hãy thử lại.",
    qrTitle: "Quét mã để thanh toán",
    qrDescription: "Vui lòng sử dụng App ngân hàng hoặc Ví điện tử để quét mã VietQR bên dưới.",
    transferContent: "Nội dung chuyển khoản:",
    waiting: "Đang chờ thanh toán...",
    close: "Đóng",
  },
  en: {
    title: "Top up your account",
    description: "Fast, secure payment through VietQR.",
    amountTitle: "Enter top-up amount",
    presetTitle: "Choose a credit pack",
    promoTitle: "Promo code (Optional)",
    promoPlaceholder: "Example: NSKILL2024",
    promoApply: "Apply",
    promoStatus: "Promo saved. It will apply when the promotion program is active.",
    terms: "I agree to OceanSkill payment rules and",
    termsLink: "Terms of use",
    submit: "Confirm top-up",
    submitting: "Creating QR...",
    summaryTitle: "Transaction summary",
    amount: "Top-up amount:",
    discount: "Discount:",
    fee: "Transaction fee:",
    free: "Free",
    total: "Total payment",
    receive: "You will receive",
    rate: "Credits are added after successful payment.",
    choosePack: "No active credit packs yet.",
    error: "Could not create payment order. Please try again.",
    qrTitle: "Scan to pay",
    qrDescription: "Use your banking app or e-wallet to scan the VietQR code below.",
    transferContent: "Transfer content:",
    waiting: "Waiting for payment...",
    close: "Close",
  },
} as const;

void copy;

export default async function TopupPage({params, searchParams}: {readonly params: Promise<{locale: string}>; readonly searchParams: Promise<{pack?: string | string[]; purpose?: string | string[]; amount?: string | string[]}>}) {
  const {locale} = await params;
  const query = await searchParams;
  const profileData = await getDashboardProfile();
  if (!profileData) redirect(`/${locale}/login`);

  const supabase = await createClient();
  const {data} = await supabase
    .from("credit_packs")
    .select("id,code,name,price_vnd,credit_units")
    .eq("active", true)
    .order("price_vnd", {ascending: true});

  const isSlotPurchase = query.purpose === "creator-slots";
  const baseLabels = locale === "vi" ? topupLabels.vi : topupLabels.en;
  const labels = isSlotPurchase ? {
    ...baseLabels,
    title: locale === "vi" ? "Mua thêm slot skill" : "Buy more skill slots",
    description: locale === "vi" ? "Mỗi 5.000₫ mở thêm 1 slot skill tự đăng. Bạn có thể chọn số tiền lớn hơn theo bội số 5.000₫." : "Every 5,000 VND adds one private-skill slot. Choose any larger multiple of 5,000 VND.",
    amountTitle: locale === "vi" ? "Số tiền mua slot" : "Slot purchase amount",
    presetTitle: locale === "vi" ? "Chọn số slot" : "Choose slot count",
    rate: locale === "vi" ? "Slot được cộng sau khi thanh toán thành công" : "Slots are added after successful payment",
  } : baseLabels;

  return (
    <>
      <header className="mb-12">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-tertiary">{locale === "vi" ? "Thanh toán" : "Payments"}</p>
        <h1 className="font-geist text-4xl font-bold tracking-tight text-primary">{labels.title}</h1>
        <p className="mt-3 max-w-2xl text-on-surface-variant">{labels.description}</p>
      </header>
      <TopupFlow
        packs={(data ?? []) as TopupPack[]}
        initialPackId={typeof query.pack === "string" ? query.pack : undefined}
        locale={locale}
        labels={labels}
        purpose={isSlotPurchase ? "creator-slots" : "credits"}
        initialAmount={typeof query.amount === "string" ? Number(query.amount) : undefined}
      />
    </>
  );
}
