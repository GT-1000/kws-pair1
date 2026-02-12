export const DSB_WFS_BASE = "https://ogc.dsb.no/wfs.ashx";

export function wfsGmlUrl(typeName: string) {
  const url = new URL(DSB_WFS_BASE);
  url.searchParams.set("service", "WFS");
  url.searchParams.set("request", "GetFeature");
  url.searchParams.set("version", "1.1.0");
  url.searchParams.set("typeName", typeName);
  url.searchParams.set("srsName", "EPSG:3857");
  url.searchParams.set("outputFormat", "text/xml; subtype=gml/3.1.1");
  return url.toString();
}
