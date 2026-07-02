import type {MetadataRoute} from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {name: "OceanSkill", short_name: "OceanSkill", description: "Production-ready skills for AI agents.", start_url: "/vi", display: "standalone", background_color: "#111319", theme_color: "#2e5bff", icons: [{src: "/favicon.ico", sizes: "any", type: "image/x-icon"}]};
}
