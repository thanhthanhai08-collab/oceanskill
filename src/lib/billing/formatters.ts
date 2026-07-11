const VIETNAM_TIME_ZONE = "Asia/Ho_Chi_Minh";

export function formatBillingDate(locale: string, value: string, dateStyle: "medium" | "long" = "medium") {
  return new Intl.DateTimeFormat(locale === "vi" ? "vi-VN" : "en-US", {
    dateStyle,
    timeStyle: "short",
    timeZone: VIETNAM_TIME_ZONE,
  }).format(new Date(value));
}

export function paymentStatusLabel(locale: string, status: string) {
  const labels = locale === "vi"
    ? {pending: "Chờ thanh toán", paid: "Đã thanh toán", expired: "Đã hết hạn", failed: "Thất bại", refunded: "Đã hoàn tiền", review: "Cần kiểm tra"}
    : {pending: "Pending", paid: "Paid", expired: "Expired", failed: "Failed", refunded: "Refunded", review: "Under review"};
  return labels[status as keyof typeof labels] ?? status;
}
