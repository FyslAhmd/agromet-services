import { MapContainer, TileLayer } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import icon from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";

const DEFAULT_MAP_CENTER = [23.8, 90.3];
const DEFAULT_MAP_ZOOM = 7.2;

const defaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
});

L.Marker.prototype.options.icon = defaultIcon;

const ProjectionMap = () => {
  return (
    <div className="relative flex-1 bg-[#edf5f4]">
      <div className="absolute inset-0">
        <MapContainer
          center={DEFAULT_MAP_CENTER}
          zoom={DEFAULT_MAP_ZOOM}
          zoomControl={false}
          className="h-full w-full"
          style={{ background: "#f8f9fa" }}
        >
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            opacity={0.6}
          />
        </MapContainer>
      </div>
    </div>
  );
};

export default ProjectionMap;
