import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { Badge } from "@/components/ui/badge";
import type { Report } from "@/types/report";

// Fix for default marker icons
delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: () => string })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

const severeIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const moderateIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-yellow.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

interface MapComponentProps {
  reports: Report[];
}

const MapUpdater = ({ reports }: { reports: Report[] }) => {
  const map = useMap();

  useEffect(() => {
    if (reports.length > 0) {
      const bounds = L.latLngBounds(
        reports.map((report) => [report.latitude, report.longitude])
      );
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [reports, map]);

  return null;
};

const MapComponent = ({ reports }: MapComponentProps) => {
  const defaultCenter: [number, number] = [28.6139, 77.209]; // Delhi, India

  return (
    <MapContainer
      center={defaultCenter}
      zoom={12}
      style={{ height: "600px", width: "100%" }}
    >
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <MapUpdater reports={reports} />
      {reports.map((report) => (
        <Marker
          key={report.id}
          position={[report.latitude, report.longitude] as [number, number]}
          icon={report.danger_level === "severe" ? severeIcon : moderateIcon}
        >
          <Popup>
            <div className="min-w-[200px]">
              <img
                src={report.image_url}
                alt="Road damage"
                className="w-full h-32 object-cover rounded mb-2"
              />
              <p className="text-sm font-semibold mb-2">{report.description}</p>
              <div className="flex gap-2 flex-wrap">
                <Badge
                  variant={report.danger_level === "severe" ? "destructive" : "default"}
                >
                  {report.danger_level}
                </Badge>
                <Badge variant="outline">{report.status}</Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {new Date(report.created_at).toLocaleDateString()}
              </p>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
};

export default MapComponent;
