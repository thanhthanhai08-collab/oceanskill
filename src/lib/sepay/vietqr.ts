import QRCode from "qrcode";

const VIETINBANK_BIN = "970415";
const NAPAS_GUID = "A000000727";

function tlv(id: string, value: string) {
  if (value.length > 99) throw new Error(`VietQR field ${id} is too long`);
  return `${id}${String(value.length).padStart(2, "0")}${value}`;
}

function crc16Ccitt(value: string) {
  let crc = 0xffff;
  for (let index = 0; index < value.length; index += 1) {
    crc ^= value.charCodeAt(index) << 8;
    for (let bit = 0; bit < 8; bit += 1) {
      crc = (crc & 0x8000) !== 0 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}

export function createVietQrPayload(amountVnd: number, orderCode: string, accountNumber: string) {
  if (!Number.isSafeInteger(amountVnd) || amountVnd <= 0) throw new Error("Invalid VietQR amount");
  if (!/^SEVQR[A-F0-9]{18}$/.test(orderCode)) throw new Error("Invalid VietQR order code");
  if (!/^\d{1,19}$/.test(accountNumber)) throw new Error("Invalid VietQR account number");

  const beneficiary = tlv("00", VIETINBANK_BIN) + tlv("01", accountNumber);
  const merchantAccount = tlv("00", NAPAS_GUID) + tlv("01", beneficiary) + tlv("02", "QRIBFTTA");
  const withoutCrc =
    tlv("00", "01") +
    tlv("01", "12") +
    tlv("38", merchantAccount) +
    tlv("52", "0000") +
    tlv("53", "704") +
    tlv("54", String(amountVnd)) +
    tlv("58", "VN") +
    tlv("62", tlv("08", orderCode)) +
    "6304";
  return withoutCrc + crc16Ccitt(withoutCrc);
}

export async function createVietQrDataUrl(amountVnd: number, orderCode: string, accountNumber: string) {
  return QRCode.toDataURL(createVietQrPayload(amountVnd, orderCode, accountNumber), {
    errorCorrectionLevel: "M",
    width: 512,
    margin: 2,
    color: {dark: "#050608", light: "#FFFFFF"},
  });
}
