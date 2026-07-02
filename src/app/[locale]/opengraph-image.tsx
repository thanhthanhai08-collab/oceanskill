import {ImageResponse} from "next/og";

export const alt = "OceanSkill — production-ready skills for AI agents";
export const size = {width: 1200, height: 630};
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    <div style={{display: "flex", width: "100%", height: "100%", alignItems: "center", justifyContent: "center", background: "radial-gradient(circle at 70% 20%, #2e5bff 0%, #111319 42%, #0c0e14 100%)", color: "#e2e2eb", fontFamily: "sans-serif"}}>
      <div style={{display: "flex", width: 980, flexDirection: "column"}}><div style={{fontSize: 34, fontWeight: 700, color: "#b8c3ff"}}>OceanSkill</div><div style={{marginTop: 38, maxWidth: 900, fontSize: 76, fontWeight: 700, lineHeight: 1.05}}>Production-ready skills for AI agents.</div><div style={{marginTop: 34, fontSize: 28, color: "#c4c5d9"}}>Reviewed metadata · Authenticated MCP delivery · Supabase access control</div></div>
    </div>,
    size,
  );
}

